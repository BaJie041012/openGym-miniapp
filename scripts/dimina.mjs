// 和 dimina SSE 端点通信 — 修复版
// 协议：GET /sse 拿 sessionId，POST /message?sessionId=xxx 发 JSON-RPC，响应从 SSE 流回来
// 用法：node scripts/dimina.mjs [tool_name] [args_json] [output_path]
// 例：node scripts/dimina.mjs take_screenshot '{}' shot.png
// 截图类工具返回 image content 时，若传了 output_path 则保存为 PNG
import { writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const toolName = args[0] || 'tools/list';
const toolArgs = args[1] ? JSON.parse(args[1]) : {};
const outputPath = args[2] || null;

const SSE_URL = 'http://127.0.0.1:7787/sse';
let idCounter = 0;

async function main() {
  // Step 1: GET /sse 建立长连接，等服务端推 endpoint 事件
  const sseRes = await fetch(SSE_URL);
  const reader = sseRes.body.getReader();
  const decoder = new TextDecoder();
  console.log('✅ SSE 已连接, status:', sseRes.status);

  // Step 2: 从 SSE 流里读 endpoint 事件拿 sessionId
  let sessionId = null;
  let buffer = '';
  while (!sessionId) {
    const { value, done } = await reader.read();
    if (done) throw new Error('SSE 连接断开');
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf('\n\n')) >= 0) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const lines = chunk.split('\n');
      let data = '';
      for (const l of lines) {
        if (l.startsWith('data:')) data += (data ? '\n' : '') + l.slice(5).trim();
      }
      console.log('← SSE event:', data);
      const m = data.match(/sessionId=([a-f0-9-]+)/);
      if (m) sessionId = m[1];
    }
  }
  console.log('📋 sessionId:', sessionId);
  const MSG_URL = `http://127.0.0.1:7787/message?sessionId=${sessionId}`;

  // Step 3: 发 initialize
  const initId = ++idCounter;
  console.log('→ initialize');
  await fetch(MSG_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: initId, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'openGym-script', version: '1.0' } } })
  });
  // 读 initialize 响应
  await readUntilId(reader, decoder, String(initId), 5000);

  // Step 4: 发 initialized 通知
  console.log('→ notifications/initialized');
  await fetch(MSG_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })
  });

  // Step 5: 调目标工具
  let rpcReq;
  if (toolName === 'tools/list') {
    rpcReq = { jsonrpc: '2.0', id: ++idCounter, method: 'tools/list', params: {} };
  } else {
    rpcReq = { jsonrpc: '2.0', id: ++idCounter, method: 'tools/call', params: { name: toolName, arguments: toolArgs } };
  }
  console.log('→', rpcReq.method, toolName);
  await fetch(MSG_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rpcReq)
  });

  // Step 6: 读响应（等最终结果）
  const result = await readUntilId(reader, decoder, String(idCounter), 20000);
  if (result) {
    // 截图类响应：提取 image content 存文件
    const content = result?.result?.content;
    if (Array.isArray(content)) {
      const img = content.find(c => c.type === 'image' && c.data);
      if (img && outputPath) {
        writeFileSync(outputPath, Buffer.from(img.data, 'base64'));
        console.log('\n🖼️ 截图已保存:', outputPath, '(' + Math.round(img.data.length * 3 / 4 / 1024) + ' KB)');
      }
      const texts = content.filter(c => c.type === 'text').map(c => c.text);
      if (texts.length) console.log('\n✅ 文本响应:\n' + texts.join('\n').slice(0, 4000));
    } else {
      console.log('\n✅ 最终响应:');
      console.log(JSON.stringify(result, null, 2).slice(0, 8000));
    }
  } else {
    console.log('\n⏰ 超时没收到响应');
  }
  process.exit(0);
}

async function readUntilId(reader, decoder, targetId, timeoutMs = 5000) {
  const start = Date.now();
  let buffer = '';
  while (Date.now() - start < timeoutMs) {
    const { value, done } = await reader.read();
    if (done) return null;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf('\n\n')) >= 0) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const lines = chunk.split('\n');
      let data = '';
      for (const l of lines) {
        if (l.startsWith('data:')) data += (data ? '\n' : '') + l.slice(5).trim();
      }
      if (!data) continue;
      console.log('←', data.slice(0, 300));
      // 尝试解析 JSON-RPC 响应
      if (data.startsWith('{')) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.id !== undefined && String(parsed.id) === targetId) {
            return parsed;
          }
          // 也可能是有 id 字段的响应
          if (parsed.id !== undefined) {
            // 打印看看
            if (parsed.result) console.log('  (intermediate result)');
            if (parsed.error) console.log('  (intermediate error):', parsed.error);
          }
        } catch { /* 不是 JSON，忽略 */ }
      }
    }
  }
  return null;
}

main().catch(e => console.error('💥', e));
