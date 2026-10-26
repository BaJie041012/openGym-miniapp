import { Auth } from '../../utils/auth.js';
import { getRoutine } from '../../utils/api.js';
import { Store } from '../../utils/store.js';

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

  // 静默登录 → 登录成功后拉取云端计划合并到本地（云端非空条目优先）
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
      // 拉取云端计划：本地为空的天用云端数据填充（本地优先，避免覆盖）
      getRoutine().then(function (cloud) {
        if (cloud && cloud.days) {
          for (var day in cloud.days) {
            if (Object.prototype.hasOwnProperty.call(cloud.days, day)) {
              var plans = cloud.days[day] || [];
              var local = Store.state.routines[day] || [];
              if (local.length === 0 && plans.length > 0) {
                Store.setRoutine(day, plans);
              }
            }
          }
        }
        self.setData({ logged: true, nickname: sess.nickname || '', logging: false });
        var rt2 = typeof qd !== 'undefined' ? qd : null;
        if (rt2 && rt2.showToast) rt2.showToast({ title: '登录成功', icon: 'none' });
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
