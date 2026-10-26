// 后端地址单点常量（全项目唯一切换点）
// 后端未上线时所有请求静默失败，前端降级为纯本地模式
export const ENV = 'dev';

export const BACKEND_BASE = ENV === 'prod'
  ? 'https://TODO_BACKEND_HOST.qiandaomp.com'
  : 'http://localhost:8080';
