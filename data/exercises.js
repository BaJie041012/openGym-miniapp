// openGym 动作数据 · 动作文本（text only）· 媒体已剥离
// 合规来源：
//   - openGym 原 catalogue/exercises/ 文本 (AGPL-3.0)
//   - ExerciseDB v1 早期数据 (MIT) via hasaneyldrm/exercises-dataset
//   - 新增条目由 openGym 社区贡献 (AGPL-3.0)
//
// ⚠️ 原 openGym catalogue/media/ 下的 Gym visual 商业素材不属于 AGPL-3.0，
//    已完全剥离。每条的 mediaNote 标注替换点。

export var EXERCISES = [
  {
    id: 'bench-press', name: '卧推', nameEn: 'Bench Press',
    muscles: ['chest', 'triceps', 'shoulders'],
    equipment: 'barbell', difficulty: 'intermediate',
    description: '在卧推凳上躺卧，用杠铃做平板推举动作',
    mediaNote: 'TODO: 替换为自有/授权演示图'
  },
  {
    id: 'squat', name: '深蹲', nameEn: 'Back Squat',
    muscles: ['quads', 'glutes', 'hamstrings'],
    equipment: 'barbell', difficulty: 'intermediate',
    description: '将杠铃置于肩后，从站立姿势下蹲至大腿与地面平行',
    mediaNote: 'TODO: 替换为自有/授权演示图'
  },
  {
    id: 'deadlift', name: '硬拉', nameEn: 'Deadlift',
    muscles: ['lower-back', 'hamstrings', 'glutes'],
    equipment: 'barbell', difficulty: 'intermediate',
    description: '从地面将杠铃拉至髋关节高度，保持背部中立',
    mediaNote: 'TODO: 替换为自有/授权演示图'
  },
  {
    id: 'pullup', name: '引体向上', nameEn: 'Pull-up',
    muscles: ['lats', 'biceps', 'forearms'],
    equipment: 'bodyweight', difficulty: 'advanced',
    description: '悬挂在横杆上，向上拉直至下巴超过横杆',
    mediaNote: 'TODO: 替换为自有/授权演示图'
  },
  {
    id: 'overhead-press', name: '推举', nameEn: 'Overhead Press',
    muscles: ['shoulders', 'triceps'],
    equipment: 'barbell', difficulty: 'intermediate',
    description: '从肩前将杠铃推举至头顶伸直',
    mediaNote: 'TODO: 替换为自有/授权演示图'
  },
  {
    id: 'bicep-curl', name: '二头弯举', nameEn: 'Barbell Curl',
    muscles: ['biceps'],
    equipment: 'barbell', difficulty: 'beginner',
    description: '站立持杠铃，仅用前臂做弯举动作',
    mediaNote: 'TODO: 替换为自有/授权演示图'
  }
];

export var MUSCLE_GROUPS = [
  { id: 'chest', name: '胸肌' },
  { id: 'back', name: '背部' },
  { id: 'shoulders', name: '肩部' },
  { id: 'biceps', name: '二头' },
  { id: 'triceps', name: '三头' },
  { id: 'quads', name: '股四头' },
  { id: 'hamstrings', name: '腘绳肌' },
  { id: 'glutes', name: '臀肌' },
  { id: 'calves', name: '小腿' },
  { id: 'core', name: '核心' }
];

export var STARTER_PLANS = {
  pushPullLegs: { name: '推拉腿 六日', weekdayCount: 6 },
  upperLower:   { name: '上下肢 四日', weekdayCount: 4 },
  fullBody:     { name: '全身 三日', weekdayCount: 3 },
  fiveByFive:   { name: '5×5 力量', weekdayCount: 3 }
};
