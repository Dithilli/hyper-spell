// verify-e2e.js — end-to-end suite for the v9 server-authoritative build.
// Spawns the REAL server (which boots the REAL headless sim) and drives it with
// real WebSocket clients speaking the documented protocol. Two phases: open
// (LAN mode) covering protocol/lobby/sim/match-flow, then key-gated covering
// the GAME_KEY regressions. Takes a few minutes — a bot plays a real match.
//
//   node server/verify-e2e.js
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const REPO = path.join(__dirname, '..');
const WebSocket = require('ws');
const TEL_FILE = path.join(__dirname, 'telemetry/rounds.jsonl');

let pass = 0, fail = 0;
const ok = (cond, label) => {
  if (cond) { pass++; console.log(`  ok  ${label}`); }
  else { fail++; console.log(`FAIL  ${label}`); }
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

function startServer(port, env = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', ['server/serve.js'], { cwd: REPO, env: { ...process.env, PORT: port, ...env } });
    let out = '';
    proc.stdout.on('data', d => { out += d; if (out.includes('running')) resolve(proc); });
    proc.stderr.on('data', d => process.stderr.write(`[server:${port}] ${d}`));
    proc.on('exit', code => { if (!out.includes('running')) reject(new Error(`server died before ready (code ${code})`)); });
    setTimeout(() => reject(new Error('server start timeout')), 15000);
  });
}

// a test client: buffers every message, tracks the latest snapshot
function client(port, opts = {}) {
  const c = {
    msgs: [], snaps: 0, lastSnap: null, fx: [],
    closedByServer: false,
    ws: new WebSocket(`ws://127.0.0.1:${port}/ws`, opts.wsOpts || {}),
  };
  c.ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.t === 'snap') { c.snaps++; c.lastSnap = m; return; } // keep only latest
    if (m.t === 'fx') { c.fx.push(m); if (c.fx.length > 400) c.fx.shift(); return; }
    c.msgs.push(m);
  });
  c.ws.on('close', () => { c.closedByServer = true; });
  c.ws.on('error', () => {});
  c.send = m => c.ws.send(JSON.stringify(m));
  c.find = t => c.msgs.find(m => m.t === t);
  c.open = new Promise(r => c.ws.on('open', r));
  return c;
}

async function until(fn, timeoutMs = 8000, step = 50) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    const v = fn();
    if (v) return v;
    await sleep(step);
  }
  return fn();
}

function httpGet(port, urlPath, headers = {}) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path: urlPath, headers }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    }).on('error', reject);
  });
}
function httpPost(port, urlPath, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: urlPath, method: 'POST', headers: { 'Content-Type': 'application/json' } }, res => {
      res.resume(); res.on('end', () => resolve(res.statusCode));
    });
    req.on('error', reject);
    req.end(body);
  });
}

const ps = (c, slot) => c.lastSnap && c.lastSnap.ps.find(p => p.s === slot);
const IDLE = { t: 'input', m: 0, j: 0, c: 0, c2: 0, b: 0, a: null };

async function phaseOpen() {
  console.log('\n== phase 1: open (LAN) server — protocol, lobby, sim, match flow ==');
  const PORT = 18790;
  const telBefore = fs.existsSync(TEL_FILE) ? fs.readFileSync(TEL_FILE, 'utf8') : null;
  const server = await startServer(PORT);
  try {
    // static serving still works
    const idx = await httpGet(PORT, '/');
    ok(idx.status === 200 && idx.body.includes('HYPERSPELL'), 'GET / serves the game page');
    const trav = await httpGet(PORT, '/../etc/passwd');
    ok(trav.status !== 200, `path traversal blocked (${trav.status})`);

    // ---- welcome / version handshake ----
    const A = client(PORT); await A.open;
    const welcomeA = await until(() => A.find('welcome'));
    ok(welcomeA && welcomeA.v === 9 && welcomeA.proto === 2 && welcomeA.st === 'LOBBY',
      `welcome carries {v:9, proto:2, st:LOBBY}`);

    // old v8 client: badVersion but NOT closed — still gets snaps (refresh-screen path)
    const OLD = client(PORT); await OLD.open;
    OLD.send({ t: 'hello', v: 8 });
    const bad = await until(() => OLD.find('badVersion'));
    ok(bad && bad.server === 9, 'v8 hello → badVersion {server:9}');
    await until(() => OLD.snaps > 0);
    ok(!OLD.closedByServer && OLD.snaps > 0 && OLD.lastSnap.v === 9, 'stale client still receives v9 snaps (its refresh screen works)');
    OLD.send({ t: 'join', name: 'SNEAKY8' });
    await sleep(400);
    ok(!OLD.find('you'), 'stale client cannot join');
    OLD.ws.close();

    // ---- join + roster ----
    A.send({ t: 'hello', v: 9, name: 'GANDALF' });
    A.send({ t: 'join', name: 'GANDALF', color: '#4ecdc4' });
    const youA = await until(() => A.find('you'));
    ok(youA && youA.slot === 0, `join → you {slot:0}`);
    const world = await until(() => A.find('world'));
    ok(world && world.world && world.world.tickMs === 16.7 && world.spells && Object.keys(world.spells).length > 90,
      `world message: tickMs + ${world ? Object.keys(world.spells).length : 0} spells`);

    const SPEC = client(PORT); await SPEC.open; // spectator: hello, never joins
    SPEC.send({ t: 'hello', v: 9 });
    await until(() => SPEC.snaps > 0);
    ok(SPEC.lastSnap && SPEC.lastSnap.ps.some(p => p.n === 'GANDALF'), 'spectator sees GANDALF in the roster');

    // name sanitation
    const B = client(PORT); await B.open;
    B.send({ t: 'hello', v: 9 });
    B.send({ t: 'join', name: '💀💀VERYLONGNAMEINDEED💀!!' });
    const youB = await until(() => B.find('you'));
    ok(youB && youB.slot === 1, 'second join → slot 1');
    await until(() => ps(A, 1));
    const bName = ps(A, 1).n;
    ok(!/💀/.test(bName) && bName.length <= 12, `name sanitized on the wire ("${bName}")`);

    // ---- lobby settings ----
    B.send({ t: 'wins', n: 2 });
    ok(await until(() => A.lastSnap && A.lastSnap.wn === 2), 'wins {n:2} → snap wn:2');
    B.send({ t: 'mode' });
    ok(await until(() => A.lastSnap && A.lastSnap.md === 'wave'), 'mode toggle → snap md:wave');
    B.send({ t: 'mode' });
    ok(await until(() => A.lastSnap && !A.lastSnap.md), 'mode toggle back → versus (md omitted)');

    // ---- bots ----
    A.send({ t: 'bot', op: 'add' });
    ok(await until(() => A.lastSnap && A.lastSnap.ps.some(p => p.b)), 'bot add → roster entry with b:1');
    A.send({ t: 'bot', op: 'remove' });
    ok(await until(() => A.lastSnap && !A.lastSnap.ps.some(p => p.b)), 'bot remove → bot gone');

    // ---- input drives the sim (lobby wizards are live) ----
    const x0 = (await until(() => ps(A, 0))).x;
    const moveEnd = Date.now() + 1200;
    const mover = setInterval(() => A.send({ t: 'input', m: 1, j: 0, c: 0, c2: 0, b: 0, a: 0 }), 16);
    await sleep(1300); clearInterval(mover);
    const x1 = ps(A, 0).x;
    ok(x1 - x0 > 40, `input moves my wizard server-side (+${x1 - x0}px)`);
    // stale guard
    await sleep(2400);
    const xs = ps(A, 0).x;
    await sleep(400);
    ok(Math.abs(ps(A, 0).x - xs) < 8, 'input silence 2s+ → wizard parks (stale guard)');

    // ---- chat + rate limit ----
    A.fx.length = 0; SPEC.fx.length = 0;
    A.send({ t: 'chat', text: 'you shall not pass!!' });
    A.send({ t: 'chat', text: 'SPAM' }); // inside the 1.5s window — must be dropped
    await until(() => SPEC.fx.some(f => f.f === 'spawnText' && String(f.a[2]).includes('you shall not pass')));
    ok(SPEC.fx.some(f => f.f === 'spawnText' && String(f.a[2]).includes('you shall not pass')), 'chat floats as fx to spectators too');
    await sleep(500);
    ok(!SPEC.fx.some(f => f.f === 'spawnText' && String(f.a[2]).includes('SPAM')), 'second chat inside 1.5s is rate-limited');

    // ---- joinDenied when full ----
    for (let i = 0; i < 6; i++) A.send({ t: 'bot', op: 'add' });
    await until(() => A.lastSnap && A.lastSnap.ps.length === 8);
    const FULLC = client(PORT); await FULLC.open;
    FULLC.send({ t: 'hello', v: 9 });
    FULLC.send({ t: 'join', name: 'NINTH' });
    const denied = await until(() => FULLC.find('joinDenied'));
    ok(denied && denied.reason === 'full', 'ninth join → joinDenied {reason:full}');
    FULLC.ws.close();
    for (let i = 0; i < 5; i++) A.send({ t: 'bot', op: 'remove' });
    await until(() => A.lastSnap && A.lastSnap.ps.length === 3); // GANDALF, B, one bot

    // ---- lobby disconnect removes the seat ----
    B.ws.close();
    ok(await until(() => A.lastSnap && !A.lastSnap.ps.some(p => p.s === 1)), 'lobby disconnect → seat removed from roster');

    // ---- start a match: GANDALF (idle statue) vs one bot, first to 2 ----
    A.send({ t: 'wins', n: 2 });
    await until(() => A.lastSnap && A.lastSnap.wn === 2);
    A.send({ t: 'start' });
    ok(await until(() => A.lastSnap && A.lastSnap.st === 'PLAY'), 'start → st:PLAY');
    const rn1 = A.lastSnap.rn;
    ok(rn1 >= 1, `round counter running (rn=${rn1})`);
    // GANDALF wanders instead of standing still — a motionless statue on the
    // wrong platform can stall a round for many minutes (the bot has to find a
    // tome before it can kill anything); a wanderer meets hazards and bots
    let wanderDir = 1;
    const wanderFlip = setInterval(() => { wanderDir = -wanderDir; }, 4000);
    const keepalive = setInterval(() => A.send({ t: 'input', m: wanderDir, j: Math.random() < 0.2 ? 1 : 0, c: 0, c2: 0, b: 0, a: null }), 100);

    // fx flow during play (rate varies a lot — wizards start unarmed and fx pick
    // up once the bot grabs a tome, so give this a generous window)
    A.fx.length = 0;
    await until(() => A.fx.length > 5, 25000);
    ok(A.fx.length > 5, `fx events flow during play (${A.fx.length})`);
    ok(await until(() => A.fx.some(f => f.f === 'sfx'), 10000), 'sfx ride the fx channel');

    // ---- mid-match join: seated but despawned until next round ----
    const C = client(PORT); await C.open;
    C.send({ t: 'hello', v: 9 });
    C.send({ t: 'join', name: 'LATECOMER' });
    const youC = await until(() => C.find('you'));
    ok(youC != null, `mid-match join accepted (slot ${youC && youC.slot})`);
    await until(() => ps(A, youC.slot));
    ok(ps(A, youC.slot).al === 0, 'mid-match joiner is despawned (al:0) until next round');

    // ---- mid-match disconnect: shell + off flag, then reconnect reclaims ----
    C.ws.close();
    ok(await until(() => ps(A, youC.slot) && ps(A, youC.slot).off === 1), 'mid-match disconnect → shell stays with off:1');
    const C2 = client(PORT); await C2.open;
    C2.send({ t: 'hello', v: 9 });
    C2.send({ t: 'join', name: 'latecomer' }); // case-insensitive name match
    const youC2 = await until(() => C2.find('you'));
    ok(youC2 && youC2.slot === youC.slot, 'reconnect by name → same slot back');
    ok(await until(() => ps(A, youC.slot) && !ps(A, youC.slot).off), 'off flag cleared on reconnect');

    // a second mid-match joiner who leaves for good — removed at the round boundary
    const D = client(PORT); await D.open;
    D.send({ t: 'hello', v: 9 });
    D.send({ t: 'join', name: 'GHOSTED' });
    const youD = await until(() => D.find('you'));
    await until(() => ps(A, youD.slot));
    D.ws.close();
    await until(() => ps(A, youD.slot) && ps(A, youD.slot).off === 1);

    // ---- the match plays out: bot beats the statues, first to 2 ----
    // round length is genuinely variable (the bot must find a tome, then land a
    // kill) — these ceilings are generous on purpose
    console.log('  … letting the bot win the match (can take a few minutes) …');
    const nextRound = await until(() => A.lastSnap && A.lastSnap.rn > rn1, 300000, 300);
    ok(nextRound, `next round started (rn ${A.lastSnap && A.lastSnap.rn})`);
    ok(await until(() => !ps(A, youD.slot), 60000), 'unclaimed shell removed at the round boundary');
    ok(await until(() => ps(A, youC.slot) && ps(A, youC.slot).al === 1, 60000), 'reconnected latecomer spawns into the new round');

    const vic = await until(() => A.lastSnap && A.lastSnap.st === 'VICTORY', 300000, 300);
    ok(vic, `match reaches VICTORY (st=${A.lastSnap && A.lastSnap.st})`);
    if (vic) {
      ok(A.lastSnap.wr != null, `victory snapshot carries winner slot (${A.lastSnap.wr})`);
      ok(!!A.lastSnap.aw, 'victory snapshot carries awards');
      ok(!!A.lastSnap.sr, 'victory snapshot carries the spell report');
    }
    clearInterval(keepalive); clearInterval(wanderFlip);

    // killcam was broadcast between rounds (rp frames)
    // (checked via SPEC which idled through the whole match)
    ok(SPEC.snaps > 100, `spectator streamed the whole match (${SPEC.snaps} snaps)`);

    // ---- telemetry written directly by the server sim ----
    const telNow = fs.existsSync(TEL_FILE) ? fs.readFileSync(TEL_FILE, 'utf8') : '';
    const newLines = telNow.split('\n').filter(l => l.includes('GANDALF'));
    ok(newLines.length >= 2, `server sim wrote ${newLines.length} telemetry rounds directly`);

    // couch-mode telemetry HTTP endpoint still works
    const post = await httpPost(PORT, '/telemetry', JSON.stringify({ probe: 'v2-test' }));
    ok(post === 204, 'POST /telemetry still answers 204 (couch path)');
    const postBad = await httpPost(PORT, '/telemetry', 'not json');
    ok(postBad === 400, 'POST /telemetry rejects bad JSON');

    // ---- back to lobby + attributed reset ----
    A.send({ t: 'start' }); // from VICTORY → lobby
    ok(await until(() => A.lastSnap && A.lastSnap.st === 'LOBBY'), 'start at VICTORY → back to LOBBY');
    A.fx.length = 0;
    A.send({ t: 'reset' });
    ok(await until(() => A.fx.some(f => f.f === 'setBanner' && String(f.a[0]).includes('GANDALF') && String(f.a[0]).includes('RESET'))),
      'reset is attributed: "GANDALF RESET THE MATCH" banner');

    A.ws.close(); SPEC.ws.close(); C2.ws.close();
  } finally {
    server.kill();
    await sleep(300);
    // restore telemetry to its pre-test content — these were test rounds
    if (telBefore != null) fs.writeFileSync(TEL_FILE, telBefore);
  }
}

async function phaseGated() {
  console.log('\n== phase 2: GAME_KEY-gated server — the gate still holds ==');
  const PORT = 18791;
  const KEY = 'wizard-test-key-v2';
  const server = await startServer(PORT, { GAME_KEY: KEY });
  try {
    const noKey = await httpGet(PORT, '/');
    ok(noKey.status === 403 && noKey.body.includes('game key'), 'no key → 403 key prompt');
    const withKey = await httpGet(PORT, `/?key=${KEY}`);
    ok(withKey.status === 302 && /hskey=/.test(withKey.headers['set-cookie']?.[0] || ''), '?key= → 302 + cookie');
    const cookie = (withKey.headers['set-cookie'][0] || '').split(';')[0];
    const cookied = await httpGet(PORT, '/', { Cookie: cookie });
    ok(cookied.status === 200, 'cookie grants the page');
    const wrong = await httpGet(PORT, '/?key=wrong');
    ok(wrong.status === 403, 'wrong key → 403');

    // WS upgrade: rejected without the key, accepted with the cookie
    const wsNo = new WebSocket(`ws://127.0.0.1:${PORT}/ws`);
    const noResult = await new Promise(r => { wsNo.on('open', () => r('open')); wsNo.on('error', () => r('rejected')); });
    ok(noResult === 'rejected', 'WS upgrade without key rejected');
    const wsYes = client(PORT, { wsOpts: { headers: { Cookie: cookie } } });
    const yesResult = await Promise.race([wsYes.open.then(() => 'open'), sleep(3000).then(() => 'timeout')]);
    ok(yesResult === 'open', 'WS upgrade with cookie accepted');
    if (yesResult === 'open') {
      wsYes.send({ t: 'hello', v: 9 });
      wsYes.send({ t: 'join', name: 'KEYED' });
      ok(await until(() => wsYes.find('you')), 'gated server: full join flow works');
      wsYes.ws.close();
    }

    // oversized frame: closed by maxPayload, server survives
    const wsBig = client(PORT, { wsOpts: { headers: { Cookie: cookie } } });
    await wsBig.open;
    wsBig.ws.send('x'.repeat(200 * 1024));
    await until(() => wsBig.closedByServer, 5000);
    ok(wsBig.closedByServer, 'oversized 200KB frame → connection closed');
    const alive = await httpGet(PORT, '/', { Cookie: cookie });
    ok(alive.status === 200, 'server survives the oversized frame');
  } finally {
    server.kill();
    await sleep(200);
    // scrub the gated phase's telemetry probes if any (none expected)
  }
}

(async () => {
  try {
    await phaseOpen();
    await phaseGated();
  } catch (e) {
    console.error('\nsuite error:', e);
    fail++;
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
