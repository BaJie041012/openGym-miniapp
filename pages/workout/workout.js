import { Store } from '../../utils/store.js';
import { syncLastHistory } from '../../utils/sync.js';

Page({
  data: {
    activeFlag: false,
    currentIdx: 0,
    exerciseCount: 0,
    currentExercise: {},
    currentSets: [],
    weight: '',
    reps: '',
    restTime: '0:00'
  },

  onLoad: function () {
    Store.init();
    this._restTimer = null;
    this._restLeft = 0;
    this._refresh();
  },

  onShow: function () { this._refresh(); },

  onHide: function () { this._stopRest(); },
  onUnload: function () { this._stopRest(); },

  _refresh: function () {
    var state = Store.state;
    var active = state.active;
    var exercises = (active && active.exercises) || [];
    var idx = active ? (active.currentExerciseIndex || 0) : 0;
    var cur = exercises[idx] || {};
    this.setData({
      activeFlag: !!active,
      currentIdx: idx,
      exerciseCount: exercises.length,
      currentExercise: {
        name: cur.name || '训练中',
        musclesText: (cur.muscles || []).join(' · ')
      },
      currentSets: (active && active.sets) ? (active.sets[idx] || []) : []
    });
  },

  onWeightInput: function (e) { this.setData({ weight: e.detail.value }); },
  onRepsInput: function (e) { this.setData({ reps: e.detail.value }); },

  logSet: function () {
    var w = parseFloat(this.data.weight);
    var r = parseInt(this.data.reps);
    if (!isFinite(w) || !isFinite(r) || r <= 0) {
      var rt = typeof qd !== 'undefined' ? qd : null;
      if (rt && rt.showToast) rt.showToast({ title: '请填写重量和次数', icon: 'none' });
      return;
    }
    Store.logSet(this.data.currentIdx, w, r);
    this.setData({ weight: '', reps: '' });
    this._refresh();
    this.startRest(90);
  },

  startRest: function (e) {
    var sec = typeof e === 'number' ? e : Number(e.currentTarget.dataset.sec);
    this._stopRest();
    this._restLeft = sec;
    this.setData({ restTime: this._fmtTime(sec) });
    var self = this;
    this._restTimer = setInterval(function () {
      self._restLeft--;
      if (self._restLeft <= 0) {
        self._stopRest();
        self.setData({ restTime: '0:00' });
      } else {
        self.setData({ restTime: self._fmtTime(self._restLeft) });
      }
    }, 1000);
  },

  _stopRest: function () {
    if (this._restTimer) { clearInterval(this._restTimer); this._restTimer = null; }
  },

  _fmtTime: function (s) {
    var m = Math.floor(s / 60);
    var ss = s % 60;
    return m + ':' + (ss < 10 ? '0' : '') + ss;
  },

  jumpTo: function (e) {
    var idx = Number(e.currentTarget.dataset.idx);
    if (Store.state.active) {
      Store.state.active.currentExerciseIndex = idx;
      Store.persist();
    }
    this._refresh();
  },

  nextExercise: function () { Store.nextExercise(); this._refresh(); },
  prevExercise: function () {
    if (Store.state.active && Store.state.active.currentExerciseIndex > 0) {
      Store.state.active.currentExerciseIndex--;
      Store.persist();
      this._refresh();
    }
  },

  finishWorkout: function () {
    var self = this;
    var rt = typeof qd !== 'undefined' ? qd : null;
    if (rt && rt.showModal) {
      rt.showModal({
        title: '确认结束训练？',
        content: '已记录的组数将保存到历史记录',
        success: function (res) {
          if (res.confirm) {
            Store.finishWorkout();
            syncLastHistory(Store.state.history); // 登录时静默云同步
            self._refresh();
            if (rt && rt.switchTab) rt.switchTab({ url: '/pages/home/home' });
          }
        }
      });
    } else {
      Store.finishWorkout();
      syncLastHistory(Store.state.history);
      this._refresh();
    }
  },

  goHome: function () {
    var rt = typeof qd !== 'undefined' ? qd : null;
    if (rt && rt.switchTab) rt.switchTab({ url: '/pages/home/home' });
  }
});
