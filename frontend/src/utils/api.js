// openGym 后端 API 适配层
// TODO: 后端服务（原 openGym API 是 Node.js/Express，见 api/ 目录）尚未迁移
// 这里仅做占位，纯前端 MVP 使用本地存储即可运行
//
// 迁移计划（用户后端账号密码到位后执行）：
// 1. 在 backend/ 下按 project-workflows.md 模板初始化服务（选 Node.js runtime）
// 2. 实现 workout / routines / exercises / history 四个核心路由
// 3. 设置 qdmp-config.json 中的 backend BASE 地址
// 4. 将下面的 BASE_URL 替换为正式后端地址

export const BACKEND_BASE = 'TODO_BACKEND_URL' // e.g. https://your-app-id.qiandaomp.com

/**
 * 后端 API 客户端 —— 当前纯占位
 * 所有方法返回 Promise，实际请求在后端可用后启用
 */
export const api = {
  // ---- 训练计划 ----
  async getRoutines() {
    // TODO: GET /api/routines
    return Promise.resolve(null)
  },
  async saveRoutine(day, exercises) {
    // TODO: POST /api/routines/:day
    return Promise.resolve(null)
  },

  // ---- 历史记录 ----
  async getHistory() {
    // TODO: GET /api/history
    return Promise.resolve(null)
  },
  async saveWorkoutRecord(record) {
    // TODO: POST /api/history
    return Promise.resolve(null)
  },

  // ---- 动作库 ----
  async getExerciseLibrary() {
    // TODO: GET /api/exercises
    return Promise.resolve(null)
  }
}
