// fx.js — the particle field, the screen shake and the flash.
//
// All of this used to live in src/sim/fx.js, because every spawner drew from
// the sim's seeded stream and was therefore part of the deterministic sequence
// a replay depends on. That was the coupling, not a reason for it: a change to
// how many sparks a hit throws off moved every gameplay roll after it, and the
// draw path (blizzard's zone, the victory confetti) reached into the same
// stream at monitor rate, so a 144Hz couch player and a 60Hz one diverged.
//
// Now the sim only says WHAT happened — `emit('spawnParticles', x, y, …)` —
// and this module decides what that looks like, using ordinary Math.random.
// Cosmetic randomness is deliberately outside the sim's stream
// (test/module-boundaries.test.js says so out loud), which is what lets the
// couch renderer, a LAN client and the killcam all run the same code.
import { ctx } from './canvas.js';
import { drawStoryParticles } from './artkit.js';
import { onWorldReset } from '../sim/world.js';
import { drainEmitted } from '../sim/emit.js';
import { playSfx } from './audio.js';
import { boltVisual } from './effects.js';

export const particles = [];
export let shake = 0;
export let flashColor = '#fff', flashAlpha = 0;

// the draw loop decays both every frame; the fx path only ever adds to them
export function setShake(v) { shake = v; }
export function setFlashAlpha(v) { flashAlpha = v; }

// Cosmetic randomness: not the round stream, on purpose. See the header.
// Exported because the draw path needs it too — src/render/draw-world.js's
// scenery (lava spit, torch glints, victory confetti) used to reach for
// src/sim/rng.js from inside draw(), which is defect D1 exactly: a 144Hz
// monitor pulled 2.4x as many numbers off the round's stream as a 60Hz one.
export const fxRandom = () => Math.random();
export const fxRange = (a, b) => a + Math.random() * (b - a);
export const fxPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function addShake(v) { shake = Math.min(shake + v, 26); }
export function doFlash(color, alpha = 0.4) { flashColor = color; flashAlpha = Math.max(flashAlpha, alpha); }

export function spawnParticles(x, y, color, count, speed, life = 40) {
  for (let i = 0; i < count; i++) {
    const a = fxRandom() * Math.PI * 2, v = fxRandom() * speed;
    particles.push({ kind: 'square', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, life: life + fxRandom() * 20, maxLife: life, color, r: 2 + fxRandom() * 3 });
  }
}

export function spawnRing(x, y, color) {
  particles.push({ kind: 'ring', x, y, r: 12, life: 16, maxLife: 16, color });
}

// flexible bespoke burst — kind/shape/spread/drift/gravity all tunable. Powers
// per-hybrid signature VFX.
//   dir: aim (rad, 0 = right)   spread: cone width   up: initial lift
//   g: per-particle gravity (negative = rises, e.g. steam/smoke)
export function spawnBurst(x, y, color, count = 12, o = {}) {
  const kind = o.kind || 'square', speed = o.speed ?? 5, spread = o.spread ?? Math.PI * 2;
  const dir = o.dir ?? 0, up = o.up ?? 0, life = o.life ?? 40, g = o.g ?? 0.25, r = o.r ?? 3;
  for (let i = 0; i < count; i++) {
    const a = dir + (fxRandom() - 0.5) * spread;
    const v = speed * (0.4 + fxRandom() * 0.9);
    particles.push({ kind, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - up, life: life + fxRandom() * 15, maxLife: life, color, r: r * (0.6 + fxRandom() * 0.8), g });
  }
}

export function spawnText(x, y, str, color) {
  particles.push({ kind: 'text', str, x, y, vx: 0, vy: -1.2, life: 50, maxLife: 50, color, r: 16 });
}

// one fully-described particle. The sim emits these for the handful of bespoke
// looks the five spawners above cannot express (rain, embers off an icicle, a
// ghost's grip sparks). They were never on the wire and still are not — the
// spec object is the whole event.
export function pushParticle(spec) { particles.push({ ...spec }); }

export function clearParticles() { particles.length = 0; }

export function updateParticles(ts) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.life -= ts;
    if (pt.life <= 0) { particles.splice(i, 1); continue; }
    if (pt.kind === 'ring') { pt.r += 7 * ts; continue; }
    if (pt.kind === 'text') { pt.y += pt.vy * ts; continue; }
    pt.x += pt.vx * ts;
    pt.y += pt.vy * ts;
    if (pt.kind === 'confetti') { pt.vy += 0.06 * ts; pt.x += Math.sin(pt.life * 0.25) * 0.8; }
    else if (pt.kind === 'leaf') { pt.vy = Math.min(pt.vy + 0.02 * ts, 1.1); pt.x += Math.sin(pt.life * 0.12) * 0.6; }
    else if (pt.kind === 'bird') { pt.vx *= 1.008; pt.vy += (pt.g ?? -0.02) * ts; } // picks up speed as it flees
    else if (pt.kind === 'glint') { /* twinkles in place */ }
    else pt.vy += (pt.g ?? 0.25) * ts; // per-particle gravity (spawnBurst can set g<0 to rise)
  }
}

export function drawParticles() {
  drawStoryParticles(ctx, particles); // storybook embers/motes/sigil rings (render/artkit.js)
}

// ---- draining the sim's cosmetic queue ----------------------------------
//
// Three of the ten wire names do nothing here, and each for a stated reason
// rather than by omission:
//
//   slowMo      — pace is simulation as well as spectacle, so src/sim/pace.js
//                 applies it directly AND emits it. Applying it again on the
//                 way out would double the hitstop locally. A LAN client has no
//                 sim, so its handler (src/net/client.js) is the real slowMo.
//   setBanner   — the banner text lives in src/sim/match.js and the HUD reads
//                 it there; the emit exists so a LAN client, which has no
//                 match.js state of its own, gets told.
//   addKillFeed — same shape as setBanner, against src/sim/awards.js.
//
// A name with no handler at all is a different thing and is NOT silently
// ignored: it is recorded, and test/emit-apply.test.js asserts that every name
// src/sim can emit is handled here.
const HANDLERS = {
  __proto__: null,
  spawnParticles,
  spawnRing,
  spawnText,
  spawnBurst,
  doFlash,
  addShake,
  boltVisual,
  particle: pushParticle,
  clearParticles,
  slowMo: () => {},
  setBanner: () => {},
  addKillFeed: () => {},
};

const unhandled = new Set();
export const unhandledEmitted = () => [...unhandled];
export const handledEmitNames = () => ['sfx', ...Object.keys(HANDLERS)];

export function applyEmitted(events) {
  for (const e of events) {
    if (e.f === 'sfx') { playSfx(e.a[0]); continue; }
    const h = HANDLERS[e.f];
    if (h) h(...e.a);
    else unhandled.add(e.f);
  }
}

// One call, so the couch entry and any harness that steps the sim by hand can
// pump cosmetics without knowing the queue exists.
export function pumpEmitted() { applyEmitted(drainEmitted()); }

onWorldReset(() => {
  particles.length = 0;
  shake = 0;
  flashColor = '#fff';
  flashAlpha = 0;
});
