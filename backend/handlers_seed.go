package main

// ─── 动作库灌库端点（管理员专用）─────────────────────────────────────────────
// POST /api/admin/seed — 批量 upsert 动作条目（Mongo 公网不可达，数据由本机脚本经 HTTP 推入）。
// 鉴权：x-seed-key 头 = hex(HMAC-SHA256(appSecret, "openGym/seed/v1"))，常量时间比对；
//      无 appSecret（未配置）时端点直接 50301。
// body: {items:[ExerciseDoc]}，单批 ≤ 1MB（decodeJSONBody 上限），按 exerciseId 幂等 upsert。

import (
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"net/http"
)

// seedDomainSeparator 是灌库密钥派生的域分隔串。
const seedDomainSeparator = "openGym/seed/v1"

// seedRequest 是 POST /api/admin/seed 的请求体。
type seedRequest struct {
	Items []ExerciseDoc `json:"items"`
}

// seedKey 校验 x-seed-key 头；未配置 appSecret 时返回 false 并已写响应。
func (s *backendServer) seedKeyOK(w http.ResponseWriter, r *http.Request) bool {
	if s == nil || s.config.AppSecret == "" {
		writeFail(w, ErrDB, "灌库服务未配置")
		return false
	}
	mac := hmac.New(sha256.New, []byte(s.config.AppSecret))
	_, _ = mac.Write([]byte(seedDomainSeparator))
	expected := hex.EncodeToString(mac.Sum(nil))
	got := r.Header.Get("x-seed-key")
	if got == "" || subtle.ConstantTimeCompare([]byte(got), []byte(expected)) != 1 {
		writeFail(w, ErrUnauthorized, "灌库密钥无效")
		return false
	}
	return true
}

// handleSeed：POST /api/admin/seed — 批量 upsert 动作条目。
func (s *backendServer) handleSeed(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeFail(w, ErrParam, "method not allowed")
		return
	}
	if !s.seedKeyOK(w, r) {
		return
	}
	if s == nil || !s.store.available() {
		writeFail(w, ErrDB, "数据库未连接")
		return
	}
	var body seedRequest
	if err := decodeJSONBody(r, &body); err != nil {
		writeFail(w, ErrParam, "请求体格式错误")
		return
	}
	if len(body.Items) == 0 {
		writeFail(w, ErrParam, "items 不能为空")
		return
	}
	if len(body.Items) > 500 {
		writeFail(w, ErrParam, "单批条目过多（上限 500）")
		return
	}
	// 基础清洗：exerciseId/name 必填且限长
	docs := make([]ExerciseDoc, 0, len(body.Items))
	for _, it := range body.Items {
		if exID := trimField(it.ExerciseID, 32); exID == "" {
			writeFail(w, ErrParam, "条目缺少 exerciseId")
			return
		} else {
			it.ExerciseID = exID
		}
		if name := trimField(it.Name, 160); name == "" {
			writeFail(w, ErrParam, "条目缺少 name")
			return
		} else {
			it.Name = name
		}
		it.NameZh = trimField(it.NameZh, 64)
		it.DescriptionZh = trimField(it.DescriptionZh, 2000)
		if len(it.InstructionsZh) > 12 {
			it.InstructionsZh = it.InstructionsZh[:12]
		}
		docs = append(docs, it)
	}
	accepted, err := s.store.upsertExercises(r.Context(), docs)
	if err != nil {
		writeFail(w, ErrInternal, "写入失败")
		return
	}
	writeOK(w, map[string]interface{}{"accepted": accepted})
}

// trimField 去空白并限制长度；超长返回截断值（exerciseId/name 空值由调用方判空）。
func trimField(v string, max int) string {
	out := ""
	for _, r := range v {
		if r != ' ' && r != '\t' || out != "" {
			out += string(r)
		}
		if len(out) > max {
			break
		}
	}
	// 简单去首尾空白
	for len(out) > 0 && (out[0] == ' ' || out[0] == '\t') {
		out = out[1:]
	}
	for len(out) > 0 && (out[len(out)-1] == ' ' || out[len(out)-1] == '\t') {
		out = out[:len(out)-1]
	}
	if len(out) > max {
		out = out[:max]
	}
	return out
}
