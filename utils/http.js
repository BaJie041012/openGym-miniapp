// openGym 请求桥 — 参考 czrDexTracker/utils/http.js 范式
// 只用 qd.request 回调结算；15s 超时；{code,data} 信封解包；安全错误文案

import { BACKEND_BASE } from './backend.js';

var DEFAULT_TIMEOUT = 15 * 1000;

function currentRuntime() {
  return typeof qd !== 'undefined' ? qd : null;
}

function parseBody(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  if (typeof raw !== 'string') return raw;
  try { return JSON.parse(raw); } catch (e) { return raw; }
}

// 传输层（只用 qd.request）
function invokeBridge(method, url, data, headers) {
  return new Promise(function (resolve, reject) {
    var rt = currentRuntime();
    if (!rt || typeof rt.request !== 'function') {
      reject(new Error('runtime unavailable'));
      return;
    }
    var settled = false;
    function done(fn, val) { if (!settled) { settled = true; fn(val); } }

    var opts = {
      url: url, method: method,
      header: headers || { 'Content-Type': 'application/json' },
      success: function (res) {
        var sc = res && typeof res.statusCode === 'number' ? res.statusCode : 0;
        var body = parseBody(res ? res.data : null);
        if (sc >= 200 && sc < 300) done(resolve, body);
        else done(reject, new Error('HTTP ' + sc));
      },
      fail: function () { done(reject, new Error('network')); }
    };
    if (data !== undefined && data !== null) opts.data = data;
    try { rt.request(opts); } catch (e) { done(reject, new Error('transport')); }
  });
}

function withTimeout(promise, ms) {
  var t = (typeof ms === 'number' && ms > 0) ? ms : DEFAULT_TIMEOUT;
  return new Promise(function (resolve, reject) {
    var settled = false;
    var timer = setTimeout(function () {
      if (!settled) { settled = true; reject(new Error('timeout')); }
    }, t);
    promise.then(
      function (v) { if (!settled) { settled = true; clearTimeout(timer); resolve(v); } },
      function (e) { if (!settled) { settled = true; clearTimeout(timer); reject(e); } }
    );
  });
}

function processBody(raw) {
  var body = parseBody(raw);
  if (body && typeof body === 'object' && body.code === 0) return body.data;
  throw new Error((body && body.message) || 'request failed');
}

// 对外主入口（无后端时静默降级）。headers 可选（如 Authorization）。
function requestJSON(method, url, data, headers) {
  var allHeaders = { 'Content-Type': 'application/json' };
  if (headers) {
    for (var k in headers) {
      if (Object.prototype.hasOwnProperty.call(headers, k)) allHeaders[k] = headers[k];
    }
  }
  return new Promise(function (resolve) { setTimeout(resolve, 0); })
    .then(function () {
      return withTimeout(invokeBridge(method, BACKEND_BASE + url, data, allHeaders), DEFAULT_TIMEOUT);
    })
    .then(processBody)
    .catch(function () { return null; }); // MVP 阶段静默降级
}

export { requestJSON, BACKEND_BASE };
