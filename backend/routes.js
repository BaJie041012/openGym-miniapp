const url = require('url')

function corsMiddleware(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, access-token, X-Client-Package-Id, X-Request-Package-Id')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return true
  }
  return false
}

function handleRequest(req, res) {
  if (corsMiddleware(req, res)) return

  const parsed = url.parse(req.url, true)

  // Health check
  if (parsed.pathname === '/' || parsed.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      status: 'ok',
      service: 'openGym-backend',
      note: 'TODO: 后端 API 占位，尚未迁移完成'
    }))
    return
  }

  // 所有 API 返回 TODO
  res.writeHead(501, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({
    error: 'not_implemented',
    message: 'openGym 后端 API 尚未迁移完成。前端当前使用本地存储。',
    path: parsed.pathname
  }))
}

module.exports = { handleRequest }
