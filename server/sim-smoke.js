// sim-smoke.js — headless proof the sim runs server-side: boots the vm context,
// adds bots, plays real matches, and asserts the invariants that matter (no
// draw-path execution, no NaN on the wire, state machine cycles, no leak growth
// across matches). Async, because the round flow schedules itself via setTimeout
// — the tick loop must yield to the event loop exactly like the real SimHost.
//
//   node server/sim-smoke.js            # one real match, ~a minute
//   node server/sim-smoke.js --long     # multi-match leak soak
'use strict';
const { performance } = require('perf_hooks');
const { createSimContext } = require('./sim-context');

const LONG = process.argv.includes('--long');
let pass = 0, fail = 0;
const ok = (cond, label) => {
  if (cond) { pass++; console.log(`  ok  ${label}`); }
  else { fail++; console.log(`FAIL  ${label}`); }
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

const fxLog = [];
const telLog = [];
const sim = createSimContext({
  emitFx: (f, a) => fxLog.push({ f, a }),
  postTelemetry: rec => telLog.push(rec),
});
const b = sim.bridge;

// the same loop shape as server/sim-host.js: ~60Hz, measured dt clamped at 33ms
let last = performance.now();
function tick() {
  const now = performance.now();
  const rawDt = Math.min(now - last, 33);
  last = now;
  b.stepSim(now, rawDt);
}
async function tickFor(ms) {
  const end = performance.now() + ms;
  while (performance.now() < end) { tick(); await sleep(16); }
}
async function tickUntil(cond, timeoutMs, label) {
  const end = performance.now() + timeoutMs;
  while (performance.now() < end) {
    tick();
    if (cond()) return true;
    await sleep(16);
  }
  return cond();
}
const snapNow = () => b.takeWireSnapshot(performance.now());

async function main() {
  ok(b.GAME_VERSION >= 9, `context loaded, GAME_VERSION=${b.GAME_VERSION}`);
  ok(b.state() === 'LOBBY', 'boots into LOBBY');

  // ---- lobby commands ----
  const s0 = b.addPlayer({ name: 'SMOKE-A', color: '#4ecdc4' });
  const s1 = b.addPlayer({ name: 'SMOKE-B' });
  ok(s0 === 0 && s1 === 1, `two players joined, slots ${s0},${s1}`);
  b.addBot(); b.addBot();
  ok(b.playerCount() === 4, 'two bots added');
  b.setWins({ n: 1 });
  await tickFor(120);
  const lobbySnap = snapNow();
  ok(lobbySnap.st === 'LOBBY' && lobbySnap.wn === 1, 'lobby snapshot: st + win target');
  ok(lobbySnap.ps.length === 4, 'lobby snapshot: 4 players');
  ok(lobbySnap.ps.filter(p => p.b).length === 2, 'bots flagged b:1 in snapshot');

  // ---- input drives a wizard (lobby wizards are live physics bodies) ----
  await tickFor(300);
  const before = snapNow().ps.find(p => p.s === s0);
  const endMove = performance.now() + 1000;
  while (performance.now() < endMove) {
    b.setInput(s0, { m: 1, j: 0, c: 0, c2: 0, b: 0, a: 0 });
    tick();
    await sleep(16);
  }
  const after = snapNow().ps.find(p => p.s === s0);
  ok(after.x - before.x > 40, `input moves the wizard server-side (+${after.x - before.x}px)`);
  b.setInput(s0, { m: 0, j: 0, c: 0, c2: 0, b: 0, a: null });

  // ---- stale guard: 2s of silence zeroes the input ----
  await tickFor(2300);
  const idle1 = snapNow().ps.find(p => p.s === s0);
  await tickFor(300);
  const idle2 = snapNow().ps.find(p => p.s === s0);
  ok(Math.abs(idle2.x - idle1.x) < 8, 'stale input guard: silent wizard stops');

  // ---- a real match runs to VICTORY ----
  // deterministic and quick: one bot vs one idle statue, win target 1 — the bot
  // wins round 1 in seconds. (Bot-vs-bot brawls can stall for minutes.)
  b.removePlayer(s1);
  b.removeBot();
  ok(b.playerCount() === 2, 'roster trimmed to statue + bot for the match');
  b.start();
  ok(b.state() === 'PLAY', 'start → PLAY');
  const reached = await tickUntil(() => b.state() === 'VICTORY', LONG ? 240000 : 150000, 'victory');
  ok(reached, `match reaches VICTORY (state=${b.state()})`);
  const vicSnap = snapNow();
  ok(vicSnap && vicSnap.wr != null, 'victory snapshot carries winner slot');
  ok(vicSnap && !!vicSnap.aw, 'victory snapshot carries awards');
  ok(telLog.length >= 1, `telemetry flushed (${telLog.length} round records)`);
  ok(fxLog.length > 50, `fx events emitted (${fxLog.length})`);
  ok(fxLog.some(e => e.f === 'sfx'), 'sfx events ride the fx channel');

  // ---- NaN sweep ----
  function nanSweep(obj, path = '') {
    if (typeof obj === 'number') return Number.isFinite(obj) ? null : path;
    if (Array.isArray(obj)) { for (let i = 0; i < obj.length; i++) { const r = nanSweep(obj[i], `${path}[${i}]`); if (r) return r; } return null; }
    if (obj && typeof obj === 'object') { for (const [k, v] of Object.entries(obj)) { const r = nanSweep(v, `${path}.${k}`); if (r) return r; } return null; }
    return null;
  }
  const nanPath = nanSweep(vicSnap);
  ok(!nanPath, nanPath ? `NaN/Infinity at ${nanPath}` : 'no NaN/Infinity anywhere in snapshot');
  ok(!!JSON.stringify(vicSnap), 'snapshot JSON-serializable');

  // ---- rematch → LOBBY, roster ops, leak audit ----
  b.start(); // from VICTORY → resetMatch → LOBBY
  ok(b.state() === 'LOBBY', 'start at VICTORY → back to LOBBY');
  b.removePlayer(s0);
  ok(b.playerCount() === 1, 'human seat removed, bot remains');
  b.removeBot();
  ok(b.playerCount() === 0, 'bot removed');
  b.reset('SMOKE');
  await tickFor(200);
  const audit = b.audit();
  ok(audit.projectiles === 0 && audit.summons === 0 && audit.gibs === 0, 'no live projectiles/summons/gibs after reset');
  ok(fxLog.some(e => e.f === 'setBanner' && String(e.a[0]).includes('RESET')), 'attributed reset banner emitted');

  // ---- the tripwire: nothing headless ever touched a canvas context ----
  ok(sim.ctxCounter.calls === 0, `zero ctx-proxy invocations (got ${sim.ctxCounter.calls})`);

  if (LONG) {
    console.log('\n-- long soak: 5 matches back to back --');
    const heap0 = process.memoryUsage().heapUsed;
    const bodies0 = b.audit().bodies;
    for (let match = 0; match < 5; match++) {
      b.addBot(); b.addBot(); b.setWins({ n: 1 }); b.start();
      await tickUntil(() => b.state() === 'VICTORY', 240000, 'soak victory');
      b.start();
      b.removeBot(); b.removeBot();
      global.gc?.();
      console.log(`  match ${match + 1}: state=${b.state()} bodies=${b.audit().bodies} heap=${Math.round(process.memoryUsage().heapUsed / 1e6)}MB`);
    }
    ok(b.audit().bodies <= bodies0 + 8, `bodies bounded across soak (${bodies0} → ${b.audit().bodies})`);
    const heap1 = process.memoryUsage().heapUsed;
    ok(heap1 < heap0 * 3, `heap bounded across soak (${Math.round(heap0 / 1e6)}MB → ${Math.round(heap1 / 1e6)}MB)`);
    ok(sim.ctxCounter.calls === 0, 'ctx still untouched after soak');
  }

  sim.destroy();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
