// match.js — the state machine: round and match flow, the arena currently
// loaded, and the banner that narrates both.
import { W, H, onWorldReset } from './world.js';
import { addBody, addTo, createBox, createComposite, removeBody } from './phys/facade.js';
import { clearModifiers, setBase } from './gravity.js';
import { simNow } from './time.js';
import { simRandom, rand, reseed } from './rng.js';
import { pairCooldown } from './cooldown.js';
import { particles, doFlash } from './fx.js';
import { slowMo } from './pace.js';
import { sfx } from './sfx.js';
import { scheduleIn, cancelTag } from './schedule.js';
import { computeAwards, resetMatchStats } from './awards.js';
import {
  computeSpellReport, flushRoundTelemetry, resetMatchTelemetry, resetTelemetry,
} from './telemetry.js';
import { MAPS } from './maps/builders.js';
import { buildMapExtras } from './maps/extras.js';
import { rollEnvEvent } from './events.js';
import { BOSS_EVERY, spawnBoss } from './ai/boss.js';
import { startRun, endRun } from './waves.js';
import {
  players, MAX_PLAYERS, createPlayer, spawnPlayer, despawnPlayer, spawnPointFor, clearSpells, gibs,
} from './player/lifecycle.js';
import { activeEffects, projectiles, summons } from './spells/core.js';
import { tomes, hats, scheduleTomes } from './pickups.js';
import { clearReplay, startReplay } from './replay.js';

// mode: 'versus' (last-wizard-standing match) | 'wave' (co-op/solo PvE survival, js/enemies.js)
export const game = { state: 'LOBBY', winsNeeded: 5, winner: null, mapIndex: 0, baseGravity: 2, mode: 'versus', wave: 0, waveState: 'active' };

// wave mode is playable solo; versus needs an opponent
export function minPlayers() { return game.mode === 'wave' ? 1 : 2; }
export let currentMap = null;
// net/client.js swaps in its own locally rebuilt arena while rendering a
// remote match, so this is a rebindable binding rather than a plain let.
export function setCurrentMap(m) { currentMap = m; }
export let banner = '', bannerColor = '#fff', bannerUntil = 0, bannerHyper = false;


function baseSetBanner(text, color, ms = 1400, hyper = false) {
  banner = text;
  bannerColor = color;
  bannerUntil = simNow() + ms;
  bannerHyper = hyper;
}

export function loadMap(index) {
  for (const fb of projectiles) removeBody(fb);
  projectiles.clear();
  for (const g of gibs) removeBody(g);
  gibs.clear();
  for (const t of tomes) removeBody(t);
  tomes.clear();
  for (const h of hats) removeBody(h);
  hats.clear();
  for (const s of summons) removeBody(s);
  summons.clear();
  // C9. Round teardown: pending effects are ABANDONED, not resolved. A Sticky
  // Bomb that never detonated must not explode into the next round's map, and
  // a Singularity that never collapsed must not blast a fresh arena — onEnd is
  // for effects that reach their OWN end. Truncating the array said this by
  // omission; the sweep says it out loud and gives an effect holding something
  // (a body, a gravity modifier) a hook to let go of it.
  for (const e of activeEffects) e.onAbandon?.();
  activeEffects.length = 0;
  particles.length = 0;
  // Every contact gate goes with the round. The bodies most of them are keyed
  // on have just been removed above, but the wizards' have not — a player
  // object outlives the round, and its stomp/spike gates used to outlive it too.
  pairCooldown.clear();
  if (currentMap) removeBody(currentMap.composite);
  const def = MAPS[index];
  const m = { def, composite: createComposite(), data: {} };
  for (const x of [-30, W + 30]) {
    const wall = createBox(x, H / 2, 60, H * 3, { isStatic: true });
    wall.render.fillStyle = '#171221';
    addTo(m.composite, wall);
  }
  def.build(m);
  // seeded extras (gap steppers, scattered cover) — the seed rides the snapshot
  // so LAN clients regenerate the exact same statics
  game.mapSeed = (simRandom() * 0xffffffff) >>> 0;
  m.data.seed = game.mapSeed;
  buildMapExtras(m, game.mapSeed);
  // The round's own stream, restarted here so a round replays from one number.
  // It is derived from the map seed but deliberately NOT equal to it: the map
  // seed already drives buildMapExtras above, and a round whose first gameplay
  // draw repeated the extras' first draw would correlate the two. The golden
  // ratio constant is the usual cheap decorrelator.
  reseed(game.mapSeed ^ 0x9e3779b9);
  if (def.stars) {
    m.data.starfield = Array.from({ length: 70 }, () => ({ x: rand(0, W), y: rand(0, H - 160), r: rand(0.5, 1.8), tw: rand(0, 6.28) }));
  }
  addBody(m.composite);
  currentMap = m;
  game.mapIndex = index;
  game.baseGravity = def.gravity ?? 2;
  // Every gravity modifier is round-scoped, exactly like the activeEffects
  // emptied above — this is what takes Moonshot's 0.45 back off, and what stops
  // a Gravity Flip cast in the last second of a round from following the
  // wizards onto the next map.
  clearModifiers();
  setBase(game.baseGravity);
  game.envEvent = null;
  game.boss = null;
}

export function startRound(index) {
  // Retract every pending round-flow callback before building the new round.
  //
  // What this closes is the STALE-ACROSS-ROUNDS case: a resolution scheduled in
  // round N that is still pending when round N+1 has itself reached ROUND_END.
  // The `game.state === 'ROUND_END'` guards on those callbacks cannot tell the
  // two apart — the state is right, the round is not — so round N's callback
  // would resolve round N+1 early. Emptying the queue at the round boundary is
  // the only thing that can distinguish them.
  //
  // It is NOT about two deaths in the same beat: both schedule checkRoundEnd,
  // the first sets ROUND_END, and the second already returns at the
  // `game.state !== 'PLAY'` guard below. That case was never reachable.
  //
  // The state guards stay load-bearing regardless — see the note on
  // drainScheduled in src/sim/schedule.js about cancellation within one drain.
  cancelTag('round');
  clearReplay();
  if (game.state === 'LOBBY') { resetMatchStats(); resetMatchTelemetry(); } // fresh match, fresh ledger
  game.totalRounds = (game.totalRounds || 0) + 1;
  resetTelemetry(); // fresh per-round balance tally
  const bossTime = game.totalRounds % BOSS_EVERY === 0;
  let tries = 0;
  while (bossTime && MAPS[index].cozy && ++tries < 60) index = Math.floor(simRandom() * MAPS.length);
  loadMap(index);
  for (const p of players) {
    clearSpells(p);
    despawnPlayer(p);
    spawnPlayer(p, spawnPointFor(p));
  }
  game.state = 'PLAY';
  game.fightAt = simNow() + 1100;
  game.fightShown = false;
  scheduleTomes(simNow());
  if (bossTime) spawnBoss(simNow());
  else rollEnvEvent(simNow());
  setBanner(bossTime ? 'BOSS BATTLE' : currentMap.def.name, bossTime ? '#ffd166' : '#e8d5ff', 1000);
}

game.onDeath = (p) => {
  if (game.state === 'LOBBY') {
    scheduleIn(1200, () => {
      if (game.state === 'LOBBY' && !p.alive) spawnPlayer(p, spawnPointFor(p));
    }, 'lobby-respawn');
    return;
  }
  if (game.state !== 'PLAY') return;
  scheduleIn(650, checkRoundEnd, 'round');
};

export function checkRoundEnd() {
  if (game.state !== 'PLAY') return;
  const alive = players.filter(p => p.alive);
  if (game.mode === 'wave') {
    // PvE survival: the run ends only on a full-party wipe. The fallen stay down
    // until the next wave's intermission revives them (see updateWaveMode).
    if (alive.length === 0) endRun();
    return;
  }
  if (game.boss) {
    // co-op boss fight: the round runs while anyone stands; a wipe wipes the score
    if (alive.length > 0) return;
    game.state = 'ROUND_END';
    game.winner = null;
    flushRoundTelemetry();
    const replayMs = startReplay(simNow());
    for (const p of players) p.roundWins = 0;
    setBanner(`${game.boss.def.name} PREVAILS — START OVER`, game.boss.def.color, 1800 + replayMs);
    sfx.death();
    slowMo(0.3, 900);
    scheduleIn(1900 + replayMs, () => {
      if (game.state === 'ROUND_END') startRound(nextMapIndex());
    }, 'round');
    return;
  }
  if (alive.length > 1) return;
  const winner = alive[0] || null;
  game.state = 'ROUND_END';
  game.winner = winner;
  flushRoundTelemetry();
  const replayMs = startReplay(simNow()); // 0 if the round was too short
  if (winner) {
    winner.roundWins++;
    setBanner(`${winner.name} +1`, winner.color, 1800 + replayMs);
  } else {
    setBanner('DRAW', '#e8d5ff', 1800 + replayMs);
  }
  sfx.roundWin();
  slowMo(0.3, 900);
  scheduleIn(1900 + replayMs, () => {
    if (game.state !== 'ROUND_END') return;
    if (winner && winner.roundWins >= game.winsNeeded) startVictory(winner);
    else startRound(nextMapIndex());
  }, 'round');
}

export function nextMapIndex() {
  const crowded = players.length >= 6; // cozy maps can't hold a big lobby
  let i, tries = 0;
  do { i = Math.floor(simRandom() * MAPS.length); }
  while ((i === game.mapIndex || (crowded && MAPS[i].cozy)) && ++tries < 60);
  return i;
}

export function startVictory(p) {
  game.state = 'VICTORY';
  game.winner = p;
  game.awards = computeAwards();
  game.spellReport = computeSpellReport();
  sfx.victory();
  doFlash(p.color, 0.4);
}

export function resetMatch() {
  cancelTag('round'); // same reason as startRound: no round-flow callback outlives the round
  clearReplay();
  for (const p of players) p.roundWins = 0;
  game.state = 'LOBBY';
  loadMap(0);
  for (const p of players) {
    despawnPlayer(p);
    spawnPlayer(p, spawnPointFor(p));
  }
  setBanner('LOBBY', '#e8d5ff', 900);
}

export function setWins(n) {
  game.winsNeeded = Math.max(1, Math.min(20, n));
  setBanner(`FIRST TO ${game.winsNeeded}`, '#e8d5ff', 900);
}
// start from the lobby into whichever mode is selected
export function beginFromLobby() {
  if (game.state !== 'LOBBY' || players.length < minPlayers()) return;
  if (game.mode === 'wave') startRun();
  else startRound(game.mapIndex);
}
export function toggleMode() {
  if (game.state !== 'LOBBY') return;
  game.mode = game.mode === 'wave' ? 'versus' : 'wave';
  setBanner(game.mode === 'wave' ? 'WAVE SURVIVAL' : 'VERSUS', '#ffd166', 1100);
}

// ---------- joining ----------
export function joinPlayer(controller, name) {
  if (players.length >= MAX_PLAYERS) return;
  // lowest free slot, not players.length — online play can remove a mid-roster
  // player, and slots are wire identity (colors, spawns) that must never collide
  let slot = 0;
  while (players.some(p => p.slot === slot)) slot++;
  const p = createPlayer(slot, controller);
  if (name) p.name = name;
  spawnPlayer(p, spawnPointFor(p));
  sfx.pickup();
  setBanner(`${p.name} JOINED`, p.color, 900);
}

// the server bridge wraps setBanner so LAN clients replay it
// (server/sim-bridge.js:48 reassigned the global)
export let setBanner = baseSetBanner;
export function setSetBanner(fn) { setBanner = fn; }

const INITIAL_GAME = { state: 'LOBBY', winsNeeded: 5, winner: null, mapIndex: 0, baseGravity: 2, mode: 'versus', wave: 0, waveState: 'active' };

onWorldReset(() => {
  for (const k of Object.keys(game)) if (k !== 'onDeath') delete game[k];
  Object.assign(game, INITIAL_GAME);
  currentMap = null;
  banner = '';
  bannerColor = '#fff';
  bannerUntil = 0;
  bannerHyper = false;
});
