import { Store } from '../../utils/store.js';

Page({
  data: { unit: 'kg' },

  onLoad: function () { Store.init(); this.setData({ unit: Store.state.settings.unit || 'kg' }); },

  setUnit: function (e) {
    var v = e.currentTarget.dataset.v;
    Store.updateSetting('unit', v);
    this.setData({ unit: v });
  },

  showClearConfirm: function () {
    var self = this;
    var rt = typeof qd !== 'undefined' ? qd : null;
    if (rt && rt.showModal) {
      rt.showModal({
        title: '确认清除？',
        content: '所有训练数据和计划将被永久删除，无法恢复',
        confirmColor: '#e74c3c',
        success: function (res) { if (res.confirm) { Store.clearAll(); self.setData({ unit: 'kg' }); } }
      });
    }
  }
});
