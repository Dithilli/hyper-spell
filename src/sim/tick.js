// tick.js — the update phase. stepSim advances everything and draws nothing.
// Neither platform calls it per frame any more: both put the fixed-timestep
// accumulator (src/sim/tick-loop.js) in front of it, so it runs 0..MAX_CATCHUP
// times per frame and always with the same step. The dedicated server
// (server/sim-host.js) drives the same loop with the draw half never running.
import { Body, Composite, Engine, engine, world, W, H } from './world.js';
import { simRandom, rand } from './rng.js';
import { particles, updateParticles } from './fx.js';
import { updatePace } from './pace.js';
import { TICK_MS, advanceTick, currentTick, simNow } from './time.js';
import { drainScheduled } from './schedule.js';
import { sfx } from './sfx.js';
import { nameEdit, nameEditEndAt } from './lobby.js';
import { game, currentMap, minPlayers, setBanner, beginFromLobby, resetMatch } from './match.js';
import { players, gibs } from './player/lifecycle.js';
import { updatePlayers } from './player/controller.js';
import { updateGhosts } from './player/ghost.js';
import { updateTomes } from './pickups.js';
import {
  projectiles, summons, removeProjectile, removeSummon, explode, updateEffects,
} from './spells/core.js';
import { updateEnvEvent } from './events.js';
import { updateBoss } from './ai/boss.js';
import { updateEnemies } from './ai/enemies.js';
import { updateWaveMode } from './waves.js';
import { replayRecord } from './replay.js';
import './collision.js'; // registers the contact handler on every new world

// ---------- per-frame upkeep ----------
export function wrapBody(b) {
  if (b.position.x < -20) Body.setPosition(b, { x: W + 15, y: b.position.y });
  if (b.position.x > W + 20) Body.setPosition(b, { x: -15, y: b.position.y });
}

export function postPhysics(now) {
  const wrap = currentMap.def.wrap;
  for (const fb of [...projectiles]) {
    fb.update?.(fb, now);
    if (simRandom() < 0.7) {
      particles.push({ kind: 'square', x: fb.position.x, y: fb.position.y, vx: rand(-0.5, 0.5), vy: rand(-0.5, 0.5), life: 14, maxLife: 14, color: fb.color || '#ffb347', r: 2.5 });
    }
    if (fb.expireAt && now > fb.expireAt) {
      projectiles.delete(fb);
      fb.onHit?.(fb, null);
      Composite.remove(world, fb);
      continue;
    }
    if (wrap) wrapBody(fb);
    const { x, y } = fb.position;
    if (y > H + 100 || (!wrap && (x < -100 || x > W + 100))) removeProjectile(fb);
  }
  for (const b of [...summons]) {
    if (b.label !== 'boss' && (now > b.dieAt || b.position.y > H + 140)) { removeSummon(b); continue; }
    if (wrap) wrapBody(b);
    if (b.critter && now > b.critter.hopAt && Math.abs(b.velocity.y) < 1) {
      b.critter.hopAt = now + rand(400, 800);
      if (b.position.x < 70) b.critter.dir = 1;
      if (b.position.x > W - 70) b.critter.dir = -1;
      Body.setVelocity(b, { x: b.critter.dir * rand(2, b.critter.speed), y: -b.critter.hop });
    }
    if (b.label === 'saw') {
      // a rolling ground hazard: keep it spinning across the arena, bouncing off the walls
      if (b.position.x < 40) b.sawDir = 1;
      if (b.position.x > W - 40) b.sawDir = -1;
      Body.setVelocity(b, { x: (b.sawDir || 1) * 9, y: b.velocity.y });
      Body.setAngularVelocity(b, (b.sawDir || 1) * 0.9);
    }
    if (b.label === 'mine' && b.mineBlast) {
      if (!b.armAt) b.armAt = now + 1000;
      else if (now > b.armAt) {
        for (const q of players) {
          if (!q.alive) continue;
          if (q === b.owner && now < b.armAt + 2500) continue;
          if (Math.hypot(q.body.position.x - b.position.x, q.body.position.y - b.position.y) < 50) {
            const mb = b.mineBlast;
            const pos = { ...b.position };
            removeSummon(b);
            explode(pos.x, pos.y, mb.radius, mb.power, mb.dmg, b.owner);
            break;
          }
        }
      }
    }
  }
  for (const gib of [...gibs]) {
    if (now > gib.dieAt || gib.position.y > H + 100) {
      gibs.delete(gib);
      Composite.remove(world, gib);
    }
  }
}

// ---------- main loop ----------
// stepSim is the entire update phase — everything that advances game state and
// nothing that draws. The browser loop below calls it every rAF; the dedicated
// server calls it from its own fixed 60Hz tick (server/sim-host.js) with the
// draw/rAF half never running.
// stepSim takes no arguments. It used to be handed the caller's wall clock and
// its measured frame delta; both are now the sim's own business:
//
//   * the step size is always TICK_MS. The accumulator in src/sim/tick-loop.js
//     sits in front of this function, so a measured delta could only ever
//     disagree with the step actually taken. Making the size a property of
//     stepSim rather than a promise from each caller is what keeps a
//     hand-rolled driver (the tape harness, server/sim-smoke.js) on the same
//     timestep the game runs.
//   * `now` is simNow() — tick x TICK_MS — and stepSim advances the tick
//     itself, at the END of the step, so everything inside one step observes
//     one timestamp and the state a step produces is stamped with the tick it
//     produced. Neither platform loop advances the tick any more; doing it in
//     both places would run the clock at double rate.
//
// Slow-mo does not shrink the step — it slows how fast the loop consumes ticks,
// which is exactly why the deadlines below are on simNow() and pace.js's own
// deadline is not (see the comment there).
export function stepSim() {
  // FIRST, before anything reads game.state: the round-flow callbacks
  // (src/sim/schedule.js) decide whether this tick belongs to the round that
  // just ended or the one starting. Draining after the update phase would let
  // one tick run against a round the scheduler had already retired.
  drainScheduled(currentTick());
  updatePace();
  const now = simNow();
  const dt = TICK_MS;

  for (const p of players) p.input = p.controller.poll();
  if (game.state === 'LOBBY' && players.length >= minPlayers() && !nameEdit && now > nameEditEndAt + 350 && players.some(p => p.input.startPressed)) beginFromLobby();
  if ((game.state === 'VICTORY' || game.state === 'RUN_OVER') && players.some(p => p.input.castPressed)) resetMatch();

  if (game.state === 'PLAY' && !game.fightShown && now > game.fightAt) {
    game.fightShown = true;
    setBanner('FIGHT!', '#7bd88f', 700);
    sfx.fight();
  }

  updatePlayers(now);
  updateGhosts(now);
  if (game.state === 'PLAY' || game.state === 'LOBBY') updateTomes(now);
  updateEffects(now, dt);
  currentMap.def.update?.(currentMap, now, dt);
  updateEnvEvent(now, dt);
  updateBoss(now, dt);
  updateEnemies(now, dt);
  updateWaveMode(now);

  // spinners + phantom platforms
  for (const b of Composite.allBodies(currentMap.composite)) {
    if (b.spin) Body.setAngle(b, b.angle + b.spin * (dt / 16.7));
    if (b.phantom) {
      const solid = Math.sin(now * b.phantom.speed + b.phantom.offset) > -0.2;
      if (solid !== b.phantomSolid) {
        b.phantomSolid = solid;
        b.collisionFilter.mask = solid ? 0xFFFFFFFF : 0;
      }
    }
  }

  // lobbed projectiles fly on reduced gravity — cancel part of it each tick
  for (const fb of projectiles) {
    if (fb.gravityScale < 1) {
      Body.applyForce(fb, fb.position, { x: 0, y: -engine.gravity.y * engine.gravity.scale * fb.mass * (1 - fb.gravityScale) });
    }
  }
  Engine.update(engine, Math.max(dt, 0.5));
  postPhysics(now);
  // one tick of particle life per tick. Particle `life` is counted in ticks, and
  // the tick loop already runs fewer ticks per second during a hitstop — scaling
  // by the pace here as well would slow the sparks twice over.
  updateParticles(1);
  replayRecord(now);
  // Last: everything above observed `now`, and the state it just produced is
  // the state AT the next tick. Advancing here rather than at the top is what
  // keeps `simNow()` inside a step equal to the timestamp the pre-Task-4 loops
  // handed in, so the substitution moves no hash on its own.
  advanceTick();
}
