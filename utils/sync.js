// openGym 训练记录云同步 — 把本地 Store 的 history 条目转换为后端 HistoryDoc 并 push
// 未登录或后端不可用时静默跳过（本地数据始终是 source of truth）

import { pushHistory } from './api.js';
import { Auth } from './auth.js';

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

export { syncLastHistory, toDoc };
