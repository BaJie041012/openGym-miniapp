<template>
  <view class="page">
    <text class="text--title">动作库</text>
    <text class="text--subtitle">共 {{ exercises.length }} 个动作</text>

    <!-- 过滤 -->
    <view class="filter-row">
      <view v-for="muscle in muscleFilters" :key="muscle"
            :class="['filter-chip', { 'filter-chip--active': activeFilter === muscle }]"
            @tap="activeFilter = activeFilter === muscle ? null : muscle">
        {{ muscle === null ? '全部' : muscle }}
      </view>
    </view>

    <!-- 动作列表 -->
    <view v-for="ex in filteredExercises" :key="ex.id" class="card exercise-card" @tap="showDetail(ex)">
      <view class="exercise-card__media">
        <!-- 占位图：原 openGym 用 Gym visual 动画（非 AGPL，已剥离） -->
        <view class="placeholder">
          <text class="placeholder__icon">🏋️</text>
          <text class="placeholder__label">TODO: 替换为自有/授权演示图</text>
        </view>
      </view>
      <view class="exercise-card__info">
        <text class="exercise-card__name">{{ ex.name }}</text>
        <text class="text--muted">{{ ex.nameEn }}</text>
        <view class="tag-row">
          <text class="tag">{{ ex.equipment }}</text>
          <text class="tag" :class="'tag--' + ex.difficulty">{{ ex.difficulty }}</text>
        </view>
        <text class="text--muted" style="margin-top: 12px">{{ ex.description }}</text>
      </view>
    </view>

    <view class="license-note">
      <text class="license-note__text">⚠️ 原项目 Gym visual 商业素材已剥离</text>
      <text class="license-note__text">详见根目录 LICENSE-THIRD-PARTY.md</text>
    </view>
  </view>
</template>

<script>
import { ref, computed } from 'vue'
import Taro from '@tarojs/taro'
import { EXERCISE_DATA } from '../../../../catalogue/exercises'

export default {
  setup() {
    const exercises = ref(EXERCISE_DATA)
    const activeFilter = ref(null)

    const muscleFilters = ['chest', 'back', 'shoulders', 'legs', 'arms']

    const filteredExercises = computed(() => {
      if (!activeFilter.value) return exercises.value
      return exercises.value.filter(e =>
        e.muscles.some(m => m.includes(activeFilter.value.toLowerCase().slice(0, 3)))
      )
    })

    function showDetail(ex) {
      Taro.showModal({
        title: ex.name,
        content: ex.description + '\n\n⚠️ 演示图待替换：' + ex.mediaNote,
        showCancel: false
      })
    }

    return { exercises, activeFilter, muscleFilters, filteredExercises, showDetail }
  }
}
</script>

<style lang="scss">
.filter-row { display: flex; flex-wrap: wrap; gap: 12px; margin: 24px 0; }
.filter-chip {
  padding: 12px 24px; border-radius: 20px;
  background: rgba(255,255,255,0.08); color: #ccccdd;
  font-size: 24px;
}
.filter-chip--active { background: #4ECDC4; color: #1a1a2e; }

.exercise-card { display: flex; }
.exercise-card__media {
  width: 180px; height: 180px; border-radius: 12px;
  background: rgba(255,255,255,0.06); flex-shrink: 0;
  margin-right: 24px; display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.placeholder { text-align: center; padding: 10px; }
.placeholder__icon { font-size: 50px; display: block; }
.placeholder__label { font-size: 20px; color: #666688; display: block; margin-top: 8px; }

.exercise-card__info { flex: 1; }
.exercise-card__name { font-size: 32px; font-weight: 600; color: #fff; display: block; }

.tag-row { display: flex; gap: 12px; margin-top: 8px; flex-wrap: wrap; }
.tag {
  font-size: 20px; padding: 6px 16px; border-radius: 10px;
  background: rgba(78,205,196,0.15); color: #4ECDC4;
  text-transform: lowercase;
}
.tag--beginner { background: rgba(46,204,113,0.15); color: #2ecc71; }
.tag--intermediate { background: rgba(243,156,18,0.15); color: #f39c12; }
.tag--advanced { background: rgba(231,76,60,0.15); color: #e74c3c; }

.license-note { text-align: center; margin-top: 32px; }
.license-note__text { font-size: 22px; color: #555566; display: block; }
</style>
