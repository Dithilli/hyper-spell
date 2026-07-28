// replay.js — re-rendering the killcam tape the sim recorded.
import { ctx } from './canvas.js';
import { W, H } from '../sim/world.js';
import { game } from '../sim/match.js';
import { replayFrameAt } from '../sim/replay.js';
import { drawSnapshotWorld } from './draw-snapshot.js';
import { getVignette } from './draw-world.js';


// the killcam's camera targets: the wizards as recorded in the tape, since the
// live players the camera would normally follow are off doing the next round
export function replayCameraPoints() {
  const f = replayFrameAt();
  if (!f) return null;
  return f.snap.ps.filter(gp => gp.al).map(gp => ({ x: gp.x, y: gp.y, r: 26 }));
}

// screen-space furniture: letterbox bars, vignette, REPLAY dot. Drawn after
// endWorld() so the camera's zoom never scales the bars — a letterbox that
// zooms is just a black rectangle wandering across the picture.
export function drawReplayOverlay(now) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, 54);
  ctx.fillRect(0, H - 54, W, 54);
  ctx.fillStyle = '#ff5e57';
  ctx.beginPath(); ctx.arc(30, 30, 6 + 1.5 * Math.sin(now * 0.01), 0, Math.PI * 2); ctx.fill();
  ctx.font = 'bold 16px Georgia';
  ctx.textAlign = 'left';
  ctx.fillText('REPLAY', 46, 36);
  ctx.textAlign = 'center';
}

// world-space half only — the caller wraps this in beginWorld()/endWorld() and
// draws the vignette and letterbox afterwards, in screen space
export function drawReplay(now) {
  const f = replayFrameAt(); // indexes a sim-time tape; it reads simNow() itself
  if (!f) return;
  drawSnapshotWorld(f.snap, f.prev, f.alpha, now);
  if (f.done) game.replay = null;
}
