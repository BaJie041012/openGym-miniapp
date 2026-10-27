package main

// ─── 认证与健康检查处理器 ─────────────────────────────────────────────────────
// 对外契约（前后端逐字一致）：
//   GET  /health            健康检查 → 200 {code:0,data:{ok:true}}
//   POST /api/auth/login    公开端点：{code} → {code:0,data:{session,expiresAt,user:{openId,nickname}}}
//
// 挂载说明：main.go 的 registerRoutes 只登记裸 handler；登录限流仅内联挂在 handleLogin
// （绝不全局挂载），健康检查保持完全公开。
//
// 安全约束：上游 accessToken/refreshToken 只在 QiandaoAuthClient 内部使用，绝不返回、绝不落日志；
// 登录失败对外只给固定安全文案，内部原因仅写服务端日志（且不含 code/密钥/token）。

import (
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"
)

// loginRequest 是 POST /api/auth/login 的请求体。
type loginRequest struct {
	Code string `json:"code"`
}

// loginResponse 是登录成功时的 data 载荷。
// expiresAt 是毫秒时间戳数字（前端 toTimestamp 直接可用），不是 RFC3339 字符串。
type loginResponse struct {
	Session   string        `json:"session"`
	ExpiresAt int64         `json:"expiresAt"`
	User      loginUserInfo `json:"user"`
}

// loginUserInfo 是对外暴露的最小身份集（openId / nickname）。
type loginUserInfo struct {
	OpenID   string `json:"openId"`
	Nickname string `json:"nickname"`
}

// handleHealth：GET /health — 公开健康检查，恒定返回 {ok:true}。
// 数据库处于降级模式时依然返回 200（业务端点自会回 50301 降级壳），
// 这样编排平台的存活探针不会因为一次数据库抖动而重启容器。
func (s *backendServer) handleHealth(w http.ResponseWriter, r *http.Request) {
	if !methodIsRead(r) {
		writeFail(w, ErrParam, "method not allowed")
		return
	}
	if s != nil && !s.store.available() {
		log.Printf("[health] degraded: database not connected")
	}
	writeOK(w, map[string]interface{}{"ok": true})
}

// handleLogin：POST /api/auth/login — {code} → {session, expiresAt, user}。
// 顺序：限流 → 方法 → 参数 → 认证客户端可用性 → 会话编解码器可用性 → 换取身份 → 签发。
func (s *backendServer) handleLogin(w http.ResponseWriter, r *http.Request) {
	if s == nil {
		writeFail(w, ErrDB, "认证服务未配置")
		return
	}
	if r.Method != http.MethodPost {
		writeFail(w, ErrParam, "method not allowed")
		return
	}

	// 限流前置：在读 body 之前就拦截，避免被刷时反复解析请求体。
	clientIP := s.clientAddress(r)
	if !s.rateLimiter.Allow(clientIP) {
		w.Header().Set("Retry-After", strconv.Itoa(s.rateLimiter.retryAfter()))
		log.Printf("[auth] login rate limited")
		writeFail(w, ErrRateLimit, "请求太频繁，请稍后重试")
		return
	}

	var body loginRequest
	if err := decodeJSONBody(r, &body); err != nil {
		writeFail(w, ErrParam, "code is required")
		return
	}
	code := strings.TrimSpace(body.Code)
	if code == "" {
		writeFail(w, ErrParam, "code is required")
		return
	}
	if len(code) > maxLoginCodeLength {
		writeFail(w, ErrParam, "code format invalid")
		return
	}
	if s.authClient == nil {
		writeFail(w, ErrDB, "认证服务未配置")
		return
	}
	if !s.codec.usable() {
		writeFail(w, ErrDB, "会话服务未配置")
		return
	}

	identity, err := s.authClient.Exchange(r.Context(), code)
	if err != nil {
		s.writeLoginFailure(w, err)
		return
	}

	token, expiresAt, err := s.codec.Sign(identity.OpenID, identity.Nickname)
	if err != nil {
		log.Printf("[auth] sign session failed")
		writeFail(w, ErrDB, "会话服务未配置")
		return
	}
	writeOK(w, loginResponse{
		Session:   token,
		ExpiresAt: expiresAt,
		User: loginUserInfo{
			OpenID:   identity.OpenID,
			Nickname: identity.Nickname,
		},
	})
}

// writeLoginFailure 把换取身份阶段的内部错误映射为对外错误码。
// 一律不透传上游细节；原始原因仅以不含机密的形式写服务端日志。
func (s *backendServer) writeLoginFailure(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, errLoginCodeInvalid):
		writeFail(w, ErrParam, "code format invalid")
	case errors.Is(err, errAuthUnconfigured):
		writeFail(w, ErrDB, "认证服务未配置")
	case errors.Is(err, errSessionUnconfigured):
		writeFail(w, ErrDB, "会话服务未配置")
	default:
		// 仅记录错误类别，绝不记录 code / appSecret / accessToken 等敏感材料。
		log.Printf("[auth] login exchange failed: %v", err)
		writeFail(w, ErrUnauthorized, "登录失败，请重试")
	}
}

// ─── 辅助 ─────────────────────────────────────────────────────────────────────

// clientAddress 解析本次请求的客户端地址（限流键），nil 安全。
func (s *backendServer) clientAddress(r *http.Request) string {
	if s == nil {
		return getClientIP(r, nil)
	}
	return getClientIP(r, s.config.TrustedProxyCIDRs)
}

// methodIsRead 判定是否为读取型方法（GET/HEAD）。
func methodIsRead(r *http.Request) bool {
	return r != nil && (r.Method == http.MethodGet || r.Method == http.MethodHead)
}
