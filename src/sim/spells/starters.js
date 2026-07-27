// spells/starters.js — the six spells the game shipped with, before the book.
// They are a plain table rather than a registration side effect so that
// src/sim/content.js can merge them into SPELLS ahead of the other hundred and
// thirty-six, whatever order the module graph happens to evaluate in.
import { Body, Composite, world, W } from '../world.js';
import { simNow } from '../time.js';
import { rand } from '../rng.js';
import { particles, spawnParticles, addShake, doFlash } from '../fx.js';
import { slowMo } from '../pace.js';
import { sfx } from '../sfx.js';
import { damagePlayer } from '../player/combat.js';
import {
  activeEffects, aimDir, shoot, dropProjectile, explode, raycastHit,
  boltVisual, spawnSingularity,
} from './core.js';

export const STARTERS = {
  fireball: {
    name: 'Fireball', color: '#ffb347', cooldown: 450,
    cast(p) {
      const m = p.mega || 1;
      const fb = shoot(p, { r: 7 * m, speed: 20, vy: -6, color: '#ffb347', gravityScale: 0.45 });
      fb.onHit = () => explode(fb.position.x, fb.position.y, 150 * m, 22 * m, 35 * m, fb.owner);
      Body.setVelocity(p.body, { x: p.body.velocity.x - p.facing * 2, y: p.body.velocity.y });
    },
  },
  gust: {
    name: 'Gust', color: '#d7f5ef', cooldown: 700,
    cast(p) {
      const m = p.mega || 1;
      const range = 240 * m;
      const { x, y } = p.body.position;
      const dir = aimDir(p, 1, 0);
      for (const b of Composite.allBodies(world)) {
        if (b.isStatic || b === p.body || b.isSensor) continue;
        const dx = b.position.x - x, dy = b.position.y - y;
        const d = Math.hypot(dx, dy);
        if (d > range || d === 0) continue;
        if ((dx * dir.x + dy * dir.y) / d < 0.55) continue; // ~56° cone around aim
        const s = 1 - d / range;
        if (b.label === 'projectile') {
          const spd = Math.hypot(b.velocity.x, b.velocity.y);
          Body.setVelocity(b, { x: dir.x * spd, y: dir.y * spd });
          continue;
        }
        Body.setVelocity(b, { x: b.velocity.x + dir.x * 18 * m * s, y: b.velocity.y + dir.y * 18 * m * s - 3 * s });
      }
      Body.setVelocity(p.body, { x: p.body.velocity.x - dir.x * 7, y: p.body.velocity.y - dir.y * 4 - 2 });
      for (let i = 0; i < 14; i++) {
        particles.push({ kind: 'spark', x: x + dir.x * 20, y: y - 6 + dir.y * 20 + rand(-10, 10), vx: dir.x * rand(6, 14), vy: dir.y * rand(6, 14) + rand(-1, 1), life: 18, maxLife: 18, color: '#d7f5ef', r: 2 });
      }
    },
  },
  lightning: {
    name: 'Lightning', color: '#fff89e', cooldown: 900, beam: true,
    cast(p) {
      const m = p.mega || 1;
      const { hit, pt, from, dir } = raycastHit(p);
      sfx.lightning();
      doFlash('#ffffff', 0.35);
      slowMo(0.05, 70);
      addShake(6);
      boltVisual(from.x, from.y, pt.x, pt.y, '#fff89e', 3 * m);
      spawnParticles(pt.x, pt.y, '#fff89e', 12, 6);
      if (hit && !hit.isStatic) {
        Body.setVelocity(hit, { x: hit.velocity.x + dir.x * 28 * m, y: hit.velocity.y + dir.y * 28 * m - 8 * m });
        if (hit.label === 'player') damagePlayer(hit.player, 50 * m);
      }
    },
  },
  frost: {
    name: 'Frost', color: '#9be7ff', cooldown: 1100,
    cast(p) {
      const m = p.mega || 1;
      const fb = shoot(p, { r: 6 * m, speed: 17, vy: -4, color: '#9be7ff', gravityScale: 0.5 });
      fb.onHit = (self, other) => {
        spawnParticles(self.position.x, self.position.y, '#9be7ff', 10, 4);
        if (other && other.label === 'player' && other.player.alive) {
          damagePlayer(other.player, 15 * m);
          other.player.frozenUntil = simNow() + 1500 * m;
          other.frictionAir = 0.001;
          sfx.freeze();
        }
      };
    },
  },
  blackhole: {
    name: 'Black Hole', color: '#a55eea', cooldown: 4000,
    cast(p) {
      const m = p.mega || 1;
      const fb = shoot(p, { r: 10 * m, speed: 9, vy: -2, color: '#a55eea', restitution: 0.2, expireMs: 1600, gravityScale: 0.4 });
      fb.onHit = () => spawnSingularity(fb.position.x, fb.position.y, m, p);
    },
  },
  meteor: {
    name: 'Meteor Storm', color: '#ff8c5a', cooldown: 5000,
    cast(p) {
      const m = p.mega || 1;
      const cx = Math.max(120, Math.min(W - 120, p.body.position.x + p.facing * 300));
      const t0 = simNow();
      const times = Array.from({ length: Math.round(7 * m) }, (_, i) => t0 + i * 170 + rand(0, 80));
      let spawned = 0;
      activeEffects.push({
        until: t0 + 1600 + (times.length - 7) * 170,
        update(now) {
          while (spawned < times.length && now > times[spawned]) {
            spawned++;
            const rock = dropProjectile(p, cx + rand(-260, 260), -50, { r: 13, vy: 18, vx: rand(-2, 2), color: '#ff8c5a', density: 0.006 });
            rock.onHit = () => explode(rock.position.x, rock.position.y, 90 * m, 14 * m, 28 * m, p);
          }
        },
      });
    },
  },
};
