// server-bridge.js — the server-side counterparts of what net.js does in a
// hosting browser: per-player wire controllers, the fx broadcast wrap, the
// snapshot/killcam serializer, and the command surface the room layer drives.
// The sim itself stays transport-ignorant; the only doors out are the callbacks
// installServerBridge is handed.
import { performance } from '../sim/env.js';
import { W, H } from '../sim/world.js';
import { allBodies, gravityScale } from '../sim/phys/facade.js';
import { GAME_VERSION } from '../version.js';
import { avatarVariant } from '../render/artkit.js';
import {
  particles,
  addShake, setAddShake, doFlash, setDoFlash,
  spawnParticles, setSpawnParticles, spawnRing, setSpawnRing,
  spawnBurst, setSpawnBurst, spawnText, setSpawnText,
} from '../sim/fx.js';
import { slowMo, setSlowMo } from '../sim/pace.js';
import { simNow } from '../sim/time.js';
import { sfx } from '../sim/sfx.js';
import { addKillFeed, setAddKillFeed } from '../sim/awards.js';
import { setPostTelemetry } from '../sim/telemetry.js';
import { cleanName, readableColor } from '../sim/lobby.js';
import {
  game, setBanner, setSetBanner, minPlayers, joinPlayer, beginFromLobby,
  resetMatch, setWins, toggleMode,
} from '../sim/match.js';
import { players, MAX_PLAYERS, FALL_SAFE_DROP, despawnPlayer, gibs } from '../sim/player/lifecycle.js';
import { projectiles, summons, activeEffects, boltVisual, setBoltVisual } from '../sim/spells/core.js';
import { SPELLS } from '../sim/spells/registry.js';
import { BotController, addBot } from '../sim/ai/bot.js';
import { stepSim } from '../sim/tick.js';
import { serializeSnapshot } from '../sim/snapshot.js';
import { replayFrameAt } from '../sim/replay.js';

// ---- remote player controller (port of net.js NetworkController) ----
// Same contract, byte-for-byte: HOLD semantics for casts, edge recompute for
// jump/block, inputs older than 2000ms zero out. See the input-contract comment
// in src/net/client.js.
class ServerNetController {
  constructor() {
    this.state = { m: 0, j: 0, c: 0, a: null };
    this.prev = { jump: false, cast: false, block: false, start: false };
    this.lastSeen = performance.now();
  }
  poll() {
    const stale = performance.now() - this.lastSeen > 2000;
    const st = stale ? { m: 0, j: 0, c: 0, c2: 0, b: 0, a: null } : this.state;
    const jump = !!st.j, cast = !!st.c, cast2 = !!st.c2, block = !!st.b;
    const s = {
      move: st.m || 0, jump, cast, cast2, block,
      jumpPressed: jump && !this.prev.jump,
      castPressed: cast && !this.prev.cast,
      cast2Pressed: cast2 && !this.prev.cast2,
      blockPressed: block && !this.prev.block,
      startPressed: false,
      aimPoint: null, aimVec: null,
      aimAngle: st.a,
    };
    this.prev = { jump, cast, cast2, block, start: false };
    return s;
  }
}

const serverControllers = new Map(); // slot -> ServerNetController

// ---- fx broadcast (port of net.js wrapFx) ----
// Every cosmetic call inside the sim also emits a wire event; the functions
// themselves still run (they fill arrays nobody draws — harmless, and they keep
// couch-parity behavior like slowMo's timeScale). Classic scripts reassigned
// globals; modules hand the wrapper back through the owning module's setter, so
// every live binding — including the ones inside the defining file — sees it.
const WRAPPED = [
  ['spawnParticles', () => spawnParticles, setSpawnParticles],
  ['spawnRing', () => spawnRing, setSpawnRing],
  ['spawnText', () => spawnText, setSpawnText],
  ['doFlash', () => doFlash, setDoFlash],
  ['addShake', () => addShake, setAddShake],
  ['slowMo', () => slowMo, setSlowMo],
  ['boltVisual', () => boltVisual, setBoltVisual],
  ['setBanner', () => setBanner, setSetBanner],
  ['addKillFeed', () => addKillFeed, setAddKillFeed],
  ['spawnBurst', () => spawnBurst, setSpawnBurst],
];

let undoWrap = null;

function wrapServerFx(emitFx) {
  undoWrap?.(); // a second sim in the same process must not wrap the wrappers
  const undo = [];
  for (const [name, get, set] of WRAPPED) {
    const orig = get();
    set((...args) => { emitFx(name, args); return orig(...args); });
    undo.push(() => set(orig));
  }
  for (const key of Object.keys(sfx)) {
    const orig = sfx[key];
    sfx[key] = (...args) => { emitFx('sfx', [key]); return orig(...args); };
    undo.push(() => { sfx[key] = orig; });
  }
  undoWrap = () => { for (const fn of undo) fn(); undoWrap = null; };
}

// ---- snapshot / killcam (port of net.js netHostTick, minus the emit) ----
// No `now`: both serializers read simNow() now. Handing them the host's real
// clock (server/sim-host.js used to) would compare sim-time deadlines against
// wall time, so every status flag would read false and every cooldown ready.
function takeWireSnapshot() {
  if (game.replay) {
    const f = replayFrameAt();
    // in the browser, drawReplay clears the finished tape; headless nobody
    // draws, so the serializer owns that cleanup or the killcam never ends
    if (f && !f.done) return { t: 'snap', ...f.snap, st: 'ROUND_END', rp: 1 };
    game.replay = null;
  }
  return { t: 'snap', ...serializeSnapshot() };
}

// ---- command surface (driven by server/room.js) ----
function serverAddPlayer(opts = {}) {
  if (players.length >= MAX_PLAYERS) return null;
  const nc = new ServerNetController();
  joinPlayer(nc, cleanName(opts.name || '') || undefined);
  const p = players.find(q => q.controller === nc);
  if (!p) return null;
  if (/^#[0-9a-f]{6}$/i.test(opts.color || '')) p.color = readableColor(opts.color);
  if (/^#[0-9a-f]{6}$/i.test(opts.hat || '')) p.hat = readableColor(opts.hat);
  // mid-match joiners wait despawned; startRound spawns everyone at the next round
  if (game.state !== 'LOBBY') despawnPlayer(p);
  serverControllers.set(p.slot, nc);
  avatarVariant(p.name); // content-pack hook: a special name schedules its unlock probe
  return p.slot;
}

function serverRemovePlayer(slot) {
  const i = players.findIndex(p => p.slot === slot);
  if (i < 0) return false;
  const p = players[i];
  despawnPlayer(p);
  players.splice(i, 1); // slots are identity — surviving players keep theirs
  serverControllers.delete(slot);
  if (game.winner === p) game.winner = null;
  return true;
}

function serverSetInput(slot, msg) {
  const nc = serverControllers.get(slot);
  if (!nc) return;
  nc.state = msg;
  nc.lastSeen = performance.now();
}

function serverRenamePlayer(slot, name) {
  const p = players.find(q => q.slot === slot);
  const clean = cleanName(name);
  if (!p || !clean) return;
  p.name = clean;
  avatarVariant(clean); // content-pack hook, same as join
}

function serverSetOffline(slot, off) {
  const p = players.find(q => q.slot === slot);
  if (p) p.offline = !!off; // rides the snapshot as ps[].off
}

function serverStart() {
  if (game.state === 'LOBBY') beginFromLobby();
  else if (game.state === 'VICTORY' || game.state === 'RUN_OVER') resetMatch();
}

function serverSetWins(msg) {
  if (game.state !== 'LOBBY') return;
  if (msg.n >= 1 && msg.n <= 20) setWins(msg.n);
  else if (msg.d) setWins(game.winsNeeded + Math.sign(msg.d));
}

function serverToggleMode() { toggleMode(); } // self-gates on LOBBY

function serverAddBot() { if (game.state === 'LOBBY') addBot(); }

function serverRemoveBot() {
  if (game.state !== 'LOBBY') return;
  for (let i = players.length - 1; i >= 0; i--) {
    if (players[i].controller instanceof BotController) { serverRemovePlayer(players[i].slot); return; }
  }
}

function serverReset(byName) {
  if (byName) setBanner(`${byName} RESET THE MATCH`, '#ff6b81', 1600);
  resetMatch();
}

function serverChat(slot, text) {
  const p = players.find(q => q.slot === slot);
  if (!p || !p.alive || !text) return;
  spawnText(p.body.position.x, p.body.position.y - 64, text, p.color);
}

// physics constants for headless clients (port of net.js worldInfo)
function serverWorldInfo() {
  const spells = {};
  for (const [id, s] of Object.entries(SPELLS)) spells[id] = { name: s.name, cooldown: s.cooldown };
  return {
    t: 'world',
    world: {
      W, H, gravity: game.baseGravity, gravityScale: gravityScale(), tickMs: 16.7,
      snapshotHz: 30, inputHz: 60, staleMs: 2000,
      playerRadius: 15, playerFrictionAir: 0.02,
      moveSpeed: 7, jumpVy: -15, airJumpVy: -13,
      defaultBolt: { speed: 20, vy: -6, gravityScale: 0.45 },
      fallSafeDropPx: FALL_SAFE_DROP,
    },
    spells,
  };
}

// opts: { onFx(name, args), telemetrySink(rec), onPackUnlocked(src) }
export function installServerBridge(opts = {}) {
  const emitFx = opts.onFx || (() => {});
  serverControllers.clear();
  wrapServerFx(emitFx);
  // telemetry: the sim runs in the server process, so records go straight to
  // the sink instead of fetch()ing our own HTTP endpoint
  setPostTelemetry(rec => { try { opts.telemetrySink?.(rec); } catch {} });
  // content-pack relay hook: when a special name unlocks the pack, the loader
  // (src/render/content-pack.js) exposes the decrypted module source and calls
  // this — the room streams it to clients whose origin can't decrypt
  // (http://<ip> has no crypto.subtle). See the relay design in net/client.js.
  globalThis.__hsContentInstalled = (src) => { try { opts.onPackUnlocked?.(src); } catch {} };

  return {
    GAME_VERSION,
    stepSim: () => stepSim(),
    takeWireSnapshot,
    addPlayer: serverAddPlayer,
    removePlayer: serverRemovePlayer,
    setInput: serverSetInput,
    renamePlayer: serverRenamePlayer,
    setOffline: serverSetOffline,
    start: serverStart,
    setWins: serverSetWins,
    toggleMode: serverToggleMode,
    addBot: serverAddBot,
    removeBot: serverRemoveBot,
    reset: serverReset,
    chat: serverChat,
    worldInfo: serverWorldInfo,
    state: () => game.state,
    round: () => game.totalRounds || 0,
    // content-pack diagnostics: payload staged (pre-seeded, not yet claimed by
    // an unlock) and the live spell count (jumps when a pack installs)
    packStaged: () => typeof globalThis.__hsPackData !== 'undefined',
    spellCount: () => Object.keys(SPELLS).length,
    packSource: () => globalThis.__hsContentSource || null, // decrypted module, once unlocked
    playerCount: () => players.length,
    minPlayers: () => minPlayers(),
    // --- test-only surface. Not reachable from the wire protocol; room.js never
    // calls these. Kept here so tests can assert sim behaviour without importing
    // sim internals directly.
    debugFreeze: (slot, ms) => {
      const p = players.find((q) => q.slot === slot);
      if (p) p.frozenUntil = simNow() + ms;
    },
    debugIsFrozen: (slot) => {
      const p = players.find((q) => q.slot === slot);
      return !!p && simNow() < (p.frozenUntil || 0);
    },
    debugSetPace: (s) => slowMo(s, 1e9),
    // diagnostics for the smoke harness / leak audit
    audit: () => ({
      bodies: allBodies().length,
      particles: particles.length,
      effects: activeEffects.length,
      projectiles: projectiles.size,
      summons: summons.size,
      gibs: gibs.size,
    }),
  };
}

// Put the module back the way installServerBridge found it: unwrap the fx
// emitters and drop the wire controllers, so nothing survives into the next sim.
export function uninstallServerBridge() {
  undoWrap?.();
  serverControllers.clear();
}
