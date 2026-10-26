import { Store } from '../../utils/store.js';
import { EXERCISES, MUSCLE_GROUPS } from '../../data/exercises.js';
import { putRoutineDay } from '../../utils/api.js';
import { Auth } from '../../utils/auth.js';

var DAY_LABELS = {
  monday: '周一', tuesday: '周二', wednesday: '周三', thursday: '周四',
  friday: '周五', saturday: '周六', sunday: '周日'
};

Page({
  data: {
    day: '',
    dayLabel: '',
    selected: [],
    filtered: [],
    filters: [],
    activeFilter: 'all',
    cloudSynced: false
  },

  onLoad: function (query) {
    var day = (query && query.day) || 'monday';
    var existing = (Store.state.routines[day] || []).slice();
    var filters = [{ id: 'all', label: '全部' }].concat(MUSCLE_GROUPS.map(function (m) {
      return { id: m.id, label: m.name };
    }));
    this.setData({
      day: day,
      dayLabel: DAY_LABELS[day] || day,
      selected: existing,
      filters: filters,
      activeFilter: 'all'
    });
    this._applyFilter('all');
  },

  _applyFilter: function (id) {
    var list = id === 'all' ? EXERCISES : EXERCISES.filter(function (ex) {
      return ex.muscles.indexOf(id) >= 0;
    }).map(function (ex) {
      var copy = {};
      for (var k in ex) copy[k] = ex[k];
      copy.muscleNames = ex.muscles.map(function (mid) {
        var g = MUSCLE_GROUPS.filter(function (m) { return m.id === mid; })[0];
        return g ? g.name : mid;
      });
      return copy;
    });
    this.setData({ filtered: list, activeFilter: id });
  },

  selectFilter: function (e) {
    this._applyFilter(e.currentTarget.dataset.id);
  },

  addExercise: function (e) {
    var idx = e.currentTarget.dataset.idx;
    var ex = this.data.filtered[idx];
    if (!ex) return;
    var exists = this.data.selected.some(function (s) { return s.exerciseId === ex.id; });
    if (exists) {
      var rt = typeof qd !== 'undefined' ? qd : null;
      if (rt && rt.showToast) rt.showToast({ title: '已在计划中', icon: 'none' });
      return;
    }
    var selected = this.data.selected.concat([{
      exerciseId: ex.id,
      name: ex.name,
      sets: 3,
      reps: '8-12'
    }]);
    this.setData({ selected: selected });
    var rt = typeof qd !== 'undefined' ? qd : null;
    if (rt && rt.showToast) rt.showToast({ title: '已加入 ' + ex.name, icon: 'none' });
  },

  removeSelected: function (e) {
    var idx = e.currentTarget.dataset.idx;
    var selected = this.data.selected.slice();
    selected.splice(idx, 1);
    this.setData({ selected: selected });
  },

  savePlan: function () {
    var self = this;
    var day = this.data.day;
    var plans = this.data.selected;

    // 1. 本地立即生效
    Store.setRoutine(day, plans);

    // 2. 已登录则云同步（静默，失败不影响本地）
    if (Auth.isAuthed()) {
      putRoutineDay(day, plans).then(function (data) {
        if (data) {
          self.setData({ cloudSynced: true });
        }
        self._done();
      });
    } else {
      self._done();
    }
  },

  _done: function () {
    var rt = typeof qd !== 'undefined' ? qd : null;
    var synced = this.data.cloudSynced;
    if (rt && rt.showToast) {
      rt.showToast({ title: synced ? '已保存并云同步' : '已保存到本地', icon: 'none' });
    }
    setTimeout(function () {
      if (rt && rt.navigateBack) rt.navigateBack();
    }, 600);
  }
});
