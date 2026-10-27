/**
 * merge-backend.mjs  ·  openGym
 * 将 Go 后端多文件源码合并为单文件 main.go + 打包为发布 zip。
 *
 * 千岛平台 Dockerfile 使用 `go build -o /go/bin/app main.go`（单文件编译），
 * 因此必须将 backend/ 下所有生产 .go 文件合并为一个 main.go。
 *
 * 流程：
 * 1. 读取根 qdmp-config.json 获取 appId、appSecret、mongodb.uri、mongodb.database
 * 2. 扫描 backend/ 目录所有 .go 文件（排除 *_test.go）
 * 3. 解析每个文件的 import 块并去重合并（别名冲突即报错）
 * 4. 提取每个文件的代码体（去除 package 声明和 import 块）
 * 5. 生成 build_inject init() 函数，构建期注入凭据（buildAppID/buildAppSecret/buildMongoURI/buildMongoDatabase）
 * 6. 组合为单个 main.go
 * 7. 将 main.go + go.mod + go.sum 打包为 backend-release.zip，并做 0 字节校验
 *
 * ⚠ 安全：源码树中不出现明文凭据；凭据仅在此打包步骤从 qdmp-config.json 注入到产物。
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync, copyFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');
const ROOT = resolve(__dirname, '..');

// ─── 读取配置 ───────────────────────────────────────────────────────────────

const CONFIG_PATH = join(ROOT, 'qdmp-config.json');

if (!existsSync(CONFIG_PATH)) {
  fatal(`找不到配置文件: ${CONFIG_PATH}`);
}

const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));

const appId = (config.appId || '').trim();
const appSecret = (config.appSecret || '').trim();
const mongoUri = (config.mongodb?.uri || '').trim();
const mongoDatabase = (config.mongodb?.database || '').trim();

if (!appId) fatal('qdmp-config.json 中缺少 appId');
// ⚠ 与 deploy-backend.mjs 对称：占位/缺失 appSecret 从源头 fatal 拦截，
// 绝不产出把占位密钥烘焙进 main.go 的 backend-release.zip（否则手动上传会部署
// 一个登录永远失败、全员静默降级的僵尸后端）。
if (!appSecret || appSecret === 'REPLACE_WITH_APP_SECRET') {
  fatal('appSecret 缺失或仍为占位符，请先在 qdmp-config.json 填入真值再打包');
}
if (!mongoUri) warn('qdmp-config.json 中缺少 mongodb.uri');
if (!mongoDatabase) warn('qdmp-config.json 中缺少 mongodb.database');

// 规范化 MongoDB URI：确保路径中包含数据库名
const normalizedMongoUri = normalizeMongoUri(mongoUri, mongoDatabase);

// ─── 扫描后端源码 ────────────────────────────────────────────────────────────

const BACKEND_DIR = join(ROOT, 'backend');

if (!existsSync(BACKEND_DIR)) {
  fatal(`找不到后端目录: ${BACKEND_DIR}`);
}

const allFiles = readdirSync(BACKEND_DIR);
const goFiles = allFiles
  .filter(f => f.endsWith('.go') && !f.endsWith('_test.go'))
  .sort();

if (goFiles.length === 0) {
  fatal('backend/ 目录中没有找到生产 Go 文件');
}

log(`找到 ${goFiles.length} 个生产 Go 文件: ${goFiles.join(', ')}`);

// ─── 解析并合并 Go 源码 ──────────────────────────────────────────────────────

/** @type {Map<string, string>} importPath -> alias (empty string = no alias) */
const imports = new Map();
/** @type {string[]} 各文件的代码体（去除 package 和 import） */
const codeBodies = [];

for (const file of goFiles) {
  const content = readFileSync(join(BACKEND_DIR, file), 'utf-8');
  const { fileImports, body } = parseGoFile(content, file);

  // 合并 imports
  for (const [importPath, alias] of fileImports) {
    const existing = imports.get(importPath);
    if (existing !== undefined && existing !== alias) {
      fatal(`Import 冲突: ${importPath} 有别名 "${existing}" 和 "${alias}" (in ${file})`);
    }
    imports.set(importPath, alias);
  }

  if (body.trim()) {
    codeBodies.push(`// ─── 源文件: ${file} ───\n\n${body.trim()}`);
  }
}

log(`合并了 ${imports.size} 个 import，${codeBodies.length} 个代码体`);

// ─── 生成 build_inject init() 函数 ──────────────────────────────────────────
// main.go 中已声明 buildAppID/buildAppSecret/buildMongoURI/buildMongoDatabase（源码恒空），
// 此处在合并产物中追加 init() 填充构建期兜底值；运行期环境变量优先。

const injectBody = [
  '// ─── 构建注入（由 merge-backend.mjs 生成，勿手改）───',
  '',
  'func init() {',
  `\tbuildAppID = ${goQuote(appId)}`,
  `\tbuildAppSecret = ${goQuote(appSecret)}`,
  `\tbuildMongoURI = ${goQuote(normalizedMongoUri)}`,
  `\tbuildMongoDatabase = ${goQuote(mongoDatabase)}`,
  '}',
].join('\n');

// ─── 组装最终 main.go ───────────────────────────────────────────────────────

let merged = 'package main\n\n';

// Import block
if (imports.size > 0) {
  const sortedImports = [...imports.entries()].sort((a, b) => {
    // stdlib first (no dot in path), then third-party
    const aIsStd = !a[0].includes('.');
    const bIsStd = !b[0].includes('.');
    if (aIsStd !== bIsStd) return aIsStd ? -1 : 1;
    return a[0].localeCompare(b[0]);
  });

  merged += 'import (\n';
  let lastWasStd = null;
  for (const [importPath, alias] of sortedImports) {
    const isStd = !importPath.includes('.');
    if (lastWasStd !== null && lastWasStd !== isStd) {
      merged += '\n';
    }
    lastWasStd = isStd;
    if (alias) {
      merged += `\t${alias} ${goQuote(importPath)}\n`;
    } else {
      merged += `\t${goQuote(importPath)}\n`;
    }
  }
  merged += ')\n\n';
}

// Code bodies
merged += codeBodies.join('\n\n');
merged += '\n\n';

// Build inject
merged += injectBody;
merged += '\n';

// ─── 准备临时目录并写入 ──────────────────────────────────────────────────────

const TEMP_DIR = join(ROOT, '.release-tmp');
const OUTPUT_ZIP = join(ROOT, 'backend-release.zip');

if (existsSync(TEMP_DIR)) {
  rmSync(TEMP_DIR, { recursive: true, force: true });
}
mkdirSync(TEMP_DIR, { recursive: true });

// 写入合并后的 main.go
writeFileSync(join(TEMP_DIR, 'main.go'), merged, 'utf-8');
log(`已生成合并 main.go (${(Buffer.byteLength(merged) / 1024).toFixed(1)} KB)`);

// ─── 拷贝 go.mod 和 go.sum ──────────────────────────────────────────────────

for (const dep of ['go.mod', 'go.sum']) {
  const src = join(BACKEND_DIR, dep);
  if (existsSync(src)) {
    copyFileSync(src, join(TEMP_DIR, dep));
    log(`已包含 ${dep}`);
  } else {
    warn(`缺少 ${dep}，发布包可能无法离线构建`);
  }
}

// ─── 打包为 zip ──────────────────────────────────────────────────────────────

if (existsSync(OUTPUT_ZIP)) {
  rmSync(OUTPUT_ZIP, { force: true });
}

try {
  // ⚠ 不能用 '.release-tmp\*' 通配：PowerShell 通配符会跳过点开头目录内的项，
  // 导致静默产出 0 字节 zip；必须显式枚举文件路径。
  const zipEntries = readdirSync(TEMP_DIR).map(f => join(TEMP_DIR, f));
  const listArg = zipEntries.map(p => `'${p}'`).join(',');
  const psCommand = `Compress-Archive -Path ${listArg} -DestinationPath '${OUTPUT_ZIP}' -Force`;
  execFileSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psCommand], { stdio: 'pipe' });
  // 产出校验：0 字节 zip 视为打包失败，绝不带着空包去部署
  const producedSize = statSync(OUTPUT_ZIP).size;
  if (producedSize === 0) {
    fatal('打包 zip 产出 0 字节（Compress-Archive 静默失败）');
  }
  log(`已生成 zip: ${OUTPUT_ZIP}`);
} catch (err) {
  fatal(`打包 zip 失败: ${err.message}`);
}

// ─── 清理临时目录 ────────────────────────────────────────────────────────────

rmSync(TEMP_DIR, { recursive: true, force: true });

// ─── 输出结果 ────────────────────────────────────────────────────────────────

const zipStat = statSync(OUTPUT_ZIP);
const zipSizeKB = (zipStat.size / 1024).toFixed(1);

console.log('');
console.log('═══════════════════════════════════════════════');
console.log('  ✓ openGym 后端发布包生成成功（单文件合并模式）');
console.log(`  路径: ${OUTPUT_ZIP}`);
console.log(`  大小: ${zipSizeKB} KB`);
console.log(`  内容: main.go (合并自 ${goFiles.length} 个文件) + go.mod + go.sum`);
console.log('═══════════════════════════════════════════════');

// ─── Go 源码解析器 ───────────────────────────────────────────────────────────

/**
 * 解析单个 Go 文件，提取 imports 和代码体
 * @param {string} content 文件内容
 * @param {string} filename 文件名（用于错误提示）
 * @returns {{ fileImports: Map<string, string>, body: string }}
 */
function parseGoFile(content, filename) {
  const fileImports = new Map();
  let body = '';

  // 去除 BOM
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }

  const lines = content.split('\n');
  let i = 0;
  let pastPackage = false;
  let inImportBlock = false;
  let bodyLines = [];

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip package declaration
    if (!pastPackage && trimmed.startsWith('package ')) {
      pastPackage = true;
      i++;
      continue;
    }

    // Handle multi-line import block
    if (trimmed === 'import (' || trimmed.startsWith('import (')) {
      inImportBlock = true;
      i++;
      continue;
    }

    if (inImportBlock) {
      if (trimmed === ')') {
        inImportBlock = false;
        i++;
        continue;
      }
      // Parse import line: optional alias + quoted path
      const importMatch = trimmed.match(/^(?:(\w+|\.|_)\s+)?"([^"]+)"$/);
      if (importMatch) {
        const alias = importMatch[1] || '';
        const importPath = importMatch[2];
        fileImports.set(importPath, alias === '_' ? '_' : alias === '.' ? '.' : alias);
      } else if (trimmed && !trimmed.startsWith('//')) {
        warn(`${filename}:${i + 1} 无法解析 import 行: ${trimmed}`);
      }
      i++;
      continue;
    }

    // Handle single-line import
    const singleImport = trimmed.match(/^import\s+(?:(\w+|\.|_)\s+)?"([^"]+)"$/);
    if (singleImport) {
      fileImports.set(singleImport[2], singleImport[1] || '');
      i++;
      continue;
    }

    // Everything else is body
    bodyLines.push(line);
    i++;
  }

  body = bodyLines.join('\n');

  // Trim leading blank lines
  body = body.replace(/^\n+/, '');

  return { fileImports, body };
}

// ─── 工具函数 ────────────────────────────────────────────────────────────────

function normalizeMongoUri(uri, database) {
  if (!uri) return uri;
  try {
    const parsed = new URL(uri);
    if (parsed.protocol !== 'mongodb:' && parsed.protocol !== 'mongodb+srv:') {
      warn(`MongoDB URI scheme "${parsed.protocol}" 不标准，原样保留`);
      return uri;
    }
    if (!parsed.pathname || parsed.pathname === '/') {
      parsed.pathname = '/' + database;
      return parsed.toString();
    }
    return uri;
  } catch {
    return uri;
  }
}

function goQuote(str) {
  const escaped = str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
  return `"${escaped}"`;
}

function log(msg) {
  console.log(`[merge-backend] ${msg}`);
}

function warn(msg) {
  console.warn(`[merge-backend] ⚠ ${msg}`);
}

function fatal(msg) {
  console.error(`[merge-backend] ✖ ${msg}`);
  process.exit(1);
}
