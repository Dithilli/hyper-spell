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

// ---------- particle budget & hierarchy ----------
// Every burst used to emit N interchangeable mid-size motes at full alpha, so
// three wizards casting filled the frame with ~900 identical ovals and the
// characters vanished behind their own VFX (measured: median 186 live, p95 740,
// peak 932). The marks were all the same size, brightness and lifetime, so the
// eye had nothing to land on — it read as confetti, not magic.
//
// Now each burst is split in two. A few CORES carry the event: big, full
// brightness, gone in ~8 frames. A thinner tail of MOTES lingers: small, dim,
// slow. Same emitter call sites, a third of the marks, and a clear read.
const PARTICLE_CAP = 300;  // hard ceiling — motes are culled before cores
const CORE_FRAC = 0.28;    // share of a burst spawned as cores
const TAIL_FRAC = 0.62;    // overall thinning applied to every legacy count

// core = the hot flash; mote = the drifting ash it leaves behind
function _tier(core, life) {
  const ml = core ? life * 0.5 : life * 1.2;
  return {
    life: ml + Math.random() * 20, maxLife: ml,
    dim: core ? 1 : 0.42,
    r: core ? 3.4 + Math.random() * 2.2 : 1.3 + Math.random() * 1.4,
  };
}

function spawnParticles(x, y, color, count, speed, life = 40) {
  const n = Math.max(1, Math.round(count * TAIL_FRAC));
  const cores = Math.max(1, Math.round(n * CORE_FRAC));
  for (let i = 0; i < n; i++) {
    const core = i < cores;
    const a = Math.random() * Math.PI * 2, v = Math.random() * speed * (core ? 1.15 : 0.8);
    particles.push({ kind: 'square', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, color, ..._tier(core, life) });
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
  // Shaped emitters (confetti, leaves, birds, glints) are bespoke per hybrid and
  // already read as distinct marks — only the generic square/spark tail gets
  // tiered and thinned, so signature VFX keep the count their author chose.
  const generic = kind === 'square' || kind === 'spark';
  const n = generic ? Math.max(1, Math.round(count * TAIL_FRAC)) : count;
  const cores = generic ? Math.max(1, Math.round(n * CORE_FRAC)) : n;
  for (let i = 0; i < n; i++) {
    const core = i < cores;
    const a = dir + (Math.random() - 0.5) * spread;
    const v = speed * (0.4 + Math.random() * 0.9) * (generic && !core ? 0.8 : 1);
    const t = _tier(core, life);
    particles.push({
      kind, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - up, color, g,
      life: generic ? t.life : life + Math.random() * 15,
      maxLife: generic ? t.maxLife : life,
      dim: generic ? t.dim : 1,
      r: generic ? r * (core ? 1.15 : 0.45) * (0.7 + Math.random() * 0.6) : r * (0.6 + Math.random() * 0.8),
    });
  }
}

// A four-way fight peaked at 27 simultaneous floating labels, which overprinted
// into an unreadable grey smear ("ABSOLUTE ZERO! x2" straight through "FLASH
// FREEZE!"). Newest wins: whatever just happened is the thing worth reading, and
// anything older than the cap is already history. Layout de-collision for the
// survivors happens at draw time (_layoutTextParticles, js/artkit.js).
const TEXT_CAP = 6;

function spawnText(x, y, str, color) {
  let live = 0;
  for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].kind !== 'text') continue;
    if (++live >= TEXT_CAP) particles.splice(i, 1);
  }
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
    else if (pt.kind === 'leaf') { pt.vy = Math.min(pt.vy + 0.02 * ts, 1.1); pt.x += Math.sin(pt.life * 0.12) * 0.6; }
    else if (pt.kind === 'bird') { pt.vx *= 1.008; pt.vy += (pt.g ?? -0.02) * ts; } // picks up speed as it flees
    else if (pt.kind === 'glint') { /* twinkles in place */ }
    else pt.vy += (pt.g ?? 0.25) * ts; // per-particle gravity (spawnBurst can set g<0 to rise)
  }
  trimParticles();
}

// A backstop for the pathological case — a fusion landing on top of a boss death
// on top of a chain lightning. Culls in order of how little the player is reading
// it: dim motes first (oldest first), then cores. Text and rings are never culled;
// they're deliberate, already capped, and carry meaning rather than texture.
function trimParticles() {
  let over = particles.length - PARTICLE_CAP;
  if (over <= 0) return;
  for (let i = 0; i < particles.length && over > 0; i++) {
    const pt = particles[i];
    if (pt.kind === 'text' || pt.kind === 'ring' || (pt.dim ?? 1) >= 1) continue;
    particles.splice(i, 1); i--; over--;
  }
  while (over > 0) {
    const i = particles.findIndex(pt => pt.kind !== 'text' && pt.kind !== 'ring');
    if (i < 0) return;
    particles.splice(i, 1); over--;
  }
}

function drawParticles() {
  drawStoryParticles(ctx, particles); // storybook embers/motes/sigil rings (js/artkit.js)
}
