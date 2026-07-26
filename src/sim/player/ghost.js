// player/ghost.js — dead wizards linger as wisps and meddle, gently.
import { Body, Composite, world, W, H } from '../world.js';
import { random } from '../env.js';
import { rand } from '../rng.js';
import { particles, spawnParticles, spawnRing, spawnBurst } from '../fx.js';
import { sfx } from '../sfx.js';
import { game } from '../match.js';
import { activeEffects } from '../spells/core.js';
import { players } from './lifecycle.js';

// ---------- ghosts: dead wizards drift as faint wisps and meddle, gently ----------
// Hold cast near a loose prop to poltergeist-carry it (release to toss it,
// softly). Cast in the open = the classic gust. Cast B drops a haunt sigil
// everyone can see (point at tomes, ambushes, or just taunt). The parry button
// lets out a wail: the living shiver, bots panic for a beat. Drifting through
// a wizard chills them. All of it stays mischief — a ghost can inconvenience
// the living, never kill them.
export const GHOST_CARRY = new Set(['crate', 'barrel', 'ball', 'plank']);
export function updateGhosts(now) {
  if (game.state !== 'PLAY') return;
  for (const p of players) {
    if (p.alive || !p.ghost) continue;
    const c = p.input, g = p.ghost;
    g.x = Math.max(20, Math.min(W - 20, g.x + (c.move || 0) * 3.2));
    g.y = Math.max(30, Math.min(H - 40, g.y + (c.jump ? -2.6 : 1.0)));

    // poltergeist carry: the prop floats on a soft spring below the wisp
    if (g.hold) {
      const held = g.hold;
      const gone = !Composite.get(world, held.id, 'body');
      const far = !gone && Math.hypot(held.position.x - g.x, held.position.y - g.y - 26) > 140;
      if (!c.cast || gone || far) {
        if (!gone) Body.setVelocity(held, { x: (c.move || 0) * 5, y: -2 }); // a toss, not a throw
        g.hold = null;
      } else {
        Body.setVelocity(held, {
          x: Math.max(-6, Math.min(6, (g.x - held.position.x) * 0.18)),
          y: Math.max(-6, Math.min(6, (g.y + 26 - held.position.y) * 0.18)),
        });
        Body.setAngularVelocity(held, held.angularVelocity * 0.9);
        if (random() < 0.2) particles.push({ kind: 'spark', x: held.position.x + rand(-8, 8), y: held.position.y + rand(-8, 8), vx: 0, vy: -0.6, life: 14, maxLife: 14, color: '#e8d5ff', r: 1.5 });
      }
    } else if (c.cast) {
      // grab if a loose prop is in reach, otherwise the classic gust
      let best = null, bd = 1e9;
      for (const b of Composite.allBodies(world)) {
        if (b.isStatic || b.isSensor || !GHOST_CARRY.has(b.label) || b.mass > 8) continue;
        const d = Math.hypot(b.position.x - g.x, b.position.y - g.y);
        if (d < 70 && d < bd) { bd = d; best = b; }
      }
      if (best) {
        g.hold = best;
        spawnRing(g.x, g.y, '#e8d5ff');
      } else if (now > g.nextGust) {
        g.nextGust = now + 2800;
        ghostGust(g);
      }
    }

    if (c.cast2Pressed && now > (g.nextMark || 0)) {
      g.nextMark = now + 6000;
      ghostMark(p, g, now);
    }
    if (c.blockPressed && now > (g.nextWail || 0)) {
      g.nextWail = now + 5000;
      ghostWail(p, g, now);
    }

    // chill touch: drifting through the living leaves frost in their joints
    for (const q of players) {
      if (!q.alive) continue;
      if (Math.hypot(q.body.position.x - g.x, q.body.position.y - g.y) > 30) continue;
      if (now < (q.ghostChillUntil || 0)) continue;
      q.ghostChillUntil = now + 1600; // per-victim breather
      q.vineSlowUntil = Math.max(q.vineSlowUntil || 0, now + 550);
      spawnParticles(q.body.position.x, q.body.position.y - 20, '#bfe8ff', 6, 2, 24);
      sfx.freeze?.();
    }
  }
}

// a haunt sigil at the wisp: visible to every screen for a few seconds — the
// dead pointing at tomes, ambushes, or nothing in particular, out of spite
export function ghostMark(p, g, now) {
  const mx = g.x, my = g.y;
  sfx.cast();
  spawnRing(mx, my, p.color);
  activeEffects.push({
    until: now + 4000,
    net: { k: 'zone', x: mx, y: my, r: 30, c: p.color }, // LAN clients see the pulse
    // art is the artkit namespace the renderer hands in; this is the only sim
    // effect that needs a drawing primitive beyond the raw context
    draw(nw, ctx, art) {
      ctx.globalAlpha = 0.75;
      art.runeRing(ctx, mx, my, 24, p.color, nw, { count: 6, lw: 1.2, alpha: 0.8, spin: 0.003 });
      ctx.globalAlpha = 1;
    },
  });
}

// the wail: nearby wizards shiver-slow for a beat; bots drop their plan and
// scurry. Purely a scare — no damage, no displacement.
export function ghostWail(p, g, now) {
  sfx.blackhole?.();
  spawnRing(g.x, g.y, '#e8d5ff');
  spawnBurst(g.x, g.y, '#e8d5ff', 14, { speed: 3.5, g: -0.04, life: 40, r: 2.5 });
  for (const q of players) {
    if (!q.alive) continue;
    if (Math.hypot(q.body.position.x - g.x, q.body.position.y - g.y) > 170) continue;
    q.vineSlowUntil = Math.max(q.vineSlowUntil || 0, now + 450);
    q.spookedUntil = now + 900; // bots read this and panic; humans just shiver
    spawnParticles(q.body.position.x, q.body.position.y - 24, '#e8d5ff', 5, 2, 20);
  }
}

// a gentle, harmless push — enough to tip a crate or ruffle a duel, never to kill
export function ghostGust(g) {
  spawnRing(g.x, g.y, 'rgba(232,213,255,0.6)');
  sfx.cast();
  for (const b of Composite.allBodies(world)) {
    if (b.isStatic || b.isSensor || b.label === 'boss') continue;
    const dx = b.position.x - g.x, dy = b.position.y - g.y;
    const d = Math.hypot(dx, dy);
    if (d > 110 || d === 0) continue;
    const s = (1 - d / 110) * 4.5;
    Body.setVelocity(b, { x: b.velocity.x + (dx / d) * s, y: b.velocity.y + (dy / d) * s - 1.2 * (1 - d / 110) });
  }
}
