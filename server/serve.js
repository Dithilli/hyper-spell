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
const { WebSocketServer } = require('ws');
const { isPublicRealPath, resolveStaticPath } = require('./static-path');

const PORT = process.env.PORT || 8787;
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
function appendTelemetry(body, res) {
  let json;
  try { json = JSON.parse(body); } catch { res.writeHead(400); res.end('bad json'); return; }
  fs.mkdir(TEL_DIR, { recursive: true }, (mkErr) => {
    if (mkErr) { res.writeHead(500); res.end('mkdir failed'); return; }
    fs.appendFile(TEL_FILE, JSON.stringify(json) + '\n', (err) => {
      if (err) { res.writeHead(500); res.end('write failed'); return; }
      res.writeHead(204); res.end();
    });
  });
}

const server = http.createServer((req, res) => {
  let urlPath;
  try { urlPath = decodeURIComponent(req.url.split('?')[0]); }
  catch { res.writeHead(400); res.end('bad url'); return; }
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
const wss = new WebSocketServer({ server, path: '/ws' });
let host = null;
const clients = new Map(); // cid -> ws
let nextCid = 1;

function send(ws, msg) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg));
}

wss.on('connection', (ws) => {
  const cid = nextCid++;
  ws.cid = cid;
  send(ws, { t: 'welcome', cid, hostPresent: !!host });

  ws.on('message', (raw) => {
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
        for (const c of clients.values()) send(c, msg);
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
  console.log(`\n  HyperSpell server running:`);
  console.log(`    you (host):  http://localhost:${PORT}`);
  for (const ip of ips) console.log(`    players:     http://${ip}:${PORT}`);
  console.log('');
});
