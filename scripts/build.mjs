'use strict';
/**
 * build.mjs — czrDexTracker（超自然图鉴）前端构建脚本
 * 改造自 pdfTabloid/scripts/build.mjs，新增 data/ 静态图鉴目录拷贝。
 *
 * 功能：
 *   将前端源码（pages、utils、data、components、根配置文件）拷贝到 dist/，
 *   同时将千岛扩展名重命名为微信原生扩展名（.qdml→.wxml，.qdss→.wxss）。
 *
 * 安全措施：
 *   - 路径穿越防护：isWithinProject / distPath 均校验相对路径
 *   - 删除 dist 前断言 path.relative(projectRoot, distRoot) === 'dist'
 *   - 所有 JS/QDML/QDSS/WXML/WXSS 文件写入前校验 content.length > 0
 *
 * 排除项（不拷入 dist）：backend/、scripts/、tests/、node_modules/、doc/、
 *   qdmp-config.json、qdmp-schema.json、.git/、.gitignore、package.json、README.md、DESIGN.md
 */

import { readdir, readFile, writeFile, mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = path.resolve(projectRoot, 'dist');

// ─── 路径安全 ────────────────────────────────────────────────────────────────

function isWithinProject(relativePath) {
  if (path.isAbsolute(relativePath)) return false;
  const normalized = path.normalize(relativePath);
  if (normalized === '..' || normalized.startsWith(`..${path.sep}`)) return false;
  return true;
}

function distPath(relativePath) {
  if (!isWithinProject(relativePath)) {
    throw new Error(`unsafe relative path: ${relativePath}`);
  }
  const resolved = path.resolve(distRoot, relativePath);
  const rel = path.relative(distRoot, resolved);
  if (rel === '' || rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    throw new Error(`unsafe output path: ${relativePath}`);
  }
  return resolved;
}

// ─── 非零字节校验 ─────────────────────────────────────────────────────────────

const CHECKED_EXTENSIONS = new Set(['.js', '.qdml', '.qdss', '.wxml', '.wxss']);

function assertNonEmpty(relativePath, content) {
  const ext = path.extname(relativePath).toLowerCase();
  if (CHECKED_EXTENSIONS.has(ext) && content.length === 0) {
    throw new Error(`file is empty (0 bytes): ${relativePath}`);
  }
}

// ─── 文件拷贝 ─────────────────────────────────────────────────────────────────

async function copyFile(srcRelative, destRelative = srcRelative) {
  const srcResolved = path.resolve(projectRoot, srcRelative);
  if (!isWithinProject(srcRelative)) throw new Error(`unsafe source path: ${srcRelative}`);

  const destResolved = distPath(destRelative);

  const content = await readFile(srcResolved);
  assertNonEmpty(srcRelative, content);

  await mkdir(path.dirname(destResolved), { recursive: true });
  await writeFile(destResolved, content);
}

// ─── 扩展名重命名映射 ─────────────────────────────────────────────────────────

function renameExt(filePath) {
  if (filePath.endsWith('.qdml')) return filePath.slice(0, -5) + '.wxml';
  if (filePath.endsWith('.qdss')) return filePath.slice(0, -5) + '.wxss';
  return filePath;
}

/**
 * 拷贝目录并对 .qdml/.qdss 文件执行重命名（递归子目录）
 */
async function copyDirectoryWithRename(srcDir, destDir) {
  const entries = await readdir(path.resolve(projectRoot, srcDir), { withFileTypes: true });
  for (const entry of entries) {
    const srcRel = `${srcDir}/${entry.name}`;
    if (entry.isDirectory()) {
      await copyDirectoryWithRename(srcRel, `${destDir}/${entry.name}`);
    } else if (entry.isFile()) {
      const destRel = renameExt(`${destDir}/${entry.name}`);
      await copyFile(srcRel, destRel);
    }
  }
}

/**
 * 拷贝目录下的 .js 文件（扁平，不递归）；目录不存在则跳过
 */
async function copyJsDir(dir) {
  const abs = path.resolve(projectRoot, dir);
  let entries;
  try {
    entries = await readdir(abs, { withFileTypes: true });
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log(`[build] ${dir}/ not found, skipping`);
      return;
    }
    throw e;
  }
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.js')) {
      const srcRel = `${dir}/${entry.name}`;
      await copyFile(srcRel, srcRel);
      console.log(`[build] ${srcRel} → dist/${srcRel}`);
    }
  }
}

// ─── 主构建流程 ───────────────────────────────────────────────────────────────

async function build() {
  // 断言 distRoot 确实指向 projectRoot/dist
  if (path.relative(projectRoot, distRoot) !== 'dist') {
    throw new Error('refusing to remove a path other than the project-local dist directory');
  }

  // 读取 app.json 获取页面列表
  const manifestPath = path.resolve(projectRoot, 'app.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (!Array.isArray(manifest.pages) || manifest.pages.length === 0) {
    throw new Error('app.json must register at least one page');
  }

  // 清空并重建 dist/
  await rm(distRoot, { recursive: true, force: true });
  await mkdir(distRoot, { recursive: true });
  console.log('[build] dist/ cleared');

  // 1. 根配置文件（app.qdss → app.wxss）
  const rootFiles = [
    { src: 'app.js', dest: 'app.js' },
    { src: 'app.json', dest: 'app.json' },
    { src: 'app.qdss', dest: 'app.wxss' },
    { src: 'sitemap.json', dest: 'sitemap.json' },
  ];
  for (const { src, dest } of rootFiles) {
    await copyFile(src, dest);
    console.log(`[build] ${src} → dist/${dest}`);
  }

  // 2. pages/**（.qdml→.wxml，.qdss→.wxss）
  await copyDirectoryWithRename('pages', 'pages');
  console.log('[build] pages/** copied');

  // 3. utils/*.js
  await copyJsDir('utils');

  // 4. data/*.js（静态图鉴数据）
  await copyJsDir('data');

  // 5. components/**（若存在）
  const componentsDir = path.resolve(projectRoot, 'components');
  try {
    const st = await stat(componentsDir);
    if (st.isDirectory()) {
      await copyDirectoryWithRename('components', 'components');
      console.log('[build] components/** copied');
    }
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    console.log('[build] components/ not found, skipping');
  }

  console.log('[build] ✓ done');
}

build().catch((error) => {
  console.error(`[build] FAILED: ${error.message}`);
  process.exitCode = 1;
});
