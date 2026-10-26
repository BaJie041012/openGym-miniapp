import { EXERCISES } from '../../data/exercises.js';

var FILTERS = [
  { id: 'all',       label: '全部',     fn: function () { return true; } },
  { id: 'barbell',   label: '杠铃',     fn: function (e) { return e.equipment === 'barbell'; } },
  { id: 'bodyweight', label: '徒手',    fn: function (e) { return e.equipment === 'bodyweight'; } },
  { id: 'chest',     label: '胸部',     fn: function (e) { return e.muscles.indexOf('chest') >= 0; } },
  { id: 'back',      label: '背部',     fn: function (e) { return e.muscles.indexOf('back') >= 0 || e.muscles.indexOf('lats') >= 0; } },
  { id: 'legs',      label: '腿部',     fn: function (e) { return e.muscles.indexOf('quads') >= 0 || e.muscles.indexOf('hamstrings') >= 0 || e.muscles.indexOf('glutes') >= 0; } },
  { id: 'shoulders', label: '肩部',     fn: function (e) { return e.muscles.indexOf('shoulders') >= 0; } },
  { id: 'arms',      label: '手臂',     fn: function (e) { return e.muscles.indexOf('biceps') >= 0 || e.muscles.indexOf('triceps') >= 0; } }
];

Page({
  data: {
    exercises: EXERCISES,
    filtered: EXERCISES,
    filters: FILTERS,
    activeFilter: 'all'
  },

  onShow: function () {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
  },

  selectFilter: function (e) {
    var id = e.currentTarget.dataset.id;
    var filter = FILTERS.find(function (f) { return f.id === id; });
    this.setData({
      activeFilter: id,
      filtered: EXERCISES.filter(function (ex) { return filter.fn(ex); })
    });
  }
});
