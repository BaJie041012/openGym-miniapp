import { Store } from '../../utils/store.js';

Page({
  data: {
    totalSessions: 0, totalVolume: 0, totalMinutes: 0, currentStreak: 0,
    weekBars: []
  },

  onLoad: function () { Store.init(); this._refresh(); },
  onShow: function () { this._refresh(); },

  _refresh: function () {
    var history = Store.state.history || [];
    var totalVol = 0, totalMin = 0;
    history.forEach(function (h) {
      (h.sets || []).forEach(function (sets) {
        (sets || []).forEach(function (s) { totalVol += (s.weight || 0) * (s.reps || 0); });
      });
      var started = h.startedAt || 0;
      var finished = h.finishedAt || Date.now();
      totalMin += Math.round((finished - started) / 60000);
    });

    // streak: 连续训练天数（最近一次在今天或昨天，往前数连续有训练记录的天）
    var dayMap = {};
    history.forEach(function (h) {
      var d = new Date(h.startedAt);
      var key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
      dayMap[key] = true;
    });
    var streak = 0;
    var cursor = new Date();
    while (true) {
      var k = cursor.getFullYear() + '-' + (cursor.getMonth() + 1) + '-' + cursor.getDate();
      if (dayMap[k]) { streak++; cursor.setDate(cursor.getDate() - 1); }
      else break;
    }

    // week bars (last 7 days)
    var bars = [];
    var weekMax = 0;
    for (var i = 6; i >= 0; i--) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      var label = ['日','一','二','三','四','五','六'][d.getDay()];
      var vol = 0;
      history.forEach(function (h) {
        var hs = new Date(h.startedAt);
        if (hs.getFullYear() === d.getFullYear() && hs.getMonth() === d.getMonth() && hs.getDate() === d.getDate()) {
          (h.sets || []).forEach(function (sets) {
            (sets || []).forEach(function (s) { vol += (s.weight || 0) * (s.reps || 0); });
          });
        }
      });
      if (vol > weekMax) weekMax = vol;
      bars.push({ day: i, label: label, vol: vol, height: 0 });
    }
    bars.forEach(function (b) {
      b.height = weekMax > 0 ? Math.round((b.vol / weekMax) * 140) : 0;
    });

    this.setData({
      totalSessions: history.length,
      totalVolume: totalVol,
      totalMinutes: totalMin,
      currentStreak: streak,
      weekBars: bars
    });
  }
});
