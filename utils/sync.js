// openGym 云同步 — push：本地条目转 HistoryDoc 上推；pull：启动时双向合并（云端为主）
// 未登录或后端不可用时静默降级为本地（离线可写，联网补推）

import { pushHistory, getHistory, getRoutine, putRoutineDay } from './api.js';
import { Auth } from './auth.js';
import { Store } from './store.js';

// 把 Store.history 的本地条目转换为后端 HistoryDoc 结构
function toDoc(entry) {
  var exercises = (entry.exercises || []).map(function (ex, i) {
    var sets = (entry.sets && entry.sets[i] ? entry.sets[i] : []).map(function (s) {
      return { weight: Number(s.weight) || 0, reps: Number(s.reps) || 0 };
    });
    var volume = sets.reduce(function (acc, s) { return acc + s.weight * s.reps; }, 0);
    return {
      exerciseId: ex.exerciseId || '',
      name: ex.name || '',
      sets: sets
    };
  });
  var totalVolume = exercises.reduce(function (acc, ex) {
    return acc + ex.sets.reduce(function (a, s) { return a + s.weight * s.reps; }, 0);
  }, 0);

  var startedAt = entry.startedAt || Date.now();
  var d = new Date(startedAt);
  var date = d.getFullYear() + '-' +
    ('0' + (d.getMonth() + 1)).slice(-2) + '-' +
    ('0' + d.getDate()).slice(-2);

  return {
    recordId: 'r' + startedAt,
    date: date,
    startedAt: startedAt,
    endedAt: entry.finishedAt || Date.now(),
    exercises: exercises,
    volume: Math.round(totalVolume * 10) / 10,
    updatedAt: Date.now()
  };
}

// 同步本地最后一条训练记录到云端（fire-and-forget）
function syncLastHistory(historyList) {
  if (!Auth.isAuthed()) return Promise.resolve(false);
  var list = historyList || [];
  if (list.length === 0) return Promise.resolve(false);
  var doc = toDoc(list[list.length - 1]);
  return pushHistory([doc]).then(function (res) { return !!res; }).catch(function () { return false; });
}

// ─── pull：启动/登录时云端 → 本地双向合并（云端为主） ────────────────────────

var WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
var PUSH_BATCH = 100; // 后端 POST /api/history 上限 100 条/次

// 云端 HistoryDoc → 本地 history 条目
function fromDoc(doc) {
  var exercises = (doc.exercises || []).map(function (ex) {
    return { exerciseId: ex.exerciseId || '', name: ex.name || '' };
  });
  var sets = (doc.exercises || []).map(function (ex) {
    return (ex.sets || []).map(function (s) {
      return { weight: Number(s.weight) || 0, reps: Number(s.reps) || 0, at: doc.startedAt || 0 };
    });
  });
  return {
    routineId: '',
    exercises: exercises,
    sets: sets,
    startedAt: doc.startedAt || 0,
    finishedAt: doc.endedAt || doc.startedAt || 0
  };
}

// 计划条目宽松比对（云端 round-trip 后字段顺序可能变化，不能 stringify 整体比）
function samePlans(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  return a.every(function (p, i) {
    var q = b[i] || {};
    return (p.exerciseId || '') === (q.exerciseId || '') &&
      (p.name || '') === (q.name || '') &&
      (p.sets || 0) === (q.sets || 0) &&
      (p.reps || '') === (q.reps || '');
  });
}

// 计划双向合并：本地空天用云端填；本地有云端空推云；两边都有且不同以本地为准并推云
// （写路径已双写，不一致只发生在未登录期间的本地编辑，本地是最近编辑处）
function mergeRoutines(cloud) {
  var days = cloud && cloud.days ? cloud.days : {};
  WEEK_DAYS.forEach(function (day) {
    var cloudPlans = days[day] || [];
    var localPlans = Store.state.routines[day] || [];
    if (localPlans.length === 0 && cloudPlans.length > 0) {
      Store.setRoutine(day, cloudPlans); // 云端 → 本地
    } else if (localPlans.length > 0 && (cloudPlans.length === 0 || !samePlans(localPlans, cloudPlans))) {
      putRoutineDay(day, localPlans); // 本地 → 云端（补推/覆盖）
    }
  });
}

// 训练记录双向合并：按 recordId（r+startedAt）幂等
function mergeHistory(cloudItems) {
  var items = Array.isArray(cloudItems) ? cloudItems : [];
  var cloudKnown = {};
  items.forEach(function (doc) { cloudKnown[doc.recordId] = true; });

  // 云端有本地无 → 插入本地
  var added = false;
  items.forEach(function (doc) {
    var exists = Store.state.history.some(function (h) { return 'r' + (h.startedAt || 0) === doc.recordId; });
    if (exists) return;
    Store.state.history.push(fromDoc(doc));
    added = true;
  });
  if (added) {
    Store.state.history.sort(function (a, b) { return (a.startedAt || 0) - (b.startedAt || 0); });
    Store.persist();
  }

  // 本地有云端无（未登录/离线期间攒的）→ 批量补推
  var missing = Store.state.history
    .filter(function (h) { return !cloudKnown['r' + (h.startedAt || 0)]; })
    .map(toDoc);
  for (var i = 0; i < missing.length; i += PUSH_BATCH) {
    pushHistory(missing.slice(i, i + PUSH_BATCH));
  }
  return added;
}

// 启动/登录后调用：拉云端 routines + history 做双向合并，完成后 emit 通知页面刷新。
// 未登录或网络失败静默返回 false（保持本地数据不动）。
function pullCloud() {
  if (!Auth.isAuthed()) return Promise.resolve(false);
  return Promise.all([getRoutine(), getHistory(0, 200)]).then(function (results) {
    if (!results[0] && !results[1]) return false; // 双双失败（未登录/断网）不动本地
    var changed = false;
    if (results[0]) { mergeRoutines(results[0]); changed = true; }
    if (results[1]) { if (mergeHistory(results[1].items)) changed = true; }
    if (changed) Store.emit();
    return changed;
  }).catch(function () { return false; });
}

export { syncLastHistory, toDoc, pullCloud, fromDoc };
