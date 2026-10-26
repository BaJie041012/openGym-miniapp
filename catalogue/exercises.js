// openGym 动作数据（text only，媒体已剥离）
// 合规来源：
//   - 原 openGym catalogue/exercises/ 文本 (AGPL-3.0)
//   - ExerciseDB v1 早期数据 (MIT) via hasaneyldrm/exercises-dataset
//   - 新增条目由 openGym 社区贡献 (AGPL-3.0)
//
// 本小程序迁移时：已剥离 catalogue/media/ 下的所有 Gym visual 商业素材，
// 详见仓库根目录 NOTICE.md 和 LICENSE-THIRD-PARTY.md
//
// 如需完整动画演示：必须自行从 gymvisual.com 获取授权

export const EXERCISE_DATA = [
  {
    id: 'bench-press',
    name: '卧推',
    nameEn: 'Bench Press',
    muscles: ['chest', 'triceps', 'shoulders'],
    equipment: 'barbell',
    difficulty: 'intermediate',
    description: '在卧推凳上躺卧，用杠铃做平板推举动作',
    // 原 openGym 有 animated demo，此处留占位
    mediaNote: 'TODO: 需替换为自有或授权的演示图/动画'
  },
  {
    id: 'squat',
    name: '深蹲',
    nameEn: 'Back Squat',
    muscles: ['quads', 'glutes', 'hamstrings'],
    equipment: 'barbell',
    difficulty: 'intermediate',
    description: '将杠铃置于肩后，从站立姿势下蹲至大腿与地面平行',
    mediaNote: 'TODO: 需替换为自有或授权的演示图/动画'
  },
  {
    id: 'deadlift',
    name: '硬拉',
    nameEn: 'Deadlift',
    muscles: ['lower-back', 'hamstrings', 'glutes'],
    equipment: 'barbell',
    difficulty: 'intermediate',
    description: '从地面将杠铃拉至髋关节高度，保持背部中立',
    mediaNote: 'TODO: 需替换为自有或授权的演示图/动画'
  },
  {
    id: 'pullup',
    name: '引体向上',
    nameEn: 'Pull-up',
    muscles: ['lats', 'biceps', 'forearms'],
    equipment: 'bodyweight',
    difficulty: 'advanced',
    description: '悬挂在横杆上，向上拉直至下巴超过横杆',
    mediaNote: 'TODO: 需替换为自有或授权的演示图/动画'
  },
  {
    id: 'overhead-press',
    name: '推举',
    nameEn: 'Overhead Press',
    muscles: ['shoulders', 'triceps'],
    equipment: 'barbell',
    difficulty: 'intermediate',
    description: '从肩前将杠铃推举至头顶伸直',
    mediaNote: 'TODO: 需替换为自有或授权的演示图/动画'
  },
  {
    id: 'bicep-curl',
    name: '二头弯举',
    nameEn: 'Barbell Curl',
    muscles: ['biceps'],
    equipment: 'barbell',
    difficulty: 'beginner',
    description: '站立持杠铃，仅用前臂做弯举动作',
    mediaNote: 'TODO: 需替换为自有或授权的演示图/动画'
  }
]

// 肌肉分组（用于肌肉浏览页面）
export const MUSCLE_GROUPS = [
  { id: 'chest', name: '胸肌', nameEn: 'Chest' },
  { id: 'back', name: '背部', nameEn: 'Back' },
  { id: 'shoulders', name: '肩部', nameEn: 'Shoulders' },
  { id: 'biceps', name: '二头', nameEn: 'Biceps' },
  { id: 'triceps', name: '三头', nameEn: 'Triceps' },
  { id: 'quads', name: '股四头', nameEn: 'Quads' },
  { id: 'hamstrings', name: '腘绳肌', nameEn: 'Hamstrings' },
  { id: 'glutes', name: '臀肌', nameEn: 'Glutes' },
  { id: 'calves', name: '小腿', nameEn: 'Calves' },
  { id: 'core', name: '核心', nameEn: 'Core' }
]

// 计划模板（从原 openGym 的 4 套 starter plans 提取骨架）
export const STARTER_PLANS = {
  pushPullLegs: {
    name: '推拉腿 六日',
    description: '经典三分化，每周六练',
    weekdayCount: 6
  },
  upperLower: {
    name: '上下肢 四日',
    description: '上下肢交替，每周四练',
    weekdayCount: 4
  },
  fullBody: {
    name: '全身 三日',
    description: '全身复合动作，每周三练',
    weekdayCount: 3
  },
  fiveByFive: {
    name: '5×5 力量',
    description: '五项基础力量，线性周期化',
    weekdayCount: 3
  }
}
