// openGym 动作数据 · 精选集（61 条 · 学术中文）
// 由 scripts/seed-exercises.mjs 从 curated-zh.json 生成，手改会被覆盖。
// 文本合规：openGym 原 catalogue (AGPL-3.0) + ExerciseDB v1 (MIT)；媒体（Gym visual 商业素材）已剥离。
// 全量 6554 条动作存于后端 Mongo，前端可经 /api/exercises 分页检索。

export var EXERCISES = [
  {
    "id": "russian-twist",
    "name": "俄罗斯转体",
    "nameEn": "assisted motion russian twist",
    "sourceId": "0014",
    "muscles": [
      "core"
    ],
    "equipment": "bodyweight",
    "difficulty": "beginner",
    "description": "坐姿抬腿完成躯干左右旋转。训练腹斜肌的旋转与抗旋转能力，可持重物增加负荷。",
    "steps": [
      "坐姿屈膝，上身后倾约 45°，双手持重物于胸前。",
      "保持下背挺直，以腹斜肌发力将躯干与重物转向一侧。",
      "再转向另一侧为一次，臀部保持稳定不晃。",
      "全程核心收紧，动作节奏受控。"
    ]
  },
  {
    "id": "assisted-pull-up",
    "name": "辅助引体向上",
    "nameEn": "assisted pull-up",
    "sourceId": "0017",
    "muscles": [
      "back",
      "biceps"
    ],
    "equipment": "machine",
    "difficulty": "beginner",
    "description": "利用器械配重抵消部分体重完成引体向上模式。作为自重引体的进阶过渡，帮助建立背阔肌发力模式与基础力量。",
    "steps": [
      "跪或站于辅助垫上，双手宽握横杆。",
      "肩胛下沉启动，以背阔肌发力将身体上拉至下颌过杆。",
      "顶端挤压背肌一秒。",
      "控制身体缓慢下降至完全伸展。"
    ]
  },
  {
    "id": "close-grip-bench",
    "name": "窄距卧推",
    "nameEn": "barbell close-grip bench press",
    "sourceId": "0030",
    "muscles": [
      "triceps",
      "chest",
      "shoulders"
    ],
    "equipment": "barbell",
    "difficulty": "intermediate",
    "description": "窄握完成卧推。负荷重心由胸肌转向肱三头肌（尤其内侧头），是发展三头水平推力与卧推锁定力量的主要辅助动作。",
    "steps": [
      "仰卧正握杠铃，握距与肩同宽或略窄。",
      "出杠后降至下胸位置，肘部贴近躯干。",
      "以三头肌主导将杠铃推起至双臂伸直。",
      "控制杠铃下放，全程肘部不外飘。"
    ]
  },
  {
    "id": "bent-over-row",
    "name": "俯身杠铃划船",
    "nameEn": "barbell bent over row",
    "sourceId": "0027",
    "muscles": [
      "back",
      "biceps",
      "lower-back"
    ],
    "equipment": "barbell",
    "difficulty": "intermediate",
    "description": "髋铰链俯身约 45° 持杠铃完成水平划船。同时发展背阔肌厚度、斜方肌中部与竖脊肌等姿势稳定肌，对髋铰链刚性有较高要求。",
    "steps": [
      "双脚与髋同宽，屈髋俯身至躯干约与地面成 45°，背部平直中立。",
      "正握杠铃自然悬垂于肩下方，核心收紧锁定躯干角度。",
      "以背肌发力将杠铃拉向下腹部，肘部贴近躯干。",
      "顶端挤压肩胛一秒，控制杠铃缓慢下放至完全伸展。"
    ]
  },
  {
    "id": "bicep-curl",
    "name": "杠铃弯举",
    "nameEn": "barbell curl",
    "sourceId": "0031",
    "muscles": [
      "biceps",
      "forearms"
    ],
    "equipment": "barbell",
    "difficulty": "beginner",
    "description": "站姿屈肘将杠铃自体侧弯举至肩前。肱二头肌为主导的肘关节屈曲动作，需严格锁定上臂位置以隔离刺激。",
    "steps": [
      "站姿反握杠铃与肩同宽，上臂贴紧躯干两侧。",
      "以肱二头肌发力屈肘将杠铃弯举至肩前，避免躯干后仰借力。",
      "顶端挤压二头肌一秒。",
      "控制杠铃缓慢下放至双臂完全伸展。"
    ]
  },
  {
    "id": "deadlift",
    "name": "杠铃硬拉",
    "nameEn": "barbell deadlift",
    "sourceId": "0032",
    "muscles": [
      "lower-back",
      "hamstrings",
      "glutes",
      "back"
    ],
    "equipment": "barbell",
    "difficulty": "advanced",
    "description": "自地面拉起杠铃至髋关节完全伸展的全身性铰链动作。整合后侧链（臀肌、腘绳肌、竖脊肌）与握力、核心刚性，是力量发展的基石动作。",
    "steps": [
      "杠铃贴近胫骨，屈髋俯身正反握杠铃，背部平直，肩胛位于杠铃正上方。",
      "深吸气绷紧核心，腿部发力使杠铃沿小腿垂直上升。",
      "杠铃过膝后髋部前推，直至髋膝完全伸展、躯干直立。",
      "以髋铰链方式控制杠铃沿原路径贴身放回地面。"
    ]
  },
  {
    "id": "bench-press",
    "name": "杠铃平板卧推",
    "nameEn": "barbell bench press",
    "sourceId": "0025",
    "muscles": [
      "chest",
      "triceps",
      "shoulders"
    ],
    "equipment": "barbell",
    "difficulty": "intermediate",
    "description": "仰卧于水平卧推凳，双手略宽于肩握持杠铃完成水平内推动作。主要发展胸大肌整体厚度，协同刺激肱三头肌与三角肌前束。",
    "steps": [
      "仰卧于凳面，双脚踏实地面，肩胛骨后缩下沉，保持胸廓展开与背部中立。",
      "双手略宽于肩正握杠铃，出杠后将其降至乳头连线水平，肘部约呈 45° 外展。",
      "杠铃轻触胸部后，以胸大肌发力垂直向上推起，肘关节伸展但不锁死。",
      "在动作顶端主动挤压胸肌约一秒，随后控制杠铃缓慢下放，重复完成规定次数。"
    ]
  },
  {
    "id": "good-morning",
    "name": "早安式体前屈",
    "nameEn": "barbell good morning",
    "sourceId": "0044",
    "muscles": [
      "lower-back",
      "hamstrings",
      "glutes"
    ],
    "equipment": "barbell",
    "difficulty": "intermediate",
    "description": "杠铃负于肩后完成髋铰链前屈。竖脊肌等长稳定、腘绳肌与臀肌动态伸展收缩，是后侧链柔韧与控制的高级训练。",
    "steps": [
      "杠铃置于斜方肌上部，站距与髋同宽，膝微屈。",
      "保持背部平直，以髋为轴前屈至躯干约与地面平行。",
      "腘绳肌充分拉伸后，以臀腿发力伸髋站起。",
      "全程核心收紧，避免腰椎屈曲。"
    ]
  },
  {
    "id": "incline-bench-press",
    "name": "杠铃上斜卧推",
    "nameEn": "barbell incline bench press",
    "sourceId": "0047",
    "muscles": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "equipment": "barbell",
    "difficulty": "intermediate",
    "description": "仰卧于 30°–45° 上斜凳完成杠铃推举。躯干角度上移使刺激重点转向胸大肌上束（锁骨部）与三角肌前束，用于改善上胸维度与轮廓。",
    "steps": [
      "调节斜凳至 30°–45°，仰卧后肩胛后缩，双脚踏实地面维持躯干稳定。",
      "正握杠铃略宽于肩，出杠后置于上胸锁骨正上方。",
      "控制杠铃沿胸廓平面下降至上胸附近，肘部自然内收约 45°。",
      "胸肌上束发力将杠铃推回起点，顶端不完全锁肘以维持张力。"
    ]
  },
  {
    "id": "preacher-curl",
    "name": "牧师凳弯举",
    "nameEn": "barbell lying preacher curl",
    "sourceId": "0059",
    "muscles": [
      "biceps"
    ],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "description": "上臂固定于斜托垫完成弯举。肩屈肌与借力被完全排除，肱二头肌在拉伸位承受恒定负荷，孤立度极高的二头动作。",
    "steps": [
      "坐姿上臂贴紧斜托垫，反握杠铃或哑铃。",
      "屈肘将重量弯举至顶端，二头肌完全收缩。",
      "挤压一秒。",
      "控制缓慢下放至手臂近完全伸展，保持张力不卸。"
    ]
  },
  {
    "id": "skull-crusher",
    "name": "仰卧臂屈伸",
    "nameEn": "barbell lying triceps extension skull crusher",
    "sourceId": "0060",
    "muscles": [
      "triceps"
    ],
    "equipment": "barbell",
    "difficulty": "intermediate",
    "description": "仰卧屈肘使杠铃下降至前额附近再伸肘还原。肱三头肌长头在肩屈位被预先拉长，刺激更为充分。",
    "steps": [
      "仰卧持杠铃（EZ杆为宜）于胸口上方，双臂伸直。",
      "保持上臂垂直固定，屈肘使杠铃缓慢下降至前额上方。",
      "以三头肌发力伸肘将杠铃还原至胸口上方，肘位不外展。",
      "重复全程保持上臂稳定。"
    ]
  },
  {
    "id": "romanian-deadlift",
    "name": "罗马尼亚硬拉",
    "nameEn": "barbell romanian deadlift",
    "sourceId": "0085",
    "muscles": [
      "hamstrings",
      "glutes",
      "lower-back"
    ],
    "equipment": "barbell",
    "difficulty": "intermediate",
    "description": "自站立位以髋铰链下放杠铃至小腿中部再起立。与硬拉的区别在于起始为离心阶段，腘绳肌在拉伸位持续受载，是后侧链肥大与柔韧的黄金动作。",
    "steps": [
      "站姿持杠铃于髋前，膝微屈固定。",
      "屈髋将杠铃贴腿下放，臀部后移，背部平直中立。",
      "下放至腘绳肌有明显拉伸感（约小腿中部）即止。",
      "以臀肌与腘绳肌发力伸髋站起，顶端臀部收紧。"
    ]
  },
  {
    "id": "seated-calf-raise",
    "name": "坐姿提踵",
    "nameEn": "barbell seated calf raise",
    "sourceId": "0088",
    "muscles": [
      "calves"
    ],
    "equipment": "machine",
    "difficulty": "beginner",
    "description": "坐姿屈膝约 90° 完成跖屈。屈膝使腓肠肌处于力学劣势，负荷转移至比目鱼肌，与站姿提踵互补。",
    "steps": [
      "坐姿前脚掌置于踏板，负重垫置于大腿下段。",
      "脚跟下降至小腿充分拉伸。",
      "跖屈抬起脚跟至最高点，顶端挤压一秒。",
      "控制缓慢回落。"
    ]
  },
  {
    "id": "shrug",
    "name": "杠铃耸肩",
    "nameEn": "barbell shrug",
    "sourceId": "0095",
    "muscles": [
      "traps"
    ],
    "equipment": "barbell",
    "difficulty": "beginner",
    "description": "站姿垂直上提肩胛（耸肩）。孤立刺激斜方肌上部，动作短小但需严格控制幅度与顶峰收缩。",
    "steps": [
      "站姿正握杠铃于体前悬垂，双臂完全伸直。",
      "垂直向上耸肩至最高点，想象肩峰去碰耳朵。",
      "顶端挤压斜方肌一秒，不屈肘、不后仰。",
      "控制肩胛缓慢下降至完全放松。"
    ]
  },
  {
    "id": "standing-calf-raise",
    "name": "站姿提踵",
    "nameEn": "barbell standing leg calf raise",
    "sourceId": "0108",
    "muscles": [
      "calves"
    ],
    "equipment": "machine",
    "difficulty": "beginner",
    "description": "站姿跖屈踝关节抬起身体。膝关节伸直位下主要刺激腓肠肌，需充分利用全幅度（充分拉伸—顶端收缩）。",
    "steps": [
      "前脚掌踩于踏板边缘，脚跟悬空，肩部顶住负重垫。",
      "脚跟下降至小腿充分拉伸。",
      "以小腿发力跖屈将脚跟抬至最高点，顶端挤压一秒。",
      "控制脚跟缓慢下降，不在底部卸力。"
    ]
  },
  {
    "id": "wrist-curl",
    "name": "腕弯举",
    "nameEn": "barbell wrist curl",
    "sourceId": "0126",
    "muscles": [
      "forearms"
    ],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "description": "前臂支撑屈腕卷起负重。孤立训练前臂屈肌群（桡侧/尺侧腕屈肌、指浅屈肌），提升握力与腕部稳定性。",
    "steps": [
      "坐姿前臂置于大腿或凳面，手腕悬空，反握哑铃掌心朝上。",
      "以腕屈肌发力向上卷起手腕至最高点。",
      "顶端挤压一秒。",
      "控制手腕缓慢下放至充分伸展。"
    ]
  },
  {
    "id": "bench-dip",
    "name": "凳上臂屈伸",
    "nameEn": "bench dip (knees bent)",
    "sourceId": "0129",
    "muscles": [
      "triceps",
      "chest",
      "shoulders"
    ],
    "equipment": "bodyweight",
    "difficulty": "beginner",
    "description": "双手反撑于凳沿、身体悬空完成屈伸肘。自重条件下集中刺激肱三头肌，动作简便适合居家与训练收尾。",
    "steps": [
      "双手与肩同宽反撑凳沿，双腿前伸或屈膝，臀部离凳。",
      "屈肘使身体下降至上臂约与地面平行，肘部朝后。",
      "以三头肌发力推起身体至双臂伸直。",
      "控制下降速度，避免耸肩。"
    ]
  },
  {
    "id": "push-up",
    "name": "俯卧撑",
    "nameEn": "bent side knee push up",
    "sourceId": "0134",
    "muscles": [
      "chest",
      "triceps",
      "shoulders",
      "core"
    ],
    "equipment": "bodyweight",
    "difficulty": "beginner",
    "description": "自重水平推举的基础动作。双手撑地完成躯干的下降与推起，同时要求核心与臀肌全程参与维持身体刚性直线，兼具胸肌与核心训练价值。",
    "steps": [
      "俯身双手略宽于肩撑地，双腿并拢，身体从头到踝呈一条直线。",
      "核心与臀肌收紧，避免塌腰或撅臀。",
      "屈肘使躯干整体下降至胸部接近地面，肘部约 45° 外展。",
      "以胸肌发力推起身体至双臂伸直，顶端保持肩胛不翼状耸起。"
    ]
  },
  {
    "id": "plank",
    "name": "平板支撑",
    "nameEn": "bent knee side plank",
    "sourceId": "0133",
    "muscles": [
      "core"
    ],
    "equipment": "bodyweight",
    "difficulty": "beginner",
    "description": "肘撑地保持身体静态直线。等长收缩训练核心深层肌群（腹横肌、多裂肌）与肩带稳定，是核心抗伸展能力的基础评估与训练动作。",
    "steps": [
      "俯身双肘撑地与肩同宽，双腿后伸以前脚掌着地。",
      "收紧核心与臀肌，使头、背、髋、踝呈一条直线。",
      "保持自然呼吸，避免塌腰、撅臀或肩胛下陷。",
      "按时间规定维持，疲劳变形即停。"
    ]
  },
  {
    "id": "lat-pulldown",
    "name": "高位下拉",
    "nameEn": "cable bar lateral pulldown",
    "sourceId": "0150",
    "muscles": [
      "back",
      "biceps"
    ],
    "equipment": "cable",
    "difficulty": "beginner",
    "description": "坐姿宽握横杆向下拉至锁骨水平。背阔肌主导的肩关节内收动作，是引体向上器械化替代方案，便于精准控制负荷与渐进超负荷。",
    "steps": [
      "坐姿调节大腿垫固定下肢，双手宽握横杆。",
      "躯干略后倾约 15°，胸廓上提，肩胛下沉启动。",
      "以背阔肌发力将横杆下拉至锁骨附近，肘部垂直向下。",
      "顶端挤压背肌一秒，控制横杆缓慢回放至完全伸展。"
    ]
  },
  {
    "id": "cable-fly",
    "name": "龙门架绳索夹胸",
    "nameEn": "cable cross-over revers fly",
    "sourceId": "0154",
    "muscles": [
      "chest"
    ],
    "equipment": "cable",
    "difficulty": "beginner",
    "description": "站姿使用双侧绳索完成水平内收。绳索的恒定张力使胸大肌在全行程持续受载，顶端的等长收缩效果优于自由重量飞鸟。",
    "steps": [
      "调整滑轮至肩部高度或略高，双手各握一侧手柄，弓步站于滑轮中点。",
      "躯干略前倾，肘部微屈固定，肩胛保持下沉后缩。",
      "以胸肌发力将双手沿弧线向前下方合拢，掌心渐趋相对。",
      "顶端交叉挤压胸肌一秒，缓慢控制回放至胸部充分拉伸。"
    ]
  },
  {
    "id": "seated-cable-row",
    "name": "坐姿绳索划船",
    "nameEn": "cable decline seated wide-grip row",
    "sourceId": "0159",
    "muscles": [
      "back",
      "biceps"
    ],
    "equipment": "cable",
    "difficulty": "beginner",
    "description": "坐姿面向滑轮完成水平划船。躯干有支撑、轨迹稳定，重点刺激背阔肌与斜方肌中部，适合作为背部厚度的安全主力或辅助动作。",
    "steps": [
      "坐姿屈膝微屈，双脚踩实踏板，背部中立。",
      "双手握把手，先以肩胛下沉与后缩启动。",
      "将把手拉向腹部，肘部贴躯干向后，胸廓保持上提。",
      "顶端挤压背肌一秒，控制把手回放至背肌充分伸展。"
    ]
  },
  {
    "id": "hammer-curl",
    "name": "锤式弯举",
    "nameEn": "cable hammer curl (with rope)",
    "sourceId": "0165",
    "muscles": [
      "biceps",
      "forearms"
    ],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "description": "掌心相对的中立位弯举。同时刺激肱二头肌、肱肌与肱桡肌，是增加上臂厚度与前臂围度的复合屈肘动作。",
    "steps": [
      "站姿双手持哑铃于体侧，掌心相对呈中立位。",
      "屈肘将哑铃上举至肩前，全程保持中立握姿。",
      "顶端挤压一秒，肘部锁定于躯干两侧。",
      "控制哑铃缓慢下放至完全伸展。"
    ]
  },
  {
    "id": "cable-lateral-raise",
    "name": "绳索侧平举",
    "nameEn": "cable lateral raise",
    "sourceId": "0178",
    "muscles": [
      "shoulders"
    ],
    "equipment": "cable",
    "difficulty": "beginner",
    "description": "单侧使用低位滑轮完成侧平举。绳索张力方向在动作全程垂直于三角肌中束纤维，起始位即有负荷，弥补哑铃侧平举底部无张力的缺陷。",
    "steps": [
      "单手持握低位滑轮手柄，身体略侧倾建立张力。",
      "以三角肌中束发力沿弧线上举至肩高水平。",
      "顶端停顿一秒。",
      "控制手柄缓慢回落，保持张力。"
    ]
  },
  {
    "id": "overhead-triceps-ext",
    "name": "绳索过顶臂屈伸",
    "nameEn": "cable overhead triceps extension (rope attachment)",
    "sourceId": "0194",
    "muscles": [
      "triceps"
    ],
    "equipment": "cable",
    "difficulty": "beginner",
    "description": "背向低位滑轮、过顶屈伸肘关节。三头长头在肩屈位被拉长，与下压类动作互补，实现长头的完整刺激。",
    "steps": [
      "背向滑轮，双手握绳索于头后，肘部指向前上方并固定。",
      "以前臂伸肘将绳索拉过头顶至双臂伸直。",
      "顶端挤压三头一秒。",
      "控制绳索缓慢回落至头后，肘位不漂移。"
    ]
  },
  {
    "id": "cable-crunch",
    "name": "跪姿绳索卷腹",
    "nameEn": "cable side crunch",
    "sourceId": "0223",
    "muscles": [
      "core"
    ],
    "equipment": "cable",
    "difficulty": "intermediate",
    "description": "跪姿持绳索于头后，以脊柱屈曲完成卷腹。附加负荷使腹直肌获得渐进超负荷可能，是腹肌增量的主力动作。",
    "steps": [
      "跪于滑轮前，绳索握把置于头后两侧，髋部保持固定。",
      "以腹直肌收缩将躯干向大腿方向卷起，臀部略后坐。",
      "顶端挤压腹肌一秒，肘部向膝方向靠拢。",
      "控制躯干缓慢伸展还原，腹肌不完全松弛。"
    ]
  },
  {
    "id": "reverse-fly",
    "name": "俯身飞鸟",
    "nameEn": "cable standing cross-over high reverse fly",
    "sourceId": "0225",
    "muscles": [
      "shoulders",
      "back"
    ],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "description": "俯身持哑铃完成水平外展。孤立刺激三角肌后束与斜方肌中部，是平衡推类训练量、改善圆肩的关键动作。",
    "steps": [
      "屈髋俯身至躯干近乎平行地面，持哑铃自然下垂，掌心相对。",
      "以肩后束发力将哑铃沿弧线向两侧举至肩高水平，肘部微屈。",
      "顶端挤压肩后束与肩胛一秒。",
      "控制哑铃缓慢回落，全程避免耸肩与借力。"
    ]
  },
  {
    "id": "triceps-pushdown",
    "name": "绳索下压",
    "nameEn": "cable triceps pushdown (v-bar)",
    "sourceId": "0241",
    "muscles": [
      "triceps"
    ],
    "equipment": "cable",
    "difficulty": "beginner",
    "description": "站姿面向高位滑轮，伸肘将绳索下压至大腿前侧。孤立刺激肱三头肌（三头长头及内外侧头），绳索恒定张力使顶端收缩充分。",
    "steps": [
      "调整滑轮至高位，双手握杆与胸同宽，肘部锁定于躯干两侧。",
      "以肱三头肌发力伸肘将杆下压至大腿前侧，顶端完全伸展。",
      "挤压三头肌一秒。",
      "控制杆缓慢回放至前臂贴近上臂，肘位不漂移。"
    ]
  },
  {
    "id": "chest-dip",
    "name": "双杠臂屈伸（胸式）",
    "nameEn": "chest dip",
    "sourceId": "0251",
    "muscles": [
      "chest",
      "triceps"
    ],
    "equipment": "bodyweight",
    "difficulty": "intermediate",
    "description": "双杠间完成自重下降与推起。躯干前倾约 30° 并屈肘外展时，负荷重点由肱三头肌转向胸大肌下束，是发展下胸的优秀自重动作。",
    "steps": [
      "双手握杠撑起身体，躯干前倾，双腿屈膝交叠于体后。",
      "控制身体下降至肩部略低于肘部，肘部自然外展。",
      "以胸肌发力推起身体至双臂近伸直，保持躯干前倾角度不变。",
      "顶端不完全锁肘，随即进入下一次离心阶段。"
    ]
  },
  {
    "id": "seated-db-press",
    "name": "坐姿哑铃推举",
    "nameEn": "dumbbell bench seated press",
    "sourceId": "0290",
    "muscles": [
      "shoulders",
      "triceps"
    ],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "description": "背部有靠背支撑的哑铃推举变式。躯干稳定使三角肌可承受更大负荷，动作模式与站姿推举互补。",
    "steps": [
      "坐姿背部贴靠凳面，双手持哑铃于肩侧。",
      "垂直向上推起至双臂近伸直。",
      "顶端三角肌完全收缩一秒。",
      "控制哑铃回落至肩侧。"
    ]
  },
  {
    "id": "db-bench-press",
    "name": "哑铃平板卧推",
    "nameEn": "dumbbell bench press",
    "sourceId": "0289",
    "muscles": [
      "chest",
      "triceps",
      "shoulders"
    ],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "description": "仰卧持哑铃完成水平推举。相较杠铃，哑铃允许更大活动幅度与独立左右平衡矫正，对胸大肌及稳定肌群的发展更全面。",
    "steps": [
      "仰卧于水平凳，双手各持一哑铃置于胸部两侧，肘部约 45° 外展。",
      "肩胛后缩贴凳，双脚踏实，核心收紧维持骨盆中立。",
      "自胸前垂直向上推起哑铃，至双臂近伸直且哑铃轻靠拢。",
      "顶端主动挤压胸肌一秒，控制哑铃缓慢回落至起始平面。"
    ]
  },
  {
    "id": "db-row",
    "name": "单臂哑铃划船",
    "nameEn": "dumbbell one arm bent-over row",
    "sourceId": "0292",
    "muscles": [
      "back",
      "biceps"
    ],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "description": "单手支撑于凳面、另一手持哑铃完成单侧水平划船。单侧负荷允许更大动作幅度与背阔肌的独立发展，同时纠正左右力量不平衡。",
    "steps": [
      "单膝与同侧手撑凳，另一脚踏实地面，背部平直与地面近乎平行。",
      "对侧手持哑铃完全悬垂，肩胛自然伸展。",
      "以背阔肌发力将哑铃拉向髋部，肘部贴近躯干上提。",
      "顶端挤压肩胛一秒，控制哑铃下放至完全伸展。"
    ]
  },
  {
    "id": "db-curl",
    "name": "哑铃弯举",
    "nameEn": "dumbbell cross body hammer curl",
    "sourceId": "0298",
    "muscles": [
      "biceps"
    ],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "description": "站姿持哑铃完成单臂或双臂屈肘弯举。前臂可自由旋转（旋后），使肱二头肌在全范围获得更完整的收缩。",
    "steps": [
      "站姿双手持哑铃于体侧，掌心相对。",
      "屈肘上举的同时前臂旋后，至掌心朝肩。",
      "顶端挤压二头肌一秒，肘部保持固定。",
      "控制哑铃缓慢下放并旋前还原。"
    ]
  },
  {
    "id": "lateral-raise",
    "name": "哑铃侧平举",
    "nameEn": "dumbbell full can lateral raise",
    "sourceId": "0311",
    "muscles": [
      "shoulders"
    ],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "description": "站姿双臂侧向平举至肩高。孤立刺激三角肌中束，决定肩部宽度与轮廓的关键动作，需严格避免借力摆动。",
    "steps": [
      "站姿双手持哑铃置于体侧，肘部微屈固定。",
      "以三角肌中束发力将哑铃沿体侧上举至肩部水平，小拇指略高。",
      "顶端停顿一秒，避免耸肩或躯干后仰。",
      "控制哑铃缓慢回落，保持全程张力。"
    ]
  },
  {
    "id": "front-raise",
    "name": "哑铃前平举",
    "nameEn": "dumbbell front raise",
    "sourceId": "0310",
    "muscles": [
      "shoulders"
    ],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "description": "站姿双臂前举哑铃至肩高。孤立刺激三角肌前束，该肌群在多数推类动作中已充分参与，常作为小负荷补充。",
    "steps": [
      "站姿持哑铃于大腿前侧，肘部微屈。",
      "以三角肌前束发力将哑铃前举至肩部水平。",
      "顶端停顿一秒，避免身体后仰借力。",
      "控制哑铃缓慢回落至大腿前。"
    ]
  },
  {
    "id": "db-fly",
    "name": "哑铃飞鸟",
    "nameEn": "dumbbell fly",
    "sourceId": "0308",
    "muscles": [
      "chest"
    ],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "description": "仰卧持哑铃做水平内收弧线动作。肘关节角度全程近似固定，通过肩关节水平内收孤立刺激胸大肌，强调肌肉在拉伸位的离心控制。",
    "steps": [
      "仰卧持哑铃上举于胸前，掌心相对，肘部保持微屈并锁定角度。",
      "以胸肌控制，将哑铃沿弧线向两侧下降，感受胸部充分拉伸。",
      "下降至胸部有轻微牵拉感即止，避免肘关节角度变化或肩部过度受压。",
      "以胸大肌水平内收的力量沿原弧线合拢哑铃，顶端主动挤压。"
    ]
  },
  {
    "id": "incline-db-press",
    "name": "哑铃上斜卧推",
    "nameEn": "dumbbell incline bench press",
    "sourceId": "0314",
    "muscles": [
      "chest",
      "shoulders",
      "triceps"
    ],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "description": "仰卧于 30°–45° 上斜凳持哑铃推举。重点发展胸大肌上束与三角肌前束，动作幅度大于杠铃上斜卧推，利于上胸的充分伸展与收缩。",
    "steps": [
      "调节斜凳至约 30°，仰卧持哑铃置于上胸两侧。",
      "肩胛后缩贴凳，核心收紧，双脚踏实地面。",
      "垂直向上推起哑铃至双臂近伸直，顶端轻靠拢并挤压。",
      "控制哑铃沿原路径回落至上胸两侧，保持肘部约 45° 外展。"
    ]
  },
  {
    "id": "incline-db-curl",
    "name": "上斜哑铃弯举",
    "nameEn": "dumbbell incline biceps curl",
    "sourceId": "0315",
    "muscles": [
      "biceps"
    ],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "description": "仰卧于 45° 上斜凳、双臂自然下垂完成弯举。肩关节后伸使肱二头肌长头在最大拉伸位受载，是发展二头峰值的高阶变式。",
    "steps": [
      "仰卧于上斜凳，双臂垂直下垂持哑铃，掌心朝前。",
      "屈肘将哑铃弯举至肩前，上臂保持固定不前移。",
      "顶端挤压二头肌一秒。",
      "控制缓慢下放至完全伸展。"
    ]
  },
  {
    "id": "overhead-press",
    "name": "站姿杠铃推举",
    "nameEn": "dumbbell standing alternate overhead press",
    "sourceId": "0414",
    "muscles": [
      "shoulders",
      "triceps",
      "core"
    ],
    "equipment": "barbell",
    "difficulty": "intermediate",
    "description": "站姿将杠铃自肩前推举至头顶伸直。三角肌前束与中束为主导，核心全程抗伸展维持躯干刚性，是发展垂直推力的基础复合动作。",
    "steps": [
      "双脚与髋同宽，杠铃置于锁骨与三角肌前束上，肘部略前于杠铃。",
      "核心与臀部收紧，避免腰椎超伸。",
      "垂直推起杠铃过头顶，至双臂完全伸直且杠铃位于耳侧正上方。",
      "顶端肩胛上回旋稳定，控制杠铃回落至锁骨位。"
    ]
  },
  {
    "id": "db-shrug",
    "name": "哑铃耸肩",
    "nameEn": "dumbbell shrug",
    "sourceId": "0406",
    "muscles": [
      "traps"
    ],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "description": "站姿持哑铃完成肩胛上提。与杠铃耸肩等效但握持更自由，可在更大活动范围内挤压斜方肌上部。",
    "steps": [
      "站姿持哑铃于体侧，双臂伸直。",
      "垂直上耸肩胛至最高点，不屈肘。",
      "顶端挤压斜方肌一秒。",
      "控制缓慢下降至肩胛完全放松。"
    ]
  },
  {
    "id": "step-up",
    "name": "哑铃箱上步",
    "nameEn": "dumbbell step-up",
    "sourceId": "0431",
    "muscles": [
      "quads",
      "glutes"
    ],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "description": "单腿蹬上箱台。功能性单侧伸髋伸膝训练，与日常生活动作模式高度一致，同时提升单腿稳定性。",
    "steps": [
      "持哑铃于体侧，面对高度约膝上方的箱台。",
      "单脚全脚踏上箱台，以该腿发力蹬直身体上台。",
      "顶端臀肌收紧，另一腿控制性放下。",
      "重复规定次数后换边。"
    ]
  },
  {
    "id": "hanging-leg-raise",
    "name": "悬垂举腿",
    "nameEn": "hanging leg raise",
    "sourceId": "0472",
    "muscles": [
      "core"
    ],
    "equipment": "bodyweight",
    "difficulty": "advanced",
    "description": "悬垂于横杆将双腿伸直上举至水平以上。同时挑战下腹（腹直肌下部）与髋屈肌力量、握力及肩带稳定性，是高阶核心动作。",
    "steps": [
      "正握横杆完全悬垂，肩胛下沉稳定。",
      "以腹部发力屈髋上举双腿至脚尖过杠高度，骨盆后倾卷起。",
      "顶端挤压下腹一秒，避免借力摆动。",
      "控制双腿缓慢下放至初始悬垂位。"
    ]
  },
  {
    "id": "burpee",
    "name": "波比跳",
    "nameEn": "jack burpee",
    "sourceId": "0501",
    "muscles": [
      "core",
      "quads",
      "chest",
      "shoulders"
    ],
    "equipment": "bodyweight",
    "difficulty": "intermediate",
    "description": "整合下蹲、俯卧撑与纵跳的全身性输出动作。对心肺系统与多肌群耐力要求极高，常用于高强度间歇训练的收尾。",
    "steps": [
      "站立后下蹲双手撑地，双脚后跳成俯撑姿势。",
      "完成一次俯卧撑（可选）。",
      "双脚跳回双手两侧，起身发力纵跳并过头击掌。",
      "落地缓冲后立即进入下一次，保持节奏均匀。"
    ]
  },
  {
    "id": "kettlebell-swing",
    "name": "壶铃摆动",
    "nameEn": "kettlebell swing",
    "sourceId": "0549",
    "muscles": [
      "glutes",
      "hamstrings",
      "core"
    ],
    "equipment": "kettlebell",
    "difficulty": "intermediate",
    "description": "以髋铰链爆发力将壶铃甩至胸前高度。后侧链爆发功率输出与核心抗负荷的经典动作，心肺负荷显著。",
    "steps": [
      "壶铃置于体前，屈髋俯身握把，背部平直。",
      "向后摆壶铃至两腿之间，然后爆发伸髋将壶铃前甩。",
      "壶铃借髋部爆发力升至胸口高度，臀肌收紧、核心绷紧。",
      "壶铃下落时顺势屈髋缓冲回摆，动作节奏由髋驱动而非手臂。"
    ]
  },
  {
    "id": "chin-up",
    "name": "引体向上（反手）",
    "nameEn": "mixed grip chin-up",
    "sourceId": "0627",
    "muscles": [
      "back",
      "biceps"
    ],
    "equipment": "bodyweight",
    "difficulty": "intermediate",
    "description": "反手窄握完成垂直上拉。相较正手引体，肱二头肌参与度显著提高，背阔肌下部与胸大肌纤维的刺激也更充分。",
    "steps": [
      "反握横杆与肩同宽，完全悬垂并主动沉肩。",
      "屈肘将身体沿垂直线上拉，肘部指向地面。",
      "下颌过杆后挤压背肌与肱二头肌一秒。",
      "控制下降至完全悬垂，重复规定次数。"
    ]
  },
  {
    "id": "mountain-climber",
    "name": "登山跑",
    "nameEn": "mountain climber lunge",
    "sourceId": "0629",
    "muscles": [
      "core",
      "quads"
    ],
    "equipment": "bodyweight",
    "difficulty": "beginner",
    "description": "俯撑姿势交替提膝至胸前。核心维持抗伸展的同时，髋屈肌与股四头肌快速交替工作，兼具核心稳定与心肺刺激。",
    "steps": [
      "俯撑姿势，双手位于肩部正下方，身体呈一条直线。",
      "核心收紧，双腿交替将膝盖快速拉向胸口。",
      "保持髋部高度稳定，不塌腰不撅臀。",
      "按时间或次数规定持续交替。"
    ]
  },
  {
    "id": "leg-extension",
    "name": "坐姿腿屈伸",
    "nameEn": "weighted leg extension crunch",
    "sourceId": "0836",
    "muscles": [
      "quads"
    ],
    "equipment": "machine",
    "difficulty": "beginner",
    "description": "坐姿伸膝将负重垫上举。孤立刺激股四头肌（尤其股直肌），是膝关节伸展力量的直接训练与腿型雕刻动作。",
    "steps": [
      "坐姿调节靠背使膝关节对准机器转轴，小腿前侧抵住负重垫。",
      "双手握座椅把手稳定躯干。",
      "以股四头肌发力伸膝上举至双腿近伸直，顶端挤压一秒。",
      "控制负重缓慢回落，不完全卸力。"
    ]
  },
  {
    "id": "single-leg-press",
    "name": "单腿腿举",
    "nameEn": "sled alternating single leg negative press",
    "sourceId": "10198",
    "muscles": [
      "quads",
      "glutes"
    ],
    "equipment": "machine",
    "difficulty": "beginner",
    "description": "单腿置于平台完成腿举。消除双侧优势补偿，用于矫正左右腿力量不平衡及大负荷单侧安全训练。",
    "steps": [
      "坐姿单脚置于平台中部，另一腿悬空。",
      "屈膝下降至膝约 90°，腰臀贴紧靠垫。",
      "以单腿蹬起至近伸直，不锁膝。",
      "控制缓慢回落，完成后换边。"
    ]
  },
  {
    "id": "hip-thrust",
    "name": "杠铃臀推",
    "nameEn": "barbell hip thrust",
    "sourceId": "1060",
    "muscles": [
      "glutes",
      "hamstrings"
    ],
    "equipment": "barbell",
    "difficulty": "intermediate",
    "description": "肩胛倚靠长凳，将杠铃置于髋部完成髋关节伸展。臀大肌在缩短位直接对抗负荷，是当前发展臀肌峰值张力最有效的动作之一。",
    "steps": [
      "肩胛上背倚靠凳沿，杠铃加垫置于髋部，双脚踩实地面。",
      "下巴微收，核心收紧。",
      "以臀肌发力伸髋将杠铃顶起至躯干与地面平行，膝髋踝约 90°。",
      "顶端臀部完全收紧一秒，控制杠铃下放但臀部不完全落地。"
    ]
  },
  {
    "id": "machine-chest-press",
    "name": "坐姿推胸器",
    "nameEn": "machine inner chest press",
    "sourceId": "1301",
    "muscles": [
      "chest",
      "triceps",
      "shoulders"
    ],
    "equipment": "machine",
    "difficulty": "beginner",
    "description": "坐姿器械水平推举。固定运动轨迹降低了稳定要求，适合初学者建立动作模式或大重量冲击阶段的辅助训练，胸大肌受载均匀且安全。",
    "steps": [
      "调节座椅高度使手柄与胸部中线齐平，背部与臀部贴紧靠垫。",
      "双手正握手柄，与肩同宽或略宽。",
      "以胸肌发力将手柄向前推出至双臂近伸直，不锁肘。",
      "控制手柄缓慢回落至起始位，保持肩胛全程贴靠。"
    ]
  },
  {
    "id": "glute-bridge",
    "name": "臀桥",
    "nameEn": "barbell glute bridge",
    "sourceId": "1409",
    "muscles": [
      "glutes",
      "hamstrings"
    ],
    "equipment": "bodyweight",
    "difficulty": "beginner",
    "description": "仰卧屈膝伸髋抬起骨盆。低负荷激活臀大肌与核心稳定，常作为臀部训练的热身或居家基础动作。",
    "steps": [
      "仰卧屈膝，双脚与髋同宽踩实，双臂置于体侧。",
      "以臀肌发力伸髋抬起骨盆至肩膝呈一条直线。",
      "顶端臀部收紧一秒，避免腰椎超伸。",
      "控制骨盆缓慢下降至接近但不接触地面。"
    ]
  },
  {
    "id": "squat-jump",
    "name": "自重纵跳深蹲",
    "nameEn": "kneeling jump squat",
    "sourceId": "1420",
    "muscles": [
      "quads",
      "glutes",
      "calves"
    ],
    "equipment": "bodyweight",
    "difficulty": "intermediate",
    "description": "自蹲位爆发纵跳的增强式训练。发展下肢爆发功率与弹性力量，落地缓冲控制同样重要。",
    "steps": [
      "半蹲位准备，双臂后摆蓄力。",
      "爆发蹬地纵跳，空中身体完全伸展。",
      "前脚掌落地屈膝缓冲，衔接下一次。",
      "保持节奏与落地质量。"
    ]
  },
  {
    "id": "lunge",
    "name": "行走弓步蹲",
    "nameEn": "walking lunge",
    "sourceId": "1460",
    "muscles": [
      "quads",
      "glutes",
      "hamstrings"
    ],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "description": "持哑铃交替向前迈步完成单腿下蹲。单侧模式改善左右腿力量与稳定性不平衡，髋膝协同参与， Functional 价值高。",
    "steps": [
      "站立持哑铃于体侧，单腿前迈一大步。",
      "屈膝下沉至前膝约 90°、后膝接近地面，躯干保持直立。",
      "前腿发力蹬地并收回，换腿继续向前迈步。",
      "全程核心收紧，膝盖与脚尖同向。"
    ]
  },
  {
    "id": "squat",
    "name": "杠铃后蹲",
    "nameEn": "barbell full squat (back pov)",
    "sourceId": "1461",
    "muscles": [
      "quads",
      "glutes",
      "hamstrings",
      "core"
    ],
    "equipment": "barbell",
    "difficulty": "advanced",
    "description": "杠铃置于斜方肌上部，屈髋屈膝下蹲至大腿平行或更低后蹲起。下肢整体力量与核心刚性发展的核心动作，膝关节与髋关节协同主导。",
    "steps": [
      "杠铃置于斜方肌上部，双脚与肩同宽或略宽，脚尖略外展。",
      "深吸气绷紧核心，屈髋屈膝同步下蹲，膝盖与脚尖同向。",
      "下蹲至大腿与地面平行或更低，保持背部中立、重心位于足中。",
      "以臀腿协同发力沿原路径蹲起至髋膝完全伸展。"
    ]
  },
  {
    "id": "back-extension",
    "name": "山羊挺身",
    "nameEn": "barbell lying back of the head tricep extension",
    "sourceId": "1720",
    "muscles": [
      "lower-back",
      "glutes",
      "hamstrings"
    ],
    "equipment": "bodyweight",
    "difficulty": "beginner",
    "description": "罗马凳上以髋为轴完成躯干的屈伸。主要强化竖脊肌的耐力与控制，协同臀肌与腘绳肌参与髋关节伸展。",
    "steps": [
      "髋部贴于罗马凳垫，双脚固定，躯干自然下垂。",
      "双手交叉于胸前，核心收紧。",
      "以臀肌与竖脊肌发力将躯干抬起至与身体呈一条直线，不过度超伸。",
      "控制躯干缓慢下降回起始位。"
    ]
  },
  {
    "id": "bulgarian-split-squat",
    "name": "保加利亚分腿蹲",
    "nameEn": "dumbbell bulgarian split squat",
    "sourceId": "2290",
    "muscles": [
      "quads",
      "glutes"
    ],
    "equipment": "dumbbell",
    "difficulty": "intermediate",
    "description": "后脚垫高完成单腿下蹲。极大的单侧负荷与平衡要求，重点发展股四头肌与臀肌，同时暴露并矫正单侧力量不足。",
    "steps": [
      "后脚背置于凳上，前腿向前跨出约一步半距离。",
      "持哑铃于体侧，躯干微前倾，核心收紧。",
      "垂直下沉至前膝约 90°、后膝接近地面。",
      "前腿发力蹲起至近伸直，重复后换边。"
    ]
  },
  {
    "id": "leg-press",
    "name": "倒蹬机腿举",
    "nameEn": "barbell leg twist press",
    "sourceId": "2811",
    "muscles": [
      "quads",
      "glutes",
      "hamstrings"
    ],
    "equipment": "machine",
    "difficulty": "beginner",
    "description": "坐姿蹬起负重平台。躯干有靠背支撑、轨迹固定，可安全使用大负荷发展股四头肌与臀肌，是蹲类动作的高效辅助。",
    "steps": [
      "坐姿背部臀部贴紧靠垫，双脚与肩同宽置于平台中部。",
      "解锁安全销，屈膝使平台下降至膝约 90°。",
      "以全脚掌发力蹬起平台至双腿近伸直，不锁膝。",
      "控制平台缓慢回落，保持腰臀部全程贴靠。"
    ]
  },
  {
    "id": "lying-leg-curl",
    "name": "俯卧腿弯举",
    "nameEn": "lying double legs biceps curl with towel",
    "sourceId": "3752",
    "muscles": [
      "hamstrings"
    ],
    "equipment": "machine",
    "difficulty": "beginner",
    "description": "俯卧屈膝将负重垫向臀部卷起。孤立刺激腘绳肌（膝屈曲功能），与伸膝类动作互补，平衡大腿前后侧发展。",
    "steps": [
      "俯卧于器械，脚后跟抵住负重垫，双手握把手固定躯干。",
      "屈膝将负重垫向臀部卷起，臀部不抬起。",
      "顶端挤压腘绳肌一秒。",
      "控制负重缓慢回落至双腿近伸直。"
    ]
  },
  {
    "id": "db-shoulder-press",
    "name": "哑铃坐姿推举",
    "nameEn": "dumbbell face down lying shoulder press",
    "sourceId": "4125",
    "muscles": [
      "shoulders",
      "triceps"
    ],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "description": "坐姿持哑铃自肩侧推举至头顶。哑铃的独立运动允许更自然的肩胛节律与更大活动范围，对三角肌前束、中束及肱三头肌均衡刺激。",
    "steps": [
      "坐姿背部贴靠，双手持哑铃于肩侧，掌心朝前。",
      "核心收紧，避免腰椎超伸。",
      "垂直向上推起哑铃至双臂近伸直，顶端轻靠拢。",
      "控制哑铃回落至肩侧起始位。"
    ]
  },
  {
    "id": "face-pull",
    "name": "绳索面拉",
    "nameEn": "cable lying face pull",
    "sourceId": "7591",
    "muscles": [
      "shoulders",
      "back"
    ],
    "equipment": "cable",
    "difficulty": "beginner",
    "description": "面向高位滑轮将绳索拉向面部并外旋肩关节。强化三角肌后束与肩袖外旋肌群，是改善圆肩体态与肩部健康的重要补充动作。",
    "steps": [
      "调整滑轮至眼部高度，双手正握绳索两端，后退建立张力。",
      "将绳索拉向面部两侧，肘部外展高于手腕，肩胛后缩。",
      "顶端外旋挤压肩后束与肩袖一秒。",
      "控制绳索缓慢回放至双臂完全伸展。"
    ]
  },
  {
    "id": "chest-supported-row",
    "name": "上斜凳俯身划船",
    "nameEn": "dumbbell chest supported row",
    "sourceId": "9698",
    "muscles": [
      "back",
      "biceps"
    ],
    "equipment": "dumbbell",
    "difficulty": "beginner",
    "description": "俯卧于上斜凳完成划船。躯干完全由凳面支撑，下背与借力被排除，背阔肌与斜方肌中部在严格形态下受载。",
    "steps": [
      "俯卧于上斜凳（30°–45°），双手持哑铃自然下垂。",
      "以背肌发力将哑铃拉向髋部两侧，肘部贴近躯干。",
      "顶端挤压肩胛一秒。",
      "控制哑铃缓慢下放至完全伸展。"
    ]
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
  { id: 'core', name: '核心' },
  { id: 'forearms', name: '前臂' },
  { id: 'traps', name: '斜方肌' },
  { id: 'lower-back', name: '下背' }
];

export var STARTER_PLANS = {
  pushPullLegs: { name: '推拉腿 六日', weekdayCount: 6 },
  upperLower:   { name: '上下肢 四日', weekdayCount: 4 },
  fullBody:     { name: '全身 三日', weekdayCount: 3 },
  fiveByFive:   { name: '5×5 力量', weekdayCount: 3 }
};
