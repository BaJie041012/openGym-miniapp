package main

// ─── 好友码管理处理器 ────────────────────────────────────────────────────────
//   /api/players                    GET  列出玩家账号 / POST 创建玩家账号
//   /api/players/:playerId          DELETE 删除玩家账号
//   /api/players/:playerId/codes    GET  列出好友码 / POST 批量添加 / DELETE 删除单条
//   /api/claim                      POST 获取随机好友码

import (
	"log"
	"net/http"
	"strings"
	"time"
)

// handlePlayersRouter /api/players/* 统一分发
func (s *backendServer) handlePlayersRouter(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/players")
	path = strings.TrimPrefix(path, "/")
	path = strings.TrimSuffix(path, "/")

	parts := []string{}
	if path != "" {
		for _, p := range strings.Split(path, "/") {
			if p != "" {
				parts = append(parts, p)
			}
		}
	}

	switch {
	// /api/players (无后缀)
	case len(parts) == 0:
		s.handlePlayers(w, r)
	// /api/players/:playerId
	case len(parts) == 1:
		s.handlePlayerDelete(w, r, parts[0])
	// /api/players/:playerId/codes
	case len(parts) == 2 && parts[1] == "codes":
		s.handleCodes(w, r, parts[0])
	default:
		writeFail(w, ErrParam, "路径错误")
	}
}

// ─── 玩家账号管理 ────────────────────────────────────────────────────────────

type createPlayerRequest struct {
	PlayerID string `json:"playerId"`
	Nickname string `json:"nickname"`
}

// handlePlayers GET/POST /api/players
func (s *backendServer) handlePlayers(w http.ResponseWriter, r *http.Request) {
	identity, ok := identityFromContext(r.Context())
	if !ok {
		writeFail(w, ErrUnauthorized, "请先登录")
		return
	}
	if !s.store.available() {
		writeFail(w, ErrDB, "数据库未连接")
		return
	}

	switch r.Method {
	case http.MethodGet:
		items, err := s.store.listPlayers(r.Context(), identity.OpenID)
		if err != nil {
			writeFail(w, ErrInternal, "查询失败")
			return
		}
		writeOK(w, items)

	case http.MethodPost:
		var body createPlayerRequest
		if err := decodeJSONBody(r, &body); err != nil {
			writeFail(w, ErrParam, "参数错误")
			return
		}
		playerID := strings.TrimSpace(body.PlayerID)
		if !IsValidPlayerID(playerID) {
			writeFail(w, ErrParam, "玩家账号必须是1-20位纯数字")
			return
		}
		now := time.Now().UnixMilli()
		doc, err := s.store.createPlayer(r.Context(), identity.OpenID, playerID, strings.TrimSpace(body.Nickname), now)
		if err != nil {
			writeFail(w, ErrParam, "该玩家账号已存在")
			return
		}
		writeOK(w, doc)

	default:
		writeFail(w, ErrParam, "method not allowed")
	}
}

// handlePlayerDelete DELETE /api/players/:playerId
func (s *backendServer) handlePlayerDelete(w http.ResponseWriter, r *http.Request, playerID string) {
	identity, ok := identityFromContext(r.Context())
	if !ok {
		writeFail(w, ErrUnauthorized, "请先登录")
		return
	}
	if r.Method != http.MethodDelete {
		writeFail(w, ErrParam, "method not allowed")
		return
	}
	if !s.store.available() {
		writeFail(w, ErrDB, "数据库未连接")
		return
	}
	playerID = strings.TrimSpace(playerID)
	if !IsValidPlayerID(playerID) {
		writeFail(w, ErrParam, "玩家账号格式错误")
		return
	}
	if err := s.store.deletePlayer(r.Context(), identity.OpenID, playerID); err != nil {
		writeFail(w, ErrInternal, "删除失败")
		return
	}
	writeOK(w, map[string]string{"ok": "deleted"})
}

// ─── 好友码管理 ──────────────────────────────────────────────────────────────

type addCodesRequest struct {
	Codes []string `json:"codes"`
}

// handleCodes GET/POST/DELETE /api/players/:playerId/codes
func (s *backendServer) handleCodes(w http.ResponseWriter, r *http.Request, playerID string) {
	identity, ok := identityFromContext(r.Context())
	if !ok {
		writeFail(w, ErrUnauthorized, "请先登录")
		return
	}
	if !s.store.available() {
		writeFail(w, ErrDB, "数据库未连接")
		return
	}
	playerID = strings.TrimSpace(playerID)
	if !IsValidPlayerID(playerID) {
		writeFail(w, ErrParam, "玩家账号格式错误")
		return
	}

	switch r.Method {
	case http.MethodGet:
		items, err := s.store.listCodes(r.Context(), identity.OpenID, playerID)
		if err != nil {
			writeFail(w, ErrInternal, "查询失败")
			return
		}
		writeOK(w, items)

	case http.MethodPost:
		var body addCodesRequest
		if err := decodeJSONBody(r, &body); err != nil {
			writeFail(w, ErrParam, "参数错误")
			return
		}
		seen := map[string]bool{}
		var clean []string
		for _, c := range body.Codes {
			c = strings.TrimSpace(c)
			if c == "" || seen[c] {
				continue
			}
			seen[c] = true
			clean = append(clean, c)
		}
		log.Printf("[addCodes] openId=%s playerId=%s raw=%d clean=%d", identity.OpenID, playerID, len(body.Codes), len(clean))
		if len(clean) == 0 {
			writeFail(w, ErrParam, "请输入好友码")
			return
		}
		now := time.Now().UnixMilli()
		n, err := s.store.addCodes(r.Context(), identity.OpenID, playerID, clean, now)
		if err != nil {
			writeFail(w, ErrInternal, "添加失败")
			return
		}
		log.Printf("[addCodes] 结果 inserted=%d total=%d", n, len(clean))
		writeOK(w, map[string]int{"inserted": n, "total": len(clean)})

	case http.MethodDelete:
		code := strings.TrimSpace(r.URL.Query().Get("code"))
		if code == "" {
			writeFail(w, ErrParam, "缺少 code 参数")
			return
		}
		if err := s.store.deleteCode(r.Context(), identity.OpenID, code); err != nil {
			writeFail(w, ErrInternal, "删除失败")
			return
		}
		writeOK(w, map[string]string{"ok": "deleted"})

	default:
		writeFail(w, ErrParam, "method not allowed")
	}
}

// ─── 获取好友码 ──────────────────────────────────────────────────────────────

// handleClaim POST /api/claim — 随机获取一条满足约束 A+B 的好友码
func (s *backendServer) handleClaim(w http.ResponseWriter, r *http.Request) {
	identity, ok := identityFromContext(r.Context())
	if !ok {
		writeFail(w, ErrUnauthorized, "请先登录")
		return
	}
	if r.Method != http.MethodPost {
		writeFail(w, ErrParam, "method not allowed")
		return
	}
	if !s.store.available() {
		writeFail(w, ErrDB, "数据库未连接")
		return
	}

	now := time.Now().UnixMilli()
	result, err := s.store.claimOne(r.Context(), identity.OpenID, now)
	if err != nil {
		writeFail(w, ErrInternal, "获取失败")
		return
	}
	if result == nil {
		writeFail(w, ErrNotFound, "暂无可获取的好友码")
		return
	}
	writeOK(w, map[string]string{
		"code":     result.Code,
		"playerId": result.PlayerID,
	})
}
