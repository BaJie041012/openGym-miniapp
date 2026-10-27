package main

// openGym Go 后端入口（改造自 czrDexTracker/backend/main.go 范式）。
//
// 本文件仅负责“基础设施装配”：配置加载、Mongo 连接、会话编解码器与认证客户端初始化、
// backendServer 组装、路由注册与 HTTP 监听（:8080）。业务处理逻辑分布在
// handlers_auth.go / handlers_exercises.go / handlers_routines.go / handlers_history.go /
// middleware.go / auth.go / store.go / mongo.go。
//
// ── main.go 期望由其它文件提供的符号 ──
//   auth.go:      SessionCodec / NewSessionCodec / sessionSigningKey（域分隔 "openGym/session/v1"）
//                 QiandaoAuthClient / newQiandaoAuth
//   middleware.go loginRateLimiter / newLoginRateLimiterForConfig / withCORS / requiredAuth
//   mongo.go:     connectMongo
//   store.go:     mongoStore / newMongoStore / syncIndexes
//   handlers_*.go (*backendServer 方法，http.HandlerFunc 兼容)

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

// 构建注入变量：源码树中恒为空，QDMP 发布打包步骤（scripts/merge-backend.mjs）会将其
// 填充为可信兜底值。运行时环境变量优先，构建注入兜底。
// ⚠ 源码树绝不出现明文 appSecret / 数据库密码。
var (
	buildAppID         = ""
	buildAppSecret     = ""
	buildMongoURI      = ""
	buildMongoDatabase = ""
)

// defaultPort 是未显式配置 PORT 时的监听端口。
const defaultPort = "8080"

// Config 是服务端有效配置。凭证绝不可从 HTTP handler 返回或写入日志。
type Config struct {
	AppID             string
	AppSecret         string
	MongoURI          string
	MongoDatabase     string
	TrustedProxyCIDRs []string
	Port              string
}

// backendServer 聚合所有请求处理所需的依赖，由 handlers_*.go / middleware.go 的方法消费。
type backendServer struct {
	config      Config
	store       *mongoStore
	codec       SessionCodec
	authClient  *QiandaoAuthClient
	rateLimiter *loginRateLimiter
}

// loadConfig 从环境变量读取配置，构建注入变量兜底。
func loadConfig(getenv func(string) string) Config {
	if getenv == nil {
		getenv = os.Getenv
	}
	port := firstNonEmpty(getenv("PORT"), defaultPort)
	return Config{
		AppID:             canonicalizeAppID(firstNonEmpty(getenv("QDMP_APP_ID"), buildAppID), buildAppID),
		AppSecret:         firstNonEmpty(getenv("QDMP_APP_SECRET"), buildAppSecret),
		MongoURI:          firstNonEmpty(getenv("MONGO_URI"), getenv("MONGODB_URI"), buildMongoURI),
		MongoDatabase:     firstNonEmpty(getenv("MONGO_DATABASE"), getenv("MONGODB_DATABASE"), buildMongoDatabase),
		TrustedProxyCIDRs: parseCSVList(getenv("TRUSTED_PROXY_CIDRS")),
		Port:              port,
	}
}

// startBackend 装配并启动服务（与 czrDexTracker 同一生命周期范式）。
func startBackend() error {
	config := loadConfig(os.Getenv)

	client, db, err := connectMongo(config.MongoURI, config.MongoDatabase)
	if err != nil {
		log.Printf("[boot] MongoDB 连接失败，进入降级模式(db=nil): %v", err)
		db = nil
	} else {
		log.Println("[boot] MongoDB 连接成功")
		defer func() {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			_ = client.Disconnect(ctx)
		}()
	}

	var store *mongoStore
	if db != nil {
		store = newMongoStore(db)
		idxCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		if ierr := store.syncIndexes(idxCtx); ierr != nil {
			log.Printf("[boot] 索引对齐告警: %v", ierr)
		}
		if n, ierr := store.countExercises(idxCtx); ierr == nil {
			log.Printf("[boot] 动作库条目数: %d", n)
		}
		cancel()
	}

	codec, err := NewSessionCodec(sessionSigningKey(config.AppSecret), 8*time.Hour, time.Now)
	if err != nil {
		log.Printf("[boot] 会话编解码器不可用: %v", err)
	}

	var authClient *QiandaoAuthClient
	if config.AppID != "" && config.AppSecret != "" {
		authClient = newQiandaoAuth(config.AppID, config.AppSecret)
	} else {
		log.Printf("[boot] 认证客户端不可用：缺少 appId/appSecret")
	}

	server := &backendServer{
		config:      config,
		store:       store,
		codec:       codec,
		authClient:  authClient,
		rateLimiter: newLoginRateLimiterForConfig(config, time.Now),
	}
	if len(config.TrustedProxyCIDRs) == 0 {
		log.Printf("[boot] auth_proxy_warning trusted_proxy_cidrs=empty forwarded_client_addresses=ignored")
	}

	mux := server.registerRoutes()
	addr := ":" + config.Port
	log.Printf("🌐 监听 %s", addr)
	return http.ListenAndServe(addr, withCORS(mux))
}

// registerRoutes 注册全部路由。约定：
//   - /health 完全公开（编排平台存活探针）；
//   - /api/auth/login 公开（内部限流）；
//   - /api/exercises 公开只读（动作库静态内容，未登录可浏览）；
//   - /api/routines、/api/history 需认证（requiredAuth）。
func (s *backendServer) registerRoutes() *http.ServeMux {
	mux := http.NewServeMux()

	mux.HandleFunc("/health", s.handleHealth)
	mux.HandleFunc("/api/auth/login", s.handleLogin)
	mux.HandleFunc("/api/exercises", s.handleExercises)
	mux.HandleFunc("/api/routines", s.requiredAuth(s.handleRoutines))
	mux.HandleFunc("/api/history", s.requiredAuth(s.handleHistory))
	mux.HandleFunc("/api/admin/seed", s.handleSeed)

	// 未匹配路由：返回统一 404 降级壳。
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		writeNotFound(w)
	})
	return mux
}

func main() {
	log.Println("🚀 启动 openGym 后端（Go：静默登录 + 动作库 + 计划/记录云同步）...")
	if err := startBackend(); err != nil {
		log.Fatalf("❌ 后端启动失败: %v", err)
	}
}

// ---------- 配置解析辅助 ----------

// firstNonEmpty 返回第一个去空白后非空的值。
func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value = strings.TrimSpace(value); value != "" {
			return value
		}
	}
	return ""
}

// canonicalizeAppID 还原发布包内嵌的规范 AppID 大小写（平台可能仅做大小写改写）。
func canonicalizeAppID(value, canonical string) string {
	value = strings.TrimSpace(value)
	canonical = strings.TrimSpace(canonical)
	if canonical != "" && strings.EqualFold(value, canonical) {
		return canonical
	}
	return value
}

// parseCSVList 将逗号分隔字符串解析为去空白、去空项的切片。
func parseCSVList(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return nil
	}
	var out []string
	for _, item := range strings.Split(raw, ",") {
		if item = strings.TrimSpace(item); item != "" {
			out = append(out, item)
		}
	}
	return out
}
