// fx.js — particles, screen shake, flash, slow-mo
const particles = [];
let shake = 0;
let flashColor = '#fff', flashAlpha = 0;
let timeScale = 1, slowUntil = 0;

function addShake(v) { shake = Math.min(shake + v, 26); }
function doFlash(color, alpha = 0.4) { flashColor = color; flashAlpha = Math.max(flashAlpha, alpha); }
function slowMo(scale, ms) { timeScale = scale; slowUntil = performance.now() + ms; }

function updateTimeScale(now) {
  if (now > slowUntil) timeScale += (1 - timeScale) * 0.08;
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
    else pt.vy += 0.25 * ts;
  }
}

function drawParticles() {
  for (const pt of particles) {
    ctx.globalAlpha = Math.max(0, Math.min(1, pt.life / pt.maxLife));
    ctx.fillStyle = pt.color;
    ctx.strokeStyle = pt.color;
    if (pt.kind === 'ring') {
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2); ctx.stroke();
    } else if (pt.kind === 'text') {
      ctx.font = 'bold 16px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText(pt.str, pt.x, pt.y);
    } else if (pt.kind === 'spark') {
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(pt.x, pt.y); ctx.lineTo(pt.x - pt.vx * 2, pt.y - pt.vy * 2); ctx.stroke();
    } else {
      ctx.fillRect(pt.x - pt.r / 2, pt.y - pt.r / 2, pt.r, pt.r);
    }
  }
  ctx.globalAlpha = 1;
}
