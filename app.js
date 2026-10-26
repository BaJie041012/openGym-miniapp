App({
  onLaunch() {
    // 静默初始化本地存储
    var rt = typeof qd !== 'undefined' ? qd : null;
    if (rt && typeof rt.getStorageSync === 'function') {
      var existing = rt.getStorageSync('opengym-state');
      if (!existing) {
        rt.setStorageSync('opengym-state', JSON.stringify({
          routines: {},
          history: [],
          active: null,
          settings: { theme: 'dark', unit: 'kg' }
        }));
      }
    }
  },
  onShow() {},
  onHide() {},
  globalData: {}
});
