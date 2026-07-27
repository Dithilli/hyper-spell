// sim-smoke.js — headless proof the sim runs server-side: boots the sim, adds
// bots, plays real matches, and asserts the invariants that matter (no
// draw-path execution, no NaN on the wire, state machine cycles, no leak growth
// across matches). Async because it drives the sim the way the real SimHost
// does — one fixed step per event-loop turn — not because the sim needs the
// event loop: round flow is on the tick scheduler now (src/sim/schedule.js), so
// it advances with the steps below rather than with the wall clock.
//
//   node server/sim-smoke.js            # one real match, ~a minute
//   node server/sim-smoke.js --long     # multi-match leak soak
'use strict';
const { performance } = require('perf_hooks');


const LONG = process.argv.includes('--long');
let pass = 0, fail = 0;
const ok = (cond, label) => {
  if (cond) { pass++; console.log(`  ok  ${label}`); }
  else { fail++; console.log(`FAIL  ${label}`); }
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

const fxLog = [];
const telLog = [];
let sim = null, b = null, renderCanvas = null;

// the same loop shape as server/sim-host.js: one fixed step per iteration.
// stepSim takes nothing and keeps its own clock (simNow() = tick x TICK_MS), so
// the only thing the real clock still decides here is how many steps each
// tickFor / tickUntil window gets through. Round flow rides those steps: the
// scheduled callbacks (src/sim/schedule.js) are drained at the top of stepSim.
function tick() {
  b.stepSim();
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
const snapNow = () => b.takeWireSnapshot();

async function main() {
  const { createSim } = await import('../src/platform/node.js');
  renderCanvas = await import('../src/render/canvas.js');
  sim = createSim({
    onFx: (f, a) => fxLog.push({ f, a }),
    telemetrySink: rec => telLog.push(rec),
  });
  b = sim.bridge;

  ok(b.GAME_VERSION >= 9, `context loaded, GAME_VERSION=${b.GAME_VERSION}`);
  ok(b.state() === 'LOBBY', 'boots into LOBBY');
  ok(b.packStaged(), 'content-pack payload staged for the sim');
  const spells0 = b.spellCount();

  // ---- lobby commands ----
  const s0 = b.addPlayer({ name: 'SMOKE-A', color: '#4ecdc4' });
  const s1 = b.addPlayer({ name: 'SMOKE-B' });
  ok(s0 === 0 && s1 === 1, `two players joined, slots ${s0},${s1}`);
  b.setWins({ n: 1 });

  // ---- input drives a wizard (lobby wizards are live physics bodies) ----
  // no bots yet — a lobby bot shoving the test wizard makes these flaky
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

  b.addBot(); b.addBot();
  ok(b.playerCount() === 4, 'two bots added');
  await tickFor(120);
  const lobbySnap = snapNow();
  ok(lobbySnap.st === 'LOBBY' && lobbySnap.wn === 1, 'lobby snapshot: st + win target');
  ok(lobbySnap.ps.length === 4, 'lobby snapshot: 4 players');
  ok(lobbySnap.ps.filter(p => p.b).length === 2, 'bots flagged b:1 in snapshot');

  // ---- a real match runs to VICTORY ----
  // deterministic and quick: one bot vs one idle statue, win target 1 — the bot
  // wins round 1 in seconds. (Bot-vs-bot brawls can stall for minutes.)
  b.removePlayer(s1);
  b.removeBot();
  ok(b.playerCount() === 2, 'roster trimmed to statue + bot for the match');
  b.start();
  ok(b.state() === 'PLAY', 'start → PLAY');
  // the test wizard wanders (like the e2e suite's) — a motionless statue parked
  // on the wrong platform can be unreachable for some bot temperaments, and a
  // wanderer meets bots and hazards, so rounds actually resolve
  let wanderFlip = 1;
  const wanderTimer = setInterval(() => { wanderFlip = -wanderFlip; }, 4000);
  const wanderFeed = setInterval(() => {
    if (b.state() === 'PLAY') b.setInput(s0, { m: wanderFlip, j: Math.random() < 0.2 ? 1 : 0, c: 0, c2: 0, b: 0, a: null });
  }, 100);
  const reached = await tickUntil(() => b.state() === 'VICTORY', 300000, 'victory');
  clearInterval(wanderTimer); clearInterval(wanderFeed);
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

  // ---- content-pack probe path: ordinary names miss cleanly ----
  // joins above already scheduled probes (PBKDF2 → HMAC fingerprint → lookup
  // miss); give them time to finish and confirm nothing broke or unlocked
  await tickFor(1500);
  ok(b.spellCount() === spells0, `ordinary names don't unlock the pack (${spells0} spells before and after probes)`);
  ok(b.packStaged(), 'pack payload still staged (unclaimed)');

  // ---- the tripwire: nothing headless ever touched a canvas context ----
  // There is no fake canvas any more — src/sim cannot import one, so the only
  // way a draw path could have run is if the headless entry had acquired a real
  // context. It never calls initCanvas, so this stays null.
  ok(renderCanvas.ctx === null, `no drawing context was ever acquired (got ${renderCanvas.ctx})`);

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
    ok(renderCanvas.ctx === null, 'still no drawing context after soak');
  }

  sim.destroy();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
