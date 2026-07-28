// serve.js — the HyperSpell game server: serves the game over HTTP and RUNS THE
// MATCH — the simulation lives here (headless; see sim-host.js), every browser
// is a client that sends inputs and renders snapshots.
//
//   cd server && npm install && node serve.js
//   everyone: open http://<server-ip>:8787 → PLAY ONLINE
//
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const { isPublicRealPath, resolveStaticPath } = require('./static-path');
const { appendTelemetryRecord } = require('./telemetry-sink');
const { SimHost } = require('./sim-host');
const { Room } = require('./room');

const PORT = process.env.PORT || 8787;

// ---- shared-key gate (GAME_KEY): for hosting beyond a trusted LAN ----
// Unset (LAN/tailnet mode): everything stays open, byte-for-byte the old behavior.
// Set: every HTTP request and WS upgrade must present the key. The flow is
// invite-link shaped: the first visit lands with ?key=XYZ, we answer with a
// cookie + redirect to a clean URL, and the browser then sends the cookie on
// everything — including the WebSocket upgrade, so net.js needs no changes.
const GAME_KEY = process.env.GAME_KEY || '';
function keyMatches(candidate) {
  if (!candidate) return false;
  const a = Buffer.from(String(candidate)), b = Buffer.from(GAME_KEY);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function isAuthed(req) {
  if (!GAME_KEY) return true;
  let url;
  try { url = new URL(req.url, 'http://x'); } catch { return false; }
  if (keyMatches(url.searchParams.get('key'))) return true;
  const cookie = /(?:^|;\s*)hskey=([^;]*)/.exec(req.headers.cookie || '');
  if (cookie) { try { if (keyMatches(decodeURIComponent(cookie[1]))) return true; } catch {} }
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') && keyMatches(auth.slice(7));
}
// returns true if the request may proceed; otherwise it has been fully answered
// (cookie-setting redirect for a fresh invite link, or the key prompt page)
function gateRequest(req, res) {
  if (!GAME_KEY) return true;
  if (isAuthed(req)) {
    let url;
    try { url = new URL(req.url, 'http://x'); } catch { return true; }
    if (!url.searchParams.has('key')) return true;
    // Secure only when the proxy says https — a bare-IP LAN test still works
    const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
    url.searchParams.delete('key');
    res.writeHead(302, {
      'Set-Cookie': `hskey=${encodeURIComponent(GAME_KEY)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`,
      Location: url.pathname + url.search,
      'Cache-Control': 'no-store',
    });
    res.end();
    return false;
  }
  res.writeHead(403, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' });
  res.end(`<!doctype html><body style="background:#0d0a14;color:#e8d5ff;font-family:Georgia,serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
    <form style="text-align:center"><div style="font-size:28px;margin-bottom:6px">HYPERSPELL</div>
    <div style="color:#9c8ab8;font-size:14px;margin-bottom:14px">this server needs a game key — check the team invite</div>
    <input name="key" autofocus autocomplete="off" style="padding:10px 16px;font-size:16px;background:transparent;border:2px solid #675a7d;color:#e8d5ff;border-radius:8px;text-align:center">
    </form></body>`);
  return false;
}
const ROOT = path.join(__dirname, '..');
const ROOT_REAL = fs.realpathSync(ROOT);
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.json': 'application/json', '.md': 'text/markdown',
};

// balance telemetry: couch-mode browsers POST one record per round; server-side
// matches append directly through the same capped sink (telemetry-sink.js).
function appendTelemetry(body, res) {
  let json;
  try { json = JSON.parse(body); } catch { res.writeHead(400); res.end('bad json'); return; }
  appendTelemetryRecord(json, (err) => {
    if (err) { res.writeHead(500); res.end(err); return; }
    res.writeHead(204); res.end();
  });
}

const server = http.createServer((req, res) => {
  let urlPath;
  try { urlPath = decodeURIComponent(req.url.split('?')[0]); }
  catch { res.writeHead(400); res.end('bad url'); return; }
  if (!gateRequest(req, res)) return;
  if (req.method === 'POST' && urlPath === '/telemetry') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 1e6) req.destroy(); }); // cap at ~1MB
    req.on('end', () => appendTelemetry(body, res));
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return;
  }
  const resolved = resolveStaticPath(ROOT, req.url);
  if (resolved.status !== 200) {
    res.writeHead(resolved.status); res.end(resolved.status === 400 ? 'bad url' : 'forbidden'); return;
  }
  fs.realpath(resolved.file, (realErr, file) => {
    if (realErr) { res.writeHead(404); res.end('not found'); return; }
    if (!isPublicRealPath(ROOT_REAL, file)) { res.writeHead(403); res.end('forbidden'); return; }
    fs.readFile(file, (readErr, data) => {
      if (readErr) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(req.method === 'HEAD' ? undefined : data);
    });
  });
});

// ---- the match: headless sim + one room ----
// permessage-deflate: snapshot JSON is full of repeated keys and compresses
// ~4x. Only frames >1KB get compressed, so 60Hz inputs stay zero-overhead.
// maxPayload: the biggest legit frame is a chat — 128KB bounds what a hostile
// sender can make us buffer/parse per message.
const wss = new WebSocketServer({
  server, path: '/ws', perMessageDeflate: { threshold: 1024 },
  maxPayload: 128 * 1024,
  verifyClient: ({ req }) => isAuthed(req),
});
const MAX_CONNS = Number(process.env.MAX_CONNS) || 40;

const simHost = new SimHost({
  telemetrySink: rec => appendTelemetryRecord(rec),
});
const room = new Room(simHost);

// internet NATs and sleeping laptops kill sockets without a FIN — ping every
// 30s and reap anything that stayed silent. Browsers answer pings automatically.
const pingTimer = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.silent) { ws.terminate(); continue; }
    ws.silent = true;
    ws.ping();
  }
}, 30000);

// a stopped server should leave nothing running behind it: the room's stats
// interval, this ping interval and the sim's own loop are all long-lived timers
let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  clearInterval(pingTimer);
  room.destroy();
  simHost.stop();
  wss.close();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000).unref(); // one stuck socket must not hold the box
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

wss.on('connection', (ws) => {
  if (wss.clients.size > MAX_CONNS) { ws.close(1013, 'server full'); return; }
  // game traffic is many small packets — Nagle batching just adds latency
  ws._socket.setNoDelay(true);
  // without this, any socket error (oversized frame, mid-frame disconnect)
  // becomes an unhandled 'error' event and takes down the whole process
  ws.on('error', (err) => console.log(`socket error: ${err.code || err.message}`));
  ws.on('pong', () => { ws.silent = false; });
  ws.on('message', () => { ws.silent = false; });
  room.addConn(ws);
});

// the sim is an ES module loaded through a dynamic import, so the port only
// opens once it is running — a client must never reach a room with no bridge
simHost.start().then(() => {
  server.listen(PORT, () => {
    const nets = os.networkInterfaces();
    const ips = Object.values(nets).flat().filter(n => n && n.family === 'IPv4' && !n.internal).map(n => n.address);
    const q = GAME_KEY ? `/?key=${encodeURIComponent(GAME_KEY)}` : '';
    console.log(`\n  HyperSpell server running${GAME_KEY ? ' (key-gated)' : ''} — the match runs here, everyone joins as a player:`);
    console.log(`    this machine: http://localhost:${PORT}${q}`);
    for (const ip of ips) console.log(`    players:      http://${ip}:${PORT}${q}`);
    console.log('');
  });
}).catch((err) => {
  console.error('sim failed to start:', err);
  process.exit(1);
});
