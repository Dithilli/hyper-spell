// tick.js — the update phase. stepSim advances everything and draws nothing:
// the browser loop calls it every rAF, the dedicated server from its own fixed
// 60Hz tick (server/sim-host.js) with the draw half never running.
import { Body, Composite, Engine, engine, world, W, H } from './world.js';
import { rand } from './rng.js';
import { particles, spawnParticles, updateParticles } from './fx.js';
import { timeScale, updateTimeScale } from './pace.js';
import { sfx } from './sfx.js';
import { nameEdit, nameEditEndAt } from './lobby.js';
import { game, currentMap, minPlayers, setBanner, beginFromLobby, resetMatch } from './match.js';
import { players, gibs } from './player/lifecycle.js';
import { updatePlayers } from './player/controller.js';
import { updateGhosts } from './player/ghost.js';
import { updateTomes } from './pickups.js';
import {
  projectiles, summons, activeEffects, removeProjectile, removeSummon,
  explode, updateEffects,
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
    if (Math.random() < 0.7) {
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
export function stepSim(now, rawDt) {
  updateTimeScale(now);
  const dt = rawDt * timeScale;

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
  updateParticles(timeScale);
  replayRecord(now);
}
