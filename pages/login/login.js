import { Auth } from '../../utils/auth.js';
import { pullCloud } from '../../utils/sync.js';

Page({
  data: {
    logged: false,
    nickname: '',
    logging: false
  },

  onShow: function () {
    var s = Auth.init();
    this.setData({ logged: !!s, nickname: (s && s.nickname) || '' });
  },

  // 静默登录 → 登录成功后拉取云端做双向合并（计划 + 训练记录，见 utils/sync.js）
  doLogin: function () {
    var self = this;
    if (this.data.logging) return;
    this.setData({ logging: true });
    Auth.login().then(function (sess) {
      if (!sess) {
        self.setData({ logging: false });
        var rt = typeof qd !== 'undefined' ? qd : null;
        if (rt && rt.showToast) rt.showToast({ title: '登录失败，请重试', icon: 'none' });
        return;
      }
      pullCloud().then(function () {
        self.setData({ logged: true, nickname: sess.nickname || '', logging: false });
        var rt2 = typeof qd !== 'undefined' ? qd : null;
        if (rt2 && rt2.showToast) rt2.showToast({ title: '登录成功，数据已同步', icon: 'none' });
      });
    });
  },

  logout: function () {
    Auth.logout();
    this.setData({ logged: false, nickname: '' });
  },

  guestMode: function () {
    var rt = typeof qd !== 'undefined' ? qd : null;
    if (rt && rt.switchTab) rt.switchTab({ url: '/pages/home/home' });
    else if (rt && rt.reLaunch) rt.reLaunch({ url: '/pages/home/home' });
  }
});
