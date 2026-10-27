// openGym 本地存储层 — 替代 Pinia，用 qd.getStorageSync / setStorageSync
// 与原 czrDexTracker 的 utils/http.js / utils/auth-core.js 风格一致

var STORAGE_KEY = 'opengym-state';

function getRuntime() {
  return typeof qd !== 'undefined' ? qd : null;
}

function loadState() {
  try {
    var rt = getRuntime();
    if (!rt || typeof rt.getStorageSync !== 'function') return defaultState();
    var raw = rt.getStorageSync(STORAGE_KEY);
    if (!raw) return defaultState();
    var parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Object.assign(defaultState(), parsed);
  } catch (e) {
    return defaultState();
  }
}

function saveState(state) {
  try {
    var rt = getRuntime();
    if (!rt || typeof rt.setStorageSync !== 'function') return;
    rt.setStorageSync(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { /* 静默 */ }
}

function defaultState() {
  return {
    routines: {},           // { monday: [...], tuesday: [...] }
    history: [],            // [{ routineId, exercises, sets, startedAt, finishedAt }]
    active: null,           // 当前进行中的训练
    settings: { theme: 'dark', unit: 'kg', weekStart: 'monday' }
  };
}

export var Store = {
  state: null,
  _listeners: [],

  init() {
    // 幂等：app.js onLaunch 已初始化，页面里重复调用不重读 storage（避免覆盖云同步合并中的 state）
    if (!this.state) this.state = loadState();
  },

  persist() {
    if (this.state) saveState(this.state);
  },

  // 轻量事件：云端数据合并进 Store 后 emit，通知已打开的页面重新渲染
  on(fn) {
    if (typeof fn === 'function') this._listeners.push(fn);
  },

  off(fn) {
    this._listeners = this._listeners.filter(function (f) { return f !== fn; });
  },

  emit() {
    this._listeners.slice().forEach(function (fn) {
      try { fn(); } catch (e) { /* 单个页面刷新失败不影响其他 */ }
    });
  },

  // 训练会话
  startWorkout(routineId) {
    var routine = this.state.routines[routineId] || [];
    this.state.active = {
      routineId: routineId,
      exercises: routine.slice(),
      currentExerciseIndex: 0,
      sets: routine.map(function () { return []; }),
      startedAt: Date.now()
    };
    this.persist();
  },

  finishWorkout() {
    if (!this.state.active) return;
    this.state.history.push({
      routineId: this.state.active.routineId,
      exercises: this.state.active.exercises,
      sets: this.state.active.sets,
      startedAt: this.state.active.startedAt,
      finishedAt: Date.now()
    });
    this.state.active = null;
    this.persist();
  },

  logSet(exerciseIndex, weight, reps) {
    if (!this.state.active) return;
    this.state.active.sets[exerciseIndex].push({
      weight: Number(weight) || 0,
      reps: Number(reps) || 0,
      at: Date.now()
    });
    this.persist();
  },

  nextExercise() {
    if (!this.state.active) return;
    var next = this.state.active.currentExerciseIndex + 1;
    if (next < this.state.active.exercises.length) {
      this.state.active.currentExerciseIndex = next;
      this.persist();
    }
  },

  // 计划
  setRoutine(day, exercises) {
    this.state.routines[day] = exercises;
    this.persist();
  },

  // 设置
  updateSetting(key, value) {
    this.state.settings[key] = value;
    this.persist();
  },

  clearAll() {
    this.state = defaultState();
    this.persist();
  }
};
