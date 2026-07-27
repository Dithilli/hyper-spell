// replay.js — final-kill killcam: ring-buffer the last few seconds of play as
// snapshots, then re-render them in slow motion on the round-end screen.
// The re-render itself is src/render/replay.js.
import { onWorldReset } from './world.js';
import { game } from './match.js';
import { serializeSnapshot } from './snapshot.js';
import { simNow } from './time.js';

export const REPLAY = {
  BUF_MS: 3400,   // ring buffer horizon
  HZ_DIV: 3,      // record every 3rd frame (~20Hz — plenty for the slow-mo killcam)
  TAIL_MS: 2200,  // portion of buffer actually replayed (the kill)
  SPEED: 0.45,    // slow-mo playback rate
  LEAD_MS: 500,   // beat of frozen frame before playback starts
  HOLD_MS: 400,   // hold on the last frame after playback
  MIN_MS: 600,    // skip replay if the round was too short
};
const replayBuf = []; // [{ t, snap }]
let replayFrameCounter = 0;

export function replayRecord(now) {
  if (game.state !== 'PLAY') return;
  if (++replayFrameCounter % REPLAY.HZ_DIV !== 0) return;
  replayBuf.push({ t: now, snap: serializeSnapshot() });
  while (replayBuf.length && replayBuf[0].t < now - REPLAY.BUF_MS) replayBuf.shift();
}

export function clearReplay() {
  replayBuf.length = 0;
  game.replay = null;
}

// called from checkRoundEnd; returns extra ms the round-end screen should last
export function startReplay(now) {
  if (replayBuf.length < 2 || replayBuf[replayBuf.length - 1].t - replayBuf[0].t < REPLAY.MIN_MS) {
    replayBuf.length = 0;
    return 0;
  }
  const cutoff = replayBuf[replayBuf.length - 1].t - REPLAY.TAIL_MS;
  let i = replayBuf.findIndex(f => f.t >= cutoff);
  if (i > 0) i--; // one frame before the tail so interpolation has a base
  const frames = replayBuf.slice(Math.max(i, 0));
  const durMs = frames[frames.length - 1].t - frames[0].t;
  game.replay = { frames, playAt: now + REPLAY.LEAD_MS, durMs };
  replayBuf.length = 0;
  return REPLAY.LEAD_MS + durMs / REPLAY.SPEED + REPLAY.HOLD_MS;
}

// bracketing frames + lerp alpha at the replay's current (slowed) time.
// Takes no `now`: the tape's timestamps and `playAt` are sim time, so the only
// clock that can index into them is simNow(). Its two callers are both outside
// sim/ (src/net/server-bridge.js, src/render/replay.js) and used to pass their
// own wall clock, which would now drift off the tape by (1 - paceScale()) of
// however long the process had been up.
export function replayFrameAt() {
  const now = simNow();
  const r = game.replay;
  if (!r) return null;
  const t = r.frames[0].t + Math.max(0, now - r.playAt) * REPLAY.SPEED;
  let i = 1;
  while (i < r.frames.length && r.frames[i].t < t) i++;
  if (i >= r.frames.length) i = r.frames.length - 1;
  const prev = r.frames[i - 1], cur = r.frames[i];
  const alpha = Math.max(0, Math.min(1, (t - prev.t) / Math.max(cur.t - prev.t, 1)));
  const done = now > r.playAt + r.durMs / REPLAY.SPEED + REPLAY.HOLD_MS;
  return { snap: cur.snap, prev: prev.snap, alpha, done };
}

onWorldReset(() => {
  replayBuf.length = 0;
  replayFrameCounter = 0;
});
