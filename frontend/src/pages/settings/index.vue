<template>
  <view class="page">
    <text class="text--title">设置</text>

    <view class="card">
      <text class="card__title">训练偏好</text>

      <view class="setting-row">
        <text>重量单位</text>
        <view class="picker" @tap="toggleUnit">
          <text>{{ store.settings.unit === 'kg' ? '公斤 (kg)' : '磅 (lb)' }}</text>
        </view>
      </view>

      <view class="setting-row">
        <text>一周起始日</text>
        <view class="picker" @tap="toggleWeekStart">
          <text>{{ store.settings.weekStart === 'monday' ? '周一' : '周日' }}</text>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="card__title">数据管理</text>
      <view class="setting-row">
        <text>本地数据</text>
        <text class="text--muted">{{ totalRecords }} 条</text>
      </view>
      <view class="btn btn--secondary" style="margin-top: 16px" @tap="clearData">清除所有数据</view>
    </view>

    <view class="card">
      <text class="card__title">关于</text>
      <text class="about-line">openGym — 自托管健身追踪</text>
      <text class="about-line">版本: 1.0.0 (千岛小程序迁移版)</text>
      <text class="about-line" style="margin-top: 16px">
        本项目基于 Duarte Santos 的 openGym 项目（AGPL-3.0）迁移。
      </text>
      <view class="btn btn--secondary" style="margin-top: 16px" @tap="showLicense">查看许可证</view>
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

    const totalRecords = computed(() => {
      return store.history.length + Object.values(store.routines).reduce((a, b) => a + b.length, 0)
    })

    function toggleUnit() {
      store.updateSetting('unit', store.settings.unit === 'kg' ? 'lb' : 'kg')
    }

    function toggleWeekStart() {
      store.updateSetting('weekStart', store.settings.weekStart === 'monday' ? 'sunday' : 'monday')
    }

    function clearData() {
      Taro.showModal({
        title: '确认清除？',
        content: '所有训练历史、计划和设置将被删除，无法恢复',
        confirmColor: '#e74c3c',
        success: (res) => {
          if (res.confirm) {
            store.history = []
            store.routines = {}
            store.settings = { theme: 'dark', unit: 'kg', weekStart: 'monday' }
            store.persist()
            Taro.showToast({ title: '已清除', icon: 'success' })
          }
        }
      })
    }

    function showLicense() {
      Taro.showModal({
        title: 'openGym 许可证',
        content: '本项目基于 GNU AGPL v3.0 发布。\n\n原项目：DuarteSantos8/openGym\n\n部分素材（动作动画）属于 Gym visual，需另行授权。\n\n详见项目根目录 LICENSE 和 NOTICE.md',
        showCancel: false
      })
    }

    return { store, totalRecords, toggleUnit, toggleWeekStart, clearData, showLicense }
  }
}
</script>

<style lang="scss">
.card__title { font-size: 30px; font-weight: 700; color: #eaeaea; display: block; margin-bottom: 16px; }

.setting-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
  font-size: 28px; color: #ccccdd;
}
.setting-row:last-child { border-bottom: none; }
.picker { color: #4ECDC4; }

.about-line { display: block; font-size: 26px; color: #ccccdd; line-height: 1.6; }
</style>
