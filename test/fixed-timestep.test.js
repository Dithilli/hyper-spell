import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTickLoop } from '../src/sim/tick-loop.js';
import { TICK_MS, MAX_CATCHUP, advanceTick, resetTick } from '../src/sim/time.js';
import { setClock } from '../src/sim/env.js';
import { BASE_PACE, paceScale, slowMo, updatePace } from '../src/sim/pace.js';

// These four tests measure loop MECHANICS — how much wall time becomes how many
// fixed steps — so they pin the pace multiplier to 1. Production leaves `pace`
// defaulted to paceScale(), which is what makes slow-mo and hitstop change how
// fast ticks are consumed; a loop whose tick rate is deliberately variable
// cannot also be the thing that proves framerate independence.
const unpaced = (step) => createTickLoop({ step, pace: () => 1 });

test('a 16.7ms frame runs exactly one step', () => {
  let steps = 0;
  const loop = unpaced(() => steps++);
  assert.equal(loop.pump(TICK_MS).alpha, 0, 'a whole tick leaves nothing over');
  assert.equal(steps, 1);
  // and the leftover a partial frame DOES leave is what a renderer interpolates
  // across, so it has to be the real fraction and not a rounding of it
  assert.equal(loop.pump(TICK_MS / 2).steps, 0);
  assert.equal(loop.pump(0).alpha, 0.5);
});

test('a slow 100ms frame catches up with several fixed steps, never one big one', () => {
  const deltas = [];
  const loop = unpaced((dt) => deltas.push(dt));
  const r = loop.pump(100);
  // 100ms is exactly six ticks' worth — one more than MAX_CATCHUP allows — so
  // the sixth is shed rather than run. What DOES run is MAX_CATCHUP steps of
  // exactly TICK_MS, never a single 100ms lurch, which is the claim here.
  assert.equal(deltas.length, MAX_CATCHUP);
  assert.ok(deltas.every((d) => d === TICK_MS), 'every step is exactly TICK_MS');
  assert.ok(r.dropped > 0, 'the sixth tick is reported as dropped, not run late');
});

test('catch-up is capped and the shortfall is reported, not silently dropped', () => {
  const loop = unpaced(() => {});
  const r = loop.pump(1000);
  assert.equal(r.steps, MAX_CATCHUP);
  assert.ok(r.dropped > 0, 'dropped time is reported');
});

test('total steps over one simulated second is framerate independent', () => {
  const run = (fps) => {
    let steps = 0;
    const loop = unpaced(() => steps++);
    const dt = 1000 / fps;
    for (let i = 0; i < fps; i++) loop.pump(dt);
    return steps;
  };
  assert.equal(run(60), 60);
  assert.equal(run(144), 60);
  assert.equal(run(30), 60);
});

// ---------------------------------------------------------------------------
// The four tests above pin `pace` to 1 so they can measure the loop's own
// mechanics. That is the right call for them, but it means nothing above — and
// nothing in sim-smoke or the golden tape, both of which call stepSim directly
// and never build a tick loop at all — ever runs the production `pace` path.
// That is the single biggest behaviour change in this task, so it gets its own
// coverage here.
// ---------------------------------------------------------------------------

test('pace scales how fast ticks are consumed, never how big a step is', () => {
  const deltas = [];
  const loop = createTickLoop({ step: (dt) => deltas.push(dt), pace: () => 0.5 });
  for (let i = 0; i < 20; i++) loop.pump(TICK_MS);
  // twenty frames' worth of real time at half pace buys ten ticks…
  assert.equal(deltas.length, 10);
  // …and every one of them is still a full-size step. This is the whole point:
  // the solver never sees a 0.8ms Engine.update because the game got dramatic.
  assert.ok(deltas.every((d) => d === TICK_MS), 'a slowed sim still steps at full size');
});

// Drives the REAL pace module through the loop's default `pace = paceScale`, in
// the shape a browser frame loop has: a 60Hz display, a fake env clock, and the
// tick advanced inside the step callback exactly as src/platform/browser.js
// does. Returns how much REAL time passed before the hitstop released.
function realMsHeldBy(scale, ms) {
  let realNow = 0;
  setClock({ now: () => realNow });
  resetTick();
  const loop = createTickLoop({ step: () => { updatePace(); advanceTick(); } });
  slowMo(scale, ms);
  const CEILING = 10000;
  while (realNow < CEILING) {
    realNow += TICK_MS;
    loop.pump(TICK_MS);
    // updatePace only eases once the deadline has passed, so the first frame
    // where the scale climbs off its floor is the frame the beat ended
    if (paceScale() > scale) break;
  }
  return realNow;
}

test('a hitstop lasts the milliseconds it was given, on the clock that authored them', (t) => {
  t.after(() => setClock(null)); // unconditional: a failed assertion must not leave the module clock stubbed
  // Every one of the 14 slowMo call sites writes a real-world duration:
  // spells/book.js:243 asks for a 90ms freeze, ai/boss.js:404 for 1100ms.
  // Measuring that deadline on simNow() — the clock the hitstop itself slows —
  // makes the real duration ms/scale, and the harder the freeze the longer it
  // lasts: a 90ms hitstop at 0.05 would hold the sim for ~2 seconds.
  const severe = realMsHeldBy(0.05, 90);
  assert.ok(severe < 500, `a 90ms hitstop held the sim for ${Math.round(severe)}ms of real time`);

  // and the duration must not scale with the severity. The residual spread is
  // only tick granularity: at pace 0.05 the loop reaches a tick every 333ms, so
  // that is the finest the deadline can be observed.
  const mild = realMsHeldBy(0.5, 90);
  assert.ok(
    severe - mild < TICK_MS / 0.05 + TICK_MS,
    `a harder freeze lasted disproportionately longer (${Math.round(mild)}ms → ${Math.round(severe)}ms)`,
  );

  assert.equal(BASE_PACE, 0.85, 'base pace is unchanged content');
});

test('a slowMo(0) recovers instead of freezing the sim forever', (t) => {
  t.after(() => setClock(null));
  let realNow = 0;
  setClock({ now: () => realNow });
  resetTick();
  const loop = createTickLoop({ step: () => { updatePace(); advanceTick(); } });

  // Content never asks for this — all 14 slowMo sites bottom out at 0.05 — but
  // applyFx passes msg.a straight through (src/net/client.js:256,266) from a
  // table whose stated job is surviving a bug or a hostile server. At a pace of
  // exactly 0 the accumulator gains nothing, so the step never fires, so
  // updatePace never runs and the pace can never climb off 0: the sim is frozen
  // for good. Before the fixed timestep this self-healed, because the ease ran
  // once per frame inside stepSim rather than once per tick.
  slowMo(0, 200);
  assert.ok(paceScale() > 0, 'a zero pace is clamped to the floor content actually uses');

  for (let i = 0; i < 1200; i++) { // twenty seconds of a 60Hz display
    realNow += TICK_MS;
    loop.pump(TICK_MS);
  }
  assert.ok(paceScale() > BASE_PACE * 0.99, `the sim never recovered (pace ${paceScale()})`);
});

test('an online client eases back from a broadcast hitstop, like the host does', async (t) => {
  // An online client never runs stepSim (src/platform/browser.js:62 returns
  // early), and stepSim is the only caller of updatePace. But the client's
  // fxLoop takes the default pace = paceScale, and applyFx replays the server's
  // slowMo into the same shared pace module — so without an ease of its own the
  // first broadcast hitstop pins the client's pace forever and its particles
  // crawl at one update per 333ms for the rest of the session. That is A8
  // failing in the module that was supposed to close it.
  const { netClientFrame } = await import('../src/net/client.js');
  const { initCanvas } = await import('../src/render/canvas.js');
  let realNow = 0;
  setClock({ now: () => realNow });
  t.after(() => setClock(null));

  // Give the client a no-op 2d context — every method does nothing, every
  // property assignment is accepted — so its draw half runs to completion
  // headlessly. The test then depends only on the pace easing back, not on an
  // exception happening to land below the pump: reordering the draw and the
  // pump is behaviour-preserving in a real browser and must stay green here.
  // Nothing is swallowed either, so a genuine error still fails the test.
  initCanvas({ getContext: () => new Proxy({}, { get: () => () => undefined, set: () => true }) });

  slowMo(0.05, 90); // exactly what applyFx does at src/net/client.js:256
  assert.equal(paceScale(), 0.05, 'the broadcast landed');

  for (let i = 0; i < 600; i++) { // ten seconds of a 60Hz display
    realNow += TICK_MS;
    netClientFrame(realNow);
  }

  assert.ok(
    paceScale() > BASE_PACE * 0.99,
    `client pace never recovered from the broadcast hitstop (stuck at ${paceScale()})`,
  );
});
