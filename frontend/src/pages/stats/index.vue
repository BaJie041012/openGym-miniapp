<template>
  <view class="page">
    <text class="text--title">训练统计</text>

    <view class="stats-grid">
      <view class="card stat-card">
        <text class="stat-num">{{ store.history.length }}</text>
        <text class="stat-label">总训练次数</text>
      </view>
      <view class="card stat-card">
        <text class="stat-num">{{ totalVolume.toLocaleString() }}</text>
        <text class="stat-label">总训练量 (kg)</text>
      </view>
      <view class="card stat-card">
        <text class="stat-num">{{ totalDuration }}</text>
        <text class="stat-label">总训练时长 (分钟)</text>
      </view>
      <view class="card stat-card">
        <text class="stat-num">{{ currentStreak }}</text>
        <text class="stat-label">连续训练天数</text>
      </view>
    </view>

    <view class="card">
      <text class="text--title" style="font-size: 32px">本周概览</text>
      <view class="week-bars">
        <view v-for="d in weekSummary" :key="d.day" class="week-bar">
          <text class="week-bar__height" :style="{ height: d.height + 'px' }"></text>
          <text class="week-bar__label">{{ d.label }}</text>
        </view>
      </view>
    </view>

    <view v-if="!store.history.length" class="card">
      <text class="text--muted">开始训练后这里会显示统计数据 💪</text>
    </view>
  </view>
</template>

<script>
import { computed } from 'vue'
import { useGymStore } from '../../stores/gym'

export default {
  setup() {
    const store = useGymStore()

    const totalVolume = computed(() => {
      return store.history.reduce((total, h) => {
        const sets = h.sets || []
        const vol = sets.reduce((sums, setList) =>
          sums + (setList || []).reduce((s, x) => s + (x.weight || 0) * (x.reps || 0), 0), 0)
        return total + vol
      }, 0)
    })

    const totalDuration = computed(() => {
      return store.history.reduce((total, h) => {
        if (!h.startedAt || !h.finishedAt) return total
        return total + Math.round((h.finishedAt - h.startedAt) / 60000)
      }, 0)
    })

    const currentStreak = computed(() => {
      if (!store.history.length) return 0
      const days = [...new Set(store.history.map(h => new Date(h.startedAt).toDateString()))].sort()
      let streak = 0
      const today = new Date()
      for (let i = days.length - 1; i >= 0; i--) {
        const d = new Date(days[i])
        const diff = Math.round((today - d) / 86400000)
        if (streak === 0 && diff <= 1) { streak = 1; continue }
        if (diff === streak + 1) streak++
        else if (diff === streak) continue
        else break
      }
      return streak
    })

    const weekSummary = computed(() => {
      const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
      const labels = ['一','二','三','四','五','六','日']
      const counts = days.map(day => {
        const dow = days.indexOf(day)
        const startOfWeek = new Date()
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + dow)
        startOfWeek.setHours(0,0,0,0)
        const endOfDay = new Date(startOfWeek); endOfDay.setHours(23,59,59)
        return store.history.filter(h => h.startedAt >= startOfWeek && h.startedAt <= endOfDay).length
      })
      const max = Math.max(...counts, 1)
      return days.map((day, i) => ({
        day, label: labels[i],
        height: counts[i] ? Math.max(20, (counts[i] / max) * 120) : 8
      }))
    })

    return { store, totalVolume, totalDuration, currentStreak, weekSummary }
  }
}
</script>

<style lang="scss">
.stats-grid {
  display: flex; flex-wrap: wrap; gap: 16px;
}
.stat-card { flex: 1; min-width: 300px; text-align: center; padding: 32px; }
.stat-num { font-size: 48px; font-weight: 700; color: #4ECDC4; display: block; }
.stat-label { font-size: 24px; color: #888899; display: block; margin-top: 8px; }

.week-bars {
  display: flex; justify-content: space-between; align-items: flex-end;
  height: 160px; margin-top: 24px;
}
.week-bar { flex: 1; display: flex; flex-direction: column; align-items: center; margin: 0 8px; }
.week-bar__height {
  width: 100%; max-width: 60px;
  background: linear-gradient(to top, #4ECDC4, rgba(78,205,196,0.4));
  border-radius: 6px 6px 0 0; min-height: 8px;
}
.week-bar__label { margin-top: 8px; font-size: 22px; color: #888899; }
</style>
