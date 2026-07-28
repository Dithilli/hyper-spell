// draw-env.js — the weather and lighting layers for environmental events,
// shared by the live draw, LAN clients, and the killcam.
import { ctx } from './canvas.js';
import { W, H } from '../sim/world.js';
import { runeRing } from './artkit.js';
import { game } from '../sim/match.js';
import { players } from '../sim/player/lifecycle.js';
import { tomes } from '../sim/pickups.js';
import { projectiles } from '../sim/spells/core.js';


// deterministic hash so the ambient weather layers need no particle state
export function envHash(i) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function drawVineAt(x, yBase, h, now) {
  const seed = Math.round(x);
  const sway = Math.sin(now * 0.0016 + seed) * 4;
  ctx.lineCap = 'round';
  // twin twist for a braided stem: dark core + lit strand
  ctx.strokeStyle = '#2f5e28'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(x, yBase);
  ctx.quadraticCurveTo(x - sway, yBase - h * 0.55, x + sway, yBase - h); ctx.stroke();
  ctx.strokeStyle = '#5aa246'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x + 1, yBase);
  ctx.quadraticCurveTo(x - sway + 1, yBase - h * 0.55, x + sway + 1, yBase - h); ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const t = 0.18 + i * 0.18;
    const lx = x + Math.sin(now * 0.0016 + seed + i) * 4 * t + (i % 2 ? 8 : -8);
    const ly = yBase - h * t;
    const ang = (i % 2 ? 0.6 : -0.6) + sway * 0.05;
    const g = ctx.createLinearGradient(lx - 6, ly, lx + 6, ly);
    g.addColorStop(0, '#4f8a3d'); g.addColorStop(1, '#8fe6a2');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(lx, ly, 7, 3.8, ang, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(30,60,26,0.5)'; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(lx - Math.cos(ang) * 6, ly - Math.sin(ang) * 6); ctx.lineTo(lx + Math.cos(ang) * 6, ly + Math.sin(ang) * 6); ctx.stroke();
  }
  // a little bud at the tip
  ctx.fillStyle = '#ffd9ec';
  ctx.beginPath(); ctx.arc(x + sway, yBase - h, 2.4, 0, Math.PI * 2); ctx.fill();
}

let nightCanvas = null, nightCtx = null;
export function drawNightfall(lights) {
  if (!nightCanvas) {
    nightCanvas = document.createElement('canvas');
    nightCanvas.width = W;
    nightCanvas.height = H;
    nightCtx = nightCanvas.getContext('2d');
  }
  nightCtx.globalCompositeOperation = 'source-over';
  nightCtx.fillStyle = 'rgba(8, 4, 20, 0.88)'; // deep violet night, not dead black
  nightCtx.clearRect(0, 0, W, H);
  nightCtx.fillRect(0, 0, W, H);
  nightCtx.globalCompositeOperation = 'destination-out';
  for (const l of lights) {
    const g = nightCtx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
    g.addColorStop(0, 'rgba(0,0,0,0.95)');
    g.addColorStop(0.6, 'rgba(0,0,0,0.55)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    nightCtx.fillStyle = g;
    nightCtx.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
  }
  ctx.drawImage(nightCanvas, 0, 0);
  // warm candlelight bloom around each light source
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const l of lights) {
    const g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r * 0.7);
    g.addColorStop(0, 'rgba(255,196,120,0.14)');
    g.addColorStop(1, 'rgba(255,196,120,0)');
    ctx.fillStyle = g;
    ctx.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
  }
  ctx.restore();
}

export function drawEnvVisuals(id, now, lights = []) {
  if (!id) return;
  if (id === 'winter') {
    ctx.fillStyle = 'rgba(190, 225, 255, 0.06)'; // cold wash
    ctx.fillRect(-30, -30, W + 60, H + 60);
    for (let i = 0; i < 80; i++) {
      const speed = 22 + envHash(i) * 46;
      const size = 1 + envHash(i + 400) * 2.6;
      const x = (envHash(i + 100) * (W + 40) + Math.sin(now * 0.0008 + i) * 34 + W) % (W + 40) - 20;
      const y = (envHash(i + 200) * H + now * 0.001 * speed) % (H + 20) - 10;
      ctx.globalAlpha = 0.35 + envHash(i + 300) * 0.5;
      ctx.fillStyle = '#f4fbff';
      ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
      if (size > 2.6) { // the big flakes twinkle with a sparkle cross
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(x - size - 1, y); ctx.lineTo(x + size + 1, y); ctx.moveTo(x, y - size - 1); ctx.lineTo(x, y + size + 1); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  } else if (id === 'tempest') {
    ctx.fillStyle = 'rgba(20, 24, 44, 0.22)'; // storm gloom
    ctx.fillRect(-30, -30, W + 60, H + 60);
    const wind = Math.sin(now / 1400) * 26;
    ctx.strokeStyle = 'rgba(150, 178, 220, 0.45)'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < 70; i++) {
      const x = (envHash(i) * (W + 80) + now * 0.02 * (0.6 + envHash(i + 50)) * Math.sign(wind || 1) + W) % (W + 80) - 40;
      const y = (envHash(i + 100) * H + now * 0.5 * (0.7 + envHash(i + 150) * 0.6)) % (H + 30) - 15;
      ctx.moveTo(x, y); ctx.lineTo(x + wind * 0.5, y + 18);
    }
    ctx.stroke();
    // deterministic lightning: a flash + forked bolt in some ~2.2s windows
    const bucket = Math.floor(now / 2200), seed = envHash(bucket);
    if (seed < 0.4) {
      const t = (now % 2200) / 2200;
      const flash = Math.max(0, 1 - t * 6); // quick decay over ~180ms
      if (flash > 0.01) {
        ctx.fillStyle = `rgba(210, 224, 255, ${0.5 * flash})`;
        ctx.fillRect(-30, -30, W + 60, H + 60);
        const bx = envHash(bucket + 9) * W;
        ctx.strokeStyle = `rgba(230, 238, 255, ${flash})`; ctx.lineWidth = 2.5; ctx.shadowColor = '#cfe0ff'; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.moveTo(bx, -10);
        for (let s = 1; s <= 6; s++) { ctx.lineTo(bx + (envHash(bucket * 7 + s) - 0.5) * 90, s / 6 * H * 0.7); }
        ctx.stroke(); ctx.shadowBlur = 0;
      }
    }
  } else if (id === 'meteors') {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      const span = H + 160;
      const prog = (now * 0.05 * (0.6 + envHash(i + 90)) + envHash(i + 60) * span) % span;
      const hx = (envHash(i) * (W + 120) - 60) + prog * 0.5, hy = prog - 80; // falls down-right
      const len = 26 + envHash(i + 30) * 40;
      const g = ctx.createLinearGradient(hx, hy, hx - len * 0.5, hy - len);
      g.addColorStop(0, 'rgba(255,220,150,0.95)'); g.addColorStop(1, 'rgba(255,120,60,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx - len * 0.5, hy - len); ctx.stroke();
      ctx.fillStyle = 'rgba(255,240,200,0.95)';
      ctx.beginPath(); ctx.arc(hx, hy, 2.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  } else if (id === 'moonshot') {
    // dreamy low-gravity: a big soft moon + lavender motes drifting UP
    const g = ctx.createRadialGradient(W * 0.82, 120, 10, W * 0.82, 120, 90);
    g.addColorStop(0, 'rgba(232,213,255,0.5)'); g.addColorStop(1, 'rgba(232,213,255,0)');
    ctx.fillStyle = g; ctx.fillRect(W * 0.82 - 90, 30, 180, 180);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 22; i++) {
      const x = (envHash(i) * W + Math.sin(now * 0.0008 + i * 2) * 44 + W) % W;
      const y = H - ((envHash(i + 40) * H + now * 0.012) % (H + 40));
      ctx.globalAlpha = 0.2 + 0.3 * Math.abs(Math.sin(now * 0.002 + i));
      ctx.fillStyle = '#e8d5ff';
      ctx.beginPath(); ctx.arc(x, y, 1.5 + (i % 3), 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore(); ctx.globalAlpha = 1;
  } else if (id === 'surge') {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 20; i++) { // rising golden sparks
      const x = (envHash(i) * W + Math.sin(now * 0.002 + i * 3) * 20 + W) % W;
      const y = H - ((envHash(i + 70) * H + now * 0.04) % (H + 30));
      ctx.globalAlpha = 0.25 + 0.35 * Math.abs(Math.sin(now * 0.004 + i));
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(x, y, 1.5 + (i % 2), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.restore();
    for (let i = 0; i < 3; i++) { // slow arcane sigils rising and fading
      const y = H - ((now * 0.02 + i * 260) % (H + 120));
      const x = envHash(i + 500) * W;
      ctx.globalAlpha = 0.3 * Math.min(1, (H - y) / 200);
      runeRing(ctx, x, y, 22, 'rgba(255,224,120,1)', now, { count: 6, lw: 1, alpha: 1, spin: 0.002 });
    }
    ctx.globalAlpha = 1;
  } else if (id === 'nightfall') {
    drawNightfall(lights);
  }
}

// live world → light sources for nightfall (host & couch)
export function drawEnvVisualsLive(now) {
  const ev = game.envEvent;
  if (!ev || !ev.announced) return;
  let lights = [];
  if (ev.def.id === 'nightfall') {
    for (const p of players) if (p.alive) lights.push({ x: p.body.position.x, y: p.body.position.y, r: 160 });
    for (const fb of projectiles) lights.push({ x: fb.position.x, y: fb.position.y, r: 90 });
    for (const t of tomes) lights.push({ x: t.position.x, y: t.position.y, r: 70 });
  }
  drawEnvVisuals(ev.def.id, now, lights);
}

// snapshot → light sources for nightfall (LAN clients & the killcam)
export function envLightsFromSnap(snap, ghosts) {
  const lights = [];
  for (const g of ghosts) if (g.alive) lights.push({ x: g._x, y: g._y, r: 160 });
  for (const e of snap.bodies || []) {
    if (e.l === 'projectile') lights.push({ x: e.x, y: e.y, r: 90 });
    if (e.l === 'tome') lights.push({ x: e.x, y: e.y, r: 70 });
  }
  return lights;
}
