// fx.js — the cosmetic side effects the simulation emits: particles, screen
// shake, flashes, floating text.
//
// These sit in sim/ rather than render/ for one reason: every spawner draws
// from Math.random, so it is part of the deterministic stream a replay depends
// on — pulling the spawn out of the sim's call path would shift every roll
// downstream of it. src/render/fx.js only draws the array. Task 13 turns these
// call sites into queued events and moves the implementation to render/.
//
// The six spawners are rebindable because the server bridge wraps each one to
// broadcast it to LAN clients (server/sim-bridge.js reassigned the globals).
import { onWorldReset } from './world.js';

export const particles = [];
export let shake = 0;
export let flashColor = '#fff', flashAlpha = 0;

// the draw loop decays both every frame; the sim only ever adds to them
export function setShake(v) { shake = v; }
export function setFlashAlpha(v) { flashAlpha = v; }

function baseAddShake(v) { shake = Math.min(shake + v, 26); }
function baseDoFlash(color, alpha = 0.4) { flashColor = color; flashAlpha = Math.max(flashAlpha, alpha); }

function baseSpawnParticles(x, y, color, count, speed, life = 40) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, v = Math.random() * speed;
    particles.push({ kind: 'square', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, life: life + Math.random() * 20, maxLife: life, color, r: 2 + Math.random() * 3 });
  }
}

function baseSpawnRing(x, y, color) {
  particles.push({ kind: 'ring', x, y, r: 12, life: 16, maxLife: 16, color });
}

// flexible bespoke burst — kind/shape/spread/drift/gravity all tunable. Powers
// per-hybrid signature VFX; broadcast to LAN like the other cosmetic emitters.
//   dir: aim (rad, 0 = right)   spread: cone width   up: initial lift
//   g: per-particle gravity (negative = rises, e.g. steam/smoke)
function baseSpawnBurst(x, y, color, count = 12, o = {}) {
  const kind = o.kind || 'square', speed = o.speed ?? 5, spread = o.spread ?? Math.PI * 2;
  const dir = o.dir ?? 0, up = o.up ?? 0, life = o.life ?? 40, g = o.g ?? 0.25, r = o.r ?? 3;
  for (let i = 0; i < count; i++) {
    const a = dir + (Math.random() - 0.5) * spread;
    const v = speed * (0.4 + Math.random() * 0.9);
    particles.push({ kind, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - up, life: life + Math.random() * 15, maxLife: life, color, r: r * (0.6 + Math.random() * 0.8), g });
  }
}

function baseSpawnText(x, y, str, color) {
  particles.push({ kind: 'text', str, x, y, vx: 0, vy: -1.2, life: 50, maxLife: 50, color, r: 16 });
}

export let addShake = baseAddShake;
export let doFlash = baseDoFlash;
export let spawnParticles = baseSpawnParticles;
export let spawnRing = baseSpawnRing;
export let spawnBurst = baseSpawnBurst;
export let spawnText = baseSpawnText;

export function setAddShake(fn) { addShake = fn; }
export function setDoFlash(fn) { doFlash = fn; }
export function setSpawnParticles(fn) { spawnParticles = fn; }
export function setSpawnRing(fn) { spawnRing = fn; }
export function setSpawnBurst(fn) { spawnBurst = fn; }
export function setSpawnText(fn) { spawnText = fn; }

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

onWorldReset(() => {
  particles.length = 0;
  shake = 0;
  flashColor = '#fff';
  flashAlpha = 0;
});
