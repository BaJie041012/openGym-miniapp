// openGym 预设计划 · 迁移自原项目 frontend/src/lib/starter.js（AGPL-3.0）
// 四套计划：推拉腿 / 上下肢 / 全身 / 5×5 力量。动作 ID 为原库 catalogue/exercises 稳定 ID，
// 可在动作库与后端 /api/exercises 精确检索。schedule 为周一..周日的排程键。
// 条目格式与 Store.routines 一致：{ exerciseId, name, sets, reps }

export var PRESET_PLANS = [
  {
    id: 'ppl',
    name: '推拉腿 · 三日',
    emoji: '💪',
    description: '经典 Push / Pull / Legs 分化，每个部位每周 1 次直接刺激，适合中级训练者',
    schedule: { monday: 'push', wednesday: 'pull', friday: 'legs' },
    routines: [
      { key: 'push', name: '推日', exercises: [
        { exerciseId: '0025', name: '杠铃平板卧推', sets: 4, reps: '8' },
        { exerciseId: '0047', name: '杠铃上斜卧推', sets: 3, reps: '10' },
        { exerciseId: '0426', name: '哑铃站姿推举', sets: 3, reps: '10' },
        { exerciseId: '0334', name: '哑铃侧平举', sets: 3, reps: '12' },
        { exerciseId: '0241', name: '绳索下压', sets: 3, reps: '12' },
        { exerciseId: '0251', name: '双杠臂屈伸', sets: 3, reps: '10' }
      ] },
      { key: 'pull', name: '拉日', exercises: [
        { exerciseId: '2330', name: '绳索高位下拉', sets: 4, reps: '10' },
        { exerciseId: '0027', name: '杠铃俯身划船', sets: 4, reps: '8' },
        { exerciseId: '1323', name: '绳索坐姿划船', sets: 3, reps: '10' },
        { exerciseId: '0031', name: '杠铃弯举', sets: 3, reps: '10' },
        { exerciseId: '0313', name: '哑铃锤式弯举', sets: 3, reps: '12' }
      ] },
      { key: 'legs', name: '腿日', exercises: [
        { exerciseId: '0043', name: '杠铃深蹲', sets: 4, reps: '8' },
        { exerciseId: '0085', name: '杠铃罗马尼亚硬拉', sets: 3, reps: '10' },
        { exerciseId: '0739', name: '45° 倒蹬', sets: 3, reps: '12' },
        { exerciseId: '0585', name: '坐姿腿屈伸', sets: 3, reps: '12' },
        { exerciseId: '0586', name: '俯卧腿弯举', sets: 3, reps: '12' },
        { exerciseId: '0605', name: '站姿提踵', sets: 4, reps: '15' }
      ] }
    ]
  },
  {
    id: 'upper-lower',
    name: '上下肢 · 四日',
    emoji: '🏋️',
    description: '上 / 下肢交替分化，每个部位每周 2 次刺激，频率与恢复兼顾',
    schedule: { monday: 'upper-a', tuesday: 'lower-a', thursday: 'upper-b', friday: 'lower-b' },
    routines: [
      { key: 'upper-a', name: '上肢 A', exercises: [
        { exerciseId: '0025', name: '杠铃平板卧推', sets: 3, reps: '8' },
        { exerciseId: '2330', name: '绳索高位下拉', sets: 3, reps: '10' },
        { exerciseId: '0047', name: '杠铃上斜卧推', sets: 2, reps: '10' },
        { exerciseId: '1323', name: '绳索坐姿划船', sets: 2, reps: '10' },
        { exerciseId: '0334', name: '哑铃侧平举', sets: 2, reps: '12' },
        { exerciseId: '0241', name: '绳索下压', sets: 2, reps: '12' },
        { exerciseId: '0031', name: '杠铃弯举', sets: 2, reps: '12' }
      ] },
      { key: 'lower-a', name: '下肢 A', exercises: [
        { exerciseId: '0043', name: '杠铃深蹲', sets: 3, reps: '8' },
        { exerciseId: '0085', name: '杠铃罗马尼亚硬拉', sets: 3, reps: '8' },
        { exerciseId: '0739', name: '45° 倒蹬', sets: 2, reps: '10' },
        { exerciseId: '0586', name: '俯卧腿弯举', sets: 2, reps: '12' },
        { exerciseId: '0605', name: '站姿提踵', sets: 3, reps: '15' }
      ] },
      { key: 'upper-b', name: '上肢 B', exercises: [
        { exerciseId: '0047', name: '杠铃上斜卧推', sets: 3, reps: '8' },
        { exerciseId: '0027', name: '杠铃俯身划船', sets: 3, reps: '8' },
        { exerciseId: '0426', name: '哑铃站姿推举', sets: 2, reps: '10' },
        { exerciseId: '2330', name: '绳索高位下拉', sets: 2, reps: '10' },
        { exerciseId: '0334', name: '哑铃侧平举', sets: 2, reps: '12' },
        { exerciseId: '0241', name: '绳索下压', sets: 2, reps: '12' },
        { exerciseId: '0313', name: '哑铃锤式弯举', sets: 2, reps: '12' }
      ] },
      { key: 'lower-b', name: '下肢 B', exercises: [
        { exerciseId: '0739', name: '45° 倒蹬', sets: 3, reps: '10' },
        { exerciseId: '0085', name: '杠铃罗马尼亚硬拉', sets: 2, reps: '10' },
        { exerciseId: '0585', name: '坐姿腿屈伸', sets: 2, reps: '12' },
        { exerciseId: '0586', name: '俯卧腿弯举', sets: 3, reps: '12' },
        { exerciseId: '0605', name: '站姿提踵', sets: 3, reps: '15' }
      ] }
    ]
  },
  {
    id: 'full-body',
    name: '全身 · 三日',
    emoji: '🔥',
    description: '每次覆盖全身大肌群，适合新手或时间有限的训练者',
    schedule: { monday: 'fb-a', wednesday: 'fb-b', friday: 'fb-c' },
    routines: [
      { key: 'fb-a', name: '全身 A', exercises: [
        { exerciseId: '0043', name: '杠铃深蹲', sets: 3, reps: '8' },
        { exerciseId: '0025', name: '杠铃平板卧推', sets: 3, reps: '8' },
        { exerciseId: '2330', name: '绳索高位下拉', sets: 3, reps: '10' },
        { exerciseId: '0586', name: '俯卧腿弯举', sets: 3, reps: '12' },
        { exerciseId: '0334', name: '哑铃侧平举', sets: 2, reps: '12' },
        { exerciseId: '0031', name: '杠铃弯举', sets: 2, reps: '12' }
      ] },
      { key: 'fb-b', name: '全身 B', exercises: [
        { exerciseId: '0085', name: '杠铃罗马尼亚硬拉', sets: 3, reps: '8' },
        { exerciseId: '0047', name: '杠铃上斜卧推', sets: 3, reps: '10' },
        { exerciseId: '1323', name: '绳索坐姿划船', sets: 3, reps: '10' },
        { exerciseId: '0585', name: '坐姿腿屈伸', sets: 3, reps: '12' },
        { exerciseId: '0334', name: '哑铃侧平举', sets: 2, reps: '12' },
        { exerciseId: '0241', name: '绳索下压', sets: 2, reps: '12' }
      ] },
      { key: 'fb-c', name: '全身 C', exercises: [
        { exerciseId: '0739', name: '45° 倒蹬', sets: 3, reps: '10' },
        { exerciseId: '0025', name: '杠铃平板卧推', sets: 2, reps: '10' },
        { exerciseId: '0027', name: '杠铃俯身划船', sets: 3, reps: '10' },
        { exerciseId: '0426', name: '哑铃站姿推举', sets: 2, reps: '10' },
        { exerciseId: '0586', name: '俯卧腿弯举', sets: 3, reps: '12' },
        { exerciseId: '0605', name: '站姿提踵', sets: 3, reps: '15' }
      ] }
    ]
  },
  {
    id: '5x5',
    name: '5×5 · 力量',
    emoji: '⚡',
    description: '经典线性进阶力量计划，三大项 5 组 5 次，适合打基础',
    schedule: { monday: '5x5-a', wednesday: '5x5-b', friday: '5x5-c' },
    routines: [
      { key: '5x5-a', name: '5×5 A', exercises: [
        { exerciseId: '0043', name: '杠铃深蹲', sets: 5, reps: '5' },
        { exerciseId: '0025', name: '杠铃平板卧推', sets: 5, reps: '5' },
        { exerciseId: '0027', name: '杠铃俯身划船', sets: 5, reps: '5' }
      ] },
      { key: '5x5-b', name: '5×5 B', exercises: [
        { exerciseId: '0085', name: '杠铃罗马尼亚硬拉', sets: 5, reps: '5' },
        { exerciseId: '0426', name: '哑铃站姿推举', sets: 5, reps: '5' },
        { exerciseId: '2330', name: '绳索高位下拉', sets: 5, reps: '5' }
      ] },
      { key: '5x5-c', name: '5×5 C', exercises: [
        { exerciseId: '0739', name: '45° 倒蹬', sets: 5, reps: '5' },
        { exerciseId: '0047', name: '杠铃上斜卧推', sets: 5, reps: '5' },
        { exerciseId: '1323', name: '绳索坐姿划船', sets: 5, reps: '5' }
      ] }
    ]
  }
];
