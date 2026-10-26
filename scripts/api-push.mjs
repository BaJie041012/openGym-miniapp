#!/usr/bin/env node
// openGym Git Data API push — 支持 root commit 覆盖已有远端
import { execSync } from 'node:child_process';

const TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const H = { Authorization: 'Bearer ' + TOKEN, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'User-Agent': 'opengym-push' };
const gitBuf = (a) => execSync('git ' + a, { encoding: null, maxBuffer: 64 * 1024 * 1024 });
const gitTxt = (cmd) => execSync(cmd, { encoding: 'utf8' });

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
  const message = gitTxt('git show -s --format=%B HEAD');
  const person = (w) => ({
    name: gitTxt('git show -s --format=%' + w + 'n HEAD').trim(),
    email: gitTxt('git show -s --format=%' + w + 'e HEAD').trim(),
    date: gitTxt('git show -s --format=%' + w + 'I HEAD').trim()
  });
  const candidates = [message, message.replace(/\s+$/, '\n'), message.trimEnd()];
  let matched = false;
  for (const msg of candidates) {
    const body = { message: msg, tree: LOCAL_TREE, author: person('a'), committer: person('c') };
    if (PARENT) body.parents = [PARENT];
    const commit = await api('POST', '/git/commits', body);
    console.log('  commit try ->', commit.sha);
    if (commit.sha === LOCAL_SHA) { matched = true; break; }
  }
  if (!matched) throw new Error('commit hash mismatch all 3 shapes');

  // Force update ref (root commit needs force to overwrite)
  const upd = await api('PATCH', '/git/refs/heads/' + BRANCH, { sha: LOCAL_SHA, force: true });
  console.log('✅ pushed:', upd.object.sha, '(force=true)');
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
