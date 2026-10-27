// 训练统计 · 对照原项目 Stats.jsx 可落地维度：
// 终身四卡 / 本周对比（weekly-volume）/ 近 8 周趋势 / 肌群容量分布（muscle balance 简化）/ 常练动作 TOP5
// 原项目的体重曲线、疲劳恢复建模、e1RM 依赖体重打卡与 RIR 记录，小程序暂无此数据，未迁移
import { Store } from '../../utils/store.js';
import { EXERCISES, MUSCLE_GROUPS } from '../../data/exercises.js';

// 肌群映射：同一动作可能以 slug（plan-edit）或原库 ID（预设计划）或中文名进入历史
var MUSCLE_LOOKUP = {};
EXERCISES.forEach(function (ex) {
  var m = (ex.muscles && ex.muscles[0]) || null;
  if (!m) return;
  MUSCLE_LOOKUP[ex.id] = m;
  if (ex.sourceId) MUSCLE_LOOKUP[ex.sourceId] = m;
  MUSCLE_LOOKUP[ex.name] = m;
});
var MUSCLE_NAME = {};
MUSCLE_GROUPS.forEach(function (g) { MUSCLE_NAME[g.id] = g.name; });

// 训练量格式化：过万缩写（如 1.2万）
function fmtVol(v) {
  v = Math.round(v);
  if (v >= 100000000) return (v / 100000000).toFixed(1) + '亿';
  if (v >= 10000) return (v / 10000).toFixed(1) + '万';
  return String(v);
}

function volOf(h) {
  var v = 0;
  (h.sets || []).forEach(function (sets) {
    (sets || []).forEach(function (s) { v += (s.weight || 0) * (s.reps || 0); });
  });
  return v;
}

// 该日期所在周的周一 00:00
function mondayOf(d) {
  var m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}

Page({
  data: {
    totalSessions: 0, totalVolume: 0, totalMinutes: 0, currentStreak: 0,
    historyCount: 0,
    thisWeekVol: 0, lastWeekVol: 0, weekDelta: '—',
    weekBars: [],
    weeklyBars: [],
    muscleDist: [],
    topExercises: []
  },

  onLoad: function () {
    Store.init();
    // 云端数据启动时异步合并进 Store，到达后自动刷新（utils/sync.js pullCloud → Store.emit）
    Store.on(this._refresh.bind(this));
    this._refresh();
  },
  onShow: function () { this._refresh(); },

  _refresh: function () {
    var history = Store.state.history || [];
    var that = this;

    // ── 终身四卡 ──
    var totalVol = 0, totalMin = 0;
    history.forEach(function (h) {
      totalVol += volOf(h);
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

    // ── 本周 vs 上周（周一起算） ──
    var now = new Date();
    var thisMon = mondayOf(now);
    var lastMon = new Date(thisMon); lastMon.setDate(lastMon.getDate() - 7);
    var thisWeekVol = 0, lastWeekVol = 0;
    history.forEach(function (h) {
      var t = h.startedAt || 0;
      if (t >= thisMon.getTime() && t < thisMon.getTime() + 7 * 86400000) thisWeekVol += volOf(h);
      else if (t >= lastMon.getTime() && t < thisMon.getTime()) lastWeekVol += volOf(h);
    });
    var weekDelta = '—';
    if (lastWeekVol > 0) {
      var pct = Math.round((thisWeekVol - lastWeekVol) / lastWeekVol * 100);
      weekDelta = (pct >= 0 ? '+' : '') + pct + '%';
    } else if (thisWeekVol > 0) {
      weekDelta = '新开始';
    }

    // ── 近 7 天每日柱状 ──
    var bars = [];
    var weekMax = 0;
    for (var i = 6; i >= 0; i--) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      var label = ['日','一','二','三','四','五','六'][d.getDay()];
      var dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      var vol = 0;
      history.forEach(function (h) {
        if (h.startedAt >= dayStart && h.startedAt < dayStart + 86400000) vol += volOf(h);
      });
      if (vol > weekMax) weekMax = vol;
      bars.push({ day: i, label: label, vol: vol, height: 0 });
    }
    bars.forEach(function (b) {
      b.height = weekMax > 0 ? Math.round((b.vol / weekMax) * 64) : 0;
    });

    // ── 近 8 周每周总量（周一为一周起点） ──
    var weeklyBars = [];
    var weeklyMax = 0;
    for (var w = 7; w >= 0; w--) {
      var start = new Date(thisMon); start.setDate(start.getDate() - w * 7);
      var end = new Date(start); end.setDate(end.getDate() + 7);
      var wvol = 0;
      history.forEach(function (h) {
        if (h.startedAt >= start.getTime() && h.startedAt < end.getTime()) wvol += volOf(h);
      });
      if (wvol > weeklyMax) weeklyMax = wvol;
      weeklyBars.push({ label: (start.getMonth() + 1) + '/' + start.getDate(), vol: wvol, height: 0 });
    }
    weeklyBars.forEach(function (b) {
      b.height = weeklyMax > 0 ? Math.round((b.vol / weeklyMax) * 64) : 0;
    });

    // ── 肌群容量分布（按主肌群聚合，取前 6 名，其余归「其他」） ──
    var muscleVol = {};
    history.forEach(function (h) {
      (h.exercises || []).forEach(function (ex, idx) {
        var ev = 0;
        ((h.sets || [])[idx] || []).forEach(function (s) { ev += (s.weight || 0) * (s.reps || 0); });
        if (ev <= 0) return;
        var m = MUSCLE_LOOKUP[ex.exerciseId] || MUSCLE_LOOKUP[ex.name] || 'other';
        muscleVol[m] = (muscleVol[m] || 0) + ev;
      });
    });
    var muscleDist = Object.keys(muscleVol).map(function (mid) {
      return { mid: mid, name: mid === 'other' ? '其他' : (MUSCLE_NAME[mid] || mid), vol: muscleVol[mid] };
    }).sort(function (a, b) { return b.vol - a.vol; });
    var othersVol = 0;
    if (muscleDist.length > 6) {
      muscleDist.slice(6).forEach(function (m) { othersVol += m.vol; });
      muscleDist = muscleDist.slice(0, 6);
    }
    if (othersVol > 0) {
      var hasOther = muscleDist.some(function (m) { return m.mid === 'other'; });
      if (hasOther) muscleDist.forEach(function (m) { if (m.mid === 'other') m.vol += othersVol; });
      else muscleDist.push({ mid: 'other', name: '其他', vol: othersVol });
    }
    muscleDist.sort(function (a, b) { return b.vol - a.vol; });
    var distMax = muscleDist.length ? muscleDist[0].vol : 0;
    var distTotal = 0;
    muscleDist.forEach(function (m) { distTotal += m.vol; });
    muscleDist = muscleDist.map(function (m) {
      return {
        name: m.name,
        volText: fmtVol(m.vol),
        pct: distTotal > 0 ? Math.round(m.vol / distTotal * 100) : 0,
        width: distMax > 0 ? Math.max(4, Math.round(m.vol / distMax * 100)) : 0
      };
    });

    // ── 常练动作 TOP5（按总容量） ──
    var exMap = {};
    history.forEach(function (h) {
      var counted = {};
      (h.exercises || []).forEach(function (ex, idx) {
        var key = ex.name || ex.exerciseId || '未知';
        if (!exMap[key]) exMap[key] = { name: key, vol: 0, sessions: 0 };
        var sets = (h.sets || [])[idx] || [];
        sets.forEach(function (s) { exMap[key].vol += (s.weight || 0) * (s.reps || 0); });
        if (sets.length && !counted[key]) { exMap[key].sessions++; counted[key] = true; }
      });
    });
    var topExercises = Object.keys(exMap).map(function (k) { return exMap[k]; })
      .sort(function (a, b) { return b.vol - a.vol; })
      .slice(0, 5)
      .map(function (e) {
        return { name: e.name, volText: fmtVol(e.vol) + ' kg · ' + e.sessions + ' 次' };
      });

    this.setData({
      totalSessions: history.length,
      totalVolume: fmtVol(totalVol),
      totalMinutes: totalMin,
      currentStreak: streak,
      historyCount: history.length,
      thisWeekVol: fmtVol(thisWeekVol),
      lastWeekVol: fmtVol(lastWeekVol),
      weekDelta: weekDelta,
      weekBars: bars,
      weeklyBars: weeklyBars,
      muscleDist: muscleDist,
      topExercises: topExercises
    });
  }
});
