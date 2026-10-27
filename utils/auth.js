// openGym 登录态管理 — 参考 czrDexTracker/utils/auth-core.js 范式
// qd.login 拿临时 code → POST /api/auth/login 换 session → 内存 + storage 双存
// session 有效期 8 小时（后端签发），过期前 60s 视为失效

import { requestJSON } from './http.js';

var SESSION_KEY = 'opengym-session';

function rt() {
  return typeof qd !== 'undefined' ? qd : null;
}

function loadStored() {
  try {
    var raw = rt() && rt().getStorageSync ? rt().getStorageSync(SESSION_KEY) : null;
    if (!raw) return null;
    var parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || !parsed.session || !parsed.expiresAt) return null;
    if (Date.now() > parsed.expiresAt - 60 * 1000) return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

function saveStored(sess) {
  try {
    if (rt() && rt().setStorageSync) {
      rt().setStorageSync(SESSION_KEY, JSON.stringify(sess));
    }
  } catch (e) { /* 静默 */ }
}

function clearStored() {
  try {
    if (rt() && rt().removeStorageSync) rt().removeStorageSync(SESSION_KEY);
  } catch (e) { /* 静默 */ }
}

export var Auth = {
  current: null,

  init() {
    this.current = loadStored();
    return this.current;
  },

  isAuthed() {
    if (!this.current) this.current = loadStored();
    return !!(this.current && this.current.session);
  },

  session() {
    if (!this.current) this.current = loadStored();
    return this.current;
  },

  authHeader() {
    var s = this.session();
    return s && s.session ? { Authorization: 'Bearer ' + s.session } : null;
  },

  // 静默登录：qd.login 拿 code → 后端换 session。成功返回 session 对象，失败返回 null。
  login() {
    var self = this;
    var runtime = rt();
    if (!runtime || typeof runtime.login !== 'function') {
      return Promise.resolve(null);
    }
    return new Promise(function (resolve) {
      var settled = false;
      function done(code) {
        if (settled) return;
        settled = true;
        if (!code) { resolve(null); return; }
        requestJSON('POST', '/api/auth/login', { code: code }).then(function (data) {
          if (!data || !data.session) { resolve(null); return; }
          var sess = {
            session: data.session,
            expiresAt: data.expiresAt || (Date.now() + 8 * 3600 * 1000),
            openId: data.user && data.user.openId || '',
            nickname: data.user && data.user.nickname || ''
          };
          self.current = sess;
          saveStored(sess);
          resolve(sess);
        });
      }
      try {
        runtime.login({
          success: function (res) {
            // 兼容 {code} 与 {data:{code}} 两种返回形态
            var code = res && res.code ? res.code : (res && res.data && res.data.code) || '';
            done(code);
          },
          fail: function () { done(''); }
        });
      } catch (e) { done(''); }
    });
  },

  logout() {
    this.current = null;
    clearStored();
  }
};
