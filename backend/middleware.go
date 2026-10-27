package main

// ─── CORS、认证中间件、登录限流、客户端地址解析 ───────────────────────────────
// 改造自 pdfTabloid/backend/middleware.go 与 http.go，按 czrDexTracker 契约调整 CORS 头。
//
//   - withCORS：全局包裹，预检 OPTIONS 直接 204；允许 * 源、GET/POST/PUT/DELETE/OPTIONS，
//     允许头含 Content-Type/Authorization/access-token/x-echo-qdmp-version；
//   - requiredAuth（enforce-mode）：无合法 Bearer 直接 40100，绝不信任前端直传 openId；
//   - 登录限流只挂在 login 端点（非全局），限流表有界（按 lastSeen 淘汰最早条目）；
//   - 仅当直连对端属于受信代理网段时才采纳 X-Forwarded-For（从右往左取第一个非受信地址）。
//
// 说明：CORS 采用 * 是千岛小程序跨域调用的既定要求；会话通过 Authorization: Bearer 头携带
// （非 Cookie），不存在浏览器环境下的 CSRF 环境凭证风险。

import (
	"context"
	"net"
	"net/http"
	"net/netip"
	"strconv"
	"strings"
	"sync"
	"time"
)

// 登录限流默认参数。
const (
	defaultLoginRateLimit      = 10          // 每 IP 每窗口 10 次
	defaultLoginRateWindow     = time.Minute // 1 分钟窗口
	defaultLoginRateMaxClients = 10000       // 有界表容量
	aggregateLoginRateLimit    = 1000        // 未配置受信代理时的聚合限制
	unknownClientAddress       = "unknown"   // 无法解析地址时的占位
	bearerPrefix               = "Bearer "   // Authorization 头前缀
)

// ─── CORS ────────────────────────────────────────────────────────────────────

// setCORS 设置跨域响应头（含 Authorization，供前端携带 Bearer 会话；
// access-token / x-echo-qdmp-version 供潜在的上游透传场景）。
func setCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, access-token, x-echo-qdmp-version")
}

// withCORS 包裹任意 handler：预检 OPTIONS 直接返回 204，其余请求注入 CORS 头后透传。
func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		setCORS(w)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// ─── 身份上下文与认证中间件 ───────────────────────────────────────────────────

// identityContextKey 是身份在 request context 中的私有键。
type identityContextKey struct{}

// withIdentity 把已校验身份挂到 context。
func withIdentity(ctx context.Context, identity *Identity) context.Context {
	if identity == nil {
		return ctx
	}
	return context.WithValue(ctx, identityContextKey{}, identity)
}

// identityFromContext 取出身份；无身份或 openId 为空一律返回 (nil, false)。
func identityFromContext(ctx context.Context) (*Identity, bool) {
	if ctx == nil {
		return nil, false
	}
	identity, ok := ctx.Value(identityContextKey{}).(*Identity)
	if !ok || identity == nil || strings.TrimSpace(identity.OpenID) == "" {
		return nil, false
	}
	return identity, true
}

// parseBearer 严格解析 "Bearer <token>"：前缀精确、token 内不含空格/制表符。
// 前端把 session 放在 Authorization: Bearer <session> 头。
func parseBearer(header string) string {
	if !strings.HasPrefix(header, bearerPrefix) {
		return ""
	}
	token := header[len(bearerPrefix):]
	if token == "" || strings.ContainsAny(token, " \t") {
		return ""
	}
	return token
}

// requiredAuth —— enforce-mode：无合法 Bearer 返回 40100；codec 未配置返回 50301。
// 校验通过后把身份挂到 context，下游 handler 从会话解出 openId（绝不信任前端直传）。
func (s *backendServer) requiredAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := parseBearer(r.Header.Get("Authorization"))
		if token == "" {
			writeFail(w, ErrUnauthorized, "请先登录")
			return
		}
		if s == nil || !s.codec.usable() {
			writeFail(w, ErrDB, "认证服务未配置")
			return
		}
		identity, err := s.codec.Verify(token)
		if err != nil || identity == nil {
			writeFail(w, ErrUnauthorized, "登录状态已失效，请重新登录")
			return
		}
		next(w, r.WithContext(withIdentity(r.Context(), identity)))
	}
}

// ─── 登录限流 ─────────────────────────────────────────────────────────────────

// loginRateEntry 单个客户端在当前窗口内的计数。
type loginRateEntry struct {
	count         int
	windowStarted time.Time
	lastSeen      time.Time
}

// loginRateLimiter 按客户端地址限制登录换取频率，状态有界。
type loginRateLimiter struct {
	limit    int
	window   time.Duration
	capacity int
	now      func() time.Time
	mu       sync.Mutex
	clients  map[string]loginRateEntry
}

// newLoginRateLimiter 创建限流器；非法参数回落到安全默认值。
func newLoginRateLimiter(limit int, window time.Duration, maxClients int) *loginRateLimiter {
	if limit <= 0 {
		limit = defaultLoginRateLimit
	}
	if window <= 0 {
		window = defaultLoginRateWindow
	}
	if maxClients <= 0 {
		maxClients = defaultLoginRateMaxClients
	}
	return &loginRateLimiter{
		limit:    limit,
		window:   window,
		capacity: maxClients,
		now:      time.Now,
		clients:  make(map[string]loginRateEntry),
	}
}

// newLoginRateLimiterForConfig 依据是否配置受信代理选择「每 IP 限制」或「聚合限制」。
func newLoginRateLimiterForConfig(config Config, now func() time.Time) *loginRateLimiter {
	limit := defaultLoginRateLimit
	if len(config.TrustedProxyCIDRs) == 0 {
		// 未配置受信代理时无法可信地取到真实客户端地址，退化为全局聚合限制。
		limit = aggregateLoginRateLimit
	}
	limiter := newLoginRateLimiter(limit, defaultLoginRateWindow, defaultLoginRateMaxClients)
	if now != nil {
		limiter.now = now
	}
	return limiter
}

// Allow 判定某客户端地址本次请求是否放行（nil 限流器一律放行）。
func (l *loginRateLimiter) Allow(ip string) bool {
	if l == nil {
		return true
	}
	client := strings.TrimSpace(ip)
	if client == "" {
		client = unknownClientAddress
	}
	now := l.now()
	if now.IsZero() {
		now = time.Now()
	}

	l.mu.Lock()
	defer l.mu.Unlock()

	entry, found := l.clients[client]
	if found && (now.Before(entry.windowStarted) || now.Sub(entry.windowStarted) >= l.window) {
		entry = loginRateEntry{windowStarted: now} // 新窗口
	}
	if found && entry.count >= l.limit {
		entry.lastSeen = now
		l.clients[client] = entry
		return false
	}
	if !found && len(l.clients) >= l.capacity {
		l.evictOldestClient()
	}
	entry.count++
	entry.lastSeen = now
	if entry.windowStarted.IsZero() {
		entry.windowStarted = now
	}
	l.clients[client] = entry
	return true
}

// evictOldestClient 淘汰 lastSeen 最早的条目（调用方须持锁）。
func (l *loginRateLimiter) evictOldestClient() {
	oldestClient := ""
	var oldest time.Time
	for client, entry := range l.clients {
		if oldestClient == "" || entry.lastSeen.Before(oldest) {
			oldestClient, oldest = client, entry.lastSeen
		}
	}
	if oldestClient != "" {
		delete(l.clients, oldestClient)
	}
}

// retryAfter 返回建议写入 Retry-After 响应头的秒数（窗口长度向上取整，最小 1）。
func (l *loginRateLimiter) retryAfter() int {
	window := defaultLoginRateWindow
	if l != nil && l.window > 0 {
		window = l.window
	}
	seconds := window / time.Second
	if window%time.Second != 0 {
		seconds++
	}
	if seconds < 1 {
		seconds = 1
	}
	return int(seconds)
}

// ─── 客户端地址解析 ───────────────────────────────────────────────────────────

// getClientIP 解析客户端地址：仅当直连对端属于受信代理网段时才采纳 X-Forwarded-For，
// 并从右往左取第一个非受信地址（最右侧由最近的代理写入，最难伪造）。
func getClientIP(r *http.Request, trustedCIDRs []string) string {
	if r == nil {
		return unknownClientAddress
	}
	prefixes := parseTrustedPrefixes(trustedCIDRs)
	direct := remoteAddress(r.RemoteAddr)
	if direct.IsValid() && isTrustedProxyAddr(direct, prefixes) {
		if forwarded := clientAddressFromForwardedFor(r.Header.Get("X-Forwarded-For"), prefixes); forwarded.IsValid() {
			return forwarded.String()
		}
	}
	if direct.IsValid() {
		return direct.String()
	}
	return unknownClientAddress
}

// remoteAddress 从 host:port 中取出地址并还原 IPv4 映射形式。
func remoteAddress(remoteAddr string) netip.Addr {
	host := strings.TrimSpace(remoteAddr)
	if parsed, _, err := net.SplitHostPort(host); err == nil {
		host = parsed
	}
	address, err := netip.ParseAddr(host)
	if err != nil {
		return netip.Addr{}
	}
	return address.Unmap()
}

// parseTrustedPrefixes 解析受信代理网段；支持裸 IP（自动补 /32 或 /128）与非法项跳过。
func parseTrustedPrefixes(cidrs []string) []netip.Prefix {
	if len(cidrs) == 0 {
		return nil
	}
	prefixes := make([]netip.Prefix, 0, len(cidrs))
	for _, raw := range cidrs {
		value := strings.TrimSpace(raw)
		if value == "" {
			continue
		}
		if prefix, err := netip.ParsePrefix(value); err == nil {
			prefixes = append(prefixes, prefix.Masked())
			continue
		}
		address, err := netip.ParseAddr(value)
		if err != nil {
			continue
		}
		address = address.Unmap()
		bits := 32
		if address.Is6() && !address.Is4In6() {
			bits = 128
		}
		if prefix, err := netip.ParsePrefix(address.String() + "/" + strconv.Itoa(bits)); err == nil {
			prefixes = append(prefixes, prefix)
		}
	}
	return prefixes
}

// isTrustedProxyAddr 判定地址是否落在受信代理网段内。
func isTrustedProxyAddr(address netip.Addr, prefixes []netip.Prefix) bool {
	if !address.IsValid() || len(prefixes) == 0 {
		return false
	}
	for _, prefix := range prefixes {
		if prefix.Contains(address) {
			return true
		}
	}
	return false
}

// clientAddressFromForwardedFor 从右往左找第一个非受信地址。
func clientAddressFromForwardedFor(header string, prefixes []netip.Prefix) netip.Addr {
	if strings.TrimSpace(header) == "" {
		return netip.Addr{}
	}
	parts := strings.Split(header, ",")
	for index := len(parts) - 1; index >= 0; index-- {
		address, err := netip.ParseAddr(strings.TrimSpace(parts[index]))
		if err != nil {
			continue
		}
		address = address.Unmap()
		if !isTrustedProxyAddr(address, prefixes) {
			return address
		}
	}
	return netip.Addr{}
}
