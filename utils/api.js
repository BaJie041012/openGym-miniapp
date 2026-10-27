// openGym 后端 API 封装 — routines / history / exercises
// 全部基于 Auth.session() 携带 Bearer 会话；未登录或网络失败静默降级为 null

import { requestJSON } from './http.js';
import { Auth } from './auth.js';

function authed() {
  var h = Auth.authHeader();
  if (!h) return null;
  return h;
}

// GET /api/routines — 拉取云端周计划；未登录/失败返回 null
function getRoutine() {
  var h = authed();
  if (!h) return Promise.resolve(null);
  return requestJSON('GET', '/api/routines', null, h);
}

// PUT /api/routines — 单日局部合并 {day, plans}
function putRoutineDay(day, plans) {
  var h = authed();
  if (!h) return Promise.resolve(null);
  return requestJSON('PUT', '/api/routines', { day: day, plans: plans }, h);
}

// GET /api/exercises — 动作库分页检索（公开）
function listExercises(params) {
  var p = params || {};
  var qs = '?page=' + (p.page || 1) + '&size=' + (p.size || 20);
  if (p.q) qs += '&q=' + encodeURIComponent(p.q);
  if (p.muscle) qs += '&muscle=' + encodeURIComponent(p.muscle);
  if (p.equipment) qs += '&equipment=' + encodeURIComponent(p.equipment);
  return requestJSON('GET', '/api/exercises' + qs);
}

// GET /api/history — 增量拉取训练记录
function getHistory(since, limit) {
  var h = authed();
  if (!h) return Promise.resolve(null);
  return requestJSON('GET', '/api/history?since=' + (since || 0) + '&limit=' + (limit || 100), null, h);
}

// POST /api/history — 批量同步训练记录（recordId 幂等）
function pushHistory(records) {
  var h = authed();
  if (!h) return Promise.resolve(null);
  return requestJSON('POST', '/api/history', { records: records }, h);
}

export { getRoutine, putRoutineDay, listExercises, getHistory, pushHistory };
