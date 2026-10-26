package main

// ─── 训练记录处理器 ───────────────────────────────────────────────────────────
// GET  /api/history?since=<ms>&limit=100 — 增量拉取（updatedAt > since），startedAt 倒序。
// POST /api/history — 批量 upsert（≤100 条/次），(openId, recordId) 幂等，last-write-wins。
// 身份一律取自已校验会话；recordId/时间戳做基础校验，防止垃圾数据入库。

import (
	"net/http"
	"strconv"
	"strings"
	"time"
)

// historyListPayload 是 GET 响应的 data 载荷。
type historyListPayload struct {
	Items      []HistoryDoc `json:"items"`
	ServerTime int64        `json:"serverTime"`
	HasMore    bool         `json:"hasMore"`
}

// handleHistory：GET 增量拉取 / POST 批量同步（同一路由按方法分派）。
func (s *backendServer) handleHistory(w http.ResponseWriter, r *http.Request) {
	identity, ok := identityFromContext(r.Context())
	if !ok || identity == nil {
		writeFail(w, ErrUnauthorized, "请先登录")
		return
	}

	switch r.Method {
	case http.MethodGet:
		s.listUserHistory(w, r, identity)
	case http.MethodPost:
		s.pushHistory(w, r, identity)
	default:
		writeFail(w, ErrParam, "method not allowed")
	}
}

// listUserHistory：GET — since 增量 + limit 截断。
func (s *backendServer) listUserHistory(w http.ResponseWriter, r *http.Request, identity *Identity) {
	if s == nil || !s.store.available() {
		writeFail(w, ErrDB, "数据库未连接")
		return
	}
	query := r.URL.Query()
	since, _ := strconv.ParseInt(query.Get("since"), 10, 64)
	limit, _ := strconv.Atoi(query.Get("limit"))
	if limit < 1 || limit > 200 {
		limit = 100
	}

	items, err := s.store.listHistory(r.Context(), identity.OpenID, since, limit)
	if err != nil {
		writeFail(w, ErrInternal, "读取记录失败")
		return
	}
	hasMore := false
	if len(items) == limit {
		hasMore = true
	}
	writeOK(w, historyListPayload{Items: items, ServerTime: time.Now().UnixMilli(), HasMore: hasMore})
}

// historyPushRequest 是 POST 的请求体。
type historyPushRequest struct {
	Records []HistoryDoc `json:"records"`
}

// pushHistory：POST — 批量 upsert。校验：recordId 非空且 ≤64 字符、日期格式、
// exercises ≤ 30 个动作、sets ≤ 20 组、records ≤ 100 条。
func (s *backendServer) pushHistory(w http.ResponseWriter, r *http.Request, identity *Identity) {
	if s == nil || !s.store.available() {
		writeFail(w, ErrDB, "数据库未连接")
		return
	}
	var body historyPushRequest
	if err := decodeJSONBody(r, &body); err != nil {
		writeFail(w, ErrParam, "请求体格式错误")
		return
	}
	if len(body.Records) == 0 {
		writeFail(w, ErrParam, "records 不能为空")
		return
	}
	if len(body.Records) > 100 {
		writeFail(w, ErrParam, "单次同步记录过多（上限 100）")
		return
	}

	now := time.Now().UnixMilli()
	records := make([]HistoryDoc, 0, len(body.Records))
	for _, rec := range body.Records {
		rec.RecordID = strings.TrimSpace(rec.RecordID)
		if rec.RecordID == "" || len(rec.RecordID) > 64 || strings.ContainsAny(rec.RecordID, ".$ ") {
			writeFail(w, ErrParam, "recordId 非法")
			return
		}
		if !isValidDate(rec.Date) {
			writeFail(w, ErrParam, "date 必须是 YYYY-MM-DD")
			return
		}
		if len(rec.Exercises) > 30 {
			writeFail(w, ErrParam, "单条记录动作过多（上限 30）")
			return
		}
		for i := range rec.Exercises {
			ex := &rec.Exercises[i]
			ex.Name = strings.TrimSpace(ex.Name)
			if len(ex.Sets) > 20 {
				ex.Sets = ex.Sets[:20]
			}
		}
		records = append(records, rec)
	}

	accepted, err := s.store.upsertHistory(r.Context(), identity.OpenID, records, now)
	if err != nil {
		writeFail(w, ErrInternal, "同步记录失败")
		return
	}
	writeOK(w, map[string]interface{}{
		"accepted":   accepted,
		"serverTime": now,
	})
}

// isValidDate 校验 YYYY-MM-DD 格式（宽松校验：长度 + 分段数字）。
func isValidDate(s string) bool {
	if len(s) != 10 || s[4] != '-' || s[7] != '-' {
		return false
	}
	for _, idx := range []int{0, 1, 2, 3, 5, 6, 8, 9} {
		if s[idx] < '0' || s[idx] > '9' {
			return false
		}
	}
	return true
}
