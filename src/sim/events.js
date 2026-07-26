// events.js — environmental events: rare round modifiers rolled at round start
// and announced with a banner just after FIGHT!. All physics runs host-side;
// visuals reach LAN clients and the killcam through the snapshot's `ev` field
// (drawn in src/render/draw-env.js).
import { Bodies, Body, Composite, world, engine, W, H } from './world.js';
import { random } from './env.js';
import { rand, pick } from './rng.js';
import { spawnParticles, addShake, doFlash } from './fx.js';
import { sfx } from './sfx.js';
import { game, setBanner, currentMap } from './match.js';
import { players } from './player/lifecycle.js';

import { tomes, spawnTome } from './pickups.js';
import { dropProjectile, explode, summon, summons } from './spells/core.js';
import { applyWind, updateStrikes } from './maps/builders.js';

export const ENV_EVENT_CHANCE = 0.20; // one round in five

// find n platform tops spread across the map (same spirit as tomeDropSpot).
// Pass a seeded rng when the result must match across host & LAN clients.
export function platformSpots(m, n, rng) {
  const rr = rng ? (a, b) => a + rng() * (b - a) : rand;
  const solids = Composite.allBodies(m.composite).filter(b =>
    b.isStatic && !b.isSensor && b.collisionFilter.mask !== 0 &&
    b.bounds.min.x > -60 && b.bounds.max.x < W + 60);
  const spots = [];
  for (let tries = 0; tries < n * 10 && spots.length < n; tries++) {
    const x = rr(90, W - 90);
    const col = solids.filter(b => x > b.bounds.min.x + 8 && x < b.bounds.max.x - 8);
    if (!col.length) continue;
    const tops = col.map(b => b.bounds.min.y).filter(y => y > 150 && y < H - 60);
    if (!tops.length) continue;
    const y = Math.min(...tops);
    if (spots.some(s => Math.abs(s.x - x) < 70 && Math.abs(s.y - y) < 60)) continue;
    spots.push({ x, y });
  }
  return spots;
}

export function killVine(v) {
  const vines = currentMap.data.vines;
  if (!vines || !vines.includes(v)) return;
  vines.splice(vines.indexOf(v), 1);
  Composite.remove(currentMap.composite, v);
  spawnParticles(v.position.x, v.position.y, '#7bd88f', 12, 4);
  sfx.squeak();
}

export const ENV_EVENTS = [
  {
    id: 'overgrowth', name: 'OVERGROWTH', color: '#7bd88f',
    start(m, now) {
      m.data.vines = [];
      for (const s of platformSpots(m, 12)) {
        const v = Bodies.rectangle(s.x, s.y - 24, 22, 48, { isStatic: true, isSensor: true, label: 'vine' });
        v.render.fillStyle = '#4f8a3d';
        v.kinematic = true; // so the snapshot carries it to clients and the killcam
        v.bornAt = now;
        Composite.add(m.composite, v);
        m.data.vines.push(v);
      }
    },
    update(m, now) {
      for (const p of players) {
        if (!p.alive) continue;
        for (const v of m.data.vines || []) {
          if (Math.abs(p.body.position.x - v.position.x) < 26 && Math.abs(p.body.position.y - v.position.y) < 44) {
            p.vineSlowUntil = now + 130;
            break;
          }
        }
      }
    },
  },
  {
    id: 'winter', name: 'WINTER', color: '#bfe8ff',
    start(m) {
      m.data.eventIcy = true;
      for (const b of Composite.allBodies(m.composite)) {
        if (b.isStatic && !b.isSensor) b.friction = 0.01;
      }
    },
  },
  {
    id: 'tempest', name: 'TEMPEST', color: '#9ef0f0',
    update(m, now) {
      applyWind(Math.sin(now / 1400) * 0.38);
      updateStrikes(m, now, 3200, 20);
    },
  },
  {
    id: 'meteors', name: 'METEOR SHOWER', color: '#ff8c5a',
    update(m, now) {
      if (now > (m.data.nextMeteor || (m.data.nextMeteor = now + 1600))) {
        m.data.nextMeteor = now + rand(1800, 3200);
        const fb = dropProjectile(null, rand(80, W - 80), -30, { r: 11, vx: rand(-3, 3), vy: 10, color: '#ff8c5a', density: 0.006, expireMs: 9000 });
        fb.onHit = (self) => explode(self.position.x, self.position.y, 95, 14, 16, null);
      }
    },
  },
  {
    id: 'moonshot', name: 'MOONSHOT', color: '#e8d5ff',
    start() {
      game.baseGravity *= 0.45;
      engine.gravity.y *= 0.45;
    },
  },
  {
    id: 'nightfall', name: 'NIGHTFALL', color: '#3d2f5c',
  },
  {
    id: 'quake', name: 'EARTHQUAKE', color: '#b08948',
    update(m, now) {
      if (now > (m.data.nextQuake || (m.data.nextQuake = now + 2600))) {
        m.data.nextQuake = now + rand(3500, 6000);
        m.data.quakeUntil = now + 900;
        sfx.explosion();
      }
      if (now < (m.data.quakeUntil || 0)) {
        addShake(1.3);
        if (random() < 0.25) {
          for (const b of Composite.allBodies(world)) {
            if (b.isStatic || b.isSensor) continue;
            Body.setVelocity(b, { x: b.velocity.x + rand(-1.6, 1.6), y: b.velocity.y - rand(0, 1.2) });
          }
        }
      }
    },
  },
  {
    id: 'rubber', name: 'RUBBER WORLD', color: '#ff8fc7',
    start(m) {
      for (const b of Composite.allBodies(m.composite)) {
        if (b.isStatic && !b.isSensor) b.restitution = 0.9;
      }
    },
  },
  {
    id: 'critters', name: 'CRITTER PLAGUE', color: '#9be15d',
    update(m, now) {
      if (now > (m.data.nextCritter || (m.data.nextCritter = now + 2000))) {
        m.data.nextCritter = now + rand(2200, 3600);
        if ([...summons].filter(b => b.label === 'critter').length < 8) {
          const side = pick([-1, 1]);
          const b = Bodies.circle(side < 0 ? -14 : W + 14, rand(80, 300), 9, { density: 0.002, friction: 0.5, restitution: 0.4, label: 'critter' });
          b.critter = { hopAt: 0, dir: -side, hop: 6, speed: 4 };
          summon(b, { life: 22000, color: pick(['#9be15d', '#e15d5d', '#c084fc']), contactDamage: 6 });
          Body.setVelocity(b, { x: -side * 4, y: 0 });
        }
      }
    },
  },
  {
    id: 'surge', name: 'ARCANE SURGE', color: '#ffd166',
    update(m, now) {
      if (now > (m.data.nextSurge || (m.data.nextSurge = now + 1200))) {
        m.data.nextSurge = now + rand(1400, 2200);
        if (tomes.size < 10) spawnTome(now);
      }
    },
  },
];

export function envEventById(id) {
  return ENV_EVENTS.find(e => e.id === id) || null;
}

export function rollEnvEvent(now) {
  game.envEvent = null;
  if (random() >= ENV_EVENT_CHANCE) return;
  const def = pick(ENV_EVENTS);
  game.envEvent = { def, announced: false };
  def.start?.(currentMap, now);
}

export function updateEnvEvent(now, dt) {
  const ev = game.envEvent;
  if (!ev || game.state !== 'PLAY') return;
  if (!ev.announced && now > (game.fightAt || 0) + 800) {
    ev.announced = true;
    setBanner(ev.def.name, ev.def.color, 1700);
    doFlash(ev.def.color, 0.18);
    sfx.event();
  }
  if (ev.announced) ev.def.update?.(currentMap, now, dt);
}
