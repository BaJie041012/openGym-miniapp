<template>
  <view class="page">
    <!-- 无训练时的引导 -->
    <view v-if="!store.active" class="card">
      <text class="text--title">没有进行中的训练</text>
      <text class="text--subtitle">切换到「今日」或「计划」页开始训练</text>
      <view class="btn" style="margin-top: 32px" @tap="goHome">返回今日</view>
    </view>

    <!-- 训练进行中 -->
    <view v-else class="card">
      <view class="exercise-nav">
        <view v-for="(ex, i) in store.active.exercises"
              :key="i"
              :class="['exercise-nav__dot', { 'exercise-nav__dot--current': i === currentIdx, 'exercise-nav__dot--done': i < currentIdx }]"
              @tap="jumpTo(i)" />
      </view>

      <text class="text--title" style="margin-top: 24px">{{ currentExercise?.name || '训练中' }}</text>
      <text class="text--muted" v-if="currentExercise?.muscles">
        {{ currentExercise.muscles.join(' · ') }}
      </text>

      <!-- 已记录的组 -->
      <view v-if="currentSets.length" class="sets">
        <text class="text--subtitle">已完成组数</text>
        <view v-for="(set, i) in currentSets" :key="i" class="set-row">
          <text>第 {{ i + 1 }} 组</text>
          <text>{{ set.weight }} kg × {{ set.reps }}</text>
        </view>
      </view>

      <!-- 录入组 -->
      <view class="input-row">
        <view class="input-block">
          <text class="text--muted">重量 (kg)</text>
          <input type="number" v-model="weight" class="input" placeholder="0" />
        </view>
        <view class="input-block">
          <text class="text--muted">次数</text>
          <input type="number" v-model="reps" class="input" placeholder="0" />
        </view>
      </view>

      <view class="btn" style="margin-top: 24px" @tap="logSet">记录这一组</view>

      <!-- 计时器 -->
      <view class="timer">
        <text class="timer__label">组间休息</text>
        <text class="timer__display">{{ formatRestTime }}</text>
        <view class="timer__controls">
          <view class="btn btn--secondary" @tap="startRest(90)">90s</view>
          <view class="btn btn--secondary" @tap="startRest(180)">3m</view>
        </view>
      </view>

      <!-- 导航 -->
      <view class="nav-buttons">
        <view v-if="currentIdx > 0" class="btn btn--secondary" @tap="prevExercise">上一个</view>
        <view v-if="currentIdx < store.active.exercises.length - 1" class="btn" @tap="nextExercise">下一个</view>
        <view class="btn btn--secondary" @tap="finishWorkout">结束训练</view>
      </view>
    </view>
  </view>
</template>

<script>
import { ref, computed, onUnmounted } from 'vue'
import Taro from '@tarojs/taro'
import { useGymStore } from '../../stores/gym'

export default {
  setup() {
    const store = useGymStore()
    const weight = ref('')
    const reps = ref('')
    const restTimer = ref(null)
    const restRemaining = ref(0)

    const currentIdx = computed(() => store.active?.currentExerciseIndex ?? 0)
    const currentExercise = computed(() => store.active?.exercises?.[currentIdx.value])
    const currentSets = computed(() => store.active?.sets?.[currentIdx.value] || [])

    const formatRestTime = computed(() => {
      const m = Math.floor(restRemaining.value / 60)
      const s = restRemaining.value % 60
      return `${m}:${String(s).padStart(2, '0')}`
    })

    function logSet() {
      const w = parseFloat(weight.value)
      const r = parseInt(reps.value)
      if (isNaN(w) || isNaN(r)) {
        Taro.showToast({ title: '请填写重量和次数', icon: 'none' })
        return
      }
      store.logSet(currentIdx.value, w, r)
      weight.value = ''
      reps.value = ''
      startRest(90)
    }

    function nextExercise() { store.nextExercise() }
    function prevExercise() { store.active && store.active.currentExerciseIndex-- && store.persist() }
    function jumpTo(i) { if (store.active) { store.active.currentExerciseIndex = i; store.persist() } }

    function startRest(seconds) {
      if (restTimer.value) clearInterval(restTimer.value)
      restRemaining.value = seconds
      restTimer.value = setInterval(() => {
        restRemaining.value--
        if (restRemaining.value <= 0) {
          clearInterval(restTimer.value)
          restTimer.value = null
          Taro.vibrateLong()
        }
      }, 1000)
    }

    function finishWorkout() {
      Taro.showModal({
        title: '确认结束训练？',
        content: '已记录的组数将会保存到历史记录',
        success: (res) => {
          if (res.confirm) {
            store.finishWorkout()
            Taro.switchTab({ url: '/pages/home/index' })
          }
        }
      })
    }

    function goHome() { Taro.switchTab({ url: '/pages/home/index' }) }

    onUnmounted(() => { if (restTimer.value) clearInterval(restTimer.value) })

    return { store, weight, reps, currentIdx, currentExercise, currentSets, formatRestTime, logSet, nextExercise, prevExercise, jumpTo, startRest, finishWorkout, goHome }
  }
}
</script>

<style lang="scss">
.exercise-nav { display: flex; justify-content: center; gap: 12px; }
.exercise-nav__dot {
  width: 16px; height: 16px; border-radius: 50%;
  background: rgba(255,255,255,0.15); cursor: pointer;
}
.exercise-nav__dot--current { background: #4ECDC4; width: 24px; height: 24px; }
.exercise-nav__dot--done { background: #2ecc71; }

.sets { margin-top: 24px; }
.set-row {
  display: flex; justify-content: space-between;
  padding: 12px 0; color: #ccccdd; font-size: 28px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.input-row { display: flex; gap: 24px; margin-top: 24px; }
.input-block { flex: 1; }
.input {
  background: rgba(255,255,255,0.08); border: none;
  border-radius: 8px; padding: 20px; font-size: 32px;
  color: #eaeaea; margin-top: 12px; width: 100%; box-sizing: border-box;
}

.timer {
  text-align: center; margin-top: 32px; padding: 24px;
  background: rgba(78,205,196,0.1); border-radius: 12px;
}
.timer__label { display: block; color: #888899; font-size: 24px; }
.timer__display { display: block; font-size: 72px; font-weight: 700; color: #4ECDC4; }
.timer__controls { display: flex; gap: 20px; justify-content: center; margin-top: 16px; }

.nav-buttons { display: flex; gap: 16px; margin-top: 32px; flex-wrap: wrap; }
.nav-buttons .btn { flex: 1; min-width: 160px; }
</style>
