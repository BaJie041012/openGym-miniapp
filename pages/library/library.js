import { EXERCISES, MUSCLE_GROUPS } from '../../data/exercises.js';

var MUSCLE_NAME = {};
MUSCLE_GROUPS.forEach(function (m) { MUSCLE_NAME[m.id] = m.name; });

var EQUIP_NAME = {
  barbell: '杠铃', dumbbell: '哑铃', bodyweight: '徒手', machine: '器械',
  cable: '绳索', kettlebell: '壶铃', band: '弹力带', other: '其他'
};
var DIFF_NAME = { beginner: '入门', intermediate: '中级', advanced: '进阶' };

// 给精选集条目补充展示字段（中文肌群/器械/难度 + steps 兜底）
var EXERCISES_VIEW = EXERCISES.map(function (ex) {
  var copy = {};
  for (var k in ex) copy[k] = ex[k];
  copy.muscleNames = (ex.muscles || []).map(function (id) { return MUSCLE_NAME[id] || id; });
  copy.equipmentLabel = EQUIP_NAME[ex.equipment] || ex.equipment || '其他';
  copy.difficultyLabel = DIFF_NAME[ex.difficulty] || '中级';
  copy.steps = ex.steps || [];
  return copy;
});

var FILTERS = [
  { id: 'all',       label: '全部',     fn: function () { return true; } },
  { id: 'barbell',   label: '杠铃',     fn: function (e) { return e.equipment === 'barbell'; } },
  { id: 'dumbbell',  label: '哑铃',     fn: function (e) { return e.equipment === 'dumbbell'; } },
  { id: 'bodyweight', label: '徒手',    fn: function (e) { return e.equipment === 'bodyweight'; } },
  { id: 'machine',   label: '器械',     fn: function (e) { return e.equipment === 'machine' || e.equipment === 'cable'; } },
  { id: 'chest',     label: '胸部',     fn: function (e) { return e.muscles.indexOf('chest') >= 0; } },
  { id: 'back',      label: '背部',     fn: function (e) { return e.muscles.indexOf('back') >= 0 || e.muscles.indexOf('lats') >= 0; } },
  { id: 'legs',      label: '腿部',     fn: function (e) { return e.muscles.indexOf('quads') >= 0 || e.muscles.indexOf('hamstrings') >= 0 || e.muscles.indexOf('glutes') >= 0; } },
  { id: 'shoulders', label: '肩部',     fn: function (e) { return e.muscles.indexOf('shoulders') >= 0; } },
  { id: 'arms',      label: '手臂',     fn: function (e) { return e.muscles.indexOf('biceps') >= 0 || e.muscles.indexOf('triceps') >= 0; } },
  { id: 'core',      label: '核心',     fn: function (e) { return e.muscles.indexOf('core') >= 0; } }
];

Page({
  data: {
    exercises: EXERCISES_VIEW,
    filtered: EXERCISES_VIEW,
    filters: FILTERS,
    activeFilter: 'all'
  },

  selectFilter: function (e) {
    var id = e.currentTarget.dataset.id;
    var filter = FILTERS.find(function (f) { return f.id === id; });
    this.setData({
      activeFilter: id,
      filtered: EXERCISES_VIEW.filter(function (ex) { return filter.fn(ex); })
    });
  }
});
