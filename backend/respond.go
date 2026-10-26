package main

// ─── 统一响应信封与错误码 ─────────────────────────────────────────────────────
// 前端唯一认可的信封格式：
//   成功：{"code":0,"message":"ok","data":<payload>}
//   失败：{"code":<非零>,"message":<msg>,"data":null}
// HTTP 状态码按 codeToStatus 双写（业务码 + HTTP 码同义）。

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
)

// 业务错误码常量。
const (
	ErrParam        = 40001 // 参数错误
	ErrUnauthorized = 40100 // 未认证 / 会话失效
	ErrNotFound     = 40404 // 资源不存在
	ErrRateLimit    = 42900 // 登录限流
	ErrInternal     = 50000 // 内部错误
	ErrDB           = 50301 // 数据库不可用 / 服务未配置
)

// codeToStatus 将业务错误码映射到 HTTP 状态码；未登记的码回退 200。
var codeToStatus = map[int]int{
	ErrParam:        400,
	ErrUnauthorized: 401,
	ErrNotFound:     404,
	ErrRateLimit:    429,
	ErrInternal:     500,
	ErrDB:           503,
}

// statusForCode 返回错误码对应的 HTTP 状态码，未登记时回退 200。
func statusForCode(code int) int {
	if status, ok := codeToStatus[code]; ok {
		return status
	}
	return 200
}

// envelope 是统一响应信封。data 为 nil 时序列化为 JSON null。
type envelope struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

// maxJSONBodyBytes 限制请求体大小（1MB）。
const maxJSONBodyBytes = 1 << 20

// writeEnvelope 是内部统一的信封写出函数。
func writeEnvelope(w http.ResponseWriter, httpStatus int, code int, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(httpStatus)
	_ = json.NewEncoder(w).Encode(envelope{Code: code, Message: message, Data: data})
}

// writeOK 写出成功信封：HTTP 200 + {"code":0,"message":"ok","data":<data>}。
func writeOK(w http.ResponseWriter, data interface{}) {
	writeEnvelope(w, http.StatusOK, 0, "ok", data)
}

// writeFail 写出业务错误信封：HTTP 状态按 codeToStatus 映射，data 恒为 null。
func writeFail(w http.ResponseWriter, code int, message string) {
	writeEnvelope(w, statusForCode(code), code, message, nil)
}

// writeNotFound 写出资源不存在信封：HTTP 404 + code 40404。
func writeNotFound(w http.ResponseWriter) {
	writeEnvelope(w, http.StatusNotFound, ErrNotFound, "not found", nil)
}

// decodeJSONBody 严格解析请求体 JSON：拒绝未知字段、限制 1MB、拒绝尾随数据。
// 解析失败返回 error，调用方按 ErrParam(40001) 处理。
func decodeJSONBody(r *http.Request, v interface{}) error {
	if r == nil || r.Body == nil {
		return errors.New("request body is empty")
	}
	limited := io.LimitReader(r.Body, maxJSONBodyBytes+1)
	decoder := json.NewDecoder(limited)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(v); err != nil {
		return err
	}
	// 若仍能读到下一个 token，说明请求体超限或含尾随数据。
	if _, err := decoder.Token(); err == nil {
		return errors.New("request body exceeds 1MB or contains trailing data")
	} else if !errors.Is(err, io.EOF) {
		return err
	}
	return nil
}
