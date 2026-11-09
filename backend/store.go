package main

// ─── 好友码管理 数据操作层 ────────────────────────────────────────────────────
// players: 每 openId 多个纯数字玩家账号，(openId, playerId) 唯一
// friend_codes: 全局好友码池，code 唯一；claimedBy 空 = 未被获取
// claim_records: (openId, playerId) 唯一 — 约束 B 防同号重复碰

import (
	"context"
	"errors"
	"log"
	"regexp"
	"strings"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// 集合名
const (
	collectionPlayers    = "players"
	collectionCodes      = "friend_codes"
	collectionClaims     = "claim_records"
)

// mongoStore 封装全部数据操作
type mongoStore struct {
	db *mongo.Database
}

func newMongoStore(db *mongo.Database) *mongoStore {
	if db == nil {
		return nil
	}
	return &mongoStore{db: db}
}

func (s *mongoStore) available() bool {
	return s != nil && s.db != nil
}

// ─── players ────────────────────────────────────────────────────────────────

func (s *mongoStore) playersColl() *mongo.Collection { return s.db.Collection(collectionPlayers) }

// listPlayers 列出某用户的所有玩家账号
func (s *mongoStore) listPlayers(ctx context.Context, openID string) ([]PlayerDoc, error) {
	if !s.available() {
		return nil, errors.New("database not connected")
	}
	cursor, err := s.playersColl().Find(ctx, bson.M{"openId": openID},
		options.Find().SetSort(bson.D{{Key: "createdAt", Value: 1}}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	var items []PlayerDoc
	if err := cursor.All(ctx, &items); err != nil {
		return nil, err
	}
	return items, nil
}

// createPlayer 创建玩家账号（纯数字校验在 handler）
func (s *mongoStore) createPlayer(ctx context.Context, openID, playerID, nickname string, now int64) (*PlayerDoc, error) {
	if !s.available() {
		return nil, errors.New("database not connected")
	}
	doc := PlayerDoc{
		OpenID:    openID,
		PlayerID:  playerID,
		Nickname:  nickname,
		CreatedAt: now,
	}
	_, err := s.playersColl().InsertOne(ctx, doc)
	if err != nil {
		return nil, err
	}
	return &doc, nil
}

// deletePlayer 删除玩家账号及其下所有好友码
func (s *mongoStore) deletePlayer(ctx context.Context, openID, playerID string) error {
	if !s.available() {
		return errors.New("database not connected")
	}
	// 删玩家账号
	_, err := s.playersColl().DeleteOne(ctx, bson.M{"openId": openID, "playerId": playerID})
	if err != nil {
		return err
	}
	// 同步删除该账号下的所有好友码
	_, _ = s.codesColl().DeleteMany(ctx, bson.M{"ownerOpenId": openID, "playerId": playerID})
	return nil
}

// playerIDPattern 纯数字玩家账号正则
var playerIDPattern = regexp.MustCompile(`^\d{1,20}$`)

// IsValidPlayerID 校验纯数字玩家账号
func IsValidPlayerID(id string) bool {
	return playerIDPattern.MatchString(strings.TrimSpace(id))
}

// ─── friend_codes ────────────────────────────────────────────────────────────

func (s *mongoStore) codesColl() *mongo.Collection { return s.db.Collection(collectionCodes) }

// addCodes 批量添加好友码（归属某玩家账号）。返回成功插入条数。
// 已存在的 code 跳过（不报错）。
func (s *mongoStore) addCodes(ctx context.Context, openID, playerID string, codes []string, now int64) (int, error) {
	if !s.available() {
		return 0, errors.New("database not connected")
	}
	if len(codes) == 0 {
		return 0, nil
	}
	models := make([]mongo.WriteModel, 0, len(codes))
	for _, c := range codes {
		c = strings.TrimSpace(c)
		if c == "" {
			continue
		}
		models = append(models, mongo.NewUpdateOneModel().
			SetFilter(bson.M{"code": c}).
			SetUpdate(bson.M{
				"$setOnInsert": bson.M{
					"code":        c,
					"ownerOpenId": openID,
					"playerId":    playerID,
					"createdAt":   now,
				},
			}).
			SetUpsert(true))
	}
	if len(models) == 0 {
		return 0, nil
	}
	res, err := s.codesColl().BulkWrite(ctx, models)
	if err != nil {
		return 0, err
	}
	return int(res.UpsertedCount), nil
}

// listCodes 列出某玩家账号下的全部好友码
func (s *mongoStore) listCodes(ctx context.Context, openID, playerID string) ([]FriendCodeDoc, error) {
	if !s.available() {
		return nil, errors.New("database not connected")
	}
	// 只返回自己添加的
	cursor, err := s.codesColl().Find(ctx,
		bson.M{"ownerOpenId": openID, "playerId": playerID},
		options.Find().SetSort(bson.D{{Key: "createdAt", Value: 1}}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	var items []FriendCodeDoc
	if err := cursor.All(ctx, &items); err != nil {
		return nil, err
	}
	return items, nil
}

// deleteCode 删除单条好友码
func (s *mongoStore) deleteCode(ctx context.Context, openID, code string) error {
	if !s.available() {
		return errors.New("database not connected")
	}
	// 只能删自己添加的
	_, err := s.codesColl().DeleteOne(ctx, bson.M{"ownerOpenId": openID, "code": code})
	return err
}

// ─── claim_records ───────────────────────────────────────────────────────────

func (s *mongoStore) claimsColl() *mongo.Collection { return s.db.Collection(collectionClaims) }

// listClaimedPlayerIDs 获取某用户已碰过的所有玩家账号（约束 B 查询用）
func (s *mongoStore) listClaimedPlayerIDs(ctx context.Context, openID string) ([]string, error) {
	if !s.available() {
		return nil, errors.New("database not connected")
	}
	cursor, err := s.claimsColl().Find(ctx, bson.M{"openId": openID},
		options.Find().SetProjection(bson.M{"playerId": 1}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	var results []struct {
		PlayerID string `bson:"playerId"`
	}
	if err := cursor.All(ctx, &results); err != nil {
		return nil, err
	}
	ids := make([]string, len(results))
	for i, r := range results {
		ids[i] = r.PlayerID
	}
	return ids, nil
}

// ClaimResult 是 claimOne 的返回值
type ClaimResult struct {
	Code     string
	PlayerID string
}

// claimOne 原子性获取一条好友码（满足约束 A+B）。
// 约束 A: code.claimedBy 为空（未被任何用户获取过）
// 约束 B: code.playerId 不在该用户已碰过的玩家账号列表里
// 返回 (code, playerId, error)。无可用码时返回 ( "", "", nil )。
func (s *mongoStore) claimOne(ctx context.Context, openID string, now int64) (*ClaimResult, error) {
	if !s.available() {
		return nil, errors.New("database not connected")
	}
	// 先查约束 B：该用户已碰过的玩家账号
	claimedPlayerIDs, err := s.listClaimedPlayerIDs(ctx, openID)
	if err != nil {
		return nil, err
	}

	// findOneAndUpdate：原子性选取 + 标记已获取
	filter := bson.M{
		"claimedBy": "", // 约束 A
	}
	if len(claimedPlayerIDs) > 0 {
		filter["playerId"] = bson.M{"$nin": claimedPlayerIDs} // 约束 B
	}

	update := bson.M{
		"$set": bson.M{
			"claimedBy": openID,
			"claimedAt": now,
		},
	}

	var result FriendCodeDoc
	err = s.codesColl().FindOneAndUpdate(ctx, filter, update,
		options.FindOneAndUpdate().SetReturnDocument(options.After)).Decode(&result)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil // 无可用码
		}
		return nil, err
	}

	// 写入 claim_record
	_, _ = s.claimsColl().InsertOne(ctx, ClaimRecordDoc{
		OpenID:    openID,
		PlayerID:  result.PlayerID,
		Code:      result.Code,
		ClaimedAt: now,
	})

	return &ClaimResult{Code: result.Code, PlayerID: result.PlayerID}, nil
}

// ─── 索引对齐 ────────────────────────────────────────────────────────────────

func (s *mongoStore) syncIndexes(ctx context.Context) error {
	if !s.available() {
		return errors.New("database not connected")
	}
	type target struct {
		coll   *mongo.Collection
		name   string
		keys   bson.D
		unique bool
	}
	targets := []target{
		{s.playersColl(), "idx_player_openid_playerid_uniq",
			bson.D{{Key: "openId", Value: 1}, {Key: "playerId", Value: 1}}, true},
		{s.codesColl(), "idx_code_uniq",
			bson.D{{Key: "code", Value: 1}}, true},
		{s.codesColl(), "idx_codes_owner_player",
			bson.D{{Key: "ownerOpenId", Value: 1}, {Key: "playerId", Value: 1}}, false},
		{s.codesColl(), "idx_codes_claimable",
			bson.D{{Key: "claimedBy", Value: 1}, {Key: "playerId", Value: 1}}, false},
		{s.claimsColl(), "idx_claim_openid_player_uniq",
			bson.D{{Key: "openId", Value: 1}, {Key: "playerId", Value: 1}}, true},
	}
	for _, t := range targets {
		opts := options.Index().SetName(t.name)
		if t.unique {
			opts = opts.SetUnique(true)
		}
		if _, err := t.coll.Indexes().CreateOne(ctx, mongo.IndexModel{Keys: t.keys, Options: opts}); err != nil {
			log.Printf("[index] create %s.%s failed: %v", t.coll.Name(), t.name, err)
		}
	}
	return nil
}
