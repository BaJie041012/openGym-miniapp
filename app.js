// 好友码管理 入口 — 启动即静默登录（qd.login 无需用户操作）
// Auth.init() 会：有有效 session 直接用；无 session 自动启动静默登录并返回 ready Promise
// home 页面通过 Auth.ready() 等登录完成后再刷昵称，避免时序问题

import { Auth } from './utils/auth.js';

App({
  onLaunch() {
    Auth.init();
  },
  onShow() {},
  onHide() {},
  globalData: {}
});
