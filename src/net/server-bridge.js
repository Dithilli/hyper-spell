// server-bridge.js — the server-side counterparts of what net.js does in a
// hosting browser: per-player wire controllers, the fx broadcast wrap, the
// snapshot/killcam serializer, and the command surface the room layer drives.
// The sim itself stays transport-ignorant; the only doors out are the callbacks
// installServerBridge is handed.
import { performance } from '../sim/env.js';
import { W, H } from '../sim/world.js';
import { allBodies, gravityY, worldGravityScale } from '../sim/phys/facade.js';
import { GAME_VERSION } from '../version.js';
import { avatarVariant } from '../render/artkit.js';
import { spawnText } from '../sim/fx.js';
import { drainEmitted, emittedCount } from '../sim/emit.js';
import { WIRE_FX } from './fx-names.js';
import { slowMo } from '../sim/pace.js';
import { simNow } from '../sim/time.js';
import { setPostTelemetry } from '../sim/telemetry.js';
import { cleanName, readableColor } from '../sim/lobby.js';
import {
  currentMap, game, setBanner, minPlayers, joinPlayer, beginFromLobby,
  loadMap, resetMatch, setWins, toggleMode, startRound,
} from '../sim/match.js';
import { MAPS } from '../sim/maps/builders.js';
import { activeModifiers, baseGravity, currentGravity } from '../sim/gravity.js';
import {
  players, MAX_PLAYERS, MAX_HP, FALL_SAFE_DROP, despawnPlayer, gibs, spawnPlayer, spawnPointFor,
} from '../sim/player/lifecycle.js';
import { projectiles, summons, activeEffects, castSpell } from '../sim/spells/core.js';
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

// ---- fx broadcast ----
//
// What this replaces: `wrapServerFx`, which reassigned ten cosmetic functions
// and every sfx key to broadcasting wrappers, and recorded an undo so a second
// createSim() in one process could not wrap the wrappers. It was careful code
// about a hazard that only existed because the sim called the renderer
// directly and the server had to intercept those calls.
//
// There is nothing to intercept now. src/sim/emit.js is where a cosmetic goes,
// so the bridge only has to drain it. That preserves both properties the
// wrapper worked for:
//
//   ORDER — the queue is FIFO and drained whole, so the events a client
//   receives are in the order the sim emitted them within the tick, which is
//   what the wrappers gave by construction (each wrapper emitted as it was
//   called). The drain runs at the END of stepSim, so a tick's cosmetics reach
//   the wire ahead of the snapshot the room sends next.
//
//   RE-INSTALLABILITY — the undo existed so installing twice could not
//   compound. Installing twice now does nothing to compound: no function is
//   replaced, and install/uninstall each empty the queue so a rebuilt sim (the
//   crash watchdog in server/sim-host.js) never inherits the dead one's
//   backlog. test/emit-apply.test.js asserts both halves.
//
// Local-only names (a bespoke particle, the per-round particle clear) are
// dropped here rather than at the receiver: they were never on the wire, the
// old wrapper covered ten names and no more, and WIRE_FX is that list.
let emitFx = () => {};

function flushFx() {
  for (const e of drainEmitted()) {
    if (e.f !== 'sfx' && !WIRE_FX.has(e.f)) continue;
    emitFx(e.f, e.a);
  }
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
      W, H, gravity: game.baseGravity, gravityScale: worldGravityScale(), tickMs: 16.7,
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
  emitFx = opts.onFx || (() => {});
  serverControllers.clear();
  drainEmitted(); // start clean: createSim's loadMap(0) has already queued a few
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
    // The drain is the last thing in a tick, so the cosmetics a tick produced
    // are on the wire before the snapshot the room sends after this returns.
    stepSim: () => { stepSim(); flushFx(); },
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
    // The room keys seat reservations on a name and shouts it in the reset
    // banner, so it needs the same cleaning the sim gives a player's name —
    // from the sim's own definition, not a second copy that can drift.
    cleanName: (s) => cleanName(s),
    // A dropped player's round wins outlive their body. The room removes the
    // shell at the round boundary — an idle one is a punching bag the round
    // cannot end without killing — and hands the wins to whoever comes back
    // for that name inside RESERVE_MS.
    playerWins: (slot) => {
      const p = players.find((q) => q.slot === slot);
      return p ? (p.roundWins || 0) : 0;
    },
    setPlayerWins: (slot, n) => {
      const p = players.find((q) => q.slot === slot);
      if (p) p.roundWins = Math.max(0, Math.min(99, Math.floor(Number(n)) || 0));
    },
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
    // Put the sim on `mapIndex`, make sure everyone is standing and whole, and
    // fire `spellId` from `slot` with its cooldown cleared.
    //
    // The phase-1 gate calls this ~15,600 times, once per spell per map, so it
    // deliberately does NOT go through startRound: that would count a round,
    // and every tenth round is a boss round which may pick a DIFFERENT map,
    // which would quietly move the gate off the map it claims to be testing.
    // loadMap plus an explicit respawn keeps the arena the caller asked for.
    //
    // Health is restored before the cast rather than after, so a spell that
    // corrupts hp during the ticks that follow is still caught — the gate reads
    // hp from the snapshot once the ticks have run.
    debugCastSpell: (slot, spellId, mapIndex) => {
      if (mapIndex != null && (!currentMap || game.mapIndex !== mapIndex)) loadMap(mapIndex);
      game.state = 'PLAY';
      for (const q of players) {
        if (!q.alive) spawnPlayer(q, spawnPointFor(q));
        q.hp = MAX_HP;
      }
      const p = players.find((q) => q.slot === slot) ?? players[0];
      if (!p) throw new Error(`no player in slot ${slot}`);
      p.slots[0] = spellId;
      p.casts[0] = -1e9; // past any cooldown
      castSpell(p, simNow(), 0);
    },
    // Start a round on the named map, cast `spellId` from slot 0, run
    // `ticksToRun` ticks, and report whether the spell's gravity modifier is
    // still on the stack. The three cycling maps rewrite gravity every tick;
    // this is what proves they no longer erase a spell that did.
    debugCastOnMap: (mapNameFragment, spellId, ticksToRun) => {
      const want = mapNameFragment.toUpperCase();
      const index = MAPS.findIndex((m) => m.name.includes(want));
      if (index < 0) throw new Error(`no map matching ${mapNameFragment}`);
      if (!players.length) serverAddPlayer({ name: 'probe' });
      startRound(index); // loads the map AND respawns everyone onto it
      if (game.mapIndex !== index) throw new Error('the round did not land on the requested map');
      const p = players[0];
      p.slots[0] = spellId;
      p.casts[0] = -1e9; // past any cooldown
      // Identify the spell's OWN modifier by id, not by counting: an env event
      // rolled at round start may have pushed one of its own, and a count would
      // confuse the two.
      const before = new Set(activeModifiers().map((m) => m.id));
      castSpell(p, simNow(), 0);
      const mine = activeModifiers().filter((m) => !before.has(m.id));
      if (mine.length !== 1) throw new Error(`${spellId} pushed ${mine.length} gravity modifiers, expected 1`);
      for (let i = 0; i < ticksToRun; i++) stepSim();
      // "Still in effect" is three claims, and the middle one is the one the
      // bug broke: modifier-presence alone would be near-tautological (only
      // pop/clearModifiers can remove one), so it is checked against the value
      // the ENGINE actually has. A map that writes gravity behind the stack's
      // back — which is exactly what Flip Zone, Blink and Glitch used to do —
      // leaves the modifier on the list and the world unflipped, and fails here.
      return activeModifiers().some((m) => m.id === mine[0].id)
        && gravityY() === currentGravity()
        && currentGravity() !== baseGravity();
    },
    // diagnostics for the smoke harness / leak audit
    // `particles` is gone from here on purpose: the field lives in
    // src/render/fx.js now and a headless host has none — reporting 0 would
    // read like a leak check that passes. `emitted` is the equivalent headless
    // measure: a queue that grows is a drain that stopped.
    audit: () => ({
      bodies: allBodies().length,
      emitted: emittedCount(),
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
  emitFx = () => {};
  drainEmitted(); // whatever the dying sim queued does not belong to the next one
  serverControllers.clear();
}
