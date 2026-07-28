// snapshot-playout.test.js — entity interpolation on the server clock.
//
// The bug this replaces cost no frame time, which is why it read as a mystery:
// interpolating between packet ARRIVAL times feeds network jitter straight into
// rendered motion, and the old render target sat outside the buffer about a
// quarter of the time, pinning alpha to 0. A wizard walking a constant 6px per
// frame rendered 3, then 9, then 3, on a LAN with no jitter at all.
//
// So the assertions here are about SMOOTHNESS, not just correctness. A playout
// that returns a valid bracketing pair every frame and still stutters is the
// exact failure being fixed, and every "does it interpolate" test passes on it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
// the client builds a local copy of the map on the first snapshot
import '../src/sim/content.js';
import {
  pushSnapshot, advancePlayout, resetPlayout, playoutStats,
} from '../src/net/client.js';

// A snapshot carrying only what the buffer reads: server stamp, round, map, and
// one wizard at x. clientLoadMap is skipped because mi stays constant.
const snap = (sv, x, { rn = 1, mi = 0 } = {}) => ({
  sv, rn, mi, v: 9, ps: [{ s: 0, x, y: 300, al: 1 }], bd: null,
});

// Render `frames` at 60Hz over a stream arriving every `period` ms of server
// time, with `jitter` ms of arrival noise, and report the x the client would
// have drawn each frame.
function play({ frames = 120, period = 33.3, jitter = 0, speed = 6, drop = 0 }) {
  resetPlayout();
  const out = [];
  let sv = 1000, at = 1000, x = 0, nextArrival = 1000, k = 0;
  for (let f = 0; f < frames; f++) {
    const now = 1000 + f * 16.7;
    // deliver whatever has arrived by now
    while (nextArrival <= now) {
      // deterministic sawtooth jitter — no Math.random, so a failure is
      // reproducible rather than a flake
      const j = jitter ? ((k % 4) - 1.5) * (jitter / 1.5) : 0;
      if (!(drop && k % drop === drop - 1)) pushSnapshot(snap(sv, x), Math.max(at, nextArrival + j));
      sv += period; x += speed * (period / 16.7); at = nextArrival; nextArrival += period; k++;
    }
    const rp = advancePlayout(now);
    if (rp) {
      const ax = rp.a.s.ps[0].x, bx = rp.b.s.ps[0].x;
      out.push(ax + (bx - ax) * rp.alpha);
    }
  }
  return out;
}

// The measure that matters: how uneven is the per-frame step? A constant-speed
// wizard should render a near-constant step, whatever the packets did.
function stepStats(xs) {
  const steps = [];
  for (let i = 1; i < xs.length; i++) steps.push(xs[i] - xs[i - 1]);
  const live = steps.slice(10); // let the clock lock on
  const mean = live.reduce((a, b) => a + b, 0) / live.length;
  const worst = live.reduce((m, s) => Math.max(m, Math.abs(s - mean)), 0);
  return { mean, worst, spread: worst / (Math.abs(mean) || 1), n: live.length };
}

test('a constant-speed wizard renders a constant step on a clean line', () => {
  const s = stepStats(play({ jitter: 0 }));
  assert.ok(s.n > 60, `only ${s.n} frames rendered`);
  assert.ok(s.spread < 0.25,
    `step varies by ${(s.spread * 100).toFixed(0)}% of its mean on a zero-jitter line — this is the 3/9/3 bug`);
});

// The headline claim. 12ms of arrival jitter on a 33ms tick is a bad wifi link;
// none of it should reach the picture, because the clock runs on server stamps.
test('arrival jitter does not reach rendered motion', () => {
  const clean = stepStats(play({ jitter: 0 }));
  const jittery = stepStats(play({ jitter: 12 }));
  assert.ok(jittery.spread < 0.35,
    `step varies by ${(jittery.spread * 100).toFixed(0)}% under 12ms of arrival jitter`);
  // and the mean speed must not change — a smoother that also slows the game
  // down has solved the wrong problem
  assert.ok(Math.abs(jittery.mean - clean.mean) < Math.abs(clean.mean) * 0.1,
    `jitter changed the rendered speed: ${clean.mean.toFixed(2)} -> ${jittery.mean.toFixed(2)} px/frame`);
});

test('the clock renders in the past, inside the buffer it holds', () => {
  resetPlayout();
  for (let i = 0; i < 6; i++) pushSnapshot(snap(1000 + i * 33, i * 12), 1000 + i * 33);
  const rp = advancePlayout(1000 + 5 * 33);
  assert.ok(rp, 'six snapshots should give a bracketing pair');
  assert.ok(rp.a.sv < rp.b.sv, 'the pair must straddle the clock in order');
  assert.ok(rp.alpha >= 0 && rp.alpha <= 1, `alpha out of range: ${rp.alpha}`);
  const st = playoutStats();
  assert.ok(st.delay >= 45 && st.delay <= 240, `interp delay outside its clamp: ${st.delay}`);
});

test('one snapshot is not enough to interpolate, and says so', () => {
  resetPlayout();
  pushSnapshot(snap(1000, 0), 1000);
  assert.equal(advancePlayout(1000), null, 'a single snapshot has nothing to straddle');
  pushSnapshot(snap(1033, 12), 1033);
  assert.ok(advancePlayout(1050), 'two snapshots should bracket');
});

// A round change teleports every body. Interpolating across it drags the whole
// roster over the arena in one long smear.
test('a round change cuts the tape instead of smearing across it', () => {
  resetPlayout();
  for (let i = 0; i < 4; i++) pushSnapshot(snap(1000 + i * 33, 100 + i * 6), 1000 + i * 33);
  assert.equal(playoutStats().buffered, 4);
  pushSnapshot(snap(1132, 900, { rn: 2 }), 1132); // new round, wizard elsewhere
  assert.equal(playoutStats().buffered, 1, 'the buffer must be cut on a round change');
  assert.equal(advancePlayout(1140), null, 'and nothing interpolates until it refills');
});

test('a map change cuts the tape too', () => {
  resetPlayout();
  for (let i = 0; i < 4; i++) pushSnapshot(snap(1000 + i * 33, 100 + i * 6), 1000 + i * 33);
  pushSnapshot(snap(1132, 900, { mi: 3 }), 1132);
  assert.equal(playoutStats().buffered, 1, 'the buffer must be cut on a map change');
});

// A killcam frame carries the timestamp it was RECORDED at. The server restamps
// them, but a stamp that goes backwards for any other reason must not run the
// playout clock backwards.
test('a snapshot from the past cuts rather than rewinding the clock', () => {
  resetPlayout();
  for (let i = 0; i < 4; i++) pushSnapshot(snap(5000 + i * 33, i * 6), 5000 + i * 33);
  pushSnapshot(snap(2000, 500), 5140); // seconds older than the stream
  assert.equal(playoutStats().buffered, 1, 'a backwards server stamp must cut the buffer');
});

test('the buffer does not grow without bound', () => {
  resetPlayout();
  for (let i = 0; i < 500; i++) pushSnapshot(snap(1000 + i * 33, i), 1000 + i * 33);
  assert.ok(playoutStats().buffered <= 16, `buffer leaked to ${playoutStats().buffered}`);
});

// Starvation: the stream stops. The clock runs to the newest snapshot and holds
// there rather than extrapolating a wizard off into the distance.
test('a stalled stream holds on the newest frame, and counts it', () => {
  resetPlayout();
  for (let i = 0; i < 4; i++) pushSnapshot(snap(1000 + i * 33, i * 12), 1000 + i * 33);
  let last = null;
  for (let f = 0; f < 60; f++) last = advancePlayout(1100 + f * 16.7) ?? last;
  const x = last.a.s.ps[0].x + (last.b.s.ps[0].x - last.a.s.ps[0].x) * last.alpha;
  assert.ok(x <= 36 + 1e-6, `extrapolated past the last known position: ${x}`);
  assert.ok(playoutStats().held > 0, 'starved frames must be counted for the F8 overlay');
});

// A server that predates the `sv` field sends no stamp. The client must fall
// back to arrival time rather than interpolating against undefined.
test('a snapshot with no server stamp falls back to arrival time', () => {
  resetPlayout();
  for (let i = 0; i < 4; i++) {
    const s = snap(0, i * 12);
    delete s.sv;
    pushSnapshot(s, 1000 + i * 33);
  }
  const rp = advancePlayout(1120);
  assert.ok(rp, 'an unstamped stream must still interpolate');
  assert.ok(Number.isFinite(rp.alpha), `alpha went non-finite without sv: ${rp.alpha}`);
});

// Dropped packets are the other half of a bad line: the buffer thins but the
// clock must keep moving smoothly rather than stalling every fourth frame.
test('an occasional dropped snapshot does not stall the picture', () => {
  const s = stepStats(play({ frames: 200, drop: 5 }));
  assert.ok(s.n > 100, `only ${s.n} frames rendered with 1-in-5 loss`);
  assert.ok(s.spread < 0.6, `step varies by ${(s.spread * 100).toFixed(0)}% with 1-in-5 packet loss`);
});
