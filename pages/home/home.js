import { Store } from '../../utils/store.js';

Page({
  data: {
    todayLabel: '',
    hasRoutine: false,
    todaysRoutine: [],
    activeFlag: false,
    activeExerciseName: '',
    todayDone: false,
    recentHistory: []
  },

  onLoad: function () {
    Store.init();
    // 云端数据启动时异步合并进 Store，到达后自动刷新（utils/sync.js pullCloud → Store.emit）
    Store.on(this._refresh.bind(this));
    this._refresh();
  },

  onShow: function () {
    this._refresh();
  },

  _refresh: function () {
    var state = Store.state;
    var d = new Date();
    var dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    var dayKey = dayNames[d.getDay()];
    var weekDays = ['周日','周一','周二','周三','周四','周五','周六'];
    // 今日是否已有完成的训练（日历日起止）
    var dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    var dayEnd = dayStart + 86400000;
    var todayDone = (state.history || []).some(function (h) {
      return h.startedAt >= dayStart && h.startedAt < dayEnd;
    });
    this.setData({
      todayLabel: (d.getMonth() + 1) + '月' + d.getDate() + '日 · ' + weekDays[d.getDay()],
      todaysRoutine: state.routines[dayKey] || [],
      hasRoutine: (state.routines[dayKey] || []).length > 0,
      activeFlag: !!state.active,
      todayDone: todayDone,
      activeExerciseName: state.active && state.active.exercises
        ? (state.active.exercises[state.active.currentExerciseIndex] || {}).name || '训练中'
        : '',
      recentHistory: state.history.slice(-3).reverse().map(function (h) {
        var ds = new Date(h.startedAt);
        return {
          startedAt: h.startedAt,
          dateLabel: (ds.getMonth() + 1) + '月' + ds.getDate() + '日',
          exerciseCount: (h.exercises || []).length
        };
      })
    });
  },

  startToday: function () {
    var d = new Date();
    var dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    var dayKey = dayNames[d.getDay()];
    Store.startWorkout(dayKey);
    var rt = typeof qd !== 'undefined' ? qd : null;
    if (rt && typeof rt.switchTab === 'function') {
      rt.switchTab({ url: '/pages/workout/workout' });
    }
  },

  goWorkout: function () {
    var rt = typeof qd !== 'undefined' ? qd : null;
    if (rt && typeof rt.switchTab === 'function') {
      rt.switchTab({ url: '/pages/workout/workout' });
    }
  }
});
