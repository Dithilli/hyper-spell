// draw-world.js — the live world draw: backdrop, terrain, hazards, bodies,
// particles and the per-frame composite. Everything here reads sim state and
// writes nothing back.
import { ctx } from './canvas.js';
import { W, H } from '../sim/world.js';
import { allBodies, allJoints, gravityY, jointEnds } from '../sim/phys/facade.js';
// Cosmetic randomness, aliased to the names the ~200 scenery call sites below
// already use. It is deliberately NOT src/sim/rng.js: this file runs at monitor
// rate, and every number it used to take off the round's seeded stream made the
// match a function of the viewer's refresh rate (defect D1).
import { fxRange as rand, fxPick as pick } from './fx.js';
import * as art from './artkit.js';
import {
  drawStoryBackdrop, drawStoryCrate, drawStoryDestructible, drawStorySpikes, drawStoryTerrain, shade,
} from './artkit.js';
import {
  particles, shake, setShake, flashColor, flashAlpha, setFlashAlpha,
} from './fx.js';
import { game, currentMap } from '../sim/match.js';
import { players, gibs } from '../sim/player/lifecycle.js';
import { activeEffects, projectiles, summons } from '../sim/spells/core.js';
import { isLeafy } from '../sim/maps/builders.js';
import { envHash, drawVineAt, drawEnvVisualsLive } from './draw-env.js';
import { drawBossBody } from './draw-boss.js';
import { drawParticles } from './fx.js';
import { drawFxEffects, drawVfx } from './effects.js';
import { drawTomes } from './draw-pickups.js';
import {
  drawWizard, drawWizardFigure, drawGhostWisps, drawOffscreenPointers,
} from './draw-wizard.js';
import { drawHUD, drawLobby, drawAwards, drawSpellReport } from './hud.js';
import { drawReplay } from './replay.js';
import { mouse, kbControllers } from '../platform/input-keyboard.js';

// ---------- drawing ----------
export function drawBodyRounded(b, color) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  const v = b.vertices;
  ctx.moveTo(v[0].x, v[0].y);
  for (let i = 1; i < v.length; i++) ctx.lineTo(v[i].x, v[i].y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

export function drawCrate(b) {
  drawStoryCrate(ctx, { vertices: b.vertices, x: b.position.x, y: b.position.y, angle: b.angle });
}

// ---------- hazard art (shared by live map bodies AND network/killcam ghosts) ----------
export function bodyRadius(b, fallback = 14) {
  if (b.circleRadius) return b.circleRadius;
  if (b.vertices && b.vertices.length) {
    return Math.hypot(b.vertices[0].x - b.position.x, b.vertices[0].y - b.position.y);
  }
  return fallback;
}

export function drawIcicle(b, now) {
  const r = bodyRadius(b, 24);
  ctx.save();
  ctx.translate(b.position.x, b.position.y);
  ctx.rotate(b.angle); // spike points along local +x (down while hanging)
  const g = ctx.createLinearGradient(-r * 0.5, 0, r, 0);
  g.addColorStop(0, '#eaf9ff');
  g.addColorStop(0.55, '#bfe8ff');
  g.addColorStop(1, '#6fb6e0');
  ctx.fillStyle = g;
  ctx.beginPath(); // main tapered spike with a jagged base
  ctx.moveTo(-r * 0.5, -r * 0.6);
  ctx.lineTo(r * 1.08, 0);
  ctx.lineTo(-r * 0.5, r * 0.6);
  ctx.lineTo(-r * 0.28, r * 0.32);
  ctx.lineTo(-r * 0.52, r * 0.14);
  ctx.lineTo(-r * 0.3, -r * 0.04);
  ctx.lineTo(-r * 0.52, -r * 0.26);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d8f4ff'; // two little side fangs
  ctx.beginPath();
  ctx.moveTo(-r * 0.1, -r * 0.52); ctx.lineTo(r * 0.42, -r * 0.34); ctx.lineTo(r * 0.05, -r * 0.2);
  ctx.moveTo(-r * 0.1, r * 0.52); ctx.lineTo(r * 0.42, r * 0.34); ctx.lineTo(r * 0.05, r * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; // cold shine down the spine
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-r * 0.3, -r * 0.16);
  ctx.lineTo(r * 0.72, -r * 0.04);
  ctx.stroke();
  ctx.restore();
}

export function drawBarrel(b) {
  const r = bodyRadius(b);
  const { x, y } = b.position;
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.2, x, y, r);
  g.addColorStop(0, '#a37ec9');
  g.addColorStop(0.7, '#7d5a9e');
  g.addColorStop(1, '#4e3766');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.save(); // plank seams + rim hoop rotate with the roll
  ctx.translate(x, y);
  ctx.rotate(b.angle);
  ctx.strokeStyle = 'rgba(30,18,44,0.55)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI / 3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85);
    ctx.lineTo(-Math.cos(a) * r * 0.85, -Math.sin(a) * r * 0.85);
    ctx.stroke();
  }
  ctx.strokeStyle = '#c9a86a';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#e0c185'; // rivets on the hoop
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + 0.4;
    ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86, 1.6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function drawBumperBody(b, now) {
  const r = bodyRadius(b, 22);
  const { x, y } = b.position;
  const pulse = 1 + 0.05 * Math.sin(now * 0.006 + x * 0.05);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * pulse);
  g.addColorStop(0, '#ffe1ef');
  g.addColorStop(0.55, '#ff8fc7');
  g.addColorStop(1, '#d4569a');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r * pulse, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffd3e8';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(x, y, r * pulse * 0.72, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x, y, r * 0.2, 0, Math.PI * 2); ctx.fill();
}

export function drawWreckingBall(b) {
  const r = bodyRadius(b, 40);
  const { x, y } = b.position;
  const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.45, r * 0.1, x, y, r * 1.05);
  g.addColorStop(0, '#4e4a5e');
  g.addColorStop(0.5, '#211c30');
  g.addColorStop(1, '#0b0812');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.save(); // studs ride the spin
  ctx.translate(x, y);
  ctx.rotate(b.angle);
  ctx.fillStyle = '#5d5870';
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8, Math.max(1.6, r * 0.07), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; // specular glint
  ctx.beginPath(); ctx.ellipse(x - r * 0.38, y - r * 0.42, r * 0.2, r * 0.11, -0.6, 0, Math.PI * 2); ctx.fill();
}

export function drawRock(b, col) {
  drawBodyRounded(b, col || '#5a5245');
  const r = bodyRadius(b, 20);
  const snow = col === '#f4fbff';
  ctx.save();
  ctx.translate(b.position.x, b.position.y);
  ctx.rotate(b.angle);
  ctx.fillStyle = snow ? 'rgba(120,160,190,0.18)' : 'rgba(0,0,0,0.28)'; // craters
  for (const [dx, dy, cr] of [[-0.35, -0.15, 0.16], [0.25, 0.2, 0.22], [0.1, -0.4, 0.12]]) {
    ctx.beginPath(); ctx.ellipse(dx * r, dy * r, cr * r, cr * r * 0.75, dx, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = snow ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.14)';
  ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.35, r * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function drawPivotBolt(b) {
  ctx.fillStyle = '#0d0a14';
  ctx.beginPath(); ctx.arc(b.position.x, b.position.y, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#6a6280';
  ctx.beginPath(); ctx.arc(b.position.x, b.position.y, 2.5, 0, Math.PI * 2); ctx.fill();
}

// dispatcher — returns true if it handled the body
export function drawHazardBody(b, now) {
  const col = (b.render && b.render.fillStyle) || b.color;
  if (b.label === 'icicle') { drawIcicle(b, now); return true; }
  if (b.label === 'barrel') { drawBarrel(b); return true; }
  if (b.label === 'bouncy') { drawBumperBody(b, now); return true; }
  if (b.label === 'ball') {
    if (col === '#100c18') drawWreckingBall(b);
    else drawRock(b, col);
    return true;
  }
  return false;
}

// stone vents for geyser maps (pure decoration; the blast itself is the explosion)
export function drawGeysers(now) {
  for (const g of currentMap.data.geysers || []) {
    ctx.fillStyle = '#3a3040';
    ctx.beginPath();
    ctx.ellipse(g.x - 14, g.y + 8, 16, 9, 0.15, 0, Math.PI * 2);
    ctx.ellipse(g.x + 14, g.y + 8, 16, 9, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c1524';
    ctx.beginPath(); ctx.ellipse(g.x, g.y + 4, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
    const soon = g.nextAt && g.nextAt - now < 700;
    if (soon || Math.random() < 0.08) { // simmer, then boil right before the blast
      particles.push({ kind: 'square', x: g.x + rand(-8, 8), y: g.y + 2, vx: 0, vy: soon ? rand(-4, -2) : -1, life: 18, maxLife: 18, color: soon ? '#ffb347' : '#8a7f9e', r: soon ? 3 : 2 });
    }
  }
}

// swamp gas vents (Goo Swamp · Gas Vents): mossy nozzles + an ever-rising gas
// shimmer so the lift columns read on EVERY screen. Clients rebuild the map
// locally, so this draws straight from map data — zero net traffic. The strong
// eruption puffs ride the fx channel from the host's map update (spawnBurst).
export function drawGasVents(now) {
  for (const v of currentMap.data.vents || []) {
    // mossy mound with a glowing slit
    ctx.fillStyle = '#25331f';
    ctx.beginPath();
    ctx.ellipse(v.x - 13, v.y + 8, 15, 8, 0.12, 0, Math.PI * 2);
    ctx.ellipse(v.x + 13, v.y + 8, 15, 8, -0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#141d10';
    ctx.beginPath(); ctx.ellipse(v.x, v.y + 4, 9, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.35 + 0.25 * Math.sin(now / 300 + v.x);
    ctx.fillStyle = '#aef05a';
    ctx.beginPath(); ctx.ellipse(v.x, v.y + 3, 6, 2.6, 0, 0, Math.PI * 2); ctx.fill();
    // stateless rising marsh gas — deterministic per screen, identical intent
    for (let i = 0; i < 10; i++) {
      const ph = envHash(Math.round(v.x) + i * 31);
      const yy = v.y - ((now * (0.045 + ph * 0.03) + ph * 500) % 260);
      const t = (v.y - yy) / 260;
      const sway = Math.sin(now * 0.003 + i * 2.1 + v.x) * (8 + ph * 10) * t;
      ctx.globalAlpha = 0.3 * (1 - t);
      ctx.fillStyle = i % 3 ? '#aef05a' : '#7bd88f';
      ctx.beginPath(); ctx.arc(v.x + sway, yy, 2 + ph * 2.5 + t * 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

export function drawSpikes(b) {
  drawStorySpikes(ctx, {
    x: b.position.x, y: b.position.y, angle: b.angle,
    w: b.w || 100, h: b.h || 20, color: b.render.fillStyle || '#8a2f3d',
  });
}

// a destructible block: per-kind storybook material (artkit), plus a whisper of
// ambient life. The particles here are pushed LOCALLY — host and LAN clients
// each run this draw over their own (identical, seeded) blocks, so the ambience
// costs zero net traffic.
export function drawDestructible(b, now = performance.now()) {
  const frac = Math.max(0, (b.hp ?? b.maxHp) / (b.maxHp || 1));
  drawStoryDestructible(ctx, {
    x: b.position.x, y: b.position.y, w: b.w || 40, h: b.h || 40,
    angle: b.angle || 0, kind: b.kind || 'wood', frac, color: b.dcolor || '#6b4a2a', now,
  });
  const { x, y } = b.position;
  const w = b.w || 40, h = b.h || 40;
  const k = b.kind;
  if (k === 'ice') {
    if (Math.random() < 0.006) particles.push({ kind: 'glint', x: x + rand(-w / 2, w / 2), y: y + rand(-h / 2, h / 2), vx: 0, vy: 0, life: 34, maxLife: 34, color: '#eaffff', r: 3 });
    if (Math.random() < 0.003) particles.push({ kind: 'square', x: x + rand(-w / 2, w / 2), y: y - h / 2, vx: rand(-0.3, 0.3), vy: 0.4, life: 40, maxLife: 40, color: '#ffffff', r: 1.5, g: 0.02 });
  } else if (k === 'obsidian') {
    if (Math.random() < 0.01) particles.push({ x: x + rand(-w / 2, w / 2), y: y - h / 2, vx: rand(-0.2, 0.2), vy: -rand(0.4, 1), life: 36, maxLife: 36, color: '#ff7043', r: 1.6, g: -0.02 });
  } else if (k === 'wood' && isLeafy(b.dcolor)) {
    if (Math.random() < 0.004) particles.push({ kind: 'leaf', x: x + rand(-w / 2, w / 2), y: y + h / 2 - 4, vx: rand(-0.4, 0.4), vy: 0.3, life: 70, maxLife: 70, color: b.dcolor, r: 2.6 });
  } else if (k === 'stone') {
    if (Math.random() < 0.0015) particles.push({ kind: 'square', x: x + rand(-w / 2, w / 2), y: y + rand(0, h / 2), vx: 0, vy: 0.5, life: 26, maxLife: 26, color: '#9a8f7a', r: 1.3, g: 0.04 });
  }
}


// biome of the current arena → which animated crust the terrain grows
export function mapCrustKind() {
  const d = currentMap.data, def = currentMap.def;
  if (def.icy || d.eventIcy) return 'snow';
  if (d.lavaY != null || d.acid) return 'char';
  if (d.starfield || d.voidTop) return 'crystal';
  return 'grass';
}

// structural terrain (platforms, walls, moving/rotating bars) gets the storybook
// stone-and-crust treatment; loose dynamic debris keeps the plain rounded look.
// (An offscreen pre-render of the static stone was tried here and benchmarked
// slower on the GPU path than just drawing the vectors — full frame is ~6.6ms
// either way, so the simple per-frame draw stays.)
export function drawTerrainBody(b, now) {
  if (b.isStatic || b.kinematic || b.spin) {
    drawStoryTerrain(ctx, {
      vertices: b.vertices, bounds: b.bounds, angle: b.angle, now,
      color: b.render.fillStyle || '#2a2336', crust: mapCrustKind(),
      flip: gravityY() < 0,
    });
  } else {
    drawBodyRounded(b, b.render.fillStyle || '#171221');
  }
}

export function drawMapBodies(now) {
  for (const b of allBodies(currentMap.composite)) {
    if (b.label === 'lava') continue;
    if (b.phantom) ctx.globalAlpha = b.phantomSolid === false ? 0.18 : 0.85;
    if (b.label === 'crate') drawCrate(b);
    else if (b.label === 'destructible') drawDestructible(b, now);
    else if (b.label === 'spikes') drawSpikes(b);
    else if (b.label === 'vine') drawVineAt(b.position.x, b.bounds.max.y, Math.min(48, (now - (b.bornAt || now)) * 0.04 + 10), now);
    else if (drawHazardBody(b, now)) { /* icicles, barrels, bumpers, balls */ }
    else {
      drawTerrainBody(b, now);
      if (b.spin) drawPivotBolt(b);
    }
    ctx.globalAlpha = 1;
  }
  for (const c of allJoints(currentMap.composite)) {
    if (c.label !== 'breakable' && c.label !== 'chain') continue;
    const [a, b] = jointEnds(c);
    if (c.label === 'chain') {
      ctx.strokeStyle = '#0d0a14';
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      ctx.fillStyle = '#2c2438';
      for (let t = 12; t < d; t += 26) {
        ctx.beginPath();
        ctx.arc(a.x + (b.x - a.x) * t / d, a.y + (b.y - a.y) * t / d, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.strokeStyle = '#5d4a33';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
  }
}

export function drawLava(now) {
  const y = currentMap.data.lavaY;
  if (y == null) return;
  const acid = currentMap.data.acid;
  const cTop = acid ? '#9be15d' : '#ff5e57';
  const cBot = acid ? '#39702e' : '#a8262a';
  const g = ctx.createLinearGradient(0, y, 0, H);
  g.addColorStop(0, cTop);
  g.addColorStop(1, cBot);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-10, H + 10);
  ctx.lineTo(-10, y + 8);
  for (let x = 0; x <= W + 32; x += 32) {
    ctx.lineTo(x, y + 6 + Math.sin(now * 0.002 + x * 0.02) * 5);
  }
  ctx.lineTo(W + 10, H + 10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = acid ? 'rgba(220,255,160,0.5)' : 'rgba(255,180,120,0.5)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let x = 0; x <= W + 32; x += 32) {
    const yy = y + 6 + Math.sin(now * 0.002 + x * 0.02) * 5;
    x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
  }
  ctx.stroke();
  if (Math.random() < 0.3) {
    particles.push({ kind: 'square', x: rand(0, W), y: y + 8, vx: 0, vy: rand(-1.5, -0.5), life: 30, maxLife: 30, color: acid ? '#c5f97d' : '#ff8c5a', r: 3 });
  }
}

export function drawGibs() {
  for (const gib of gibs) drawBodyRounded(gib, gib.color);
}

// wave-mode enemies: a labelled silhouette + type-specific detail, with a hurt
// flash and a shrinking HP bar so hits read clearly on the couch TV.
export function drawEnemy(b, now) {
  const e = b.enemy;
  if (!e) { drawBodyRounded(b, b.color || '#c98a4a'); return; }
  const x = b.position.x, y = b.position.y;
  const dir = Math.abs(b.velocity.x) > 0.2 ? Math.sign(b.velocity.x) : (b._face || 1);
  b._face = dir;
  const hurt = now - (e.hurtAt || 0) < 110;
  // the swordsman paints its OWN hooded-rogue silhouette (no plain body box) —
  // everything else keeps the rounded-blob base + a detail pass on top
  if (e.type !== 'swordsman') drawBodyRounded(b, hurt ? '#ffffff' : e.color);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (e.type === 'swordsman') {
    // a sneaky rogue: hunched, hooded cloak + a short reverse-grip dagger. The
    // cloak fully hides the collision box, so no "terrible square" reads through.
    const cloak = hurt ? '#ffffff' : e.color;
    const bob = Math.sin(now * 0.008 + x * 0.05) * 1.2; // subtle skulking sway
    // --- cloak body: narrow hunched shoulders flaring to a ragged hem ---
    ctx.fillStyle = hurt ? '#ffffff' : shade(cloak, -0.28);
    ctx.beginPath();
    ctx.moveTo(-9, -8);                       // back shoulder (hunched high)
    ctx.quadraticCurveTo(-15, 8, -13, 21);    // back drape
    ctx.lineTo(-8, 17); ctx.lineTo(-3, 22);   // ragged hem tips
    ctx.lineTo(3, 17); ctx.lineTo(9, 22);
    ctx.lineTo(12, 15);
    ctx.quadraticCurveTo(11, 0, 6, -9);       // front lean (leaning forward = sneaking)
    ctx.closePath(); ctx.fill();
    // lit front fold so the silhouette has depth
    ctx.fillStyle = hurt ? '#ffffff' : cloak;
    ctx.beginPath();
    ctx.moveTo(6, -9); ctx.quadraticCurveTo(10, 4, 9, 20);
    ctx.lineTo(3, 17); ctx.lineTo(0, 21); ctx.quadraticCurveTo(2, 4, 2, -8);
    ctx.closePath(); ctx.fill();
    // --- hood: a pointed cowl tilted forward over a shadowed face ---
    ctx.fillStyle = hurt ? '#ffffff' : shade(cloak, -0.42);
    ctx.beginPath();
    ctx.moveTo(-8, -6 + bob);
    ctx.quadraticCurveTo(-7, -22 + bob, 7, -22 + bob);   // peak leans forward
    ctx.quadraticCurveTo(13, -18 + bob, 12, -6 + bob);   // brow juts out
    ctx.quadraticCurveTo(2, -3 + bob, -8, -6 + bob);
    ctx.closePath(); ctx.fill();
    // face void + a glint of eyes peering from the dark
    ctx.fillStyle = 'rgba(8,6,14,0.92)';
    ctx.beginPath(); ctx.ellipse(4, -11 + bob, 6, 4.5, -0.15, 0, Math.PI * 2); ctx.fill();
    if (!hurt) {
      ctx.fillStyle = '#bfe8ff';
      ctx.beginPath(); ctx.arc(5, -11 + bob, 1.5, 0, Math.PI * 2); ctx.arc(9, -11.5 + bob, 1.3, 0, Math.PI * 2); ctx.fill();
    }
    // --- dagger: short blade, low reverse grip in the leading hand ---
    ctx.save();
    ctx.translate(9, 9);
    ctx.rotate(0.5);
    ctx.strokeStyle = '#3a2c1c'; ctx.lineWidth = 3;                     // wrapped grip
    ctx.beginPath(); ctx.moveTo(-3, -4); ctx.lineTo(1, 3); ctx.stroke();
    ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 3;                     // crossguard
    ctx.beginPath(); ctx.moveTo(-4, 1); ctx.lineTo(4, -1); ctx.stroke();
    ctx.fillStyle = hurt ? '#ffffff' : '#cfd8e8';                      // broad short dagger
    ctx.beginPath();
    ctx.moveTo(-2, -2); ctx.lineTo(3, 2);                              // back of the blade off the guard
    ctx.lineTo(13, 6); ctx.lineTo(3, 4); ctx.closePath();             // belly + point
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1;      // spine glint
    ctx.beginPath(); ctx.moveTo(0, -0.5); ctx.lineTo(12, 5.5); ctx.stroke();
    ctx.restore();
    ctx.restore();
    // HP bar handled below; skip the shared eyes/blob detail for the rogue
    if (e.hp < e.maxHp) {
      const w = Math.max(20, (b.bounds.max.x - b.bounds.min.x));
      const top = b.bounds.min.y - 8;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x - w / 2, top, w, 4);
      ctx.fillStyle = '#ff5e57'; ctx.fillRect(x - w / 2, top, w * Math.max(0, e.hp / e.maxHp), 4);
    }
    return;
  } else if (e.type === 'archer') {
    ctx.strokeStyle = '#5a3d22'; ctx.lineWidth = 3;                     // bow
    ctx.beginPath(); ctx.arc(12, 0, 14, -1.1, 1.1); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1;       // string
    ctx.beginPath(); ctx.moveTo(12 + 14 * Math.cos(-1.1), 14 * Math.sin(-1.1)); ctx.lineTo(12 + 14 * Math.cos(1.1), 14 * Math.sin(1.1)); ctx.stroke();
  } else if (e.type === 'bug') {
    ctx.strokeStyle = e.color; ctx.lineWidth = 2;                       // scuttling legs
    for (const s of [-1, 1]) for (const o of [-4, 0, 4]) { ctx.beginPath(); ctx.moveTo(s * 6, o); ctx.lineTo(s * 13, o + Math.sin(now * 0.02 + o) * 3); ctx.stroke(); }
  } else if (e.type === 'ogre') {
    ctx.fillStyle = '#7a5a33';                                         // club
    ctx.save(); ctx.translate(20, -6); ctx.rotate(-0.5); ctx.fillRect(-4, -4, 8, 34); ctx.beginPath(); ctx.arc(0, 30, 9, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  // eyes (glowing, angrier for the heavy)
  ctx.fillStyle = e.type === 'ogre' ? '#ff5555' : '#fff';
  const ey = e.type === 'bug' ? -3 : -6, er = e.type === 'ogre' ? 3 : 2;
  ctx.beginPath(); ctx.arc(3, ey, er, 0, Math.PI * 2); ctx.arc(9, ey, er, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // HP bar (only once damaged)
  if (e.hp < e.maxHp) {
    const w = Math.max(20, (b.bounds.max.x - b.bounds.min.x));
    const top = b.bounds.min.y - 8;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x - w / 2, top, w, 4);
    ctx.fillStyle = '#ff5e57'; ctx.fillRect(x - w / 2, top, w * Math.max(0, e.hp / e.maxHp), 4);
  }
}

// draws any dynamic body (real or network ghost) by label
export function drawDynamicBody(b, now) {
  const col = (b.render && b.render.fillStyle) || b.color || '#c0c0cc';
  if (b.label === 'projectile') {
    const r = b.circleRadius || 7;
    ctx.shadowColor = b.color || '#ffb347';
    ctx.shadowBlur = 12;
    ctx.fillStyle = b.color || '#ffb347';
    ctx.beginPath(); ctx.arc(b.position.x, b.position.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(b.position.x, b.position.y, r * 0.45, 0, Math.PI * 2); ctx.fill();
    return;
  }
  if (b.label === 'crate') { drawCrate(b); return; }
  if (b.label === 'boss') { drawBossBody(b, now); return; }
  if (b.label === 'vine') {
    const ys = b.vertices ? b.vertices.map(v => v.y) : [b.position.y - 24, b.position.y + 24];
    drawVineAt(b.position.x, Math.max(...ys), Math.max(...ys) - Math.min(...ys), now);
    return;
  }
  if (b.label === 'critter') {
    drawBodyRounded(b, col);
    const dir = b.critter ? b.critter.dir : 1;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(b.position.x + dir * 4, b.position.y - 3, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(b.position.x + dir * 4.8, b.position.y - 3, 1, 0, Math.PI * 2); ctx.fill();
    return;
  }
  if (b.label === 'enemy') { drawEnemy(b, now); return; }
  if (b.label === 'decoy') {
    const p = b.decoyOf;
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(b.position.x, b.position.y - 4, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.hat;
    ctx.beginPath();
    ctx.moveTo(b.position.x - 9, b.position.y - 10);
    ctx.lineTo(b.position.x + 9, b.position.y - 10);
    ctx.lineTo(b.position.x + 2, b.position.y - 26);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }
  if (b.label === 'saw') {
    drawBodyRounded(b, col);
    ctx.save();
    ctx.translate(b.position.x, b.position.y);
    ctx.rotate(b.angle);
    ctx.strokeStyle = '#7a7a8c';
    ctx.lineWidth = 2;
    const r = (b.circleRadius || 15) + 3;
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (r - 6), Math.sin(a) * (r - 6));
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  if (b.label === 'mine') {
    drawBodyRounded(b, col);
    ctx.fillStyle = Math.sin(now * 0.008) > 0 ? '#ff4444' : '#661111';
    ctx.beginPath(); ctx.arc(b.position.x, b.position.y - 6, 2.5, 0, Math.PI * 2); ctx.fill();
    return;
  }
  if (b.label === 'anvil') {
    ctx.save(); ctx.translate(b.position.x, b.position.y); ctx.rotate(b.angle);
    ctx.fillStyle = '#4a4a55';
    ctx.fillRect(-22, -13, 34, 10);                                                   // top face
    ctx.beginPath(); ctx.moveTo(12, -13); ctx.lineTo(25, -8); ctx.lineTo(12, -3); ctx.closePath(); ctx.fill(); // horn
    ctx.fillStyle = '#3d3d47';
    ctx.fillRect(-6, -3, 12, 6);                                                       // waist
    ctx.beginPath(); ctx.moveTo(-16, 14); ctx.lineTo(16, 14); ctx.lineTo(10, 3); ctx.lineTo(-10, 3); ctx.closePath(); ctx.fill(); // flared base
    ctx.strokeStyle = '#26262e'; ctx.lineWidth = 1.3; ctx.strokeRect(-22, -13, 34, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(-22, -13, 34, 2.5);         // top glint
    ctx.restore();
    return;
  }
  if (b.label === 'boulderS') {
    const r = b.circleRadius || 26;
    ctx.save(); ctx.translate(b.position.x, b.position.y); ctx.rotate(b.angle);
    ctx.fillStyle = '#6b6357';
    ctx.beginPath();
    const n = 9;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const rr = r * (0.8 + ((i * 41) % 13) / 40); const px = Math.cos(a) * rr, py = Math.sin(a) * rr; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#3f3a32'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.strokeStyle = '#524b40'; ctx.lineWidth = 1;                                    // cracks / facets
    ctx.beginPath(); ctx.moveTo(-r * 0.35, -r * 0.4); ctx.lineTo(r * 0.05, 0); ctx.lineTo(-r * 0.25, r * 0.45); ctx.moveTo(r * 0.05, 0); ctx.lineTo(r * 0.5, -r * 0.15); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.35, r * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return;
  }
  if (b.label === 'piano') {
    drawBodyRounded(b, col);
    ctx.save();
    ctx.translate(b.position.x, b.position.y);
    ctx.rotate(b.angle);
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(-34, 4, 68, 10);
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    for (let i = -30; i <= 30; i += 8) { ctx.beginPath(); ctx.moveTo(i, 4); ctx.lineTo(i, 14); ctx.stroke(); }
    ctx.restore();
    return;
  }
  if (drawHazardBody(b, now)) return; // icicles, barrels, bumpers, balls (live + ghosts)
  drawBodyRounded(b, col);
  if (b.spin) drawPivotBolt(b);
}

export function drawProjectiles(now) {
  for (const fb of projectiles) drawDynamicBody(fb, now);
}

export function drawSummons(now) {
  for (const b of summons) drawDynamicBody(b, now);
}

export function drawReticle(now) {
  if (!mouse.present) return;
  const p = players.find(q => q.controller === kbControllers[0]);
  if (!p || !p.alive) return;
  ctx.strokeStyle = p.color;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 9, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath();
  for (const [dx, dy] of [[12, 0], [-12, 0], [0, 12], [0, -12]]) {
    ctx.moveTo(mouse.x + dx * 0.5, mouse.y + dy * 0.5);
    ctx.lineTo(mouse.x + dx, mouse.y + dy);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

let vignetteCache = null;
export function getVignette() {
  if (!vignetteCache) {
    vignetteCache = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95);
    vignetteCache.addColorStop(0, 'rgba(0,0,0,0)');
    vignetteCache.addColorStop(1, 'rgba(0,0,0,0.38)');
  }
  return vignetteCache;
}

export function drawBackdrop(now) {
  drawStoryBackdrop(ctx, {
    bg: currentMap.def.bg || '#241d2e', W, H, now,
    stars: currentMap.data.starfield, voidTop: currentMap.data.voidTop,
    icy: currentMap.def.icy || currentMap.data.eventIcy,
    acid: currentMap.data.acid, lavaY: currentMap.data.lavaY,
  });
}


export function drawVictory(now) {
  ctx.fillStyle = 'rgba(10,6,16,0.6)';
  ctx.fillRect(0, 0, W, H);
  const p = game.winner;
  drawWizardFigure(p, W / 2, 400, 4.5, now);
  ctx.textAlign = 'center';
  ctx.font = 'bold 58px Georgia';
  ctx.fillStyle = p.color;
  ctx.fillText(`${p.name} WINS THE MATCH`, W / 2, 180);
  ctx.font = '20px Georgia';
  ctx.fillStyle = '#e8d5ff';
  ctx.fillText('press CAST for a rematch', W / 2, 550);
  drawAwards(game.awards, now);
  drawSpellReport(game.spellReport, now);
  if (Math.random() < 0.6) {
    particles.push({ kind: 'confetti', x: rand(0, W), y: -10, vx: rand(-1, 1), vy: rand(1, 3), life: 120, maxLife: 120, color: pick(['#4ecdc4', '#ff6b81', '#ffd166', '#a55eea', '#e8d5ff']), r: 4 });
  }
}

export function draw(now) {
  if (game.replay) {
    // killcam: re-render the recorded tape; the live sim keeps running unseen
    setShake(shake * 0.88);
    setFlashAlpha(flashAlpha * 0.86);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(-30, -30, W + 60, H + 60);
    drawReplay(now);
    drawHUD(now);
    return;
  }
  const sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake;
  setShake(shake * 0.88);
  ctx.setTransform(1, 0, 0, 1, sx, sy);
  ctx.clearRect(-30, -30, W + 60, H + 60);
  drawBackdrop(now);
  drawMapBodies(now);
  drawLava(now);
  drawGeysers(now);
  drawGasVents(now);
  drawTomes(now);
  drawSummons(now);
  drawGibs();
  drawProjectiles(now);
  // sim-owned effects describe themselves (`vfx`); render-owned ones (bolts)
  // live entirely in src/render/effects.js
  for (const e of activeEffects) drawVfx(e, now, ctx);
  drawFxEffects(now, ctx);
  drawParticles();
  for (const p of players) if (p.alive) drawWizard(p, now);
  drawOffscreenPointers(players.filter(p => p.alive).map(p => ({
    x: p.body.position.x, y: p.body.position.y,
    vx: p.body.velocity.x, vy: p.body.velocity.y, color: p.color,
  })), now);
  drawGhostWisps(now);

  drawEnvVisualsLive(now);
  drawReticle(now);

  ctx.fillStyle = getVignette();
  ctx.fillRect(0, 0, W, H);

  if (flashAlpha > 0.01) {
    ctx.globalAlpha = flashAlpha;
    ctx.fillStyle = flashColor;
    ctx.fillRect(-30, -30, W + 60, H + 60);
    ctx.globalAlpha = 1;
  }
  setFlashAlpha(flashAlpha * 0.86);

  drawHUD(now);
  if (game.state === 'LOBBY') drawLobby();
  if (game.state === 'VICTORY') drawVictory(now);
  if (game.state === 'RUN_OVER') drawRunOver(now);
  globalThis.drawNetStats?.(now); // F8 overlay (net.js; absent in file:// couch mode)
}

export function drawRunOver(now) {
  ctx.fillStyle = 'rgba(10,6,16,0.68)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.font = 'bold 54px Georgia';
  ctx.fillStyle = '#ff6b6b';
  ctx.fillText('OVERRUN', W / 2, 210);
  ctx.font = 'bold 40px Georgia';
  ctx.fillStyle = '#ffd166';
  ctx.fillText(`REACHED WAVE ${game.runScore || game.wave}`, W / 2, 290);
  ctx.font = '22px Georgia';
  ctx.fillStyle = '#e8d5ff';
  const best = game.bestWave || 0;
  const isBest = (game.runScore || game.wave) >= best && best > 0;
  ctx.fillText(isBest ? '★ NEW BEST ★' : `best: wave ${best}`, W / 2, 340);
  ctx.font = '20px Georgia';
  ctx.fillStyle = '#9c8ab8';
  ctx.fillText('press CAST for the lobby', W / 2, 430);
}
