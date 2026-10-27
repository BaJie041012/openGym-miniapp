<template>
  <view class="page">
    <view class="hero">
      <text class="hero__greeting">今天是</text>
      <text class="hero__date">{{ todayLabel }}</text>
    </view>

    <!-- 当前训练状态 -->
    <view v-if="store.hasActiveWorkout" class="card card--active" @tap="goWorkout">
      <text class="card__label">训练进行中</text>
      <text class="card__title">继续 {{ activeExerciseName }}</text>
      <text class="card__hint">点击返回训练</text>
    </view>

    <!-- 今日训练卡片 -->
    <view class="card">
      <text class="text--title">{{ todaysRoutine.length ? '今日训练' : '今日休息日' }}</text>
      <view v-if="todaysRoutine.length" class="exercise-list">
        <view v-for="(ex, i) in todaysRoutine" :key="i" class="exercise-item">
          <text class="exercise-item__idx">{{ i + 1 }}</text>
          <view class="exercise-item__info">
            <text class="exercise-item__name">{{ ex.name }}</text>
            <text class="text--muted">{{ ex.sets }} × {{ ex.reps }}</text>
          </view>
        </view>
      </view>
      <text v-else class="text--muted">没有安排训练，好好休息或做些轻量活动</text>

      <view v-if="todaysRoutine.length && !store.hasActiveWorkout"
            class="btn" style="margin-top: 32px" @tap="startToday">
        开始今日训练
      </view>
    </view>

    <!-- 最近训练 -->
    <view v-if="store.history.length" class="card">
      <text class="text--title">最近训练</text>
      <view v-for="(h, i) in recentHistory" :key="i" class="history-item">
        <text class="history-item__date">{{ formatDate(h.startedAt) }}</text>
        <text class="text--muted">{{ h.exercises?.length || 0 }} 个动作</text>
      </view>
    </view>

    <view v-else class="card">
      <text class="text--muted">还没有训练记录，开始你的第一次训练吧 💪</text>
    </view>

    <!-- 版权提示 -->
    <view class="license-note">
      <text class="license-note__text">本项目基于 openGym (AGPL-3.0) 迁移</text>
      <text class="license-note__text">详见 LICENSE 和 NOTICE 文件</text>
    </view>
  </view>
</template>

<script>
import { computed } from 'vue'
import Taro from '@tarojs/taro'
import { useGymStore } from '../../stores/gym'

export default {
  setup() {
    const store = useGymStore()

    const todayLabel = computed(() => {
      const d = new Date()
      return d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })
    })

    const todaysRoutine = computed(() => store.todaysRoutine || [])

    const activeExerciseName = computed(() => {
      if (!store.active) return ''
      const idx = store.active.currentExerciseIndex || 0
      return store.active.exercises?.[idx]?.name || '训练中'
    })

    const recentHistory = computed(() => store.history.slice(-3).reverse())

    function startToday() {
      if (todaysRoutine.value.length === 0) return
      store.startWorkout('today')
      Taro.switchTab({ url: '/pages/workout/index' })
    }

    function goWorkout() {
      Taro.switchTab({ url: '/pages/workout/index' })
    }

    function formatDate(ts) {
      if (!ts) return ''
      const d = new Date(ts)
      return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    }

    return { store, todayLabel, todaysRoutine, activeExerciseName, recentHistory, startToday, goWorkout, formatDate }
  }
}
</script>

<style lang="scss">
.hero { text-align: center; margin-bottom: 32px; }
.hero__greeting { display: block; color: #888899; font-size: 26px; }
.hero__date { display: block; font-size: 44px; font-weight: 700; color: #4ECDC4; margin-top: 8px; }

.card--active { border: 2px solid #4ECDC4; }
.card__label { color: #4ECDC4; font-size: 24px; display: block; margin-bottom: 8px; }
.card__title { font-size: 34px; font-weight: 700; display: block; margin-bottom: 8px; }
.card__hint { color: #888899; font-size: 24px; }

.exercise-list { margin-top: 24px; }
.exercise-item {
  display: flex; align-items: center; padding: 20px 0;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.exercise-item:last-child { border-bottom: none; }
.exercise-item__idx {
  width: 56px; height: 56px; border-radius: 50%;
  background: rgba(78,205,196,0.15); color: #4ECDC4;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 28px; margin-right: 20px;
}
.exercise-item__info { flex: 1; }
.exercise-item__name { display: block; font-size: 30px; color: #fff; }

.history-item {
  display: flex; justify-content: space-between;
  padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
}
.history-item__date { font-size: 28px; color: #eaeaea; }

.license-note { text-align: center; margin-top: 48px; }
.license-note__text { display: block; font-size: 22px; color: #555566; }
</style>
