/**
 * deploy-backend.mjs  ·  openGym
 * 通过 MCP Streamable HTTP 协议调用千岛平台 GitLab MCP 服务，
 * 完成后端仓库初始化 + 代码上传 + 发布触发 + Pipeline 轮询 + 健康检查。
 *
 * MCP Server URL: https://openapi.qiandao.com/gitlab/mcp
 * Upload URL:     https://openapi.qiandao.com/gitlab-mcp/upload
 *
 * 完整流程：
 * 1. 初始化 MCP 会话
 * 2. 检查仓库是否存在（qdmp_gitlab_repo_exists）
 * 3. 不存在则初始化仓库（qdmp_gitlab_init_repo，传入 appName + runtime）
 * 4. 上传后端代码 zip（FormData: appId/appSecret/version/file）
 * 5. 触发发布（qdmp_gitlab_publish）启动 CI/CD pipeline
 * 6. 轮询 pipeline 状态（qdmp_gitlab_pipeline_status）直到 success/failed
 * 7. 成功后轮询健康检查端点 https://<appId>.qiandaomp.com/health
 *
 * CLI:
 *   --version   / -v   发布版本号（默认 v1.0.0）
 *   --description / -d 版本描述（默认自动生成）
 *   --skip-upload      跳过上传（仅重新触发发布）
 *   --skip-health      跳过发布后健康检查轮询
 *
 * ⚠ 安全：appSecret 从根 qdmp-config.json 读取，仅在部署进程内存中使用，不落日志。
 * 本脚本改造自 pdfTabloid/scripts/deploy-backend.mjs。
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const ROOT = resolve(__dirname, '..');
const CONFIG_PATH = join(ROOT, 'qdmp-config.json');

if (!existsSync(CONFIG_PATH)) {
  fatal(`找不到配置文件: ${CONFIG_PATH}`);
}
const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));

const appId = config.appId;
const appSecret = config.appSecret;
const appName = config.name || 'openGym';
const runtime = config.runtime || 'go';

const MCP_URL = 'https://openapi.qiandao.com/gitlab/mcp';
const UPLOAD_URL = 'https://openapi.qiandao.com/gitlab-mcp/upload';
const ZIP_PATH = join(ROOT, 'backend-release.zip');
const HEALTH_URL = `https://${appId}.qiandaomp.com/health`;

let sessionId = null;
let requestId = 0;

// ─── MCP Protocol Helpers ─────────────────────────────────────────────────────

async function mcpRequest(method, params = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
  };
  if (sessionId) {
    headers['Mcp-Session-Id'] = sessionId;
  }

  const body = {
    jsonrpc: '2.0',
    id: ++requestId,
    method,
    params,
  };

  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });

  const newSessionId = res.headers.get('mcp-session-id');
  if (newSessionId) {
    sessionId = newSessionId;
  }

  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('text/event-stream')) {
    const text = await res.text();
    const lines = text.split('\n');
    let lastData = null;
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        lastData = line.slice(6);
      }
    }
    if (lastData) return JSON.parse(lastData);
    return { raw: text };
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MCP HTTP ${res.status}: ${text.slice(0, 300)}`);
  }

  return await res.json();
}

async function callTool(name, args) {
  const result = await mcpRequest('tools/call', { name, arguments: args });

  if (result.error) {
    return { success: false, error: result.error };
  }

  if (result.result?.content) {
    const content = result.result.content;
    if (Array.isArray(content)) {
      for (const item of content) {
        if (item.type === 'text') {
          try {
            return { success: true, data: JSON.parse(item.text) };
          } catch {
            return { success: true, data: item.text };
          }
        }
      }
    }
  }

  return { success: true, data: result.result };
}

function log(msg) {
  console.log(`[deploy] ${msg}`);
}

function fatal(msg) {
  console.error(`[deploy] ✖ ${msg}`);
  process.exit(1);
}

// ─── Parse CLI args ───────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let version = '';
let description = '';
let skipUpload = false;
let skipHealth = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--version' || args[i] === '-v') version = args[++i] || '';
  if (args[i] === '--description' || args[i] === '-d') description = args[++i] || '';
  if (args[i] === '--skip-upload') skipUpload = true;
  if (args[i] === '--skip-health') skipHealth = true;
}

if (!version) {
  version = 'v1.0.0';
  log(`未指定 --version，使用默认: ${version}`);
}

if (!description) {
  description = `Deploy ${appName} ${runtime} backend ${version}`;
}

if (!appSecret || appSecret === 'REPLACE_WITH_APP_SECRET') {
  fatal('qdmp-config.json 中 appSecret 缺失或仍是占位符，请先填入真值再部署');
}

// ─── Main Flow ────────────────────────────────────────────────────────────────

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  千岛后端自动化部署 · openGym');
console.log(`  AppID:    ${appId}`);
console.log(`  AppName:  ${appName}`);
console.log(`  Runtime:  ${runtime}`);
console.log(`  Version:  ${version}`);
console.log(`  MCP URL:  ${MCP_URL}`);
console.log('═══════════════════════════════════════════════════════════');
console.log('');

// Step 1: Initialize MCP session
log('Step 1/7: 初始化 MCP 会话...');
const initResult = await mcpRequest('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: { tools: {} },
  clientInfo: { name: `${appName}-deploy`, version: '1.0.0' },
});

if (!initResult.result?.serverInfo) {
  fatal(`MCP 初始化失败: ${JSON.stringify(initResult)}`);
}
log(`  ✓ MCP 连接成功 (${initResult.result.serverInfo.name} v${initResult.result.serverInfo.version})`);

// Step 2: Check if repo exists
log('Step 2/7: 检查代码仓库...');
const repoCheck = await callTool('qdmp_gitlab_repo_exists', { appId, appSecret });
log(`  仓库状态: ${JSON.stringify(repoCheck.data)}`);

// Step 3: Init repo if needed
const repoData = repoCheck.data;
const repoExists = typeof repoData === 'object' ? repoData.exists : false;

if (!repoExists) {
  log('Step 3/7: 初始化代码仓库...');
  const initRepo = await callTool('qdmp_gitlab_init_repo', { appId, appSecret, appName, runtime });
  log(`  初始化结果: ${JSON.stringify(initRepo.data)}`);
  if (!initRepo.success) {
    fatal(`仓库初始化失败: ${JSON.stringify(initRepo.error || initRepo.data)}`);
  }
  log('  ✓ 仓库初始化成功');
} else {
  const currentRuntime = typeof repoData === 'object' ? repoData.runtime : '';
  if (currentRuntime && currentRuntime !== runtime) {
    log(`Step 3/7: Runtime 变更 (${currentRuntime} → ${runtime})，重新初始化...`);
    const initRepo = await callTool('qdmp_gitlab_init_repo', { appId, appSecret, appName, runtime });
    log(`  结果: ${JSON.stringify(initRepo.data)}`);
  } else {
    log('Step 3/7: 仓库已存在，跳过初始化');
  }
}

// Step 4: Upload backend zip
if (!skipUpload) {
  log('Step 4/7: 上传后端代码包...');
  if (!existsSync(ZIP_PATH)) {
    fatal(`找不到发布包: ${ZIP_PATH}\n请先运行: node scripts/merge-backend.mjs`);
  }
  const zipStat = statSync(ZIP_PATH);
  const zipSizeKB = (zipStat.size / 1024).toFixed(1);
  if (zipStat.size === 0) {
    fatal('发布包为 0 字节，请先重新运行 node scripts/merge-backend.mjs');
  }
  log(`  文件: ${basename(ZIP_PATH)} (${zipSizeKB} KB)`);

  const zipBuffer = readFileSync(ZIP_PATH);
  const formData = new FormData();
  formData.append('appId', appId);
  formData.append('appSecret', appSecret);
  formData.append('version', version);
  formData.append('file', new Blob([zipBuffer], { type: 'application/zip' }), basename(ZIP_PATH));

  const uploadRes = await fetch(UPLOAD_URL, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(120000),
  });

  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    fatal(`上传失败 HTTP ${uploadRes.status}: ${text}`);
  }

  const uploadResult = await uploadRes.json();
  if (uploadResult.message !== 'ok') {
    fatal(`上传被拒绝: ${JSON.stringify(uploadResult)}`);
  }
  log(`  ✓ 上传成功 (${((uploadResult.size || 0) / 1024).toFixed(1)} KB)`);
} else {
  log('Step 4/7: 跳过上传 (--skip-upload)');
}

// Step 5: Publish (trigger CI/CD pipeline)
log('Step 5/7: 触发 CI/CD 构建部署...');
const publishResult = await callTool('qdmp_gitlab_publish', {
  appId,
  appSecret,
  version,
  description,
});
log(`  Publish 结果: ${JSON.stringify(publishResult.data)}`);

if (!publishResult.success) {
  fatal(`发布触发失败: ${JSON.stringify(publishResult.error || publishResult.data)}`);
}

const publishData = publishResult.data;
if (typeof publishData === 'object' && publishData.error) {
  fatal(`发布失败: ${publishData.error.message || JSON.stringify(publishData.error)}`);
}

log('  ✓ 发布已触发');

// Step 6: Poll pipeline status
log('Step 6/7: 等待 Pipeline 完成...');
const MAX_POLLS = 60;
const POLL_INTERVAL = 10000; // 10s
let pipelineSucceeded = false;

for (let i = 0; i < MAX_POLLS; i++) {
  await new Promise(r => setTimeout(r, POLL_INTERVAL));

  const statusResult = await callTool('qdmp_gitlab_pipeline_status', { appId, appSecret, version });
  const statusData = statusResult.data;
  const status = typeof statusData === 'object' ? statusData.status : String(statusData);

  log(`  [${(i + 1) * 10}s] Pipeline 状态: ${status}`);

  if (status === 'success' || status === 'passed') {
    pipelineSucceeded = true;
    break;
  }

  if (status === 'failed' || status === 'canceled') {
    log('  Pipeline 失败，获取日志...');
    const logsResult = await callTool('qdmp_gitlab_pipeline_logs', { appId, appSecret, version });
    console.error(`  日志: ${JSON.stringify(logsResult.data).slice(0, 1000)}`);
    fatal('Pipeline 构建失败');
  }
}

if (!pipelineSucceeded) {
  log('⚠ Pipeline 超时（10 分钟），请稍后检查状态');
  console.log(`  服务地址: https://${appId}.qiandaomp.com`);
  process.exit(0);
}

// Step 7: Health check
if (!skipHealth) {
  log('Step 7/7: 健康检查...');
  const HEALTH_POLLS = 12;
  const HEALTH_INTERVAL = 15000; // 15s
  let healthy = false;
  for (let i = 0; i < HEALTH_POLLS; i++) {
    try {
      const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(10000) });
      const text = await res.text();
      log(`  [${i + 1}/${HEALTH_POLLS}] ${HEALTH_URL} → ${res.status} ${text.slice(0, 120)}`);
      if (res.status === 200) {
        healthy = true;
        break;
      }
    } catch (err) {
      log(`  [${i + 1}/${HEALTH_POLLS}] 健康检查异常: ${err.message}`);
    }
    if (i < HEALTH_POLLS - 1) {
      await new Promise(r => setTimeout(r, HEALTH_INTERVAL));
    }
  }
  if (!healthy) {
    log('⚠ 健康检查在 3 分钟内未通过，请稍后手动确认');
  } else {
    log('  ✓ 健康检查通过');
  }
} else {
  log('Step 7/7: 跳过健康检查 (--skip-health)');
}

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  ✅ 后端部署成功！');
console.log(`  版本:     ${version}`);
console.log(`  服务地址: https://${appId}.qiandaomp.com`);
console.log(`  健康检查: ${HEALTH_URL}`);
console.log('═══════════════════════════════════════════════════════════');
process.exit(0);
