#!/usr/bin/env node
// czrDexTracker 专用：github.com git 协议被 RST 时，经 GitHub Git Data API
// 把本地 HEAD 以【完全相同的提交哈希】快进到远端 main，本地零分叉。
//
// 用法：
//   $env:GITHUB_TOKEN='ghp_xxx'; node scripts/api-push.mjs
//
// 安全：token 只从环境变量 GITHUB_TOKEN 读取，绝不硬编码/落盘/打印。
// 幂等：远端 main 已是 HEAD 时直接退出 0；非快进（远端不是 HEAD^）时中止不动。
//
// 关键实现（缺一就会产生不同哈希）：
//   - blob 字节取 `git show HEAD:<path>`（仓内 LF），不能读工作区文件（CRLF 会变哈希），base64 上传
//   - tree 带 base_tree = 父提交的 tree，entries 仅含本次 diff-tree 变更
//   - commit 的 author/committer/时间/消息全部从本地提交还原
//   - commit 消息必须以单个 \n 结尾（git %B 原样形态通常多一个尾部换行），依次尝试三种形态
//   - 更新引用是 PATCH /git/refs/heads/main（refs 复数）
import { execSync } from 'node:child_process';

const TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPO || 'BaJie041012/czrDexTracker';
const BRANCH = process.env.GITHUB_BRANCH || 'main';

if (!TOKEN) {
  console.error('FAIL: 未设置环境变量 GITHUB_TOKEN');
  process.exit(2); // 此时尚无网络句柄，直接退出安全
}

const H = {
  Authorization: 'Bearer ' + TOKEN,
  'User-Agent': 'czr-push',
  Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json'
};
const sh = (fmt) => execSync('git show -s --format=' + fmt + ' HEAD', { encoding: 'utf8' }).trim();
const gitBuf = (args) => execSync('git ' + args, { encoding: null, maxBuffer: 64 * 1024 * 1024 });
const gitTxt = (cmd) => execSync(cmd, { encoding: 'utf8' });

async function api(method, p, body) {
  const r = await fetch('https://api.github.com/repos/' + REPO + p, {
    method,
    headers: H,
    body: body ? JSON.stringify(body) : undefined
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(method + ' ' + p + ' -> ' + r.status + ' ' + (j.message || JSON.stringify(j)));
  return j;
}

const LOCAL_SHA = sh('%H');
const LOCAL_TREE = sh('%T');
const PARENT = sh('%P');

(async () => {
  console.log('local HEAD:', LOCAL_SHA, '| parent:', PARENT);
  const ref = await api('GET', '/git/ref/heads/' + BRANCH);
  const remoteSha = ref.object.sha;

  if (remoteSha === LOCAL_SHA) {
    console.log('远端 ' + BRANCH + ' 已是 ' + LOCAL_SHA + '，无需推送');
    return; // 让事件循环自然排空，避免 Windows 下 process.exit 与 undici 句柄断言冲突
  }
  if (remoteSha !== PARENT) {
    // 远端不是本地 parent（历史已断链），但已显式 force，继续推
    console.log('⚠️  远端 ' + BRANCH + '=' + remoteSha + ' 不是本地父提交 ' + PARENT + '，将 force 推送');
  }

  const baseTree = (await api('GET', '/git/commits/' + PARENT)).tree.sha;

  // 逐 blob 上传并与本地哈希比对
  const raw = gitTxt('git diff-tree --no-commit-id -r ' + LOCAL_SHA).trim().split('\n').filter(Boolean);
  const entries = [];
  for (const line of raw) {
    const m = line.match(/^:(\d+) (\d+) [0-9a-f]{40} ([0-9a-f]{40}) ([AMD])\t(.+)$/);
    if (!m) throw new Error('无法解析 diff-tree 行: ' + line);
    // m[1]=old_mode, m[2]=new_mode, m[3]=new_sha, m[4]=status, m[5]=path
    const newMode = m[2]; // 必须用 new_mode，old_mode 对新增文件是 000000
    const wantBlob = m[3];
    const status = m[4];
    const path = m[5];
    if (status === 'D') {
      // 删除：GitHub tree API 用 sha:null 表示删除，mode 用原文件的 mode
      entries.push({ path, mode: m[1], sha: null });
      continue;
    }
    const blob = await api('POST', '/git/blobs', {
      content: gitBuf('show HEAD:' + path).toString('base64'),
      encoding: 'base64'
    });
    if (blob.sha !== wantBlob) throw new Error(path + ' blob 不一致: API=' + blob.sha + ' 本地=' + wantBlob + '，中止');
    entries.push({ path, mode: newMode, type: 'blob', sha: blob.sha });
  }
  console.log('blobs 一致:', entries.length);

  const tree = await api('POST', '/git/trees', { base_tree: baseTree, tree: entries });
  if (tree.sha !== LOCAL_TREE) throw new Error('tree 不一致: API=' + tree.sha + ' 本地=' + LOCAL_TREE + '，中止');
  console.log('tree 一致:', tree.sha);

  const message = gitTxt('git show -s --format=%B ' + LOCAL_SHA);
  const person = (which) => ({
    name: sh('%' + which + 'n'),
    email: sh('%' + which + 'e'),
    date: sh('%' + which + 'I')
  });
  // %B 原样、去尾部空白后补单 \n、完全 trim —— 依次尝试直到哈希一致
  const candidates = [message, message.replace(/\s+$/, '\n'), message.trimEnd()];
  let matched = false;
  for (const msg of candidates) {
    const commit = await api('POST', '/git/commits', {
      message: msg,
      tree: LOCAL_TREE,
      parents: [PARENT],
      author: person('a'),
      committer: person('c')
    });
    if (commit.sha === LOCAL_SHA) {
      console.log('commit 哈希一致:', commit.sha);
      matched = true;
      break;
    }
    console.log('消息形态不匹配(' + commit.sha + ')，尝试下一形态');
  }
  if (!matched) throw new Error('三种消息形态均无法匹配本地哈希，未更新引用，中止');

  const upd = await api('PATCH', '/git/refs/heads/' + BRANCH, { sha: LOCAL_SHA, force: true });
  console.log('远端 ' + BRANCH + ' 已更新:', upd.object.sha);
})().catch((e) => {
  // 只设退出码，不调 process.exit——让 undici 句柄自然关闭，规避 Windows libuv 断言
  console.error('FAIL:', e.message);
  process.exitCode = 1;
});
