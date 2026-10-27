package main

// ─── openGym 数据模型 ─────────────────────────────────────────────────────────
// 三个集合（与根 qdmp-schema.json 对齐）：
//   exercises — 动作库全量（6554 条，全用户共享只读，seed 脚本灌入）
//   routines  — 每用户一文档的周计划（days 键 monday..sunday，单日局部合并）
//   history   — 每用户多条训练记录（recordId 幂等 upsert，last-write-wins）

// RoutineDayPlan 是某一天计划里的单个动作条目。
type RoutineDayPlan struct {
	ExerciseID string `json:"exerciseId"`
	Name       string `json:"name"`
	Sets       int    `json:"sets"`
	Reps       string `json:"reps"` // 如 "8-12"、"5×5"
}

// RoutineDoc 是每用户一文档的周计划。Days 的键为 monday..sunday（全小写）。
type RoutineDoc struct {
	OpenID    string                      `json:"openId"    bson:"openId"`
	Days      map[string][]RoutineDayPlan `json:"days"      bson:"days"`
	UpdatedAt int64                       `json:"updatedAt" bson:"updatedAt"`
	CreatedAt int64                       `json:"createdAt" bson:"createdAt"`
}

// HistorySet 是单个正式组的记录。
type HistorySet struct {
	Weight float64 `json:"weight"`
	Reps   int     `json:"reps"`
}

// HistoryExercise 是训练记录里的单个动作。
type HistoryExercise struct {
	ExerciseID string       `json:"exerciseId"`
	Name       string       `json:"name"`
	Sets       []HistorySet `json:"sets"`
}

// HistoryDoc 是一条完整训练记录。RecordID 由前端生成（时间戳基），幂等 upsert。
type HistoryDoc struct {
	OpenID    string            `json:"openId"    bson:"openId"`
	RecordID  string            `json:"recordId"  bson:"recordId"`
	Date      string            `json:"date"      bson:"date"`      // YYYY-MM-DD
	StartedAt int64             `json:"startedAt" bson:"startedAt"` // 毫秒时间戳
	EndedAt   int64             `json:"endedAt"   bson:"endedAt"`
	Exercises []HistoryExercise `json:"exercises" bson:"exercises"`
	Volume    float64           `json:"volume"    bson:"volume"`
	UpdatedAt int64             `json:"updatedAt" bson:"updatedAt"`
	CreatedAt int64             `json:"createdAt" bson:"createdAt"`
}

// ExerciseDoc 是动作库条目。中文字段（NameZh/DescriptionZh/InstructionsZh）仅精选条目有值。
type ExerciseDoc struct {
	ExerciseID       string   `json:"exerciseId"       bson:"exerciseId"`
	Name             string   `json:"name"             bson:"name"`
	NameZh           string   `json:"nameZh"           bson:"nameZh"`
	BodyPart         string   `json:"bodyPart"         bson:"bodyPart"`
	Equipment        string   `json:"equipment"        bson:"equipment"`
	Target           string   `json:"target"           bson:"target"`
	SecondaryMuscles []string `json:"secondaryMuscles" bson:"secondaryMuscles"`
	Category         string   `json:"category"         bson:"category"`
	Description      string   `json:"description"      bson:"description"`
	DescriptionZh    string   `json:"descriptionZh"    bson:"descriptionZh"`
	Instructions     []string `json:"instructions"     bson:"instructions"`
	InstructionsZh   []string `json:"instructionsZh"   bson:"instructionsZh"`
	Difficulty       string   `json:"difficulty"       bson:"difficulty"`
	TextSource       string   `json:"textSource"       bson:"textSource"`
}

// validDayKeys 是周计划允许的天键集合。
var validDayKeys = map[string]bool{
	"monday": true, "tuesday": true, "wednesday": true, "thursday": true,
	"friday": true, "saturday": true, "sunday": true,
}
