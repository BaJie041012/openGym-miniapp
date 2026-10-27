#!/usr/bin/env node
// openGym Git Data API push — 支持 root commit 覆盖已有远端
// 凭据优先级：环境变量 GITHUB_TOKEN/GITHUB_REPO > git remote.origin.url 自动解析
import { execSync, spawnSync } from 'node:child_process';

const BRANCH = process.env.GITHUB_BRANCH || 'main';
const gitBuf = (a) => execSync('git ' + a, { encoding: null, maxBuffer: 64 * 1024 * 1024 });
const gitTxt = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();

// --- 凭据解析（三级回退） ---
let TOKEN = process.env.GITHUB_TOKEN;
let REPO = process.env.GITHUB_REPO;

// 1) 环境变量 override 已填则直接用
// 2) 从 git remote.origin.url 解析（支持带 token 和不带 token 两种格式）
if (!REPO) {
  const remoteUrl = gitTxt('git config --get remote.origin.url');
  // https://<token>@github.com/<owner>/<repo> 或 https://github.com/<owner>/<repo>
  const m = remoteUrl.match(/^https:\/\/(?:[^@]+@)?github\.com\/([^/]+)\/([^/.]+)/);
  if (m) REPO = m[1] + '/' + m[2];
}
if (!TOKEN) {
  const remoteUrl = gitTxt('git config --get remote.origin.url');
  // URL 里 token 可能拼在 username 后面（BaJie041012ghp_xxx），也可能用 username:token
  const m = remoteUrl.match(/^https:\/\/[^@]*?(ghp_[A-Za-z0-9]+)@/);
  if (m) { TOKEN = m[1]; console.log('凭据来源: git remote.origin.url'); }
}

// 3) remote URL 无 token 时，用 git credential 协议从 Windows 凭据管理器取
if (!TOKEN) {
  try {
    const r = spawnSync('git', ['credential', 'fill'], {
      input: 'protocol=https\nhost=github.com\n',
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const pwMatch = r.stdout.match(/^password=(.+)$/m);
    if (pwMatch) { TOKEN = pwMatch[1].trim(); console.log('凭据来源: git credential (Windows 凭据管理器)'); }
  } catch (_) {}
}

if (!TOKEN || !REPO) {
  console.error('FAIL: 无法获取 GitHub token 或 repo。请设置环境变量 GITHUB_TOKEN / GITHUB_REPO，配置 remote.origin.url（带 token），或在 Windows 凭据管理器里登录 GitHub');
  process.exit(1);
}
console.log('目标仓库:', REPO, '分支:', BRANCH);

const H = { Authorization: 'Bearer ' + TOKEN, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'User-Agent': 'opengym-push' };

async function api(method, p, body) {
  const r = await fetch('https://api.github.com/repos/' + REPO + p, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(method + ' ' + p + ' -> ' + r.status + ' ' + (j.message || JSON.stringify(j)));
  return j;
}

(async () => {
  const LOCAL_SHA = gitTxt('git show -s --format=%H HEAD').trim();
  const LOCAL_TREE = gitTxt('git show -s --format=%T HEAD').trim();
  const PARENT = gitTxt('git show -s --format=%P HEAD').trim();
  const IS_ROOT = !PARENT;
  console.log('HEAD:', LOCAL_SHA, 'tree:', LOCAL_TREE, 'parent:', PARENT || '(root)');

  // Upload all blobs (no base_tree for root commit)
  const ls = gitTxt('git ls-tree -r HEAD').trim().split('\n').filter(Boolean);
  const entries = [];
  for (const line of ls) {
    const parts = line.split(/\s+/);
    const [mode, type, wantBlob] = parts;
    const path = parts.slice(3).join(' ');
    const blob = await api('POST', '/git/blobs', {
      content: gitBuf('show HEAD:' + path).toString('base64'),
      encoding: 'base64'
    });
    if (blob.sha !== wantBlob) throw new Error(path + ' blob sha mismatch');
    entries.push({ path, mode, type: 'blob', sha: blob.sha });
  }
  console.log('blobs ok:', entries.length);

  // Create tree (no base_tree)
  const tree = await api('POST', '/git/trees', { tree: entries });
  if (tree.sha !== LOCAL_TREE) throw new Error('tree mismatch');
  console.log('tree ok:', tree.sha);

  // Create commit — try 3 message shapes
  // 如果 parent 不在远端，就不带 parents（force push 覆盖模式）
  const message = gitTxt('git show -s --format=%B HEAD');
  const person = (w) => ({
    name: gitTxt('git show -s --format=%' + w + 'n HEAD').trim(),
    email: gitTxt('git show -s --format=%' + w + 'e HEAD').trim(),
    date: gitTxt('git show -s --format=%' + w + 'I HEAD').trim()
  });

  // 检测 parent 是否在远端
  let parentExists = false;
  if (PARENT) {
    try {
      await api('GET', '/git/commits/' + PARENT);
      parentExists = true;
      console.log('parent 在远端:', PARENT.slice(0, 7));
    } catch (_) {
      console.log('parent 不在远端，将以 root commit 覆盖远端');
    }
  }

  // 创建 commit — 如果 parent 不在远端，用 root commit 覆盖模式，SHA 不会和本地匹配，跳过 mismatch 检查
  let commitSha;
  const candidates = [message, message.replace(/\s+$/, '\n'), message.trimEnd()];
  for (const msg of candidates) {
    const body = { message: msg, tree: LOCAL_TREE, author: person('a'), committer: person('c') };
    if (PARENT && parentExists) body.parents = [PARENT];
    const commit = await api('POST', '/git/commits', body);
    console.log('  commit ->', commit.sha, '(local:', LOCAL_SHA.slice(0, 7), ')');
    commitSha = commit.sha;
    if (PARENT && parentExists && commit.sha === LOCAL_SHA) break;  // 正常模式：匹配就停
    if (!PARENT || !parentExists) break;                             // root 覆盖模式：第一试就停
  }
  if (!commitSha) throw new Error('commit 创建失败');

  // Force update ref
  const upd = await api('PATCH', '/git/refs/heads/' + BRANCH, { sha: commitSha, force: true });
  console.log('✅ pushed:', upd.object.sha, '(force=true)');
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
