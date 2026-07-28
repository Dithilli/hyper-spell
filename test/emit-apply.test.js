// emit-apply.test.js — the glue between the sim's cosmetic queue and the two
// things that consume it: the renderer (src/render/fx.js) and the wire
// (src/net/server-bridge.js).
//
// This file exists because of the pattern that has now bitten this plan seven
// times: the pure functions get tested, the call sites get asserted to exist,
// and the small connective piece between them — the piece that encodes the
// actual rule — gets neither. Here the rules are:
//
//   * every name the sim can emit has a handler on the render side
//   * a name with no handler is recorded, not swallowed
//   * only the ten wire names leave the process
//   * slowMo applies locally AND emits; either half alone is a live bug
//   * installing the bridge twice does not compound, and neither install nor
//     uninstall leaves the previous sim's backlog behind
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { emit, drainEmitted, emittedCount } from '../src/sim/emit.js';
import {
  applyEmitted, handledEmitNames, unhandledEmitted, particles, shake, setShake,
} from '../src/render/fx.js';
import { fxEffects, clearFxEffects } from '../src/render/effects.js';
import { WIRE_FX } from '../src/net/fx-names.js';
import { createSim } from '../src/platform/node.js';
import { paceScale, BASE_PACE, slowMo } from '../src/sim/pace.js';
import { SPELLS } from '../src/sim/spells/registry.js';
import { players } from '../src/sim/player/lifecycle.js';
import { damagePlayer } from '../src/sim/player/combat.js';

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.js')) out.push(p);
  }
  return out;
}

// Every literal name src/sim hands to emit(). A name added without a handler
// would draw nothing at all locally and there would be no other symptom — the
// game would simply get quieter, which is why this is a test and not a comment.
function emittedNamesInSim() {
  const names = new Set();
  for (const file of walk('src/sim')) {
    for (const [, n] of readFileSync(file, 'utf8').matchAll(/\bemit\(\s*'([^']+)'/g)) names.add(n);
  }
  return [...names].sort();
}

test('the scan finds the names the sim really emits', () => {
  const names = emittedNamesInSim();
  // If this ever returns [] the two tests below become vacuous, and both would
  // still be green.
  assert.ok(names.length >= 8, `expected the cosmetic vocabulary, found ${names.join(', ')}`);
  for (const required of ['spawnParticles', 'sfx', 'slowMo', 'particle']) {
    assert.ok(names.includes(required), `${required} is no longer emitted anywhere in src/sim`);
  }
});

test('every name the sim emits has a render handler', () => {
  const handled = new Set(handledEmitNames());
  const missing = emittedNamesInSim().filter((n) => !handled.has(n));
  assert.deepEqual(missing, [], `src/render/fx.js would silently drop: ${missing.join(', ')}`);
});

test('every wire name has a render handler too', () => {
  const handled = new Set(handledEmitNames());
  const missing = [...WIRE_FX].filter((n) => !handled.has(n));
  assert.deepEqual(missing, [], `a LAN client could not render: ${missing.join(', ')}`);
});

test('an unknown name is recorded rather than swallowed', () => {
  const before = unhandledEmitted().length;
  applyEmitted([{ f: 'nosuchcosmetic', a: [] }]);
  const after = unhandledEmitted();
  assert.equal(after.length, before + 1);
  assert.ok(after.includes('nosuchcosmetic'));
});

test('applying a spawn really produces particles', () => {
  drainEmitted();
  particles.length = 0;
  emit('spawnParticles', 100, 100, '#fff', 7, 4);
  applyEmitted(drainEmitted());
  assert.equal(particles.length, 7, 'the whole chain emit -> drain -> apply did not draw');
  particles.length = 0;
});

test('a bespoke particle event carries its whole description', () => {
  drainEmitted();
  particles.length = 0;
  emit('particle', { kind: 'spark', x: 3, y: 4, vx: 0, vy: 0, life: 9, maxLife: 9, color: '#abc', r: 1 });
  applyEmitted(drainEmitted());
  assert.equal(particles.length, 1);
  assert.deepEqual({ ...particles[0] }, { kind: 'spark', x: 3, y: 4, vx: 0, vy: 0, life: 9, maxLife: 9, color: '#abc', r: 1 });
  particles.length = 0;
});

test('a bolt is a render effect, not a sim effect', () => {
  drainEmitted();
  clearFxEffects();
  emit('boltVisual', 0, 0, 100, 100, '#fff', 3, 500);
  applyEmitted(drainEmitted());
  assert.equal(fxEffects.length, 1);
  assert.equal(fxEffects[0].pts.length, 10, 'nine segments and a start point');
  clearFxEffects();
});

test('shake accumulates through the queue and clamps', () => {
  drainEmitted();
  setShake(0);
  for (let i = 0; i < 20; i++) emit('addShake', 5);
  applyEmitted(drainEmitted());
  assert.equal(shake, 26, 'twenty 5s should have piled up against the clamp');
  setShake(0);
});

// THE DUAL PATH. slowMo is the documented exception: it is pacing as well as
// spectacle, so src/sim/pace.js applies it locally AND emits it. Both halves
// are asserted here because deleting either is a real, shipped bug —
// emit-only leaves a headless host running at full speed while every client
// crawls; apply-only leaves every client at full speed while the host crawls.
test('slowMo applies locally and emits', () => {
  drainEmitted();
  slowMo(0.2, 500);
  assert.equal(paceScale(), 0.2, 'the local sim did not slow down');
  const events = drainEmitted();
  assert.deepEqual(events, [{ f: 'slowMo', a: [0.2, 500] }], 'the hitstop never reached the wire');
  // and applying the drained event again must NOT re-slow: the sim already did
  applyEmitted(events);
  assert.equal(paceScale(), 0.2);
  slowMo(BASE_PACE, 0);
  drainEmitted();
});

// ---- the wire half -------------------------------------------------------

function withSim(fn) {
  const log = [];
  const sim = createSim({ onFx: (f, a) => log.push({ f, a }) });
  try { return fn(sim.bridge, log); } finally { sim.destroy(); }
}

// THE TEN NAMES, LITERALLY. Every other test here derives its expectation from
// WIRE_FX, which makes them all tautological in the deletion direction: drop
// 'doFlash' from the list and the sender stops forwarding flashes, the receiver
// starts rejecting them, LAN clients go dark on every explosion — and nothing
// else in the suite notices, because everything else asks WIRE_FX what to
// expect. GAME_VERSION is frozen at 9, so this list is a wire-compatibility
// promise; it is written out here so breaking it costs a deliberate edit.
//
// These are exactly the ten the old server-side wrapper covered (the WRAPPED
// table it replaced) and exactly the ten src/net/client.js's FX_ALLOWED
// accepted. `sfx` rides the same channel but is handled separately at both
// ends, because its payload is a cue key rather than an argument list.
test('the wire carries exactly these ten cosmetic names', () => {
  assert.deepEqual([...WIRE_FX].sort(), [
    'addKillFeed', 'addShake', 'boltVisual', 'doFlash', 'setBanner',
    'slowMo', 'spawnBurst', 'spawnParticles', 'spawnRing', 'spawnText',
  ]);
});

// Ordering is the property wrapServerFx gave by construction — each wrapper
// broadcast as it was called — and the property a queue can lose. Cosmetics
// narrate a tick (the flash, then the ring, then the text) and a consumer
// handed them backwards draws the wrong story.
//
// This asserts it pairwise, on the BRIDGE, which is where the queue is turned
// back into a stream. The earlier version of this test only checked that a
// setBanner existed and that every name was a wire name; `flushFx` reversing
// its batch left it green.
test('the bridge forwards a tick\'s cosmetics in emission order', () => {
  withSim((bridge, log) => {
    bridge.addPlayer({ name: 'A' });
    bridge.addPlayer({ name: 'B' });
    bridge.start();
    for (let i = 0; i < 30; i++) bridge.stepSim();
    assert.ok(log.length > 0, 'a running match emitted no cosmetics at all');
    for (const e of log) assert.ok(e.f === 'sfx' || WIRE_FX.has(e.f), `${e.f} is not a wire name`);

    // three markers, queued in a known order, ahead of a tick that will emit
    // plenty of its own
    const mark = log.length;
    for (const n of ['ORDER-1', 'ORDER-2', 'ORDER-3']) emit('spawnText', 0, 0, n, '#fff');
    bridge.stepSim();
    const batch = log.slice(mark);
    assert.ok(batch.length >= 3, 'the markers never reached the wire');
    // they were queued first, so they must arrive first, in the order queued
    assert.deepEqual(batch.slice(0, 3).map((e) => e.a[2]), ['ORDER-1', 'ORDER-2', 'ORDER-3']);
  });
});

// Each of the ten wire names is one emitter in src/sim. Deleting the emit from
// any one of them is invisible everywhere else: the game keeps playing, the
// tape keeps matching (cosmetics no longer touch the round stream at all), and
// the only symptom is that one thing stops being drawn — on the couch and on
// every client at once. This is the test that fails for it.
test('a real match speaks the whole cosmetic vocabulary', () => {
  withSim((bridge, log) => {
    bridge.addPlayer({ name: 'A' });
    bridge.addPlayer({ name: 'B' });
    bridge.start();
    // Casting the whole book is what reaches all ten: nine of them fall out of
    // the spells themselves, and addKillFeed needs somebody to actually die.
    for (const id of Object.keys(SPELLS)) {
      bridge.debugCastSpell(0, id, 0);
      for (let t = 0; t < 4; t++) bridge.stepSim();
    }
    damagePlayer(players[1], 9999, players[0]);
    bridge.stepSim();
    const seen = new Set(log.map((e) => e.f));
    const missing = [...WIRE_FX, 'sfx'].filter((n) => !seen.has(n));
    assert.deepEqual(missing, [], `these cosmetics stopped being emitted: ${missing.join(', ')}`);
  });
});

test('local-only cosmetics never reach the wire', () => {
  withSim((bridge, log) => {
    bridge.addPlayer({ name: 'A' });
    bridge.start();
    emit('particle', { kind: 'square' });
    emit('clearParticles');
    emit('spawnRing', 1, 2, '#fff');
    bridge.stepSim();
    assert.deepEqual(log.filter((e) => e.f === 'particle' || e.f === 'clearParticles'), []);
    assert.ok(log.some((e) => e.f === 'spawnRing'), 'the allowlist rejected a name that belongs on the wire');
  });
});

test('the drain empties the queue every tick', () => {
  withSim((bridge) => {
    bridge.addPlayer({ name: 'A' });
    bridge.addPlayer({ name: 'B' });
    bridge.start();
    for (let i = 0; i < 120; i++) bridge.stepSim();
    // What wrapServerFx's undo protected against was a bridge that compounds.
    // The queue version's equivalent failure is a queue that never empties, so
    // this is the assertion that replaces it.
    assert.equal(bridge.audit().emitted, 0, 'the cosmetic queue is growing — the drain stopped');
  });
});

test('a second sim does not inherit the first sim\'s backlog, and does not double-forward', () => {
  const logA = [];
  const a = createSim({ onFx: (f, args) => logA.push({ f, a: args }) });
  a.bridge.addPlayer({ name: 'A' });
  a.bridge.start();
  emit('spawnRing', 0, 0, '#fff'); // queued, never drained
  a.destroy();

  const logB = [];
  const b = createSim({ onFx: (f, args) => logB.push({ f, a: args }) });
  b.bridge.addPlayer({ name: 'B' });
  b.bridge.start();
  b.bridge.stepSim();
  const before = logA.length;
  b.bridge.stepSim();
  b.destroy();

  assert.equal(logA.length, before, 'the dead sim is still being fed');
  // Every event the second sim forwarded appears exactly once. Under the old
  // monkeypatch this was the "wrapping the wrappers" hazard: a second install
  // over live wrappers broadcast each cosmetic twice, three times, n times.
  const banners = logB.filter((e) => e.f === 'setBanner');
  assert.ok(banners.length > 0, 'the second sim emitted nothing');
  const rounds = banners.filter((e) => String(e.a[0]).length > 0);
  assert.equal(rounds.length, banners.length);
  assert.ok(!logB.some((e, i) => i > 0 && e.f === logB[i - 1].f && JSON.stringify(e.a) === JSON.stringify(logB[i - 1].a) && e.f === 'setBanner'),
    'the same banner was forwarded twice in a row — the bridge is compounding');
});
