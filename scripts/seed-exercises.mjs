/**
 * seed-exercises.mjs · openGym 动作库灌库 + 前端精选集生成
 *
 * 1. 并发拉取原项目 catalogue/exercises/*.json（6554 条，textSource: exercisedb = MIT）
 * 2. 与 scripts/curated-zh.json（68 条学术中文）按 name 宽松匹配合并
 * 3. 全量 bulk insert 到千岛 Mongo exercises 集合
 * 4. 将精选条目生成前端 data/exercises.js（含 muscles/equipment/difficulty 映射）
 *
 * 用法：node scripts/seed-exercises.mjs [--dry]
 *   --dry  只做拉取与生成前端文件，不写数据库
 *
 * 合规：动作文本 AGPL-3.0 / MIT（exercisedb），媒体（Gym visual）已全部排除。
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CACHE = join(ROOT, '..', 'openGymTemp', 'exercises-raw.json');
const NAMES = join(ROOT, '..', 'openGymTemp', 'exercise-names.txt');
const DRY = process.argv.includes('--dry');

const TREE_API = 'https://api.github.com/repos/DuarteSantos8/openGym/git/trees/HEAD?recursive=1';
const RAW_BASE = 'https://raw.githubusercontent.com/DuarteSantos8/openGym/HEAD/catalogue/exercises/';
const CONCURRENCY = 24;
const CHUNK = 500; // Mongo 单批写入条数

// ─── 工具 ─────────────────────────────────────────────────────────────────────

/** 宽松匹配键：小写、统一连字符/空格、去多余空白。 */
function normKey(name) {
  return String(name || '').toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

async function fetchJSON(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (res.status === 200) return await res.json();
      if (res.status === 404) return null;
      throw new Error('HTTP ' + res.status);
    } catch (e) {
      if (i === retries) throw e;
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }
  return null;
}

/** 有界并发映射。 */
async function pool(items, worker, concurrency) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await worker(items[idx], idx).catch(() => null);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, run));
  return results;
}

// ─── 主流程 ───────────────────────────────────────────────────────────────────

async function main() {
  // 缓存优先：openGymTemp/exercises-raw.json 存在则直接使用（二次运行秒级）
  let items = null;
  try {
    const cached = JSON.parse(readFileSync(CACHE, 'utf8'));
    if (Array.isArray(cached) && cached.length > 1000) {
      items = cached;
      console.log('[seed] 使用缓存数据: ' + items.length + ' 条（' + CACHE + '）');
    }
  } catch (e) { /* 无缓存 */ }

  if (!items) {
    console.log('[seed] 拉取仓库文件树...');
    const tree = await fetchJSON(TREE_API);
    if (!tree || !Array.isArray(tree.tree)) throw new Error('仓库树拉取失败');
    const files = tree.tree
      .filter(t => t.type === 'blob' && /^catalogue\/exercises\/\d+\.json$/.test(t.path))
      .map(t => t.path);
    console.log(`[seed] 发现 ${files.length} 个动作文件`);

    // 增量续拉：缓存里已有的 id 跳过；每 500 条 flush 一次落盘（进程被杀可续）
    const have = new Set((items || []).map(it => String(it.file || it.id)));
    let pending = files.filter(p => !have.has(p.match(/(\d+)\.json$/)[1]));
    if (items && have.size > 0) console.log(`[seed] 缓存已有 ${have.size} 条，续拉 ${pending.length} 条`);
    else { items = []; pending = files; }

    let done = 0;
    await pool(pending, async (p) => {
      const id = p.match(/(\d+)\.json$/)[1];
      const data = await fetchJSON(RAW_BASE + p.split('/').pop()).catch(() => null);
      if (data) {
        items.push({ file: id, ...data });
        done++;
        if (done % 500 === 0) {
          try { writeFileSync(CACHE, JSON.stringify(items)); } catch (e) { /* 忽略 */ }
          console.log(`[seed] 进度 ${done}/${pending.length}（已落盘）`);
        }
      }
      return null;
    }, CONCURRENCY);
    console.log(`[seed] 本轮拉取 ${done}/${pending.length} 条，总计 ${items.length} 条`);

    // 落盘缓存 + 名字清单（供 curated 匹配键校准）
    try {
      writeFileSync(CACHE, JSON.stringify(items));
      writeFileSync(NAMES, items.map(it => (it.file || '') + '\t' + (it.name || '')).join('\n'));
      console.log('[seed] 已缓存原始数据与名字清单');
    } catch (e) { console.log('[seed] 缓存写入失败（不影响主流程）: ' + e.message); }
  }

  console.log('[seed] 读取精选中文映射...');
  const curated = JSON.parse(readFileSync(join(__dirname, 'curated-zh.json'), 'utf8')).items;

  // 关键词自动匹配：match 拆词 AND（词序无关），排除变体词；两轮放宽
  const STRICT_EXCLUDES = ['decline', 'incline', 'jm', 'smith', 'reverse', 'close', 'wide', 'narrow',
    'stability', 'ball', 'band', 'lever', 'sled', 'suspension', 'suspender', 'alternate', 'behind',
    'kneeling', 'seated', 'standing', 'single', 'one leg', 'one arm', 'rotation', 'twisting', 'jump',
    'walk', 'negative', 'v. 2', 'exercise ball', 'chair', 'plate loaded'];
  const LOOSE_EXCLUDES = ['stability', 'ball', 'suspension', 'suspender', 'chair'];
  function findSource(matchStr) {
    const words = normKey(matchStr).split(' ');
    const test = (it, excludes) => {
      const n = normKey(it.name);
      if (!n) return false;
      return words.every(w => n.includes(w)) && !excludes.some(x => n.includes(x));
    };
    return items.find(it => test(it, STRICT_EXCLUDES)) ||
           items.find(it => test(it, LOOSE_EXCLUDES)) || null;
  }

  const matched = new Set();
  // 逐条精选找原库源条目，再回填中文字段
  for (const c of curated) {
    const src = findSource(c.match);
    if (src) {
      matched.add(c.id);
      src.__zh = c; // 标记
    }
  }
  const docs = items.map(it => {
    const zh = it.__zh || null;
    return {
      exerciseId: String(it.id ?? it.file ?? '').trim(),
      name: String(it.name || '').trim(),
      nameZh: zh ? zh.nameZh : '',
      bodyPart: String(it.bodyPart || '').trim(),
      equipment: String(it.equipment || '').trim(),
      target: String(it.target || '').trim(),
      secondaryMuscles: Array.isArray(it.secondaryMuscles) ? it.secondaryMuscles : [],
      category: String(it.category || '').trim(),
      description: String(it.description || '').trim(),
      descriptionZh: zh ? zh.descriptionZh : '',
      instructions: Array.isArray(it.instructions) ? it.instructions : [],
      instructionsZh: zh ? zh.instructionsZh : [],
      difficulty: zh ? zh.difficulty : '',
      textSource: String(it.textSource || '').trim(),
    };
  }).filter(d => d.exerciseId && d.name); // 原库存在 name 为空的脏数据（如 0004），过滤掉
  const missing = curated.filter(c => !matched.has(c.id)).map(c => `${c.id} (${c.match})`);
  console.log(`[seed] 精选匹配: ${matched.size}/${curated.length}` + (missing.length ? `；未命中: ${missing.join(', ')}` : ''));

  // 生成前端精选集 data/exercises.js
  const frontend = items
    .filter(it => it.__zh)
    .map(it => {
      const c = it.__zh;
      return {
        id: c.id,
        name: c.nameZh,
        nameEn: it.name,
        sourceId: String(it.id ?? it.file),
        muscles: c.muscles,
        equipment: c.equipment,
        difficulty: c.difficulty,
        description: c.descriptionZh,
        steps: c.instructionsZh,
      };
    });

  const js = `// openGym 动作数据 · 精选集（${frontend.length} 条 · 学术中文）
// 由 scripts/seed-exercises.mjs 从 curated-zh.json 生成，手改会被覆盖。
// 文本合规：openGym 原 catalogue (AGPL-3.0) + ExerciseDB v1 (MIT)；媒体（Gym visual 商业素材）已剥离。
// 全量 ${items.length} 条动作存于后端 Mongo，前端可经 /api/exercises 分页检索。

export var EXERCISES = ${JSON.stringify(frontend, null, 2)};

export var MUSCLE_GROUPS = [
  { id: 'chest', name: '胸肌' },
  { id: 'back', name: '背部' },
  { id: 'shoulders', name: '肩部' },
  { id: 'biceps', name: '二头' },
  { id: 'triceps', name: '三头' },
  { id: 'quads', name: '股四头' },
  { id: 'hamstrings', name: '腘绳肌' },
  { id: 'glutes', name: '臀肌' },
  { id: 'calves', name: '小腿' },
  { id: 'core', name: '核心' },
  { id: 'forearms', name: '前臂' },
  { id: 'traps', name: '斜方肌' },
  { id: 'lower-back', name: '下背' }
];

export var STARTER_PLANS = {
  pushPullLegs: { name: '推拉腿 六日', weekdayCount: 6 },
  upperLower:   { name: '上下肢 四日', weekdayCount: 4 },
  fullBody:     { name: '全身 三日', weekdayCount: 3 },
  fiveByFive:   { name: '5×5 力量', weekdayCount: 3 }
};
`;
  writeFileSync(join(ROOT, 'data', 'exercises.js'), js);
  console.log(`[seed] 前端精选集已生成: data/exercises.js (${frontend.length} 条)`);

  if (DRY) {
    console.log('[seed] --dry 模式，跳过数据库写入');
    return;
  }

  // --push：经线上后端 /api/admin/seed 分批灌库（Mongo 公网不可达，容器内才可连）
  if (process.argv.includes('--push')) {
    const config = JSON.parse(readFileSync(join(ROOT, 'qdmp-config.json'), 'utf8'));
    const { createHmac } = await import('node:crypto');
    const key = createHmac('sha256', config.appSecret).update('openGym/seed/v1').digest('hex');
    const base = 'https://' + config.appId + '.qiandaomp.com';
    console.log('[seed] --push 模式：分批推送到 ' + base + '/api/admin/seed');
    const BATCH = 300;
    for (let i = 0; i < docs.length; i += BATCH) {
      const batch = docs.slice(i, i + BATCH);
      const res = await fetch(base + '/api/admin/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-seed-key': key },
        body: JSON.stringify({ items: batch }),
        signal: AbortSignal.timeout(30000),
      });
      const out = await res.json().catch(() => ({}));
      if (out.code !== 0) throw new Error('批次 ' + i + ' 失败: ' + JSON.stringify(out).slice(0, 200));
      console.log('[seed] push ' + Math.min(i + BATCH, docs.length) + '/' + docs.length + ' accepted=' + (out.data && out.data.accepted));
    }
    console.log('[seed] 线上灌库完成');
    return;
  }

  // 直连 Mongo（仅当 RDS 对公网开放时可用；当前千岛 RDS 仅内网可达，走 --push）
  console.log('[seed] 连接千岛 Mongo...');
  const { default: mongodb } = await import('mongodb');
  const config = JSON.parse(readFileSync(join(ROOT, 'qdmp-config.json'), 'utf8'));
  const client = new mongodb.MongoClient(config.mongodb.uri, { serverSelectionTimeoutMS: 15000 });
  await client.connect();
  const coll = client.db(config.mongodb.database).collection('exercises');

  console.log('[seed] 清空旧数据并灌入...');
  await coll.deleteMany({});
  for (let i = 0; i < docs.length; i += CHUNK) {
    await coll.insertMany(docs.slice(i, i + CHUNK), { ordered: false });
    process.stdout.write(`\r[seed] ${Math.min(i + CHUNK, docs.length)}/${docs.length}`);
  }
  console.log(`\n[seed] 完成：共写入 ${docs.length} 条到 ${config.mongodb.database}.exercises`);
  await client.close();
}

main().catch(e => {
  console.error('[seed] 失败:', e.message);
  process.exit(1);
});
