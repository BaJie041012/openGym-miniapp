package main

// ─── 动作库处理器 ─────────────────────────────────────────────────────────────
// GET /api/exercises — 公开只读。分页 + 关键词（中英文名）+ target/equipment 过滤。
// 契约：?page=1&size=20&q=卧推&muscle=abs&equipment=barbell
//   → {code:0,data:{total,page,size,items:[ExerciseDoc...]}}
// 未 seed 时 items 为空数组（前端回退本地精选集），不算错误。

import (
	"net/http"
	"strconv"
)

// handleExercises：GET /api/exercises — 公开分页查询。
func (s *backendServer) handleExercises(w http.ResponseWriter, r *http.Request) {
	if !methodIsRead(r) {
		writeFail(w, ErrParam, "method not allowed")
		return
	}
	if s == nil || !s.store.available() {
		writeFail(w, ErrDB, "数据库未连接")
		return
	}
	query := r.URL.Query()

	page, _ := strconv.Atoi(query.Get("page"))
	size, _ := strconv.Atoi(query.Get("size"))
	if page < 1 {
		page = 1
	}
	if size < 1 {
		size = 20
	}
	if size > 50 {
		size = 50
	}

	total, items, err := s.store.listExercises(r.Context(), exerciseQuery{
		Keyword:   query.Get("q"),
		Muscle:    query.Get("muscle"),
		Equipment: query.Get("equipment"),
		Page:      page,
		Size:      size,
	})
	if err != nil {
		writeFail(w, ErrInternal, "查询失败")
		return
	}
	if items == nil {
		items = []ExerciseDoc{}
	}
	writeOK(w, map[string]interface{}{
		"total": total,
		"page":  page,
		"size":  size,
		"items": items,
	})
}
