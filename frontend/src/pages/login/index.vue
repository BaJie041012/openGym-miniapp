<template>
  <view class="page">
    <view class="login-hero">
      <text class="login-hero__icon">💪</text>
      <text class="login-hero__title">openGym</text>
      <text class="login-hero__subtitle">你的健身数据，归你所有</text>
    </view>

    <view class="card">
      <text class="text--title" style="font-size: 30px">当前状态</text>
      <text class="text--muted">纯前端 MVP 阶段 —— 本地存储即可使用</text>
      <text class="text--muted" style="margin-top: 8px">后端账号到位后将支持：</text>
      <view class="todo-list">
        <text class="todo-item">🔐 千岛开放平台账号登录</text>
        <text class="todo-item">☁️ 多设备数据同步</text>
        <text class="todo-item">🏋️ Coach AI 功能</text>
      </view>
    </view>

    <view class="btn" @tap="enterAsGuest">以游客身份开始</view>

    <view class="license-note" style="margin-top: 48px">
      <text class="license-note__text">本项目基于 openGym (AGPL-3.0) 迁移</text>
      <text class="license-note__text">开源地址：待补</text>
    </view>
  </view>
</template>

<script>
import Taro from '@tarojs/taro'

export default {
  setup() {
    function enterAsGuest() {
      Taro.switchTab({ url: '/pages/home/index' })
    }
    return { enterAsGuest }
  }
}
</script>

<style lang="scss">
.login-hero { text-align: center; padding: 60px 0 32px; }
.login-hero__icon { font-size: 100px; display: block; }
.login-hero__title { display: block; font-size: 56px; font-weight: 700; color: #4ECDC4; margin-top: 16px; }
.login-hero__subtitle { display: block; font-size: 26px; color: #888899; margin-top: 8px; }

.todo-list { margin-top: 20px; }
.todo-item { display: block; font-size: 26px; color: #ccccdd; padding: 6px 0; }

.license-note { text-align: center; }
.license-note__text { display: block; font-size: 22px; color: #555566; }
</style>
