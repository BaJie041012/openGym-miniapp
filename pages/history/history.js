import { Store } from '../../utils/store.js';

Page({
  data: { history: [] },

  onLoad: function () { Store.init(); this._refresh(); },
  onShow: function () { this._refresh(); },

  _refresh: function () {
    var raw = (Store.state.history || []).slice().reverse();
    var processed = raw.map(function (h) {
      var ds = new Date(h.startedAt);
      var mins = Math.round(((h.finishedAt || Date.now()) - h.startedAt) / 60000);
      var vol = 0;
      (h.sets || []).forEach(function (sets) {
        (sets || []).forEach(function (s) {
          vol += (s.weight || 0) * (s.reps || 0);
        });
      });
      return {
        startedAt: h.startedAt,
        dateLabel: (ds.getMonth() + 1) + '月' + ds.getDate() + '日',
        durationLabel: mins + ' 分钟',
        exerciseCount: (h.exercises || []).length,
        totalVolume: vol
      };
    });
    this.setData({ history: processed });
  }
});
