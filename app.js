// openGym 入口 — 启动即静默登录并从云端拉取数据（云端为主，本地为缓存）
// 登录或拉取失败静默降级：离线仍可正常训练，数据落本地，下次联网自动补推

import { Store } from './utils/store.js';
import { Auth } from './utils/auth.js';
import { pullCloud } from './utils/sync.js';

App({
  onLaunch() {
    Store.init();
    // 已有有效 session 直接拉云端；无 session 先静默登录（qd.login 无需用户操作）
    var boot = Auth.isAuthed() ? Promise.resolve(Auth.session()) : Auth.login();
    Promise.resolve(boot).then(function (sess) {
      if (sess) pullCloud();
    });
  },
  onShow() {},
  onHide() {},
  globalData: {}
});
