// replay.js — re-rendering the killcam tape the sim recorded.
import { ctx } from './canvas.js';
import { W, H } from '../sim/world.js';
import { game } from '../sim/match.js';
import { replayFrameAt } from '../sim/replay.js';
import { drawSnapshotWorld } from './draw-snapshot.js';
import { getVignette } from './draw-world.js';


export function drawReplayOverlay(now) {
  ctx.fillStyle = '#000';
  ctx.fillRect(-30, -30, W + 60, 84);
  ctx.fillRect(-30, H - 54, W + 60, 84);
  ctx.fillStyle = '#ff5e57';
  ctx.beginPath(); ctx.arc(30, 30, 6 + 1.5 * Math.sin(now * 0.01), 0, Math.PI * 2); ctx.fill();
  ctx.font = 'bold 16px Georgia';
  ctx.textAlign = 'left';
  ctx.fillText('REPLAY', 46, 36);
  ctx.textAlign = 'center';
}

export function drawReplay(now) {
  const f = replayFrameAt(now);
  if (!f) return;
  drawSnapshotWorld(f.snap, f.prev, f.alpha, now);
  ctx.fillStyle = getVignette();
  ctx.fillRect(0, 0, W, H);
  drawReplayOverlay(now);
  if (f.done) game.replay = null;
}
