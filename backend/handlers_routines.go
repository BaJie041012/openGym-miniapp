package main

// ─── 周计划处理器 ─────────────────────────────────────────────────────────────
// GET /api/routines — 读整周计划；文档不存在返回空壳（days 全空数组）。
// PUT /api/routines — body {day, plans:[{exerciseId,name,sets,reps}]}，单日局部合并。
//   days.<day> 用 $set 局部合并（绝不整档覆盖，多设备不互相清空）。
// 身份一律取自已校验会话（identityFromContext），绝不信任前端 body 直传 openId。

import (
	"net/http"
	"strings"
	"time"
)

// routinePayload 是 GET 响应的 data 载荷；空计划时 days 各键为空数组。
type routinePayload struct {
	Days      map[string][]RoutineDayPlan `json:"days"`
	UpdatedAt int64                       `json:"updatedAt"`
}

// emptyDays 构造全空周计划。
func emptyDays() map[string][]RoutineDayPlan {
	days := make(map[string][]RoutineDayPlan, len(validDayKeys))
	for day := range validDayKeys {
		days[day] = []RoutineDayPlan{}
	}
	return days
}

// handleRoutines：GET 读取 / PUT 单日合并（同一路由按方法分派）。
func (s *backendServer) handleRoutines(w http.ResponseWriter, r *http.Request) {
	identity, ok := identityFromContext(r.Context())
	if !ok || identity == nil {
		writeFail(w, ErrUnauthorized, "请先登录")
		return
	}

	switch r.Method {
	case http.MethodGet:
		s.readRoutine(w, r, identity)
	case http.MethodPut:
		s.mergeRoutine(w, r, identity)
	default:
		writeFail(w, ErrParam, "method not allowed")
	}
}

// readRoutine：GET — 返回整周计划；无文档返回空壳。
func (s *backendServer) readRoutine(w http.ResponseWriter, r *http.Request, identity *Identity) {
	if s == nil || !s.store.available() {
		writeFail(w, ErrDB, "数据库未连接")
		return
	}
	doc, err := s.store.getRoutine(r.Context(), identity.OpenID)
	if err != nil {
		writeFail(w, ErrInternal, "读取计划失败")
		return
	}
	days := emptyDays()
	var updatedAt int64
	if doc != nil && doc.Days != nil {
		for day, plans := range doc.Days {
			if validDayKeys[day] {
				if plans == nil {
					plans = []RoutineDayPlan{}
				}
				days[day] = plans
			}
		}
		updatedAt = doc.UpdatedAt
	}
	writeOK(w, routinePayload{Days: days, UpdatedAt: updatedAt})
}

// routinePutRequest 是 PUT 的请求体（字段集固定）。
type routinePutRequest struct {
	Day   string            `json:"day"`
	Plans []RoutineDayPlan `json:"plans"`
}

// mergeRoutine：PUT — 校验 day 键与条目规模后局部合并。
// 上限：单日 ≤ 20 个动作条目（防滥用）。
func (s *backendServer) mergeRoutine(w http.ResponseWriter, r *http.Request, identity *Identity) {
	if s == nil || !s.store.available() {
		writeFail(w, ErrDB, "数据库未连接")
		return
	}
	var body routinePutRequest
	if err := decodeJSONBody(r, &body); err != nil {
		writeFail(w, ErrParam, "请求体格式错误")
		return
	}
	day := strings.ToLower(strings.TrimSpace(body.Day))
	if !validDayKeys[day] {
		writeFail(w, ErrParam, "day 必须是 monday..sunday")
		return
	}
	if len(body.Plans) > 20 {
		writeFail(w, ErrParam, "单日动作条目过多（上限 20）")
		return
	}
	// 规整：清空 plans 时统一为空数组；条目字段做基础清洗。
	plans := make([]RoutineDayPlan, 0, len(body.Plans))
	for _, p := range body.Plans {
		p.ExerciseID = strings.TrimSpace(p.ExerciseID)
		p.Name = strings.TrimSpace(p.Name)
		p.Reps = strings.TrimSpace(p.Reps)
		if p.ExerciseID == "" || p.Name == "" {
			writeFail(w, ErrParam, "动作条目缺少 exerciseId 或 name")
			return
		}
		if p.Sets < 0 {
			p.Sets = 0
		}
		if p.Sets == 0 {
			p.Sets = 3
		}
		if len(p.Reps) > 32 || len(p.Name) > 64 {
			writeFail(w, ErrParam, "动作条目字段超长")
			return
		}
		plans = append(plans, p)
	}

	now := time.Now().UnixMilli()
	if err := s.store.mergeRoutineDay(r.Context(), identity.OpenID, identity.Nickname, day, plans, now); err != nil {
		writeFail(w, ErrInternal, "保存计划失败")
		return
	}
	writeOK(w, map[string]interface{}{"day": day, "count": len(plans), "updatedAt": now})
}
