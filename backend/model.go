package main

// ─── 好友码管理 数据模型 ─────────────────────────────────────────────────────
// 三个集合：
//   players       — 每 openId 多个纯数字玩家账号
//   friend_codes  — 全局好友码池（带 owner + player 归属，一次性消费）
//   claim_records — 约束 B 记录（某用户碰过哪些玩家账号，防同号重复碰）

// PlayerDoc 是一个千岛用户下的某个纯数字玩家账号。
// PlayerID 由用户创建（纯数字字符串），同一 openId 下不可重复。
type PlayerDoc struct {
	OpenID    string `json:"openId"    bson:"openId"`
	PlayerID  string `json:"playerId"  bson:"playerId"`
	Nickname  string `json:"nickname"  bson:"nickname"` // 可选玩家备注
	CreatedAt int64  `json:"createdAt" bson:"createdAt"`
}

// FriendCodeDoc 是一条好友码，归属某玩家账号。
// ClaimedBy 非空 = 已被获取过（约束 A：一次性消费）。
type FriendCodeDoc struct {
	Code       string `json:"code"       bson:"code"`       // 好友码本身（全局唯一）
	OwnerOpenID string `json:"ownerOpenId" bson:"ownerOpenId"` // 谁添加的
	PlayerID   string `json:"playerId"   bson:"playerId"`   // 属于哪个玩家账号
	ClaimedBy  string `json:"claimedBy"  bson:"claimedBy"`  // 获取者 openId（空=未获取）
	ClaimedAt  int64  `json:"claimedAt"  bson:"claimedAt"`
	CreatedAt  int64  `json:"createdAt"  bson:"createdAt"`
}

// ClaimRecordDoc 约束 B 记录：某用户碰过哪些玩家账号。
// (openId, playerId) 唯一 — 防同一用户重复碰同一玩家账号。
type ClaimRecordDoc struct {
	OpenID    string `json:"openId"    bson:"openId"`
	PlayerID  string `json:"playerId"  bson:"playerId"`
	Code      string `json:"code"      bson:"code"`
	ClaimedAt int64  `json:"claimedAt" bson:"claimedAt"`
}
