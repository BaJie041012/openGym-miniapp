<template>
  <view class="page">
    <text class="text--title">本周计划</text>
    <text class="text--subtitle">点击某天查看或编辑训练内容</text>

    <view v-for="day in weekdays" :key="day.id" class="card day-card">
      <view class="day-card__header">
        <text class="day-card__name" :class="{ 'day-card__name--today': isToday(day.id) }">{{ day.label }}</text>
        <text v-if="store.routines[day.id]?.length" class="day-card__count">
          {{ store.routines[day.id].length }} 个动作
        </text>
        <text v-else class="text--muted">休息日</text>
      </view>
      <view v-if="store.routines[day.id]?.length" class="preview-list">
        <view v-for="(ex, i) in store.routines[day.id]" :key="i" class="preview-item">
          <text class="preview-item__bullet">•</text>
          <text>{{ ex.name }}</text>
        </view>
      </view>
      <view class="btn btn--secondary" style="margin-top: 20px" @tap="editDay(day.id)">
        {{ store.routines[day.id]?.length ? '编辑' : '添加' }}
      </view>
    </view>

    <view class="license-note">
      <text class="license-note__text">计划数据存储在本地，后端可用后将支持多设备同步</text>
    </view>
  </view>
</template>

<script>
import { ref } from 'vue'
import { useGymStore } from '../../stores/gym'
import Taro from '@tarojs/taro'

const WEEKDAYS = [
  { id: 'monday',    label: '周一' },
  { id: 'tuesday',   label: '周二' },
  { id: 'wednesday', label: '周三' },
  { id: 'thursday',  label: '周四' },
  { id: 'friday',    label: '周五' },
  { id: 'saturday',  label: '周六' },
  { id: 'sunday',    label: '周日' }
]

export default {
  setup() {
    const store = useGymStore()
    const weekdays = WEEKDAYS

    function isToday(id) {
      const day = new Date().toLocaleDateString('en', { weekday: 'long' }).toLowerCase()
      return id === day
    }

    function editDay(dayId) {
      Taro.showToast({ title: '编辑功能待后端', icon: 'none' })
      // TODO: 打开动作选择器，从 catalogue 选动作加入该日计划
    }

    return { store, weekdays, isToday, editDay }
  }
}
</script>

<style lang="scss">
.day-card__header { display: flex; justify-content: space-between; align-items: center; }
.day-card__name { font-size: 32px; font-weight: 600; color: #eaeaea; }
.day-card__name--today { color: #4ECDC4; }
.day-card__count { color: #888899; font-size: 26px; }
.preview-list { margin-top: 20px; }
.preview-item {
  display: flex; align-items: center; padding: 8px 0;
  font-size: 26px; color: #ccccdd;
}
.preview-item__bullet { color: #4ECDC4; margin-right: 16px; }
.license-note { text-align: center; margin-top: 32px; }
.license-note__text { font-size: 22px; color: #555566; }
</style>
