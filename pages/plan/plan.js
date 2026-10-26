import { Store } from '../../utils/store.js';

var WEEKDAY_IDS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
var WEEKDAY_LABELS = ['周一','周二','周三','周四','周五','周六','周日'];

Page({
  data: { weekdays: [] },

  onLoad: function () {
    Store.init();
    this._refresh();
  },

  onShow: function () { this._refresh(); },

  _refresh: function () {
    var state = Store.state;
    var dow = new Date().getDay();
    var todayKey = WEEKDAY_IDS[dow === 0 ? 6 : dow - 1];

    var list = WEEKDAY_IDS.map(function (id, idx) {
      var ex = state.routines[id] || [];
      return {
        id: id,
        label: WEEKDAY_LABELS[idx],
        today: id === todayKey,
        count: ex.length,
        exercises: ex
      };
    });
    this.setData({ weekdays: list });
  },

  editDay: function (e) {
    var rt = typeof qd !== 'undefined' ? qd : null;
    if (rt && typeof rt.showToast === 'function') {
      rt.showToast({ title: '编辑功能待后端', icon: 'none' });
    }
  }
});
