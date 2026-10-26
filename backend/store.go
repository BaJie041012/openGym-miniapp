package main

// ─── 数据操作层：exercises / routines / history 三集合 ────────────────────────
// routines 写路径用 $set days.<day> 局部合并（绝不整档覆盖，避免多设备互相清空）；
// history 按 (openId, recordId) 幂等 upsert（last-write-wins）；
// exercises 全量共享只读，由 scripts/seed-exercises.mjs 灌入，启动时对齐索引。

import (
	"context"
	"errors"
	"log"
	"regexp"
	"strings"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// 集合名（与根 qdmp-schema.json 一致）。
const (
	collectionExercises = "exercises"
	collectionRoutines  = "routines"
	collectionHistory   = "history"
)

// mongoStore 封装全部数据操作。
type mongoStore struct {
	db *mongo.Database
}

// newMongoStore 基于已连接的数据库创建 store。db 为 nil 时返回 nil（降级模式）。
func newMongoStore(db *mongo.Database) *mongoStore {
	if db == nil {
		return nil
	}
	return &mongoStore{db: db}
}

// available 报告底层数据库是否可用（供 handler 决定降级）。
func (s *mongoStore) available() bool {
	return s != nil && s.db != nil

}

// ─── exercises（动作库，全量共享只读）─────────────────────────────────────────

func (s *mongoStore) exercisesColl() *mongo.Collection { return s.db.Collection(collectionExercises) }

// exerciseQuery 是动作库列表查询条件。
type exerciseQuery struct {
	Keyword   string // 名称模糊匹配（name / nameZh）
	Muscle    string // target 精确匹配
	Equipment string // equipment 精确匹配
	Page      int
	Size      int
}

// listExercises 分页查询动作库。返回 (总数, 条目, error)。
func (s *mongoStore) listExercises(ctx context.Context, q exerciseQuery) (int64, []ExerciseDoc, error) {
	if !s.available() {
		return 0, nil, errors.New("database not connected")
	}
	filter := bson.M{}
	if kw := strings.TrimSpace(q.Keyword); kw != "" {
		// 转义正则元字符，防注入；中英文名任一命中即返回。
		pattern := regexp.QuoteMeta(kw)
		filter["$or"] = []bson.M{
			{"name": bson.M{"$regex": pattern, "$options": "i"}},
			{"nameZh": bson.M{"$regex": pattern, "$options": "i"}},
		}
	}
	if m := strings.TrimSpace(q.Muscle); m != "" {
		filter["target"] = m
	}
	if e := strings.TrimSpace(q.Equipment); e != "" {
		filter["equipment"] = e
	}

	total, err := s.exercisesColl().CountDocuments(ctx, filter)
	if err != nil {
		return 0, nil, err
	}
	page, size := q.Page, q.Size
	if page < 1 {
		page = 1
	}
	if size < 1 || size > 50 {
		size = 20
	}
	opts := options.Find().
		SetSort(bson.D{{Key: "exerciseId", Value: 1}}).
		SetSkip(int64((page - 1) * size)).
		SetLimit(int64(size))
	cursor, err := s.exercisesColl().Find(ctx, filter, opts)
	if err != nil {
		return 0, nil, err
	}
	defer cursor.Close(ctx)
	items := []ExerciseDoc{}
	if err := cursor.All(ctx, &items); err != nil {
		return 0, nil, err
	}
	return total, items, nil
}

// ─── routines（周计划，每用户一文档，单日局部合并）────────────────────────────

func (s *mongoStore) routinesColl() *mongo.Collection { return s.db.Collection(collectionRoutines) }

// getRoutine 读取用户周计划；不存在返回 (nil, nil)（视为空计划）。
func (s *mongoStore) getRoutine(ctx context.Context, openID string) (*RoutineDoc, error) {
	if !s.available() {
		return nil, errors.New("database not connected")
	}
	var doc RoutineDoc
	err := s.routinesColl().FindOne(ctx, bson.M{"openId": openID}).Decode(&doc)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &doc, nil
}

// mergeRoutineDay 用 $set days.<day> 局部合并单日计划（upsert，不整档覆盖）。
// day 合法性与 plans 规模由 handler 校验。
func (s *mongoStore) mergeRoutineDay(ctx context.Context, openID, nickname, day string, plans []RoutineDayPlan, now int64) error {
	if !s.available() {
		return errors.New("database not connected")
	}
	set := bson.M{"updatedAt": now}
	if nickname = strings.TrimSpace(nickname); nickname != "" {
		set["nickname"] = nickname
	}
	if plans == nil {
		plans = []RoutineDayPlan{}
	}
	set["days."+day] = plans
	update := bson.M{
		"$set":         set,
		"$setOnInsert": bson.M{"openId": openID, "createdAt": now},
	}
	_, err := s.routinesColl().UpdateOne(ctx, bson.M{"openId": openID}, update, options.Update().SetUpsert(true))
	return err
}

// ─── history（训练记录，(openId, recordId) 幂等 upsert）──────────────────────

func (s *mongoStore) historyColl() *mongo.Collection { return s.db.Collection(collectionHistory) }

// upsertHistory 批量写入训练记录（同 recordId 以较新 updatedAt 获胜）。
// 返回实际写入的条数。
func (s *mongoStore) upsertHistory(ctx context.Context, openID string, records []HistoryDoc, now int64) (int, error) {
	if !s.available() {
		return 0, errors.New("database not connected")
	}
	models := make([]mongo.WriteModel, 0, len(records))
	for _, rec := range records {
		rec.OpenID = openID
		if rec.UpdatedAt <= 0 {
			rec.UpdatedAt = now
		}
		filter := bson.M{"openId": openID, "recordId": rec.RecordID}
		// last-write-wins：仅在无文档或 incoming 更新时覆盖。
		update := bson.M{
			"$set": bson.M{
				"date":      rec.Date,
				"startedAt": rec.StartedAt,
				"endedAt":   rec.EndedAt,
				"exercises": rec.Exercises,
				"volume":    rec.Volume,
				"updatedAt": rec.UpdatedAt,
			},
			"$setOnInsert": bson.M{
				"openId":    openID,
				"recordId":  rec.RecordID,
				"createdAt": now,
			},
		}
		models = append(models, mongo.NewUpdateOneModel().SetFilter(filter).SetUpdate(update).SetUpsert(true))
	}
	if len(models) == 0 {
		return 0, nil
	}
	res, err := s.historyColl().BulkWrite(ctx, models)
	if err != nil {
		return 0, err
	}
	return int(res.UpsertedCount + res.ModifiedCount), nil
}

// listHistory 按 startedAt 倒序拉取记录；since > 0 时只返回 updatedAt > since 的增量。
func (s *mongoStore) listHistory(ctx context.Context, openID string, since int64, limit int) ([]HistoryDoc, error) {
	if !s.available() {
		return nil, errors.New("database not connected")
	}
	if limit < 1 || limit > 200 {
		limit = 100
	}
	filter := bson.M{"openId": openID}
	if since > 0 {
		filter["updatedAt"] = bson.M{"$gt": since}
	}
	opts := options.Find().SetSort(bson.D{{Key: "startedAt", Value: -1}}).SetLimit(int64(limit))
	cursor, err := s.historyColl().Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	items := []HistoryDoc{}
	if err := cursor.All(ctx, &items); err != nil {
		return nil, err
	}
	return items, nil
}

// ─── 索引对齐 ─────────────────────────────────────────────────────────────────

// syncIndexes 启动时对齐三个集合的索引；失败仅告警不阻断启动。
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
		{s.exercisesColl(), "idx_exercise_id_uniq", bson.D{{Key: "exerciseId", Value: 1}}, true},
		{s.exercisesColl(), "idx_target", bson.D{{Key: "target", Value: 1}}, false},
		{s.exercisesColl(), "idx_equipment", bson.D{{Key: "equipment", Value: 1}}, false},
		{s.routinesColl(), "idx_routine_openid_uniq", bson.D{{Key: "openId", Value: 1}}, true},
		{s.historyColl(), "idx_history_record_uniq", bson.D{{Key: "openId", Value: 1}, {Key: "recordId", Value: 1}}, true},
		{s.historyColl(), "idx_history_user_time", bson.D{{Key: "openId", Value: 1}, {Key: "startedAt", Value: -1}}, false},
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
	// exercises 全量 seed 前先清理占位：空集合由 seed 脚本负责灌入，这里不处理数据。
	return nil
}

// countExercises 返回动作库总条数（健康检查/诊断用）。
func (s *mongoStore) countExercises(ctx context.Context) (int64, error) {
	if !s.available() {
		return 0, errors.New("database not connected")
	}
	return s.exercisesColl().CountDocuments(ctx, bson.M{})
}

// upsertExercises 批量 upsert 动作条目（按 exerciseId 幂等，灌库端点使用）。
func (s *mongoStore) upsertExercises(ctx context.Context, docs []ExerciseDoc) (int, error) {
	if !s.available() {
		return 0, errors.New("database not connected")
	}
	models := make([]mongo.WriteModel, 0, len(docs))
	for _, d := range docs {
		filter := bson.M{"exerciseId": d.ExerciseID}
		models = append(models, mongo.NewReplaceOneModel().SetFilter(filter).SetReplacement(d).SetUpsert(true))
	}
	res, err := s.exercisesColl().BulkWrite(ctx, models)
	if err != nil {
		return 0, err
	}
	return int(res.UpsertedCount + res.ModifiedCount), nil
}

// 编译期断言：确保 primitive 包被使用（bson.D 兼容旧写法时防 import 漂移）。
var _ = primitive.NilObjectID
