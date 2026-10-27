import { Store } from '../../utils/store.js';
import { PRESET_PLANS } from '../../data/preset-plans.js';
import { putRoutineDay } from '../../utils/api.js';
import { Auth } from '../../utils/auth.js';

var WEEKDAY_IDS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
var WEEKDAY_LABELS = ['周一','周二','周三','周四','周五','周六','周日'];

Page({
  data: { weekdays: [] },

  onLoad: function () {
    Store.init();
    // 云端数据启动时异步合并进 Store，到达后自动刷新（utils/sync.js pullCloud → Store.emit）
    Store.on(this._refresh.bind(this));
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
    var day = e.currentTarget.dataset.day;
    var rt = typeof qd !== 'undefined' ? qd : null;
    if (rt && rt.navigateTo) {
      rt.navigateTo({ url: '/pages/plan-edit/plan-edit?day=' + day });
    }
  },

  // 导入预设计划：actionSheet 选择 → 确认覆盖 → 写 Store 7 天 + 登录时逐日云同步
  importPreset: function () {
    var self = this;
    var rt = typeof qd !== 'undefined' ? qd : null;
    if (!rt || !rt.showActionSheet) return;
    var names = PRESET_PLANS.map(function (p) { return p.emoji + ' ' + p.name + '（' + p.days + ' 练/周）'; });
    rt.showActionSheet({
      itemList: names,
      success: function (res) {
        var plan = PRESET_PLANS[res.tapIndex];
        if (!plan || !rt.showModal) { self._applyPreset(plan); return; }
        rt.showModal({
          title: '导入「' + plan.name + '」？',
          content: '将覆盖当前整周计划，动作可在导入后单独调整',
          success: function (m) { if (m.confirm) self._applyPreset(plan); }
        });
      }
    });
  },

  _applyPreset: function (plan) {
    if (!plan) return;
    var self = this;
    var authed = Auth.isAuthed();
    // 按 schedule 展开到 7 天：排到的天用对应 routine，其余天清空
    WEEKDAY_IDS.forEach(function (day) {
      var key = plan.schedule[day];
      var routine = key ? plan.routines.filter(function (r) { return r.key === key; })[0] : null;
      var plans = routine ? routine.exercises.slice() : [];
      Store.setRoutine(day, plans);
      if (authed) putRoutineDay(day, plans); // 静默云同步
    });
    self._refresh();
    var rt = typeof qd !== 'undefined' ? qd : null;
    if (rt && rt.showToast) {
      rt.showToast({ title: authed ? '已导入并云同步' : '已导入到本地', icon: 'none' });
    }
  }
});
