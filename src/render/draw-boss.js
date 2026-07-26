// draw-boss.js — the boss body (via drawDynamicBody, so live bodies, LAN ghosts
// and the killcam all share it) and the shared HP bar.
import { ctx } from './canvas.js';
import { W } from '../sim/world.js';
import { drawStoryBoss } from './artkit.js';

// drawn via drawDynamicBody (live, LAN ghosts, and the killcam use the same path)
export function drawBossBody(b, now) {
  const { x, y } = b.position;
  drawStoryBoss(ctx, {
    x, y, now,
    r: b.circleRadius || 46,
    type: b.bossType,
    color: b.color || '#e15d5d',
  });
}

// shared HP bar (host HUD draws from game.boss; the net client from snap.bs)
export function drawBossBar(name, color, hp, maxHp) {
  const w = 420, x = W / 2 - w / 2, y = 96;
  ctx.textAlign = 'center';
  ctx.font = 'bold 15px Georgia';
  ctx.fillStyle = color;
  ctx.fillText(name, W / 2, y - 6);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x, y, w, 10);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * Math.max(0, hp / maxHp), 10);
  ctx.strokeStyle = '#e8d5ff';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, 10);
}
