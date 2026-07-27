// match.js — the state machine: round and match flow, the arena currently
// loaded, and the banner that narrates both.
import { Composite, Bodies, world, engine, W, H, onWorldReset } from './world.js';
import { random } from './env.js';
import { simNow } from './time.js';
import { rand } from './rng.js';
import { particles, doFlash } from './fx.js';
import { slowMo } from './pace.js';
import { sfx } from './sfx.js';
import { schedule } from './schedule.js';
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
  for (const fb of projectiles) Composite.remove(world, fb);
  projectiles.clear();
  for (const g of gibs) Composite.remove(world, g);
  gibs.clear();
  for (const t of tomes) Composite.remove(world, t);
  tomes.clear();
  for (const h of hats) Composite.remove(world, h);
  hats.clear();
  for (const s of summons) Composite.remove(world, s);
  summons.clear();
  activeEffects.length = 0;
  particles.length = 0;
  if (currentMap) Composite.remove(world, currentMap.composite);
  const def = MAPS[index];
  const m = { def, composite: Composite.create(), data: {} };
  for (const x of [-30, W + 30]) {
    const wall = Bodies.rectangle(x, H / 2, 60, H * 3, { isStatic: true });
    wall.render.fillStyle = '#171221';
    Composite.add(m.composite, wall);
  }
  def.build(m);
  // seeded extras (gap steppers, scattered cover) — the seed rides the snapshot
  // so LAN clients regenerate the exact same statics
  game.mapSeed = (random() * 0xffffffff) >>> 0;
  m.data.seed = game.mapSeed;
  buildMapExtras(m, game.mapSeed);
  if (def.stars) {
    m.data.starfield = Array.from({ length: 70 }, () => ({ x: rand(0, W), y: rand(0, H - 160), r: rand(0.5, 1.8), tw: rand(0, 6.28) }));
  }
  Composite.add(world, m.composite);
  currentMap = m;
  game.mapIndex = index;
  game.baseGravity = def.gravity ?? 2;
  engine.gravity.y = game.baseGravity;
  game.envEvent = null;
  game.boss = null;
}

export function startRound(index) {
  clearReplay();
  if (game.state === 'LOBBY') { resetMatchStats(); resetMatchTelemetry(); } // fresh match, fresh ledger
  game.totalRounds = (game.totalRounds || 0) + 1;
  resetTelemetry(); // fresh per-round balance tally
  const bossTime = game.totalRounds % BOSS_EVERY === 0;
  let tries = 0;
  while (bossTime && MAPS[index].cozy && ++tries < 60) index = Math.floor(random() * MAPS.length);
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
    schedule(() => {
      if (game.state === 'LOBBY' && !p.alive) spawnPlayer(p, spawnPointFor(p));
    }, 1200);
    return;
  }
  if (game.state !== 'PLAY') return;
  schedule(checkRoundEnd, 650);
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
    schedule(() => {
      if (game.state === 'ROUND_END') startRound(nextMapIndex());
    }, 1900 + replayMs);
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
  schedule(() => {
    if (game.state !== 'ROUND_END') return;
    if (winner && winner.roundWins >= game.winsNeeded) startVictory(winner);
    else startRound(nextMapIndex());
  }, 1900 + replayMs);
}

export function nextMapIndex() {
  const crowded = players.length >= 6; // cozy maps can't hold a big lobby
  let i, tries = 0;
  do { i = Math.floor(random() * MAPS.length); }
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
