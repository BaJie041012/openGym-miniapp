package main

// ─── 会话与千岛认证 ───────────────────────────────────────────────────────────
// 改造自 pdfTabloid/backend/auth.go，保持其成熟的安全范式，并按 czrDexTracker 契约调整：
//
//   - 域分隔串固定为 czrDexTracker/session/v1，与其它产品线（pdfTabloid、murderMysteryTask）
//     完全隔离；同一 appSecret 在不同项目间不可互相签发/校验；
//   - token 结构 v1.<base64url(payload)>.<base64url(sig)>，签名输入含版本前缀；
//   - payload.exp 与对外 expiresAt 一律是「毫秒时间戳数字」，TTL 8 小时；
//   - 校验用常量时间比对 + 拒绝未知字段；
//   - 认证客户端使用裸 HTTP 精确对齐上游契约（不引入 SDK 依赖）：
//       POST https://openapi.qiandao.com/auth/v1/token
//            body {grantType:"AUTHORIZATION_CODE", appId, appSecret, code}
//            → {code:0,data:{accessToken,refreshToken,expiresAt,openId}}
//       GET  https://openapi.qiandao.com/user/v1/me
//            header access-token:<accessToken> + x-echo-qdmp-version:1.0
//            → {code:0,data:{id,nickname}}
//   - accessToken/refreshToken 只在进程内流转，绝不返回前端、绝不落日志；
//   - user.me 失败但已拿到 openId 时仍按 openId 归属，nickname 用 openId 兜底。

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const (
	// sessionDomainSeparator 是密钥派生的域分隔串，改动即令全部历史会话失效。
	sessionDomainSeparator = "openGym/session/v1"
	// sessionTokenVersion 是 token 首段，参与签名输入，防止版本混淆。
	sessionTokenVersion = "v1"
	// sessionSignatureBytes HMAC-SHA256 摘要长度。
	sessionSignatureBytes = sha256.Size

	// authUpstreamTimeout 单次上游认证调用超时。
	authUpstreamTimeout = 5 * time.Second
	// authResponseLimitBytes 上游响应体上限。
	authResponseLimitBytes int64 = 64 << 10
	// maxLoginCodeLength 前端 qd.login 临时 code 的最大长度。
	maxLoginCodeLength = 1024

	// qiandaoTokenEndpoint 临时 code 换取用户 accessToken 的端点（编译期常量，非用户可控）。
	qiandaoTokenEndpoint = "https://openapi.qiandao.com/auth/v1/token"
	// qiandaoUserMeEndpoint 用户资料端点，用于取 nickname 并二次确认 openId（编译期常量）。
	qiandaoUserMeEndpoint = "https://openapi.qiandao.com/user/v1/me"
	// qiandaoVersionHeader 业务接口版本头（仅 user.me 需要，token 端点不带）。
	qiandaoVersionHeader = "x-echo-qdmp-version"
)

// 认证相关哨兵错误：handler 依此映射对外错误码，绝不把上游细节透传给前端。
var (
	errSessionUnconfigured = errors.New("session codec is not configured")
	errSessionMalformed    = errors.New("malformed session")
	errSessionSignature    = errors.New("invalid session signature")
	errSessionExpired      = errors.New("session expired")
	errLoginCodeInvalid    = errors.New("login code is required or too long")
	errAuthUnconfigured    = errors.New("qiandao auth client is not configured")
	errAuthUpstream        = errors.New("qiandao authentication failed")
)

// Identity 是服务端校验后的千岛账号身份。Exp 仅在内存中携带到期时刻，不参与序列化。
type Identity struct {
	OpenID   string    `json:"openId"`
	Nickname string    `json:"nickname"`
	Exp      time.Time `json:"-"`
}

// sessionPayload 是 token 中间段的完整内容，字段集固定（校验时拒绝未知字段）。
type sessionPayload struct {
	OpenID   string `json:"openId"`
	Nickname string `json:"nickname"`
	Expires  int64  `json:"exp"` // 毫秒时间戳
}

// SessionCodec 签发/校验无状态短时会话。零值不可用（key 为空即视为未配置）。
type SessionCodec struct {
	key []byte
	ttl time.Duration
	now func() time.Time
}

// sessionSigningKey 密钥派生：HMAC-SHA256(appSecret, 域分隔串)。
func sessionSigningKey(appSecret string) []byte {
	mac := hmac.New(sha256.New, []byte(appSecret))
	_, _ = mac.Write([]byte(sessionDomainSeparator))
	return mac.Sum(nil)
}

// NewSessionCodec 用已派生的签名密钥构造 codec；key 为空或 ttl 非正时返回错误。
func NewSessionCodec(key []byte, ttl time.Duration, now func() time.Time) (SessionCodec, error) {
	if len(key) == 0 {
		return SessionCodec{}, errors.New("session signing key is required")
	}
	if ttl <= 0 {
		return SessionCodec{}, errors.New("session ttl must be positive")
	}
	if now == nil {
		now = time.Now
	}
	return SessionCodec{key: append([]byte(nil), key...), ttl: ttl, now: now}, nil
}

// usable 报告 codec 是否可用于签发/校验。
func (c SessionCodec) usable() bool {
	return len(c.key) > 0 && c.ttl > 0 && c.now != nil
}

// Sign 返回 (token, expiresAt 毫秒时间戳, error)。
func (c SessionCodec) Sign(openID, nickname string) (string, int64, error) {
	if !c.usable() {
		return "", 0, errSessionUnconfigured
	}
	openID = strings.TrimSpace(openID)
	if openID == "" {
		return "", 0, errors.New("identity openId is required")
	}
	nickname = strings.TrimSpace(nickname)
	if nickname == "" {
		nickname = openID
	}

	expires := c.now().Add(c.ttl)
	expiresAt := expires.UnixMilli()

	payload, err := json.Marshal(sessionPayload{OpenID: openID, Nickname: nickname, Expires: expiresAt})
	if err != nil {
		return "", 0, fmt.Errorf("encode session: %w", err)
	}
	signingInput := sessionTokenVersion + "." + base64.RawURLEncoding.EncodeToString(payload)
	mac := hmac.New(sha256.New, c.key)
	_, _ = mac.Write([]byte(signingInput))
	token := signingInput + "." + base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	return token, expiresAt, nil
}

// Verify 三段分割 → 常量时间比对签名 → 严格解析 payload → 过期检查。
func (c SessionCodec) Verify(token string) (*Identity, error) {
	if !c.usable() {
		return nil, errSessionUnconfigured
	}
	parts := strings.Split(strings.TrimSpace(token), ".")
	if len(parts) != 3 || parts[0] != sessionTokenVersion || parts[1] == "" || parts[2] == "" {
		return nil, errSessionMalformed
	}
	signature, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil || len(signature) != sessionSignatureBytes {
		return nil, errSessionMalformed
	}
	mac := hmac.New(sha256.New, c.key)
	_, _ = mac.Write([]byte(parts[0] + "." + parts[1]))
	if subtle.ConstantTimeCompare(signature, mac.Sum(nil)) != 1 {
		return nil, errSessionSignature
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, errSessionMalformed
	}
	decoder := json.NewDecoder(bytes.NewReader(payloadBytes))
	decoder.DisallowUnknownFields()
	var payload sessionPayload
	if err := decoder.Decode(&payload); err != nil || decoder.Decode(&struct{}{}) != io.EOF {
		return nil, errSessionMalformed
	}
	openID := strings.TrimSpace(payload.OpenID)
	nickname := strings.TrimSpace(payload.Nickname)
	if openID == "" || nickname == "" || payload.Expires <= 0 {
		return nil, errSessionMalformed
	}
	expires := time.UnixMilli(payload.Expires)
	if !c.now().Before(expires) {
		return nil, errSessionExpired
	}
	return &Identity{OpenID: openID, Nickname: nickname, Exp: expires}, nil
}

// ─── 千岛认证客户端（裸 HTTP）──────────────────────────────────────────────────

// sharedAuthHTTPClient 供所有 QiandaoAuthClient 复用（共享连接池与超时）。
var sharedAuthHTTPClient = &http.Client{Timeout: authUpstreamTimeout}

// QiandaoAuthClient 用前端临时 code 换取身份，全程不把上游凭证外泄。
type QiandaoAuthClient struct {
	appID       string
	appSecret   string
	endpoint    string
	userMe      string
	httpClient  *http.Client
	maxResponse int64
}

// newQiandaoAuth 构造认证客户端；appID/appSecret 为空时返回的对象在 Exchange 阶段判定为未配置。
func newQiandaoAuth(appID, appSecret string) *QiandaoAuthClient {
	return &QiandaoAuthClient{
		appID:       strings.TrimSpace(appID),
		appSecret:   strings.TrimSpace(appSecret),
		endpoint:    qiandaoTokenEndpoint,
		userMe:      qiandaoUserMeEndpoint,
		httpClient:  sharedAuthHTTPClient,
		maxResponse: authResponseLimitBytes,
	}
}

// Exchange：code → (openId, nickname)。
//  1. code 非空且长度 ≤ 1024；
//  2. POST /auth/v1/token 换 openId + accessToken；
//  3. GET /user/v1/me 取 nickname 并二次确认 data.id 非空（best-effort，失败不阻断登录）。
func (a *QiandaoAuthClient) Exchange(ctx context.Context, code string) (*Identity, error) {
	code = strings.TrimSpace(code)
	if code == "" || len(code) > maxLoginCodeLength {
		return nil, errLoginCodeInvalid
	}
	if a == nil || a.appID == "" || a.appSecret == "" || a.endpoint == "" {
		return nil, errAuthUnconfigured
	}
	client := a.httpClient
	if client == nil {
		client = sharedAuthHTTPClient
	}
	if ctx == nil {
		ctx = context.Background()
	}
	limit := a.maxResponse
	if limit <= 0 {
		limit = authResponseLimitBytes
	}
	userMe := a.userMe
	if strings.TrimSpace(userMe) == "" {
		userMe = qiandaoUserMeEndpoint
	}

	requestCtx, cancel := context.WithTimeout(ctx, authUpstreamTimeout)
	defer cancel()

	openID, accessToken, err := a.exchangeToken(requestCtx, code, client, limit)
	if err != nil {
		return nil, err
	}
	if openID == "" {
		return nil, fmt.Errorf("%w: token exchange returned no openId", errAuthUpstream)
	}

	// user.me 为 best-effort：失败仅归属 openId，nickname 用 openId 兜底（绝不阻断登录）。
	nickname, err := a.fetchNickname(requestCtx, accessToken, userMe, client, limit)
	if err != nil {
		nickname = openID
	}
	if strings.TrimSpace(nickname) == "" {
		nickname = openID
	}
	return &Identity{OpenID: openID, Nickname: nickname}, nil
}

// tokenRequestBody 是 POST /auth/v1/token 的请求体（字段集固定，逐字对齐上游契约）。
type tokenRequestBody struct {
	GrantType string `json:"grantType"`
	AppID     string `json:"appId"`
	AppSecret string `json:"appSecret"`
	Code      string `json:"code"`
}

// exchangeToken 用临时 code 换取 (openId, accessToken)。
// 注意：token 端点不带 x-echo-qdmp-version 头（与官方 SDK 一致，业务版本头仅用于标准业务接口）。
// accessToken/refreshToken/appSecret/code 绝不写入日志或错误文案。
func (a *QiandaoAuthClient) exchangeToken(ctx context.Context, code string, client *http.Client, limit int64) (string, string, error) {
	body, err := json.Marshal(tokenRequestBody{
		GrantType: "AUTHORIZATION_CODE",
		AppID:     a.appID,
		AppSecret: a.appSecret,
		Code:      code,
	})
	if err != nil {
		return "", "", fmt.Errorf("%w: encode token request", errAuthUpstream)
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, a.endpoint, bytes.NewReader(body))
	if err != nil {
		return "", "", fmt.Errorf("%w: token request: %v", errAuthUpstream, err)
	}
	request.Header.Set("Content-Type", "application/json")

	response, err := client.Do(request)
	if err != nil {
		return "", "", fmt.Errorf("%w: token exchange: %v", errAuthUpstream, err)
	}
	defer response.Body.Close()

	raw, err := io.ReadAll(io.LimitReader(response.Body, limit+1))
	if err != nil || int64(len(raw)) > limit {
		return "", "", fmt.Errorf("%w: token payload", errAuthUpstream)
	}
	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		return "", "", fmt.Errorf("%w: token status %d", errAuthUpstream, response.StatusCode)
	}

	var envelope struct {
		Code any             `json:"code"`
		Data json.RawMessage `json:"data"`
	}
	if err := json.Unmarshal(raw, &envelope); err != nil {
		return "", "", fmt.Errorf("%w: token envelope", errAuthUpstream)
	}
	if !authEnvelopeCodeOK(envelope.Code) {
		return "", "", fmt.Errorf("%w: token business code", errAuthUpstream)
	}
	var data struct {
		AccessToken string `json:"accessToken"`
		OpenID      string `json:"openId"`
	}
	if err := json.Unmarshal(envelope.Data, &data); err != nil {
		return "", "", fmt.Errorf("%w: token data", errAuthUpstream)
	}
	openID := strings.TrimSpace(data.OpenID)
	accessToken := strings.TrimSpace(data.AccessToken)
	if openID == "" {
		return "", "", fmt.Errorf("%w: token exchange returned no openId", errAuthUpstream)
	}
	if accessToken == "" {
		return "", "", fmt.Errorf("%w: token exchange returned no access token", errAuthUpstream)
	}
	return openID, accessToken, nil
}

// fetchNickname 拉取用户资料；只返回 nickname，accessToken 与完整响应都不外泄。
// data.id 非空视为 openId 二次确认通过（权威 openId 仍以 token 交换结果为准）。
func (a *QiandaoAuthClient) fetchNickname(ctx context.Context, accessToken, userMe string, client *http.Client, limit int64) (string, error) {
	if accessToken == "" {
		return "", fmt.Errorf("%w: missing access token", errAuthUpstream)
	}
	if client == nil {
		client = sharedAuthHTTPClient
	}
	// 端点是编译期常量（openapi.qiandao.com），不受用户输入影响，无需过 SSRF 校验。
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, userMe, nil)
	if err != nil {
		return "", fmt.Errorf("%w: user profile: %v", errAuthUpstream, err)
	}
	request.Header.Set("access-token", accessToken)
	request.Header.Set(qiandaoVersionHeader, "1.0")

	response, err := client.Do(request)
	if err != nil {
		return "", fmt.Errorf("%w: user profile: %v", errAuthUpstream, err)
	}
	defer response.Body.Close()

	raw, err := io.ReadAll(io.LimitReader(response.Body, limit+1))
	if err != nil || int64(len(raw)) > limit {
		return "", fmt.Errorf("%w: user profile payload", errAuthUpstream)
	}
	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		return "", fmt.Errorf("%w: user profile status %d", errAuthUpstream, response.StatusCode)
	}

	var envelope struct {
		Code any             `json:"code"`
		Data json.RawMessage `json:"data"`
	}
	if err := json.Unmarshal(raw, &envelope); err != nil {
		return "", fmt.Errorf("%w: user profile envelope", errAuthUpstream)
	}
	if !authEnvelopeCodeOK(envelope.Code) {
		return "", fmt.Errorf("%w: user profile business code", errAuthUpstream)
	}
	var data struct {
		ID       string `json:"id"`
		Nickname string `json:"nickname"`
	}
	if err := json.Unmarshal(envelope.Data, &data); err != nil || strings.TrimSpace(data.ID) == "" {
		return "", fmt.Errorf("%w: user profile identity", errAuthUpstream)
	}
	return strings.TrimSpace(data.Nickname), nil
}

// authEnvelopeCodeOK 兼容上游 code 为数字 0 或字符串 "0" 两种形态。
func authEnvelopeCodeOK(value any) bool {
	switch code := value.(type) {
	case float64:
		return code == 0
	case string:
		return strings.TrimSpace(code) == "0"
	default:
		return false
	}
}
