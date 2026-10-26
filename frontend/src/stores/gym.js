// openGym 数据层 —— 基于本地存储（Taro.setStorage / Taro.getStorage）
// 迁移自原 openGym frontend/src/store 的核心数据模型
// 原项目使用 Zustand，这里改用 Pinia + Taro 存储 API

import { defineStore } from 'pinia'
import Taro from '@tarojs/taro'

const STORAGE_KEY = 'opengym-state-v1'

// 从 openGym 原项目迁移的核心数据结构：
// - routines: 每周训练计划（按 weekday 组织）
// - exercises: 动作库（text 部分合规，媒体需替换）
// - history: 历史训练记录
// - active: 当前进行中的训练
// - settings: 用户偏好（主题、单位等）

function loadState() {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    return null
  }
}

function saveState(state) {
  try {
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('Failed to persist state:', e)
  }
}

export const useGymStore = defineStore('gym', {
  state: () => {
    const loaded = loadState()
    return {
      user: loaded?.user || null,
      routines: loaded?.routines || {}, // { 'monday': [...], 'tuesday': [...] }
      exercises: loaded?.exercises || [],
      history: loaded?.history || [],
      active: loaded?.active || null, // { routineId, currentExerciseIndex, sets: [...] }
      settings: loaded?.settings || {
        theme: 'dark',
        unit: 'kg',
        weekStart: 'monday'
      },
      isGuest: true // 千岛小程序 MVP 默认游客模式，后端接入后改为认证
    }
  },

  getters: {
    hasActiveWorkout: (state) => !!state.active,
    activeExerciseIndex: (state) => state.active?.currentExerciseIndex ?? 0,
    todaysRoutine: (state) => {
      const day = new Date().toLocaleDateString('en', { weekday: 'lowercase' })
      return state.routines[day] || []
    }
  },

  actions: {
    persist() {
      saveState({
        user: this.user,
        routines: this.routines,
        exercises: this.exercises,
        history: this.history,
        active: this.active,
        settings: this.settings
      })
    },

    // ---- 训练会话 ----
    startWorkout(routineId) {
      const routine = this.routines[routineId] || []
      this.active = {
        routineId,
        exercises: [...routine],
        currentExerciseIndex: 0,
        sets: routine.map(ex => []), // 每个动作的组数记录
        startedAt: Date.now()
      }
      this.persist()
    },

    finishWorkout() {
      if (!this.active) return
      this.history.push({
        routineId: this.active.routineId,
        exercises: this.active.exercises,
        sets: this.active.sets,
        startedAt: this.active.startedAt,
        finishedAt: Date.now()
      })
      this.active = null
      this.persist()
    },

    logSet(exerciseIndex, weight, reps) {
      if (!this.active) return
      this.active.sets[exerciseIndex].push({ weight, reps, at: Date.now() })
      this.persist()
    },

    nextExercise() {
      if (!this.active) return
      const next = this.active.currentExerciseIndex + 1
      if (next < this.active.exercises.length) {
        this.active.currentExerciseIndex = next
        this.persist()
      }
    },

    // ---- 动作库 ----
    setExercises(list) {
      this.exercises = list
      this.persist()
    },

    // ---- 计划 ----
    setRoutine(day, exercises) {
      this.routines[day] = exercises
      this.persist()
    },

    // ---- 设置 ----
    updateSetting(key, value) {
      this.settings[key] = value
      this.persist()
    }
  }
})
