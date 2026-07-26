// waves.js — the wave manager and run lifecycle for PvE survival mode.
// game.js calls updateWaveMode/startRun/endRun; the enemies themselves are in
// src/sim/ai/enemies.js.
import { W, onWorldReset } from './world.js';
import { performance, random } from './env.js';
import { rand } from './rng.js';
import { slowMo } from './pace.js';
import { sfx } from './sfx.js';
import { storage } from './storage.js';
import { resetMatchStats } from './awards.js';
import { resetMatchTelemetry } from './telemetry.js';
import { game, setBanner, loadMap } from './match.js';
import {
  players, clearSpells, despawnPlayer, spawnPlayer, spawnPointFor,
} from './player/lifecycle.js';
import { scheduleTomes, spawnTome } from './pickups.js';
import { removeSummon } from './spells/core.js';
import { MAPS } from './maps/builders.js';
import { clearReplay } from './replay.js';
import { enemies, spawnEnemy } from './ai/enemies.js';
import { spawnBoss } from './ai/boss.js';

export let pendingSpawns = [];         // staggered spawn queue: { type, tier, at, x, y }

export function clearEnemies() {
  for (const b of [...enemies]) removeSummon(b);
  enemies.clear();
  pendingSpawns = [];
}

// ---------- wave manager ----------

export const WAVE_ENEMY_CAP = 20; // couch-sane concurrent cap; overflow is logged, not silent

// difficulty tier climbs every 5 waves (also what boss capstones scale by)
export function waveTier(n) { return 1 + Math.floor((n - 1) / 5); }

// a flat list of enemy type strings for wave n (non-boss waves)
export function waveComposition(n) {
  const list = [];
  for (let i = 0; i < 2 + Math.floor(n * 0.8); i++) list.push('swordsman');
  if (n >= 3) for (let i = 0; i < 1 + Math.floor(n / 4); i++) list.push('archer');
  if (n >= 4) for (let i = 0; i < 3 + Math.floor(n / 2); i++) list.push('bug');
  if (n >= 6) for (let i = 0; i < Math.floor((n - 4) / 3); i++) list.push('ogre');
  if (list.length > WAVE_ENEMY_CAP) {
    console.warn(`wave ${n}: capping ${list.length} enemies to ${WAVE_ENEMY_CAP}`);
    return list.slice(0, WAVE_ENEMY_CAP);
  }
  return list;
}

export function queueSpawn(type, tier, at) {
  const side = random() < 0.5 ? -1 : 1;
  pendingSpawns.push({ type, tier, at, x: side < 0 ? 40 : W - 40, y: 120 });
}

export function startWave(n) {
  game.wave = n;
  game.waveState = 'active';
  const now = performance.now();
  const tier = waveTier(n);
  if (n % 5 === 0) {
    // boss capstone (+ a few adds), reusing the scaled boss system
    game.fightAt = now; // let the boss announce right after the wave banner
    spawnBoss(now, { tier });
    const adds = Math.min(4, 1 + Math.floor(n / 10));
    for (let i = 0; i < adds; i++) queueSpawn('swordsman', tier, now + 500 + i * 500);
    setBanner(`WAVE ${n} — BOSS`, '#ffd166', 1600);
  } else {
    let t = now + 300;
    for (const type of waveComposition(n)) { queueSpawn(type, tier, t); t += rand(160, 340); }
    setBanner(`WAVE ${n}`, '#e8d5ff', 1200);
  }
  sfx.roundWin?.();
}

export function updateWaveMode(now) {
  if (game.mode !== 'wave' || game.state !== 'PLAY') return;
  // flush the staggered spawn queue
  if (pendingSpawns.length) {
    pendingSpawns = pendingSpawns.filter(s => {
      if (now < s.at) return true;
      spawnEnemy(s.type, s.x, s.y, s.tier);
      return false;
    });
  }
  if (game.waveState === 'active') {
    if (!pendingSpawns.length && enemies.size === 0 && !game.boss) {
      game.waveState = 'intermission';
      game.intermissionAt = now + 3200;
      for (const p of players) if (!p.alive) spawnPlayer(p, spawnPointFor(p)); // revive the fallen
      spawnTome(now); spawnTome(now); // reward: a couple of tomes to power up
      setBanner(`WAVE ${game.wave} CLEARED`, '#7bd88f', 1600);
      sfx.victory?.();
    }
  } else if (game.waveState === 'intermission' && now > game.intermissionAt) {
    startWave(game.wave + 1);
  }
}

// ---------- run lifecycle ----------

export function startRun() {
  game.mode = 'wave';
  clearReplay();
  resetMatchStats();
  resetMatchTelemetry();
  game.totalRounds = 0;
  game.wave = 0;
  game.winner = null;
  game.boss = null;
  clearEnemies();
  // a grounded, non-cozy arena to fight in
  const idx = MAPS.findIndex(m => !m.cozy && (m.gravity ?? 2) > 0);
  loadMap(idx >= 0 ? idx : 0);
  for (const p of players) { clearSpells(p); despawnPlayer(p); spawnPlayer(p, spawnPointFor(p)); }
  game.state = 'PLAY';
  game.fightAt = performance.now() + 900;
  game.fightShown = false;
  game.bestWave = +(storage.getItem('hs-best-wave') || 0);
  scheduleTomes(performance.now());
  startWave(1);
}

export function endRun() {
  const reached = game.wave;
  game.runScore = reached;
  if (reached > (game.bestWave || 0)) { game.bestWave = reached; storage.setItem('hs-best-wave', String(reached)); }
  game.state = 'RUN_OVER';
  game.winner = null;
  clearEnemies();
  game.boss = null;
  setBanner(`OVERRUN — REACHED WAVE ${reached}`, '#ff6b6b', 2400);
  sfx.death?.();
  slowMo(0.3, 1000);
}

onWorldReset(() => { pendingSpawns = []; });
