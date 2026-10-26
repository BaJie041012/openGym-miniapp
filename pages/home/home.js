import { Store } from '../../utils/store.js';

Page({
  data: {
    todayLabel: '',
    hasRoutine: false,
    todaysRoutine: [],
    activeFlag: false,
    activeExerciseName: '',
    recentHistory: []
  },

  onLoad: function () {
    Store.init();
    this._refresh();
  },

  onShow: function () {
    this._refresh();
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  _refresh: function () {
    var state = Store.state;
    var d = new Date();
    var dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    var dayKey = dayNames[d.getDay()];
    var weekDays = ['周日','周一','周二','周三','周四','周五','周六'];
    this.setData({
      todayLabel: (d.getMonth() + 1) + '月' + d.getDate() + '日 · ' + weekDays[d.getDay()],
      todaysRoutine: state.routines[dayKey] || [],
      hasRoutine: (state.routines[dayKey] || []).length > 0,
      activeFlag: !!state.active,
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
