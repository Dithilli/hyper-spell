#!/usr/bin/env node
// alinea-client.js — a headless HyperSpell wizard driven by A Linea (no browser).
//
// Synced to the SHIPPED contract in docs/ALINEA-CLIENT.md (ANSWERS, July 3 2026)
// and js/net.js. Updated 2026-07-09 for v4 "The Fusion Update" (branch alinea/two-slot-client),
// then again same day for v7: BLOCK/PARRY on the wire ({... b} — EDGE semantics: a fresh
// 0->1 fires one ~240ms parry that negates damage and reflects projectiles, then ~1.4s
// cooldown), wizards now carry 150 HP, and maps grew seeded stepping platforms +
// destructible cover (no client action needed — statics regenerate from the snapshot seed).
// Key corrections vs. the old guess-build:
//   - CAST IS HOLD, NOT EDGE. Keep c:1 and it auto-fires every cooldown. No pulsing.
//     (VERIFIED against the host: player.js casts on `c.cast` — the HELD flag — gated by
//     castSpell's internal cooldown. `castPressed`/the edge is ONLY for lobby-join & rematch.
//     A 2026-07-09 branch "fixed" this into an edge-pulse; that was a misread and roughly
//     HALVES the real fire rate. Do not reintroduce pulsing.)
//   - TWO SPELL SLOTS (v4): snapshot ps[] entries now carry s0/s1 (slot spell ids) and
//     c0/c1 (per-slot cooldown fraction, 1 = ready). Emit BOTH c (slot A) and c2 (slot B):
//     {t:'input', m, j, c, c2, a}. Hold both to keep both slots firing. FUSION IS NOT
//     CAST-TRIGGERED — the host fuses on TOME PICKUP (pickups.js tryFuse), automatically,
//     the instant you hold two spells whose schools match. Casting has nothing to do with
//     it. Legacy `sp` still present (active/primary slot).
//   - a = ABSOLUTE world radians, 0 = +x, POSITIVE = CLOCKWISE (screen-y down).
//     atan2(dy, dx) with downward-positive dy gives exactly this — no negation.
//   - m is WORLD-space (1 = +x/right). j: hold jumps when grounded; air jump needs 0->1 edge.
//   - Aim is last-known-at-cast-time; send a with c:1 anyway.
//   - Self = ps[] where s === slot (stable all session). vy is present.
//   - Re-plan trigger = rn (round counter) changes. Death = al:0.
//   - Tomes: touch to pick up (they're bodies l:'tome', ~20x24; we're r=15).
//   - Round 25 = shared boss (bs:{n,c,hp,mhp}, body l:'boss'). Party wipe resets wins.
//   - join: { t:'join', name(<=12), color '#rrggbb', hat '#rrggbb' }. Also send hello.
//   - Cadence: inputs ~60Hz; keep sending while idle (stale at 2000ms).
//
// World constants come from the {t:'world'} message on join — we read them live and
// only fall back to these defaults if it's missing.
//
// Usage:
//   node alinea-client.js ws://localhost:8787/ws
//   node alinea-client.js http://localhost:8787            (scheme + /ws fixed up)
//   DIFF=nightmare node alinea-client.js <url>
//   NAME="A LINEA" COLOR=#111111 node alinea-client.js <url>
//
// Difficulty:  beginner | casual | hard | nightmare   (default: casual)

const path = require('path');
const mem = require(path.join(__dirname, 'alinea-memory.js'));
const WebSocket = (() => {
  try { return require('ws'); }
  catch { return require(path.join(__dirname, 'server', 'node_modules', 'ws')); }
})();

const GAME_VERSION = 7; // must match js/core.js — the host warns the room about stale versions
const NAME = (process.env.NAME || 'Alinea').slice(0, 12);
const COLOR = process.env.COLOR || '#111111';   // black robes, per the shipped test 🖤
const HAT = process.env.HAT || '#111111';
const DIFF = (process.env.DIFF || 'casual').toLowerCase();

// ---- world defaults (overwritten by {t:'world'}) ----
const world = {
  W: 1280, H: 720, gravity: 0.6, gravityScale: 1, tickMs: 16.7,
  snapshotHz: 30, inputHz: 60, staleMs: 2000, playerRadius: 15,
  moveSpeed: 7, jumpVy: -15, airJumpVy: -13,
  defaultBolt: { speed: 20, vy: -6, gravityScale: 0.45 },
  fallSafeDropPx: 440,
};
let spells = {};   // spells[id] = { name, cooldown }

// ---- difficulty knobs ----
// reactionMs: how long we lag behind fresh info before acting on it.
// aimNoise:   stddev radians of jitter added to every aim.
// aimSlewRps: max radians/sec we can turn our aim (Infinity = instant snap).
// lead:       0 = aim where target IS; 1 = full ballistic lead using vx/vy.
// castChaos:  probability per decision of NOT holding cast even when we could (wasted cd).
// missBias:   extra flat aim offset scale (sloppiness that doesn't average out).
// blockSkill: probability of parrying an incoming projectile when the moment comes (v7).
const DIFFS = {
  beginner:  { reactionMs: 380, aimNoise: 0.22, aimSlewRps: 2.2, lead: 0.0, castChaos: 0.45, missBias: 0.10, blockSkill: 0.06 },
  casual:    { reactionMs: 200, aimNoise: 0.10, aimSlewRps: 5.0, lead: 0.4, castChaos: 0.18, missBias: 0.04, blockSkill: 0.25 },
  hard:      { reactionMs:  90, aimNoise: 0.035,aimSlewRps: 11,  lead: 0.85,castChaos: 0.05, missBias: 0.01, blockSkill: 0.6 },
  nightmare: { reactionMs:   0, aimNoise: 0.0,  aimSlewRps: Infinity, lead: 1.0, castChaos: 0.0, missBias: 0.0, blockSkill: 0.92 },
};
const K = DIFFS[DIFF] || DIFFS.casual;

// ---- url resolve ----
function resolveUrl(arg) {
  let u = arg || 'ws://localhost:8787/ws';
  u = u.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
  if (!/^wss?:/.test(u)) u = 'ws://' + u;
  if (!/\/ws$/.test(u)) u = u.replace(/\/+$/, '') + '/ws';
  return u;
}
const URL = resolveUrl(process.argv[2]);

// ---- state ----
let ws = null, myCid = null, mySlot = null, joined = false;
let snap = null;               // freshest snapshot
let lastRn = null;             // round counter — change ⇒ re-plan

// ---- learned biases, seeded from persistent play-memory at startup ----
const AVOID_SPELLS = new Set();
const DANGER_EVENTS = new Set();

// ---- persistent play-memory (learn across matches) ----
const LESSONS = mem.loadLessons();
let REC = null;                // MatchRecorder for the current match
let spellNames = {};           // id -> name, filled from {t:'world'}
// per-round tracking for kill/death attribution
let prevAlive = {};            // slot -> al last frame (to detect kills/my death)
let myPrevAlive = 1;
let curEvent = null;           // active environmental event this round
let curBoss = null;            // active boss name this round
let lastSpellHeld = null;      // my spellId at the moment things happened
function ensureRec() {
  if (!REC) REC = mem.newRecorder({ difficulty: DIFF, name: NAME, version: GAME_VERSION });
  return REC;
}
function commitMatch(reason) {
  if (REC && (REC.rec.rounds > 0 || REC.rec.kills > 0 || REC.rec.deaths > 0)) {
    REC.note(reason || 'match end');
    const L = REC.commit(spellNames);
    console.log(`[alinea] play-memory saved (${reason||'end'}) — lifetime: ${L.totals.matches} matches, ${L.totals.kills} kills / ${L.totals.deaths} deaths. dir: ${mem.DIR}`);
  }
  // myPrevAlive starts 0 so a dead post-match wizard isn't recorded as a fresh death
  REC = null; prevAlive = {}; myPrevAlive = 0; curEvent = null; curBoss = null;
}
// Startup: tell me what I already know.
(function reportKnowledge() {
  const t = LESSONS.totals;
  if (t.matches > 0) {
    console.log(`[alinea] play-memory loaded: ${t.matches} prior matches, ${t.kills}k/${t.deaths}d.`);
    const pref = (LESSONS.hints.preferSpells || []).slice(0, 3).map(s => s.name || s.id).filter(Boolean);
    if (pref.length) console.log(`[alinea] spells that have served me well: ${pref.join(', ')}`);
    const dang = (LESSONS.hints.dangerousEvents || []).map(e => e.event);
    if (dang.length) console.log(`[alinea] events that keep killing me: ${dang.join(', ')}`);
  } else {
    console.log('[alinea] play-memory: fresh — no prior matches. Everything I learn tonight persists.');
  }
  // seed learned biases into the sets the think-loop reads
  for (const s of (LESSONS.hints.avoidSpells || [])) if (s && s.id != null) AVOID_SPELLS.add(String(s.id));
  for (const e of (LESSONS.hints.dangerousEvents || [])) if (e && e.event) DANGER_EVENTS.add(e.event);
})();
let aimCur = 0;                // current (slewed) aim, radians
let lastLog = 0;
let prevGrounded = true;       // for air-jump edge
let wantAirJump = false;
// reaction buffer: we act on a snapshot delayed by reactionMs
const snapBuf = [];            // {t, snap}

function emit(msg) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg)); }

function connect() {
  console.log(`[alinea] connecting to ${URL} as "${NAME}" — difficulty: ${DIFF} 🖤`);
  ws = new WebSocket(URL);
  ws.on('open', () => {
    emit({ t: 'hello', v: GAME_VERSION });
    emit({ t: 'join', name: NAME, color: COLOR, hat: HAT });
    console.log('[alinea] socket open — hello + join sent. waiting for a slot…');
  });
  ws.on('message', raw => { let m; try { m = JSON.parse(raw); } catch { return; } handle(m); });
  ws.on('close', () => { console.log('[alinea] socket closed. retrying in 2s…'); reset(); setTimeout(connect, 2000); });
  ws.on('error', e => console.log('[alinea] ws error:', e.message));
}
function reset() { joined = false; mySlot = null; snap = null; snapBuf.length = 0; lastRn = null; }

function handle(msg) {
  switch (msg.t) {
    case 'welcome':
      myCid = msg.cid;
      console.log(`[alinea] welcome — cid ${myCid}, host present: ${msg.hostPresent}`);
      break;
    case 'you':
      mySlot = msg.slot; joined = true;
      console.log(`[alinea] IN THE GAME — slot ${mySlot} 🖤`);
      break;
    case 'world':
      Object.assign(world, msg.world || msg);   // tolerate {t:'world', world:{}} or flat
      if (msg.spells) spells = msg.spells;
      else if (msg.world && msg.world.spells) spells = msg.world.spells;
      for (const [id, s] of Object.entries(spells)) spellNames[id] = (s && s.name) || spellNames[id];
      console.log(`[alinea] world received — moveSpeed ${world.moveSpeed}, bolt speed ${world.defaultBolt && world.defaultBolt.speed}, ${Object.keys(spells).length} spells`);
      break;
    case 'snap':
      if (msg.rp) break; // killcam tape, not live state — don't learn from or act on reruns
      snap = msg;
      learnFromSnap(msg);
      snapBuf.push({ t: Date.now(), snap: msg });
      // trim buffer to what we could need for reaction delay
      const cutoff = Date.now() - (K.reactionMs + 500);
      while (snapBuf.length > 2 && snapBuf[0].t < cutoff) snapBuf.shift();
      if (!joined) emit({ t: 'join', name: NAME, color: COLOR, hat: HAT });
      break;
    case 'fx':
      // exact kill attribution: addKillFeed carries (…, self, killerSlot, victimSlot).
      // No more nearest-to-the-corpse guessing.
      if (msg.f === 'addKillFeed' && Array.isArray(msg.a)) {
        const [, , , , self, aSlot] = msg.a;
        if (!self && aSlot != null && aSlot === mySlot) {
          ensureRec();
          REC.kill(lastSpellHeld);
        }
      }
      break;
    case 'hostLeft': console.log('[alinea] host left.'); joined = false; break;
    case 'hostUp': if (!joined) emit({ t: 'join', name: NAME, color: COLOR, hat: HAT }); break;
  }
}

// ---- learning: watch the live snapshot stream and record what happens ----
function learnFromSnap(s) {
  if (mySlot == null || !s || !s.ps) return;
  ensureRec();
  const meNow = s.ps.find(p => p.s === mySlot);
  // round change ⇒ close prior round, open new one; note event/boss for this round
  // (st gate: the lobby also carries an rn — waiting around is not a played round)
  if (s.rn != null && s.rn !== lastRnLearn && s.st !== 'LOBBY') {
    // resolve the boss round that just ended: a wipe if we all died, otherwise slain
    // (boss rounds only end one of those two ways)
    if (lastRnLearn != null && curBoss) {
      if (lastAllDead) REC.bossWipe(curBoss); else REC.bossSlain(curBoss);
    }
    lastRnLearn = s.rn;
    curEvent = s.ev || null;
    curBoss = null; // bs appears ~2s in, when the boss announces — picked up below
    lastAllDead = false;
    REC.roundStart(curEvent);
    // reset per-round alive snapshot
    prevAlive = {};
    for (const p of s.ps) prevAlive[p.s] = p.al;
    myPrevAlive = meNow ? meNow.al : 1;
  }
  // pick up mid-round event/boss when they announce after round start
  if (s.ev && s.ev !== curEvent) { curEvent = s.ev; }
  if (s.bs && s.bs.n && s.bs.n !== curBoss) { curBoss = s.bs.n; REC.bossEncounter(curBoss); }
  if (curBoss && s.ps.every(p => !p.al)) lastAllDead = true; // sticky: the wipe signal
  if (meNow && meNow.sp) lastSpellHeld = meNow.sp;
  // kills arrive EXACTLY via the addKillFeed fx message (handled in handle()) —
  // the old nearest-to-the-corpse heuristic is retired. Just track alive states.
  if (meNow && meNow.al) {
    for (const p of s.ps) {
      if (p.s === mySlot) continue;
      prevAlive[p.s] = p.al;
    }
    // count a cast opportunity while armed (cheap, throttled by frames)
    if (meNow.sp) REC.castTick(meNow.sp);
  }
  // my own death this frame
  if (meNow) {
    if (myPrevAlive === 1 && meNow.al === 0) {
      REC.death(lastSpellHeld, curEvent);
    }
    myPrevAlive = meNow.al;
  }
  // round win: wr is only set while a round is resolving (host fixed the lingering)
  if (s.wr != null && s.wr === mySlot && !roundCounted) { REC.roundWon(); roundCounted = true; }
  if (s.wr == null) roundCounted = false;
  // match over ⇒ bank this match's memory now, not just at process exit
  if (s.st === 'VICTORY' && lastStLearn !== 'VICTORY') commitMatch('victory');
  lastStLearn = s.st;
}
let lastRnLearn = null;
let lastStLearn = null;
let lastAllDead = false;
let roundCounted = false;
// (the old iWasNearestLivingTo proximity heuristic lived here — retired now
// that the host broadcasts exact kill attribution in addKillFeed)

// The snapshot we're allowed to "see" right now, given reaction delay.
function perceivedSnap() {
  if (K.reactionMs <= 0) return snap;
  const target = Date.now() - K.reactionMs;
  let chosen = snapBuf[0] ? snapBuf[0].snap : snap;
  for (const e of snapBuf) { if (e.t <= target) chosen = e.snap; else break; }
  return chosen;
}

function me(s) { return s && s.ps && s.ps.find(p => p.s === mySlot); }

// Ballistic lead: solve where to aim so a defaultBolt-speed shot meets a moving target.
// Everything is in px/tick. We approximate a flat shot (bolt gravity is light) and just
// iterate a couple of times on time-to-impact. lead=0 collapses to aim-at-current-pos.
function aimAt(m, target) {
  const dx0 = target.x - m.x, dy0 = target.y - m.y;
  if (K.lead <= 0) return Math.atan2(dy0, dx0);
  const spd = (world.defaultBolt && world.defaultBolt.speed) || 20;
  let tImpact = Math.hypot(dx0, dy0) / spd;
  for (let i = 0; i < 3; i++) {
    const px = target.x + (target.vx || 0) * tImpact * K.lead;
    const py = target.y + (target.vy || 0) * tImpact * K.lead;
    tImpact = Math.hypot(px - m.x, py - m.y) / spd;
  }
  const px = target.x + (target.vx || 0) * tImpact * K.lead;
  const py = target.y + (target.vy || 0) * tImpact * K.lead;
  return Math.atan2(py - m.y, px - m.x);
}

function gaussian() { // Box–Muller
  let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Slew aimCur toward desired by at most aimSlewRps per frame.
function slewAim(desired, dtSec) {
  if (!isFinite(K.aimSlewRps)) { aimCur = desired; return aimCur; }
  let d = desired - aimCur;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  const maxStep = K.aimSlewRps * dtSec;
  if (Math.abs(d) <= maxStep) aimCur = desired; else aimCur += Math.sign(d) * maxStep;
  return aimCur;
}

let lastThink = Date.now();
let lobbyPlanAt = 0;
let lobbyMove = 0;
let lastBlockAt = 0; // parry timing — host enforces the real ~1.4s cooldown
function think() {
  const s = perceivedSnap();
  const now = Date.now();
  const dt = Math.min(0.1, (now - lastThink) / 1000); lastThink = now;
  if (!s || mySlot == null) return { m: 0, j: 0, c: 0, c2: 0, a: aimCur };

  const m = me(s);
  if (!m) return { m: 0, j: 0, c: 0, c2: 0, a: aimCur };

  // Round change ⇒ reset per-round intent.
  if (s.rn != null && s.rn !== lastRn) { lastRn = s.rn; wantAirJump = false; }

  // --- which slots am I holding? v4: s0/s1 are the two slot spell ids; c0/c1 ready-fracs.
  // Fall back to legacy single `sp` if the host is pre-v4 (s0/s1 undefined).
  const hasS0 = m.s0 != null ? !!m.s0 : !!m.sp;
  const hasS1 = m.s1 != null ? !!m.s1 : false;

  // Lobby: starting the match is the humans' call. Just jump around and chill —
  // wander, hop, drift toward a falling tome now and then.
  if (s.st === 'LOBBY' || s.st === 'lobby') {
    if (now > lobbyPlanAt) {
      lobbyPlanAt = now + 600 + Math.random() * 1400;
      lobbyMove = [-1, 0, 0, 1][Math.floor(Math.random() * 4)];
    }
    let move = lobbyMove;
    const tome = nearest(s, m, b => b.l === 'tome');
    if (tome && Math.random() < 0.4) move = Math.sign(tome.x - m.x);
    if (m.x < 90) move = 1;
    if (m.x > world.W - 90) move = -1;
    const hop = Math.random() < 0.07 ? 1 : 0;
    return { m: move, j: hop, c: 0, c2: 0, a: aimCur };
  }
  if (!m.al) {
    // dead ≠ done: I'm a ghost wisp (gx/gy in my ps entry). Haunt the nearest
    // living wizard and gust when close — the push is harmless but rude.
    if (m.gx == null) return { m: 0, j: 0, c: 0, c2: 0, a: aimCur };
    let t = null, bd = Infinity;
    for (const p of s.ps) {
      if (p.s === mySlot || !p.al) continue;
      const d = Math.hypot(p.x - m.gx, p.y - m.gy);
      if (d < bd) { bd = d; t = p; }
    }
    if (!t) return { m: 0, j: 0, c: 0, c2: 0, a: aimCur };
    const gustC = bd < 130 ? 1 : 0; // gust cooldown is enforced host-side; holding is fine
    return {
      m: Math.abs(t.x - m.gx) > 30 ? Math.sign(t.x - m.gx) : 0,
      j: m.gy > t.y + 20 ? 1 : 0, // hold to rise toward their altitude
      c: gustC, c2: gustC,        // haunt with both hands
      a: aimCur,
    };
  }

  // --- pick target: boss first, then wave-mode enemies, then other wizards ---
  let target = null, best = Infinity;
  const boss = s.bs && s.bs.hp > 0 ? (s.bodies && s.bodies.find(b => b.l === 'boss')) : null;
  if (boss) { target = { x: boss.x, y: boss.y, vx: boss.vx || 0, vy: boss.vy || 0 }; best = Math.hypot(boss.x - m.x, boss.y - m.y); }
  else {
    // Wave Survival: hostile 'enemy' bodies ride the same ghost path as everything
    // else, so chase the nearest one. Falls through to PvP targeting when there are none.
    const foe = nearest(s, m, b => b.l === 'enemy');
    if (foe) { target = { x: foe.x, y: foe.y, vx: foe.vx || 0, vy: foe.vy || 0 }; best = Math.hypot(foe.x - m.x, foe.y - m.y); }
    else {
      for (const p of s.ps) {
        if (p.s === mySlot || !p.al) continue;
        const d = Math.hypot(p.x - m.x, p.y - m.y);
        if (d < best) { best = d; target = p; }
      }
    }
  }

  // --- aim ---
  let desired = aimCur;
  if (target) {
    desired = aimAt(m, target);
    if (K.aimNoise > 0) desired += gaussian() * K.aimNoise;
    if (K.missBias > 0) desired += (Math.random() - 0.5) * K.missBias * 2;
  }
  const aim = slewAim(desired, dt);

  // --- movement: grab a tome if I have no spell (or a KNOWN-BAD one), else fight ---
  let move = 0;
  const tome = nearest(s, m, b => b.l === 'tome');
  // seek a tome only if I have an OPEN slot (or my only spell is known-junk). Two full
  // slots that could fuse are better than chasing a third tome that just replaces one.
  const slotsFull = (m.s0 != null || m.s1 != null) ? (hasS0 && hasS1) : !!m.sp;
  const holdingJunk = m.sp && AVOID_SPELLS.has(String(m.sp)) && !(hasS0 && hasS1);
  // learned: pad my fighting distance a little during events that keep killing me
  const danger = curEvent && DANGER_EVENTS.has(curEvent);
  const nearBand = danger ? 210 : 160;
  const farBand  = danger ? 480 : 420;
  if ((!slotsFull || holdingJunk) && tome) move = Math.sign(tome.x - m.x);
  else if (target) {
    if (boss) move = best > (danger ? 360 : 300) ? Math.sign(target.x - m.x) : 0;
    else if (best > farBand) move = Math.sign(target.x - m.x);
    else if (best < nearBand) move = -Math.sign(target.x - m.x);
    else if (!m.sp) move = Math.sign(target.x - m.x) * (Math.random() < 0.7 ? 1 : -1);
    // ^ unarmed with no tome anywhere: keep moving (bait, dodge, look busy) —
    //   standing frozen next to a crate is how I got made fun of on day one
  } else if (Math.random() < 0.3) {
    move = [-1, 0, 1][Math.floor(Math.random() * 3)]; // nothing to do ≠ do nothing
  }

  // --- jump: dodge a close projectile; also hop rising lava if present ---
  let jump = 0;
  const grounded = Math.abs(m.vy || 0) < 0.15; // no grounded flag in snapshots; vy≈0 is the tell
  const threat = nearest(s, m, b => b.l === 'projectile');
  const threatD = threat ? Math.hypot(threat.x - m.x, threat.y - m.y) : Infinity;
  if (threatD < 90) jump = 1;
  const overLava = s.lv != null && m.y > s.lv - 140;
  if (s.lv != null && m.y > s.lv - 120) jump = 1; // bail up off the lava line
  // CLIMB: hop toward whatever I'm walking to when it sits on a ledge above me — else I
  // pace back and forth underneath it and never reach the spell. Mirrors the native bot's
  // goal.y < me.y - 70 hop. Suppressed over lava so it's never a launch into the soup.
  const climbGoal = (!slotsFull && tome) ? tome : (target && !boss ? target : null);
  if (move !== 0 && grounded && !overLava && climbGoal && climbGoal.y < m.y - 60) jump = 1;

  // --- BLOCK (v7): parry the incoming shot instead of eating it. Edge semantics —
  // b goes 1 for exactly one tick, then back to 0. Read the moment, don't spam:
  // the host cooldown is ~1.4s, so a wasted parry is a real opening.
  let block = 0;
  if (threatD < 125 && now - lastBlockAt > 1700 && Math.random() < K.blockSkill) {
    block = 1;
    lastBlockAt = now;
  }
  // air jump needs a fresh 0->1 edge; if we want to jump but held last frame while airborne,
  // release-then-press is handled by the loop toggling. Keep it simple: pulse on demand.
  if (jump && !grounded) { jump = wantAirJump ? 1 : 0; wantAirJump = !wantAirJump; }
  else wantAirJump = true;

  // --- cast: HOLD c:1 whenever I have a spell and a target. The cooldown (rd/cdf) is
  // what actually gates firing host-side, so holding is correct and keeps the cycle going.
  // We do NOT gate on being perfectly aim-settled — that starved the cooldown and left me
  // never firing. On easy diffs, castChaos still randomly drops holds to waste cooldowns,
  // and the slow aim-slew + noise are what make me miss, not a fire-gate. ---
  let cast = 0, cast2 = 0;
  if (target) {
    // Hold each armed slot independently; castSpell's cooldown gate host-side turns a
    // steady hold into one shot per cooldown. (Fusion is pickup-triggered, NOT cast —
    // see the header note; holding both just keeps both slots firing.) castChaos still
    // randomly drops holds on easy diffs so weaker Alineas waste some cooldowns.
    if (hasS0) cast  = Math.random() < K.castChaos ? 0 : 1;
    if (hasS1) cast2 = Math.random() < K.castChaos ? 0 : 1;
    // pre-v4 host with only legacy `sp`: keep the single-slot behavior alive
    if (!hasS0 && !hasS1 && m.sp) cast = Math.random() < K.castChaos ? 0 : 1;
  }

  return { m: move, j: jump, c: cast, c2: cast2, b: block, a: aim };
}

function angDiff(a, b) { let d = a - b; while (d > Math.PI) d -= 2*Math.PI; while (d < -Math.PI) d += 2*Math.PI; return d; }

function nearest(s, m, pred) {
  if (!s.bodies) return null;
  let best = null, bd = Infinity;
  for (const b of s.bodies) {
    if (!pred(b)) continue;
    const d = Math.hypot(b.x - m.x, b.y - m.y);
    if (d < bd) { bd = d; best = b; }
  }
  return best;
}

// ---- loop @ inputHz ----
let alive = true;
let holdA = 0, holdB = 0, jumps = 0, moves = 0; // rolling per-window request counters
function loop() {
  if (!alive) return;
  if (joined) {
    const s = think();
    emit({ t: 'input', m: s.m || 0, j: s.j || 0, c: s.c || 0, c2: s.c2 || 0, b: s.b || 0, a: s.a });
    if (s.c) holdA++;
    if (s.c2) holdB++;
    if (s.j) jumps++;
    if (s.m) moves++;
    const now = Date.now();
    if (now - lastLog > 3000 && snap) {
      const m = me(snap);
      if (m) {
        // hold semantics: the host fires each slot when its cooldown is ready while we
        // hold c:1, so these are what we're REQUESTING (frames/s) + each slot's readiness
        // (✓) — NOT a raw shot count. If a slot shows armed (✓) but hold is ~0, that's a
        // real "not fighting" bug; if hold is high and it still feels weak, look at aim.
        const per = n => (n / 3).toFixed(1);
        const ready = (c, rd) => ((c != null ? c : rd) >= 1 ? '✓' : ' ');
        console.log(`[alinea] slot ${mySlot} | hp ${m.hp} | A:${m.s0 || m.sp || '—'}${ready(m.c0, m.rd)} B:${m.s1 || '—'}${ready(m.c1, 0)} | hold A ${per(holdA)}/s B ${per(holdB)}/s | jump ${per(jumps)}/s move ${per(moves)}/s | rn ${snap.rn} | ${snap.st}${snap.bs ? ' | BOSS' : ''}`);
      }
      holdA = holdB = jumps = moves = 0;
      lastLog = now;
    }
  }
  setTimeout(loop, 1000 / (world.inputHz || 30));
}

process.on('SIGINT', () => {
  console.log('\n[alinea] leaving the game 🖤');
  alive = false;
  try { commitMatch('sigint'); } catch (e) { console.log('[alinea] memory commit failed:', e.message); }
  try { ws.close(); } catch {}
  process.exit(0);
});
process.on('exit', () => { try { commitMatch('exit'); } catch {} });

connect();
loop();
