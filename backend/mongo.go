package main

// ─── MongoDB 连接 ─────────────────────────────────────────────────────────────
// 连接串与 database 来自根 qdmp-config.json 的 mongodb 字段（打包期由 merge-backend.mjs
// 注入 buildMongoURI/buildMongoDatabase；本地 go run 时可由环境变量覆盖）。
// 源码树中绝不出现明文数据库密码。

import (
	"context"
	"errors"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// mongoConnectTimeout 建连 + Ping 的总超时。
const mongoConnectTimeout = 15 * time.Second

// connectMongo 建立数据库连接并 Ping 校验；失败返回 error（调用方据此进入降级模式）。
// 返回的 *mongo.Client 供进程退出时优雅断开（可为 nil）。
func connectMongo(uri, database string) (*mongo.Client, *mongo.Database, error) {
	if uri == "" || database == "" {
		return nil, nil, errors.New("missing MONGO_URI or MONGO_DATABASE")
	}
	ctx, cancel := context.WithTimeout(context.Background(), mongoConnectTimeout)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return nil, nil, fmt.Errorf("mongo.Connect: %w", err)
	}
	if err := client.Ping(ctx, nil); err != nil {
		_ = client.Disconnect(context.Background())
		return nil, nil, fmt.Errorf("client.Ping: %w", err)
	}
	return client, client.Database(database), nil
}
