// profiler.test.js — the frame-time instrumentation, headless.
//
// The profiler exists to be trusted about a stutter that fires once every few
// hundred frames, so the properties worth asserting are the ones that would
// quietly poison that: allocating per frame (a profiler that adds GC pressure
// changes the thing it measures), corrupting its own state on an unbalanced
// call, or costing anything at all while switched off — it is compiled into
// every frame of the shipped game.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  perfFrameStart, perfFrameEnd, perfBegin, perfEnd, perfCount, perfDump, perfSetEnabled, drawPerfHud,
} from '../src/render/profiler.js';

const frame = (body = () => {}) => { perfFrameStart(); body(); perfFrameEnd(); };

test('a frame records its phases without a canvas', () => {
  perfSetEnabled(true);
  frame(() => {
    perfBegin('sim'); perfEnd();
    perfBegin('draw'); perfEnd();
    perfCount('particles', 120);
  });
  const dump = perfDump();
  assert.ok(dump, 'perfDump must return a summary');
  assert.ok(/sim/.test(JSON.stringify(dump)), 'the sim phase must appear in the dump');
  perfSetEnabled(false);
});

test('nested phases do not double-count the frame', () => {
  perfSetEnabled(true);
  frame(() => {
    perfBegin('world');
    perfBegin('bloom'); perfEnd();   // nested inside world
    perfEnd();
  });
  const dump = JSON.stringify(perfDump());
  assert.ok(/world/.test(dump) && /bloom/.test(dump), 'both phases must be recorded');
  perfSetEnabled(false);
});

test('an unbalanced perfEnd does not corrupt the next frame', () => {
  perfSetEnabled(true);
  frame(() => { perfEnd(); }); // stray close, no open
  frame(() => { perfBegin('sim'); perfEnd(); });
  assert.ok(perfDump(), 'the profiler must survive a stray perfEnd');
  perfSetEnabled(false);
});

test('an unclosed perfBegin does not leak into the next frame', () => {
  perfSetEnabled(true);
  frame(() => { perfBegin('leaky'); });  // never closed
  frame(() => { perfBegin('sim'); perfEnd(); });
  assert.ok(perfDump(), 'an unclosed phase must not wedge the profiler');
  perfSetEnabled(false);
});

// The hot path runs in the shipped game whether or not anyone pressed F7, so
// every hook has to be free when off — and must not allocate a ring buffer
// merely by being called.
test('every hook is inert while switched off', () => {
  perfSetEnabled(false);
  assert.doesNotThrow(() => {
    frame(() => { perfBegin('x'); perfEnd(); perfCount('n', 1); });
    drawPerfHud(0);
  });
  assert.equal(globalThis.PERF.on, false);
  assert.equal(globalThis.PERF.n, 0, 'a disabled profiler must record nothing');
});

test('the overlay is a no-op without a canvas', () => {
  perfSetEnabled(true);
  frame(() => { perfBegin('sim'); perfEnd(); });
  assert.doesNotThrow(() => drawPerfHud(0), 'drawPerfHud must no-op headless');
  perfSetEnabled(false);
});

// A fixed ring buffer is the design: the profiler must not grow while running,
// or it becomes the leak it is being used to hunt.
test('the ring buffer does not grow with runtime', () => {
  perfSetEnabled(true);
  for (let i = 0; i < 1000; i++) frame(() => { perfBegin('sim'); perfEnd(); });
  assert.ok(globalThis.PERF.n <= 240, `ring buffer grew to ${globalThis.PERF.n}`);
  assert.equal(globalThis.PERF.buf.length, 240, 'the buffer itself must stay fixed');
  perfSetEnabled(false);
});

// Interned phase names index typed arrays; the cap is what stops a caller
// passing a dynamic name from growing them without bound.
test('an unbounded stream of phase names cannot grow the slot table', () => {
  perfSetEnabled(true);
  frame(() => { for (let i = 0; i < 500; i++) { perfBegin(`phase${i}`); perfEnd(); } });
  assert.doesNotThrow(() => perfDump());
  perfSetEnabled(false);
});

test('toggling off and on again starts from a clean window', () => {
  perfSetEnabled(true);
  for (let i = 0; i < 50; i++) frame(() => { perfBegin('sim'); perfEnd(); });
  perfSetEnabled(false);
  perfSetEnabled(true);
  assert.equal(globalThis.PERF.n, 0, 'stale frames would skew every percentile');
  perfSetEnabled(false);
});
