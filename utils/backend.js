// 后端地址单点常量（全项目唯一切换点）
// 千岛后端域名：https://<appId>.qiandaomp.com（部署后端后生效）
// 后端未上线时所有请求静默失败，前端降级为纯本地模式
export const ENV = 'prod';

export const BACKEND_BASE = ENV === 'prod'
  ? 'https://echokmhvfmrwl7jto0cz.qiandaomp.com'
  : 'http://localhost:8080';
