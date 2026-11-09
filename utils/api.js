// 好友码管理 后端 API 封装
// 全部基于 Auth.session() 携带 Bearer 会话；未登录或网络失败静默降级为 null

import { requestJSON } from './http.js';
import { Auth } from './auth.js';

function authed() {
  var h = Auth.authHeader();
  if (!h) return null;
  return h;
}

// ─── 玩家账号 ────────────────────────────────────────────────────────────────

function listPlayers() {
  var h = authed();
  if (!h) return Promise.resolve(null);
  return requestJSON('GET', '/api/players', null, h);
}

function createPlayer(playerId, nickname) {
  var h = authed();
  if (!h) return Promise.resolve(null);
  return requestJSON('POST', '/api/players', { playerId: playerId, nickname: nickname || '' }, h);
}

function deletePlayer(playerId) {
  var h = authed();
  if (!h) return Promise.resolve(null);
  return requestJSON('DELETE', '/api/players/' + encodeURIComponent(playerId), null, h);
}

// ─── 好友码 ─────────────────────────────────────────────────────────────────

function listCodes(playerId) {
  var h = authed();
  if (!h) return Promise.resolve(null);
  return requestJSON('GET', '/api/players/' + encodeURIComponent(playerId) + '/codes', null, h);
}

function addCodes(playerId, codes) {
  var h = authed();
  if (!h) return Promise.resolve(null);
  return requestJSON('POST', '/api/players/' + encodeURIComponent(playerId) + '/codes', { codes: codes }, h);
}

function deleteCode(playerId, code) {
  var h = authed();
  if (!h) return Promise.resolve(null);
  return requestJSON('DELETE', '/api/players/' + encodeURIComponent(playerId) + '/codes?code=' + encodeURIComponent(code), null, h);
}

// ─── 获取 ────────────────────────────────────────────────────────────────────

function claimOne() {
  var h = authed();
  if (!h) return Promise.resolve(null);
  return requestJSON('POST', '/api/claim', null, h);
}

export { listPlayers, createPlayer, deletePlayer, listCodes, addCodes, deleteCode, claimOne };
