// fx.js — particles, screen shake, flash, slow-mo
const particles = [];
let shake = 0;
let flashColor = '#fff', flashAlpha = 0;
let timeScale = 1, slowUntil = 0;
// master game pace: 1 = original, <1 = calmer & more readable so the spectacle
// (combos, fusions, big spells) registers instead of flashing by. Tune to taste.
const BASE_PACE = 0.85;

function addShake(v) { shake = Math.min(shake + v, 26); }
function doFlash(color, alpha = 0.4) { flashColor = color; flashAlpha = Math.max(flashAlpha, alpha); }
function slowMo(scale, ms) { timeScale = scale; slowUntil = performance.now() + ms; }

function updateTimeScale(now) {
  if (now > slowUntil) timeScale += (BASE_PACE - timeScale) * 0.08; // ease back to the base pace, not full speed
}

function spawnParticles(x, y, color, count, speed, life = 40) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, v = Math.random() * speed;
    particles.push({ kind: 'square', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, life: life + Math.random() * 20, maxLife: life, color, r: 2 + Math.random() * 3 });
  }
}

function spawnRing(x, y, color) {
  particles.push({ kind: 'ring', x, y, r: 12, life: 16, maxLife: 16, color });
}

// flexible bespoke burst — kind/shape/spread/drift/gravity all tunable. Powers
// per-hybrid signature VFX; broadcast to LAN like the other cosmetic emitters.
//   dir: aim (rad, 0 = right)   spread: cone width   up: initial lift
//   g: per-particle gravity (negative = rises, e.g. steam/smoke)
function spawnBurst(x, y, color, count = 12, o = {}) {
  const kind = o.kind || 'square', speed = o.speed ?? 5, spread = o.spread ?? Math.PI * 2;
  const dir = o.dir ?? 0, up = o.up ?? 0, life = o.life ?? 40, g = o.g ?? 0.25, r = o.r ?? 3;
  for (let i = 0; i < count; i++) {
    const a = dir + (Math.random() - 0.5) * spread;
    const v = speed * (0.4 + Math.random() * 0.9);
    particles.push({ kind, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - up, life: life + Math.random() * 15, maxLife: life, color, r: r * (0.6 + Math.random() * 0.8), g });
  }
}

function spawnText(x, y, str, color) {
  particles.push({ kind: 'text', str, x, y, vx: 0, vy: -1.2, life: 50, maxLife: 50, color, r: 16 });
}

function updateParticles(ts) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.life -= ts;
    if (pt.life <= 0) { particles.splice(i, 1); continue; }
    if (pt.kind === 'ring') { pt.r += 7 * ts; continue; }
    if (pt.kind === 'text') { pt.y += pt.vy * ts; continue; }
    pt.x += pt.vx * ts;
    pt.y += pt.vy * ts;
    if (pt.kind === 'confetti') { pt.vy += 0.06 * ts; pt.x += Math.sin(pt.life * 0.25) * 0.8; }
    else pt.vy += (pt.g ?? 0.25) * ts; // per-particle gravity (spawnBurst can set g<0 to rise)
  }
}

function drawParticles() {
  drawStoryParticles(ctx, particles); // storybook embers/motes/sigil rings (js/artkit.js)
}
