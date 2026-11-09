// 好友码管理 入口 — 启动即静默登录（qd.login 无需用户操作）
// 登录失败静默降级：离线时按钮不可用，联网后恢复

import { Auth } from './utils/auth.js';

App({
  onLaunch() {
    // 已有有效 session 直接用；无 session 先静默登录
    if (!Auth.isAuthed()) {
      Auth.login();
    }
  },
  onShow() {},
  onHide() {},
  globalData: {}
});
