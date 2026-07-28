// client.js — online client: the SERVER runs the match (headless sim in
// server/sim-host.js); this file connects, sends inputs, and renders snapshots.
// Opened via file:// it never connects — connect() is only reached from the
// mode menu, which only appears on an http(s) page.
import { W, H } from '../sim/world.js';
import { allBodies, allJoints, createComposite, removeFrom } from '../sim/phys/facade.js';
import { GAME_VERSION } from '../version.js';
// cosmetic randomness (the local starfield, the victory confetti). A client
// runs no simulation, so these must not touch src/sim/rng.js's round stream.
import { fxRange as rand, fxPick as pick } from '../render/fx.js';
import { ctx, RENDER_SCALE } from '../render/canvas.js';
import { rgba } from '../render/artkit.js';
import { ensureAudio } from '../render/audio.js';
// spawnParticles is here because applyBrokenDestructibles bursts the block it
// removes. The name moved from sim/fx.js to render/fx.js in the
// cosmetics-as-events refactor and was dropped from this list while its call
// site stayed — the same loss the helper below documents, and the second
// offender test/no-undefined-identifiers.test.js reported on this branch.
// Keep prose OUT of the braces: the guard reads an import's brace body as
// declared names, so a comment in there can name away its own bug.
import {
particles, shake, setShake, flashColor, flashAlpha, setFlashAlpha,
updateParticles, applyEmitted, pumpEmitted, spawnParticles,
} from '../render/fx.js';
import { WIRE_FX } from './fx-names.js';
import { slowMo, updatePace } from '../sim/pace.js';
import { createTickLoop } from '../sim/tick-loop.js';
import { advanceTick, simNow } from '../sim/time.js';
import { netMode as currentNetMode, setNetMode } from '../sim/net-mode.js';
import { cleanName } from '../sim/lobby.js';
import {
banner, bannerColor, bannerUntil, bannerHyper, setBanner, setCurrentMap,
} from '../sim/match.js';
import { addKillFeed } from '../sim/awards.js';
import { MAPS } from '../sim/maps/builders.js';
import { buildMapExtras } from '../sim/maps/extras.js';
import { envEventById } from '../sim/events.js';
import { MAX_PLAYERS } from '../sim/player/lifecycle.js';
import { activeEffects } from '../sim/spells/core.js';
import { keys, mouse } from '../platform/input-keyboard.js';
import { drawSnapshotWorld, ghostPlayer } from '../render/draw-snapshot.js';
import { drawWizardFigure } from '../render/draw-wizard.js';
import { drawAwards, drawKillFeed, drawLobbyPanel, drawPlayerSpells, drawSpellReport } from '../render/hud.js';
import { drawBossBar } from '../render/draw-boss.js';
import { getVignette } from '../render/draw-world.js';
import { drawReplayOverlay } from '../render/replay.js';

let ws = null;
let mySlot = null;
let joined = false;
let joinDeniedMsg = null;
let serverWorld = null; // {t:'world', world, spells} — constants, stashed for curious tooling
// Optional content pack (secret avatars): only a secure context (localhost or
// https) exposes crypto.subtle, so players on http://<ip> can never decrypt
// it themselves. The server — which always can — relays the plaintext module,
// chunked to stay under the 128KB WS frame cap. See render/content-pack.js.
let packChunks = null;            // chunk reassembly buffer
let packInstalled = false;        // run-once guard
let hooks = { status() {}, welcome() {} };

// which sim owns this browser's match — the frame loop asks before stepping
export function netMode() { return currentNetMode; }

// THE CLIENT INPUT CONTRACT — { t:'input', m, j, c, c2, b, a }, sent ~60/sec:
//   m: move, WORLD-space: 1 = +x (screen right), -1 = left, 0 = idle. Not facing-relative.
//   a: aim, ABSOLUTE world radians: 0 = +x, positive = clockwise on screen (screen y grows
//      down, so a = Math.atan2(dy, dx) with dy downward-positive). null = no aim (falls back
//      to facing + lob). The server uses the LAST-KNOWN aim at the moment a cast fires, so `a`
//      does not need to arrive on the same frame as c:1 — but sending both together is safest.
//   c: cast, HOLD semantics: keep c:1 and the wizard casts every time the cooldown is ready
//      (auto-repeats). The castPressed edge is only used for lobby join / rematch.
//   j: jump, hybrid: holding j:1 jumps whenever grounded (auto-hop); the AIR jump (double
//      jump) needs a fresh 0→1 edge. Send j:1 then j:0 to meter your jumps.
//   b: block/parry, EDGE semantics: a fresh 0→1 triggers one ~240ms parry (then ~1.4s
//      cooldown). Holding b:1 does nothing extra — time it.
//   c2: cast slot B, same HOLD semantics as c.
// Inputs older than 2000ms zero out server-side (stale guard) — keep sending even when idle.
// Snapshots broadcast at ~30Hz. In snapshot ps[]: you are the entry with s === your slot
// (slots are stable for the whole session; they never reshuffle). Tomes are picked up by
// touching them (bodies[].l === 'tome', body is 20×24px; players are r=15 circles).
// A new round = the snapshot's `rn` counter increments (state also flips to 'PLAY').

// ---- net stats (F8): live truth about what the wire is carrying ----
const netStats = { on: false, lastBytes: 0, bytes: 0, snaps: 0, at: 0, rate: 0, kbs: 0, delay: 0 };
// the overlay only means anything online, and js/net.js's IIFE never ran on
// file:// — so the toggle stays unbound there too
if (typeof location !== 'undefined' && location.protocol.startsWith('http')) {
  addEventListener('keydown', e => { if (e.code === 'F8') netStats.on = !netStats.on; });
}
function statTick(bytes, now) {
  netStats.lastBytes = bytes;
  netStats.bytes += bytes;
  netStats.snaps++;
  if (now - netStats.at > 1000) {
    netStats.rate = netStats.snaps; netStats.kbs = Math.round(netStats.bytes / 1024);
    netStats.snaps = 0; netStats.bytes = 0; netStats.at = now;
  }
}
globalThis.drawNetStats = function drawNetStats(now) {
  if (!netStats.on) return;
  const line = `NET · snap ${netStats.lastBytes}B · ${netStats.rate}/s · ${netStats.kbs}KB/s in · gap ${Math.round(snapGapMs)}ms · delay ${Math.round(netStats.delay)}ms`;
  ctx.save();
  ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
  ctx.font = '12px Menlo, monospace';
  ctx.textAlign = 'left';
  const w = ctx.measureText(line).width + 16;
  ctx.fillStyle = 'rgba(10,6,16,0.75)';
  ctx.fillRect(8, H - 34, w, 22);
  ctx.fillStyle = '#9ef0f0';
  ctx.fillText(line, 16, H - 19);
  ctx.restore();
};

function emit(msg) {
  if (!ws || ws.readyState !== 1) return;
  ws.send(JSON.stringify(msg));
}

// The name the opening menu stored for player 1 (src/platform/menu.js writes
// this key). It rides `hello` and every join, and it is also the key the room
// matches a reconnect against (server/room.js reserves a dropped seat by name),
// so it has to be the same string every time this tab asks for a seat.
//
// This helper was lost in the ESM refactor: the three calls survived, the
// definition did not, so ws.onopen threw before `hello` could be sent and the
// server never marked the connection as having said hello — which is the one
// thing it requires before it will seat anybody. Nobody could join an online
// match. test/no-undefined-identifiers.test.js now fails on that class of loss.
function myName() {
  return cleanName(localStorage.getItem('hs-name-0') || '') || 'WIZARD';
}
export function connect(h) {
  hooks = h || hooks;
  hooks.status('connecting…');
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${proto}://${location.host}/ws`);
  // np:1 asks the server to relay the optional content pack — set only on
  // insecure origins (no crypto.subtle), where we can never decrypt it
  // ourselves. Secure clients (https/localhost) self-decrypt via the loader.
  ws.onopen = () => emit({ t: 'hello', v: GAME_VERSION, name: myName(), np: canDecryptLocally() ? 0 : 1 });
  ws.onerror = () => hooks.status('connection failed — is the server running?');
  ws.onclose = () => { if (currentNetMode === 'online') setBanner('CONNECTION LOST — refresh', '#ff6b81', 60000); };
  ws.onmessage = ev => {
    let msg;
    try { msg = JSON.parse(ev.data); } catch { return; }
    if (msg.t === 'snap') statTick(ev.data.length, performance.now());
    handleMessage(msg);
  };
}

function handleMessage(msg) {
  switch (msg.t) {
    case 'welcome':
      if (msg.v !== GAME_VERSION) {
        hooks.status('GAME UPDATED — hard-refresh this page (⌘⇧R) and try again');
        ws.close();
        return;
      }
      setNetMode('online');
      hooks.welcome();
      emit({ t: 'join', name: myName() }); // the menu already asked for the name — just go
      break;
    case 'badVersion':
      // server told us we're stale before we ever saw a snapshot
      setBanner('GAME UPDATED — REFRESH THE PAGE', '#ff6b81', 60000);
      break;
    case 'you':
      mySlot = msg.slot;
      joined = true;
      joinDeniedMsg = null;
      break;
    case 'world':
      serverWorld = msg;
      break;
    case 'joinDenied':
      joinDeniedMsg = msg.reason === 'full' ? 'match is full (8 wizards) — spectating' : 'join refused — spectating';
      break;
    case 'snap':
      pushSnapshot(msg);
      break;
    case 'fx':
      applyFx(msg);
      break;
    case 'pack':
      receivePackChunk(msg);
      break;
  }
}

// can this origin decrypt the pack itself? (crypto.subtle needs a secure
// context — https or localhost; http://<ip> LAN pages don't have it)
const canDecryptLocally = () => !!(globalThis.crypto && globalThis.crypto.subtle);

// collect server-relayed pack chunks (any order), then install once complete
function receivePackChunk(msg) {
  if (packInstalled) return;
  if (typeof msg.s !== 'string' || !(msg.n > 0) || !(msg.i >= 0 && msg.i < msg.n)) return;
  if (!packChunks || packChunks.length !== msg.n) packChunks = new Array(msg.n).fill(null);
  packChunks[msg.i] = msg.s;
  if (packChunks.every(c => c !== null)) {
    const src = packChunks.join('');
    packChunks = null;
    installPack(src);
  }
}

// run the server's decrypted optional-content module. Same trust model as
// applyFx (we already render server-named state); guarded so the avatar
// patch installs exactly once.
function installPack(src) {
  if (packInstalled || typeof src !== 'string') return;
  packInstalled = true;
  try { new Function(src)(); }
  catch (e) { packInstalled = false; console.warn('Optional content could not be installed.', e); }
}

// ================= CLIENT =================
let snapPrev = null, snapCur = null, tPrev = 0, tCur = 0;
let snapGapMs = 40; // smoothed inter-snapshot gap → drives the interp delay
let clientMap = null; // {def, composite, data}

function pushSnapshot(snap) {
  const tNow = performance.now();
  if (tCur) snapGapMs += (Math.min(tNow - tCur, 200) - snapGapMs) * 0.12;
  snapPrev = snapCur; tPrev = tCur;
  snapCur = snap; tCur = tNow;
  if (!clientMap || clientMap.index !== snap.mi || (snap.msd != null && clientMap.data.seed !== snap.msd)) clientLoadMap(snap.mi, snap.msd);
  applyBrokenDestructibles(snap.bd);
}

// mirror the server's blown-apart cover by removing the matching local blocks
function applyBrokenDestructibles(bd) {
  if (!bd || !clientMap) return;
  const applied = clientMap.data._bdApplied || 0;
  if (bd.length <= applied) return;
  const dests = allBodies(clientMap.composite).filter(b => b.label === 'destructible');
  for (let i = applied; i < bd.length; i++) {
    const [bx, by] = bd[i];
    let best = null, bdst = 3600; // within 60px
    for (const d of dests) { const dd = (d.position.x - bx) ** 2 + (d.position.y - by) ** 2; if (dd < bdst) { bdst = dd; best = d; } }
    if (best) { spawnParticles(best.position.x, best.position.y, best.dcolor || '#6b4a2a', 14, 6, 40); removeFrom(clientMap.composite, best); }
  }
  clientMap.data._bdApplied = bd.length;
}

function clientLoadMap(index, seed) {
  const def = MAPS[index];
  const m = { def, composite: createComposite(), data: {} };
  def.build(m);
  // regenerate the server's seeded extras so static cover/steppers match exactly
  // (statics never ride the snapshot; dynamics below get stripped and arrive as ghosts)
  if (seed != null) { m.data.seed = seed; buildMapExtras(m, seed); }
  // keep only plain static scenery; everything else arrives as ghosts
  for (const b of [...allBodies(m.composite)]) {
    if (!b.isStatic || b.spin || b.phantom || b.kinematic || b.label === 'lava') removeFrom(m.composite, b);
  }
  for (const c of [...allJoints(m.composite)]) removeFrom(m.composite, c);
  if (def.stars) {
    m.data.starfield = Array.from({ length: 70 }, () => ({ x: rand(0, W), y: rand(0, H - 160), r: rand(0.5, 1.8), tw: rand(0, 6.28) }));
  }
  m.index = index;
  clientMap = m;
  setCurrentMap(m); // shared draw helpers read currentMap
  particles.length = 0;
  activeEffects.length = 0;
}

// An fx event off the wire is the same object the host's sim emitted, so it
// goes through the same applyEmitted the couch renderer uses. What is NOT the
// same is the allowlist: a couch sim can only emit what its own code emits,
// whereas this arrives from a server that may be buggy or hostile, so the name
// is checked against the wire set (src/net/fx-names.js) before anything runs.
//
// Three names cannot go to applyEmitted, because on a host they are simulation
// as well as spectacle and applyEmitted deliberately no-ops them (the host's
// sim already did the work on the way past). A client has no sim, so here they
// ARE the work: the banner text, the kill feed and the hitstop all have to be
// applied to the shared sim modules the HUD and the tick loop read.
const LOCAL_FX = { __proto__: null, setBanner, addKillFeed, slowMo };
function applyFx(msg) {
  if (msg.f !== 'sfx' && !WIRE_FX.has(msg.f)) return;
  const local = LOCAL_FX[msg.f];
  if (local) { local(...msg.a); return; }
  applyEmitted([msg]);
}

// once per rendered frame (~60Hz) — halving it was cheap on paper, but on a
// struggling client it compounded: 40fps ⇒ 20Hz inputs ⇒ mushy casts/jumps
function sendInput(now) {
  const jump = !!keys['KeyW'] || !!keys['Space'] || !!keys['ArrowUp'];
  const cast = !!keys['KeyE'] || !!keys['Enter'] || mouse.down;        // slot A
  const cast2 = !!keys['KeyQ'] || !!keys['ShiftRight'] || mouse.rdown;  // slot B
  const block = !!keys['KeyS'] || !!keys['ArrowDown'] || mouse.mdown;   // parry
  const move = (keys['KeyD'] || keys['ArrowRight'] ? 1 : 0) - (keys['KeyA'] || keys['ArrowLeft'] ? 1 : 0);
  let aim = null;
  if (mouse.present && snapCur && mySlot != null) {
    const me = snapCur.ps.find(q => q.s === mySlot);
    if (me) aim = Math.atan2(mouse.y - me.y, mouse.x - me.x);
  }
  if (!joined && (cast || mouse.down)) emit({ t: 'join', name: myName() }); // retry after a denial
  if (joined) emit({ t: 'input', m: move, j: jump ? 1 : 0, c: cast ? 1 : 0, c2: cast2 ? 1 : 0, b: block ? 1 : 0, a: aim });
  // lobby verbs become messages; the server's sim answers with banners/fx
  const edge = (code, fn) => {
    if (keys[code] && !this[`_${code}`]) fn();
    this[`_${code}`] = !!keys[code];
  };
  edge('Space', () => emit({ t: 'start' }));
  edge('KeyB', () => emit({ t: 'bot', op: 'add' }));
  edge('KeyM', () => emit({ t: 'mode' }));
  edge('KeyR', () => emit({ t: 'reset' }));
  for (let d = 1; d <= 9; d++) edge(`Digit${d}`, () => emit({ t: 'wins', n: d }));
  edge('Equal', () => emit({ t: 'wins', d: 1 }));
  edge('Minus', () => emit({ t: 'wins', d: -1 }));
}

function drawOnlineLobby(snap, now) {
  const mode = snap.md || 'versus';
  const wave = mode === 'wave';
  const count = Math.max(4, Math.min(MAX_PLAYERS, snap.ps.length + 1));
  const slots = [];
  for (let i = 0; i < count; i++) {
    const gp = snap.ps[i];
    slots.push({
      label: gp ? gp.n + (gp.s === mySlot ? ' ✦' : '') : 'JOIN',
      color: gp ? gp.c : '#4a3f5e',
      hint: !gp ? 'OPEN SEAT'
        : gp.b ? 'BOT'
        : gp.off ? '(connection lost)'
        : gp.s === mySlot ? 'YOU — WASD + MOUSE'
        : 'ONLINE',
    });
  }
  const min = wave ? 1 : 2;
  const ready = snap.ps.length >= min;
  drawLobbyPanel({
    joinLine: joinDeniedMsg || (joined
      ? `you are in as P${(mySlot ?? 0) + 1} — WASD move · SPACE/W jump · aim & fire with the mouse`
      : 'CLICK or press E to join'),
    slots,
    readyColor: ready ? (wave ? '#ffd166' : '#7bd88f') : '#675a7d',
    readyLine: !ready ? (wave ? 'NEED AT LEAST 1 WIZARD' : 'NEED AT LEAST 2 WIZARDS')
      : wave ? `SPACE — WAVE SURVIVAL${snap.bw ? `  (BEST: WAVE ${snap.bw})` : ''}`
      : `SPACE TO FIGHT — FIRST TO ${snap.wn} WINS`,
    controlsLine: wave
      ? 'M switches back to VERSUS · co-op: everyone fights the waves together · B adds a bot'
      : `M = WAVE SURVIVAL · 1–9 sets win target (${snap.wn}) · B adds a bot · R resets`,
  });
}

// An online client renders but never simulates, so its particles used to get
// exactly one update per rAF — which made them travel 2.4× faster on a 144Hz
// display than on a 60Hz one. The same accumulator the sim uses gives them a
// fixed 60Hz cadence, and because it keeps the default pace, a slowMo the
// server broadcasts slows the sparks here exactly as it does on the host.
//
// updatePace() runs INSIDE the step, not once per frame, because that is where
// stepSim runs it (src/sim/tick.js:106) and this loop is the client's only
// stand-in for stepSim — an online client returns early at
// src/platform/browser.js:62 and never reaches the sim at all. Easing per frame
// instead would recover ~5.7× faster than the host during a hard hitstop (60
// frames/sec against 3 ticks/sec), so the client's sparks would be back to full
// speed while the host was still in slow motion. The ease keeps progressing as
// long as frames keep arriving inside the 250ms gap the pump below discards:
// pace.js floors the scale at 0.05 and updatePace only ever raises it, so ticks
// come at worst every TICK_MS/0.05 = 333ms. Below ~4fps every gap is discarded,
// nothing pumps and the pace does sit still — it resumes easing on the first
// frame back under 250ms.
//
// advanceTick() runs in here too, for the same reason updatePace() does. A
// client never calls stepSim, so without this its simNow() would sit at 0
// forever — and applyFx writes SIM-time deadlines into shared sim modules on
// every broadcast: setBanner stamps `bannerUntil = simNow() + ms`, addKillFeed
// stamps `at: simNow()`, boltVisual stamps `until: simNow() + life`. A dead
// clock means every one of those is already expired the instant it lands, so
// no banner, no kill feed and no lightning would ever render online. Ticking
// the same accumulator gives the client a sim clock at the host's own cadence
// (paceScale() x real time), which is all these purely local durations need —
// they are set and read on this machine, never compared against the server's.
// pumpEmitted drains what LOCAL_FX above put on the sim's queue. setBanner,
// addKillFeed and slowMo all emit as well as apply (they are shared sim
// modules and cannot know they are running on a client), and a queue nobody
// drained would grow for the length of the session.
const fxLoop = createTickLoop({ step: () => { updatePace(); pumpEmitted(); updateParticles(1); advanceTick(); } });
let lastFxAt = null;

export function netClientFrame(now) {
  sendInput.call(sendInput, now);
  // a gap we spent not rendering — the first frame after connecting, a rejoin,
  // a hidden tab — is not particle time, so it starts a fresh interval rather
  // than being spent as catch-up. 250ms is the loop's own clamp.
  if (lastFxAt === null || now - lastFxAt > 250) lastFxAt = now;
  fxLoop.pump(now - lastFxAt);
  lastFxAt = now;

  const sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake;
  setShake(shake * 0.88);
  // RENDER_SCALE carries the device-pixel backing store (canvas.js). The online
  // path still draws its own fixed framing — the camera reaches it in the boss
  // framing task — but it has to agree with the couch path about how many
  // device pixels a world unit is, or an online client on a HiDPI display
  // renders the whole match into the top-left quarter of its canvas.
  ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, sx * RENDER_SCALE, sy * RENDER_SCALE);
  ctx.clearRect(-30, -30, W + 60, H + 60);

  if (!snapCur || !clientMap) {
    ctx.fillStyle = '#16121c';
    ctx.fillRect(-30, -30, W + 60, H + 60);
    ctx.fillStyle = '#9c8ab8';
    ctx.font = '22px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('connecting to the match…', W / 2, H / 2);
    return;
  }

  const snap = snapCur;
  if (snap.v !== GAME_VERSION) {
    ctx.fillStyle = '#16121c';
    ctx.fillRect(-30, -30, W + 60, H + 60);
    ctx.fillStyle = '#ff6b81';
    ctx.font = 'bold 34px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('GAME UPDATED — REFRESH THE PAGE', W / 2, H / 2);
    return;
  }
  // interpolate just behind the snapshot stream — the delay tracks the real
  // arrival gap (~42ms at 30Hz) instead of a fixed 60ms, and stretches
  // gracefully if the connection degrades
  const delay = Math.min(90, Math.max(36, snapGapMs * 1.25));
  netStats.delay = delay;
  const span = Math.max(tCur - tPrev, 1);
  const alpha = Math.max(0, Math.min(1, (now - delay - tPrev) / span));
  const ghosts = drawSnapshotWorld(snap, snapPrev, alpha, now, true);

  // reticle
  if (mouse.present) {
    const mine = ghosts.find(g => g.slot === mySlot);
    ctx.strokeStyle = mine ? mine.color : '#9c8ab8';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 9, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = getVignette();
  ctx.fillRect(0, 0, W, H);
  if (flashAlpha > 0.01) {
    ctx.globalAlpha = flashAlpha;
    ctx.fillStyle = flashColor;
    ctx.fillRect(-30, -30, W + 60, H + 60);
    ctx.globalAlpha = 1;
  }
  setFlashAlpha(flashAlpha * 0.86);

  if (snap.rp) drawReplayOverlay(now); // the server is playing the killcam

  // HUD
  ctx.textAlign = 'center';
  ctx.font = '12px Georgia';
  ctx.fillStyle = '#675a7d';
  ctx.fillText(`${clientMap.def.name} · ${snap.mi + 1}/${MAPS.length}`, W / 2, 18);
  if (snap.ev) {
    const evDef = envEventById(snap.ev);
    if (evDef) {
      ctx.font = 'bold 11px Georgia';
      ctx.fillStyle = evDef.color;
      ctx.fillText(`⚠ ${evDef.name}`, W / 2, H - 12);
      ctx.font = '12px Georgia';
    }
  }
  if (snap.bs) drawBossBar(snap.bs.n, snap.bs.c, snap.bs.hp, snap.bs.mhp);
  drawKillFeed(simNow()); // the feed's `at` stamps are sim time (src/sim/awards.js)
  const spacing = Math.min(300, (W - 220) / Math.max(snap.ps.length - 1, 1));
  snap.ps.forEach((gp, i) => {
    const x = snap.ps.length === 1 ? 150 : W / 2 + (i - (snap.ps.length - 1) / 2) * spacing;
    ctx.font = 'bold 20px Georgia';
    ctx.fillStyle = gp.c;
    ctx.fillText(gp.n + (gp.s === mySlot ? ' ◂you' : '') + (gp.off ? ' ⌁' : ''), x, 38);
    ctx.strokeStyle = gp.c;
    if (snap.wn <= 9) {
      const pipStart = x - (snap.wn - 1) * 9;
      for (let w = 0; w < snap.wn; w++) {
        ctx.beginPath();
        ctx.arc(pipStart + w * 18, 54, 5.5, 0, Math.PI * 2);
        if (w < gp.w) ctx.fill();
        else { ctx.lineWidth = 1.5; ctx.stroke(); }
      }
    } else {
      ctx.font = 'bold 15px Georgia';
      ctx.fillText(`${gp.w} / ${snap.wn}`, x, 58);
    }
    drawPlayerSpells(x, [gp.s0 ?? null, gp.s1 ?? null], [gp.c0 || 0, gp.c1 || 0], gp.mc || 0, [gp.h0 ?? null, gp.h1 ?? null]);
  });
  if (simNow() < bannerUntil) { // bannerUntil is sim time; `now` below is only animation phase
    if (bannerHyper) {
      const pulse = 1 + 0.12 * Math.sin(now * 0.03);
      ctx.save();
      ctx.translate(W / 2, 160);
      ctx.scale(pulse, pulse);
      ctx.font = 'bold 78px Georgia';
      ctx.shadowColor = '#a55eea';
      ctx.shadowBlur = 34;
      ctx.fillStyle = `hsl(${(now * 0.4) % 360}, 90%, 78%)`;
      ctx.fillText(banner, 0, 0);
      ctx.restore();
      ctx.shadowBlur = 0;
    } else {
      ctx.font = 'bold 52px Georgia';
      ctx.fillStyle = bannerColor;
      ctx.fillText(banner, W / 2, 150);
    }
  }

  if (snap.st === 'LOBBY') drawOnlineLobby(snap, now);

  if (snap.st === 'VICTORY' && snap.wr != null) {
    const gw = snap.ps.find(q => q.s === snap.wr);
    if (gw) {
      ctx.fillStyle = 'rgba(10,6,16,0.6)';
      ctx.fillRect(0, 0, W, H);
      const g = ghostPlayer(gw, null, 1, now);
      g._x = W / 2; g._y = 400;
      g.body.position = { x: W / 2, y: 400 };
      drawWizardFigure(g, W / 2, 400, 4.5, now);
      ctx.font = 'bold 58px Georgia';
      ctx.fillStyle = gw.c;
      ctx.textAlign = 'center';
      ctx.fillText(`${gw.n} WINS THE MATCH`, W / 2, 180);
      drawAwards(snap.aw, now);
      drawSpellReport(snap.sr, now);
      if (Math.random() < 0.6) {
        particles.push({ kind: 'confetti', x: rand(0, W), y: -10, vx: rand(-1, 1), vy: rand(1, 3), life: 120, maxLife: 120, color: pick(['#4ecdc4', '#ff6b81', '#ffd166', '#a55eea', '#e8d5ff']), r: 4 });
      }
    }
  }
  drawNetStats(now); // F8 overlay
}
