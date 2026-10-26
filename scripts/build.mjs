#!/usr/bin/env node
// openGym 构建脚本 — 拷贝源码到 dist/，.qdml → .wxml、.qdss → .wxss
// qdmp-cli 会自动补 app 级入口文件

import { mkdirSync, copyFileSync, existsSync, rmSync, readdirSync, statSync } from 'node:fs';
import { join, basename, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const OUT  = join(ROOT, 'dist');

const DIRS_COPY = ['pages', 'utils', 'data'];   // 整目录拷贝
const ROOT_COPY = ['app.js', 'app.json', 'app.qdss', 'qdmp.json'];

function renameDest(filePath) {
  // .qdml → .wxml, .qdss → .wxss
  if (filePath.endsWith('.qdml')) return filePath.replace(/\.qdml$/, '.wxml');
  if (filePath.endsWith('.qdss')) return filePath.replace(/\.qdss$/, '.wxss');
  return filePath;
}

function copyDir(src, dst, skipExt = []) {
  if (!existsSync(src)) return;
  mkdirSync(dst, { recursive: true });
  for (const entry of readdirSync(src)) {
    const sp = join(src, entry);
    const st = statSync(sp);
    if (st.isDirectory()) {
      copyDir(sp, join(dst, entry), skipExt);
    } else {
      // 跳过 skipExt 列表里的扩展名
      const ext = extname(entry);
      if (skipExt.includes(ext)) continue;
      const dp = renameDest(join(dst, entry));
      mkdirSync(dirname(dp), { recursive: true });
      copyFileSync(sp, dp);
    }
  }
}

function build() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  // pages 目录跳过 .qdss（已合并进 app.qdss，避免 EMP 编译器加 scoped 属性隔离）
  for (const d of DIRS_COPY) {
    const skip = d === 'pages' ? ['.qdss'] : [];
    copyDir(join(ROOT, d), join(OUT, d), skip);
  }

  // 根目录入口文件
  for (const f of ROOT_COPY) {
    const src = join(ROOT, f);
    if (!existsSync(src)) continue;
    const dp = renameDest(join(OUT, f));
    mkdirSync(dirname(dp), { recursive: true });
    copyFileSync(src, dp);
  }

  console.log('built dist/:');
  readdirSync(OUT).forEach(function (e) {
    console.log('  ' + e);
  });
}

build();
