// draw-wizard.js — the wizard figure, its name tag, the offscreen pointers and
// the wisps the dead drift as. The art itself is artkit's drawStoryWizard; this
// is the adapter that supplies the state.
import { ctx } from './canvas.js';
import { W, H } from '../sim/world.js';
import { avatarVariant, drawStoryWizard } from './artkit.js';
import { game } from '../sim/match.js';
import { players, MAX_HP } from '../sim/player/lifecycle.js';
import { SPELLS } from '../sim/spells/registry.js';
import { effectiveCooldown } from '../sim/spells/core.js';
import { cameraZoom, cameraViewRect } from './camera.js';
import { claimTagSlot } from './name-tags.js';

// edge pointers for wizards knocked offscreen (usually skyward). A color-coded
// chevron rides the screen edge at the wizard's clamped position and points
// along their velocity — while they're soaring it aims up/away; the moment it
// tips downward it's marking the column they're about to land in. Shared by
// the live draw, LAN clients, and the killcam. list: [{x, y, vx, vy, color}]
export function drawOffscreenPointers(list, now) {
  // Bounds are the camera's view rect, not the arena — once the camera zooms in,
  // "off screen" starts well inside the world, and that's exactly when these
  // arrows matter most. Sizes divide by zoom so they stay constant on screen.
  const v = cameraViewRect();
  const z = cameraZoom();
  const INSET = 22 / z, EDGE = 18 / z;
  for (const w of list) {
    if (w.x > v.x0 - EDGE && w.x < v.x1 + EDGE && w.y > v.y0 - EDGE && w.y < v.y1 + EDGE) continue;
    const ax = Math.max(v.x0 + INSET, Math.min(v.x1 - INSET, w.x));
    const ay = Math.max(v.y0 + INSET, Math.min(v.y1 - INSET, w.y));
    const speed = Math.hypot(w.vx || 0, w.vy || 0);
    // point along travel; a near-still wizard (frozen mid-air) points at them
    const ang = speed > 0.8 ? Math.atan2(w.vy, w.vx) : Math.atan2(w.y - ay, w.x - ax);
    const dist = Math.hypot(w.x - ax, w.y - ay);
    const s = Math.max(9, 15 - dist * 0.012) / z * (1 + 0.12 * Math.sin(now * 0.012));
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(ang);
    ctx.fillStyle = w.color;
    ctx.strokeStyle = 'rgba(13,10,20,0.9)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(s, 0);
    ctx.lineTo(-s * 0.7, s * 0.62);
    ctx.lineTo(-s * 0.35, 0);
    ctx.lineTo(-s * 0.7, -s * 0.62);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// very subtle: a drifting mote with a fading tail — pointedly NOT a wizard
export function drawWisp(name, color, x, y, now) {
  const seed = (name || '').length * 1.7;
  const bob = Math.sin(now * 0.0035 + seed) * 3;
  const yy = y + bob;
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = color;
  for (let i = 1; i <= 3; i++) { // tail
    ctx.beginPath();
    ctx.arc(x - Math.sin(now * 0.0035 + seed - i * 0.9) * 4, yy + i * 7, 4 - i, 0, Math.PI * 2);
    ctx.fill();
  }
  const g = ctx.createRadialGradient(x, yy, 0, x, yy, 9);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 0.22 + 0.05 * Math.sin(now * 0.005 + seed);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, yy, 9, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.16;
  ctx.font = '9px Georgia';
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.fillText(name, x, yy - 13);
  ctx.globalAlpha = 1;
}

export function drawGhostWisps(now) {
  if (game.state !== 'PLAY' && game.state !== 'ROUND_END') return;
  for (const p of players) {
    if (!p.alive && p.ghost) drawWisp(p.name, p.color, p.ghost.x, p.ghost.y, now);
  }
}

// the hat IS the health indicator: proud ≥75, knocked askew 50–74,
// gone below 50 (the shame), and under 25 the wizard smolders.
// Rendering lives in artkit.js (drawStoryWizard) so the game and the review
// gallery share one source of truth; this adapter just supplies the state.
export function drawWizardFigure(p, x, y, scale, now, angle = 0) {
  const spell = p.spellId && SPELLS[p.spellId];
  // C4: the hand glows when the spell is actually castable. Like the HUD bar
  // this used to read the DECLARED cooldown, so Fireball's hand lit up 30ms
  // before the cast gate would let it fire.
  const ready = spell && now - p.lastCast > effectiveCooldown(p.spellId);
  drawStoryWizard(ctx, {
    x, y, scale, angle, now, name: p.name,
    color: p.color, hat: p.hat, hp: ((p.hp ?? MAX_HP) / MAX_HP) * 100,
    facing: p.facing, walkPhase: p.walkPhase, vx: p.body.velocity.x,
    piggy: now < (p.pigUntil || 0),
    alive: p.alive !== 0 && p.alive !== false,
    spellReady: ready, spellColor: ready ? spell.color : '#fff',
    variant: avatarVariant(p.name),
  });
}

export function drawNameTag(name, color, x, y) {
  const z = cameraZoom();
  ctx.save();
  // sized in screen px: a nametag that scales with the camera stops being a label
  ctx.font = `bold ${11 / z}px Georgia`;
  ctx.textAlign = 'center';
  const halfW = ctx.measureText(name).width / 2;
  const ty = claimTagSlot(x, y, halfW);
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = 'rgba(10, 6, 16, 0.85)'; // halo so any color reads on any backdrop
  ctx.lineWidth = 3 / z;
  ctx.lineJoin = 'round';
  ctx.strokeText(name, x, ty);
  ctx.fillStyle = color;
  ctx.fillText(name, x, ty);
  // a tag pushed up off its owner gets a stem, so it stays attached to a wizard
  if (ty < y - 2) {
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1 / z;
    ctx.beginPath(); ctx.moveTo(x, ty + 3 / z); ctx.lineTo(x, y + 2 / z); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawWizard(p, now) {
  const { x, y } = p.body.position;
  const s = p.sizeScale || 1;
  drawNameTag(p.name, p.color, x, y - 48 * s);
  if (s > 1.6) {
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 18;
  }
  drawWizardFigure(p, x, y, s, now, p.body.angle * 0.35);
  ctx.shadowBlur = 0;
  if (now < (p.floatyUntil || 0)) {
    ctx.strokeStyle = '#ff6b81';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y - 26 * s); ctx.lineTo(x + 3, y - 44 * s); ctx.stroke();
    ctx.fillStyle = '#ff6b81';
    ctx.beginPath(); ctx.arc(x + 3, y - 52 * s, 9, 0, Math.PI * 2); ctx.fill();
  }
  if (now < (p.invulnUntil || 0) || now < (p.reflectUntil || 0)) {
    ctx.strokeStyle = now < (p.reflectUntil || 0) ? '#4ecdff' : '#ffd700';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(now * 0.02);
    ctx.beginPath(); ctx.arc(x, y - 8 * s, 24 * s, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (now < (p.hurtUntil || 0)) {
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(x, y - 8 * s, 19 * s, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (now < p.frozenUntil) {
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#9be7ff';
    ctx.fillRect(x - 17 * s, y - 32 * s, 34 * s, 50 * s);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#d8f4ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 17 * s, y - 32 * s, 34 * s, 50 * s);
  }
  // no health bars — the hat tells the story (see drawWizardFigure)
}
