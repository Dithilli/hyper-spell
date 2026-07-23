// serve.js — HyperSpell LAN server: serves the game over HTTP and relays
// host<->client messages over WebSocket on the same port.
//
//   cd server && npm install && node serve.js
//   host:    open http://localhost:8787       → click HOST ONLINE
//   players: open http://<your-ip>:8787       → click JOIN GAME
//
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const { isPublicRealPath, resolveStaticPath } = require('./static-path');

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

// balance telemetry: the host POSTs one JSON record per round; we append it as a
// line to telemetry/rounds.jsonl for offline analysis (see scripts/balance-report.js).
const TEL_DIR = path.join(__dirname, 'telemetry');
const TEL_FILE = path.join(TEL_DIR, 'rounds.jsonl');
// on a shared box the log must not grow without bound — past the cap we ack
// (204) but stop writing, so a long-lived server can't fill its disk
const TEL_MAX_BYTES = 50 * 1024 * 1024;
let telFullLogged = false;
function appendTelemetry(body, res) {
  let json;
  try { json = JSON.parse(body); } catch { res.writeHead(400); res.end('bad json'); return; }
  fs.mkdir(TEL_DIR, { recursive: true }, (mkErr) => {
    if (mkErr) { res.writeHead(500); res.end('mkdir failed'); return; }
    fs.stat(TEL_FILE, (stErr, st) => {
      if (!stErr && st.size > TEL_MAX_BYTES) {
        if (!telFullLogged) { telFullLogged = true; console.log(`telemetry file over ${TEL_MAX_BYTES / 1e6}MB — rotating stopped, dropping new rounds`); }
        res.writeHead(204); res.end(); return;
      }
      fs.appendFile(TEL_FILE, JSON.stringify(json) + '\n', (err) => {
        if (err) { res.writeHead(500); res.end('write failed'); return; }
        res.writeHead(204); res.end();
      });
    });
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

// ---- relay: one room, one host, many clients ----
// permessage-deflate: snapshot JSON is full of repeated keys and compresses
// ~4x. Only frames >1KB get compressed, so 60Hz inputs stay zero-overhead.
// maxPayload: the biggest legit frame is a mayhem snapshot (a few KB) — 128KB
// bounds what a hostile sender can make us buffer/parse per message
const wss = new WebSocketServer({
  server, path: '/ws', perMessageDeflate: { threshold: 1024 },
  maxPayload: 128 * 1024,
  verifyClient: ({ req }) => isAuthed(req),
});
const MAX_CONNS = Number(process.env.MAX_CONNS) || 40;
let host = null;
const clients = new Map(); // cid -> ws
let nextCid = 1;

function send(ws, msg) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg));
}

// a slow client's socket must never queue unboundedly — past this, droppable
// traffic (snapshots, fx) skips that client until its buffer drains. Snapshots
// are full-state, so the next one supersedes anything dropped: a lagging player
// gets a lower snapshot rate instead of seconds of accumulating delay.
const DROP_AT = 64 * 1024;

// visibility: every 10s, log which clients are shedding frames and how backed
// up their sockets are — this is the number that says "the pipe is too small"
const dropStats = new Map(); // cid -> frames dropped since last report
setInterval(() => {
  const lines = [];
  for (const c of clients.values()) {
    const d = dropStats.get(c.cid) || 0;
    if (d || c.bufferedAmount > 4096) lines.push(`cid${c.cid}: dropped ${d}, ${Math.round(c.bufferedAmount / 1024)}KB queued`);
  }
  dropStats.clear();
  if (lines.length) console.log(`[net ${new Date().toISOString().slice(11, 19)}] ${lines.join(' | ')}`);
}, 10000);

// internet NATs and sleeping laptops kill sockets without a FIN — ping every
// 30s and reap anything that stayed silent, so a zombie host can't hang the
// room until TCP gives up minutes later. Browsers answer pings automatically.
setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.silent) { ws.terminate(); continue; }
    ws.silent = true;
    ws.ping();
  }
}, 30000);

wss.on('connection', (ws) => {
  if (wss.clients.size > MAX_CONNS) { ws.close(1013, 'server full'); return; }
  const cid = nextCid++;
  ws.cid = cid;
  // game traffic is many small packets — Nagle batching just adds latency
  ws._socket.setNoDelay(true);
  // without this, any socket error (oversized frame, mid-frame disconnect)
  // becomes an unhandled 'error' event and takes down the whole process
  ws.on('error', (err) => console.log(`cid${cid} socket error: ${err.code || err.message}`));
  ws.on('pong', () => { ws.silent = false; });
  send(ws, { t: 'welcome', cid, hostPresent: !!host });

  ws.on('message', (raw) => {
    ws.silent = false;
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (msg.t === 'claimHost') {
      if (host && host !== ws) { send(ws, { t: 'hostTaken' }); return; }
      host = ws;
      ws.isHost = true;
      clients.delete(cid);
      send(ws, { t: 'youAreHost' });
      for (const c of clients.values()) send(c, { t: 'hostUp' });
      console.log(`host claimed by connection ${cid}`);
      return;
    }
    if (ws.isHost) {
      // host -> one client or broadcast
      if (msg.t === 'to') {
        send(clients.get(msg.cid), msg.msg);
      } else {
        // serialize once (was per client) and respect per-client backpressure
        const text = raw.toString();
        const droppable = msg.t === 'snap' || msg.t === 'fx';
        for (const c of clients.values()) {
          if (c.readyState !== 1) continue;
          if (droppable && c.bufferedAmount > DROP_AT) { dropStats.set(c.cid, (dropStats.get(c.cid) || 0) + 1); continue; }
          c.send(text);
        }
      }
    } else {
      // client -> host, stamped with sender id
      if (!clients.has(cid)) clients.set(cid, ws);
      msg.cid = cid;
      send(host, msg);
    }
  });

  ws.on('close', () => {
    if (ws.isHost) {
      host = null;
      for (const c of clients.values()) send(c, { t: 'hostLeft' });
      console.log('host left');
    } else {
      clients.delete(cid);
      send(host, { t: 'clientLeft', cid });
    }
  });
});

server.listen(PORT, () => {
  const nets = os.networkInterfaces();
  const ips = Object.values(nets).flat().filter(n => n && n.family === 'IPv4' && !n.internal).map(n => n.address);
  const q = GAME_KEY ? `/?key=${encodeURIComponent(GAME_KEY)}` : '';
  console.log(`\n  HyperSpell server running${GAME_KEY ? ' (key-gated)' : ''}:`);
  console.log(`    you (host):  http://localhost:${PORT}${q}`);
  for (const ip of ips) console.log(`    players:     http://${ip}:${PORT}${q}`);
  console.log('');
});
