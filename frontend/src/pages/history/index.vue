<template>
  <view class="page">
    <text class="text--title">训练历史</text>
    <text class="text--subtitle">共 {{ store.history.length }} 次训练</text>

    <view v-if="!store.history.length" class="card">
      <text class="text--muted">还没有训练记录，开始第一次训练吧！</text>
    </view>

    <view v-for="(h, i) in reversedHistory" :key="i" class="card">
      <text class="history-date">{{ formatDate(h.startedAt) }}</text>
      <text class="text--muted">{{ formatDuration(h.startedAt, h.finishedAt) }}</text>

      <view v-if="h.exercises?.length" class="exercise-list">
        <view v-for="(ex, j) in h.exercises" :key="j" class="exercise-item">
          <text class="exercise-item__name">{{ ex.name || '动作 ' + (j+1) }}</text>
          <text class="text--muted">{{ totalVolume(h.sets?.[j]) }} kg</text>
        </view>
      </view>

      <view v-if="h.sets" class="volume-total">
        <text class="text--muted">总训练量</text>
        <text class="volume-num">{{ sumVolume(h.sets) }} kg</text>
      </view>
    </view>
  </view>
</template>

<script>
import { computed } from 'vue'
import { useGymStore } from '../../stores/gym'

export default {
  setup() {
    const store = useGymStore()
    const reversedHistory = computed(() => [...store.history].reverse())

    function formatDate(ts) {
      if (!ts) return ''
      const d = new Date(ts)
      return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
    }

    function formatDuration(start, end) {
      if (!start || !end) return ''
      const mins = Math.round((end - start) / 60000)
      return `训练时长 ${mins} 分钟`
    }

    function totalVolume(sets) {
      if (!sets || !sets.length) return 0
      return sets.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0)
    }

    function sumVolume(allSets) {
      if (!allSets) return 0
      return allSets.reduce((total, sets) => total + totalVolume(sets), 0)
    }

    return { store, reversedHistory, formatDate, formatDuration, totalVolume, sumVolume }
  }
}
</script>

<style lang="scss">
.history-date { font-size: 34px; font-weight: 700; color: #4ECDC4; display: block; }
.exercise-list { margin-top: 16px; }
.exercise-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
}
.exercise-item__name { font-size: 28px; color: #eaeaea; }
.volume-total {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 20px; padding-top: 16px;
  border-top: 2px solid rgba(78,205,196,0.3);
}
.volume-num { font-size: 32px; font-weight: 700; color: #4ECDC4; }
</style>
