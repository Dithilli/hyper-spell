import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as phys from '../src/sim/phys/facade.js';
import { createWorld, destroyWorld } from '../src/sim/world.js';

test('addVelocity is mass-independent — the design language of ~70 spell pushes', () => {
  createWorld();
  const light = phys.createCircle(100, 100, 10, { density: 0.004 });
  const heavy = phys.createCircle(200, 100, 10, { density: 0.02 });
  phys.addBody(light); phys.addBody(heavy);
  phys.addVelocity(light, { x: 10, y: 0 });
  phys.addVelocity(heavy, { x: 10, y: 0 });
  assert.equal(phys.velocityOf(light).x, phys.velocityOf(heavy).x, 'a Gust shoves an anvil like a wizard');
  destroyWorld();
});

test('applyImpulse IS mass-scaled — the physical operation, kept distinct', () => {
  createWorld();
  const light = phys.createCircle(100, 100, 10, { density: 0.004 });
  const heavy = phys.createCircle(200, 100, 10, { density: 0.02 });
  phys.addBody(light); phys.addBody(heavy);
  phys.applyImpulse(light, { x: 1, y: 0 });
  phys.applyImpulse(heavy, { x: 1, y: 0 });
  assert.ok(phys.velocityOf(light).x > phys.velocityOf(heavy).x, 'mass matters for a true impulse');
  destroyWorld();
});

test('queryRay finds a thin platform a 10px stepping loop would miss', () => {
  createWorld();
  const thin = phys.createBox(300, 400, 200, 8, { isStatic: true });
  phys.addBody(thin);
  const hit = phys.queryRay({ x: 300, y: 100 }, { x: 300, y: 700 });
  assert.ok(hit, 'an 8px platform must be hit');
  assert.equal(hit.body, thin);
  destroyWorld();
});

test('rescaleBody is absolute, not cumulative', () => {
  createWorld();
  const b = phys.createCircle(100, 100, 15, { density: 0.004 });
  phys.addBody(b);
  for (let i = 0; i < 50; i++) { phys.rescaleBody(b, 2); phys.rescaleBody(b, 1); }
  assert.ok(Math.abs(phys.radiusOf(b) - 15) < 1e-9, `50 grow/shrink cycles must not drift: ${phys.radiusOf(b)}`);
  destroyWorld();
});

// The facade owns the reset of matter-js's process-global RNG (task 6 found
// that Body.create draws from it for every non-static body, which made an
// uncoloured body's wire colour a function of process history). The query
// operations must not move that stream either: Query.ray builds a throwaway
// body internally, so an unguarded queryRay would advance the seed and make
// the simulation's randomness a function of how many rays were cast.
test('a query does not move the physics RNG the sim is seeded on', () => {
  createWorld();
  const b = phys.createBox(300, 400, 200, 8, { isStatic: true });
  phys.addBody(b);
  const before = phys.physRandomSeed();
  phys.queryRay({ x: 300, y: 100 }, { x: 300, y: 700 });
  phys.queryRay({ x: 0, y: 0 }, { x: 640, y: 400 });
  assert.equal(phys.physRandomSeed(), before, "casting a ray must not advance matter-js's own RNG");
  destroyWorld();
});

// queryRegion/queryRadius/queryCapsule are part of the declared contract from
// day one because tasks 9 and 12 assert against them; a signature that has
// never been executed is a signature that is wrong.
test('the region, radius and capsule queries agree about a body in front of them', () => {
  createWorld();
  const near = phys.createCircle(100, 100, 10, { density: 0.004 });
  const far = phys.createCircle(600, 600, 10, { density: 0.004 });
  phys.addBody(near); phys.addBody(far);

  const region = phys.queryRegion({ min: { x: 50, y: 50 }, max: { x: 200, y: 200 } });
  assert.deepEqual(region, [near]);
  assert.deepEqual(phys.queryRadius({ x: 100, y: 100 }, 40), [near]);
  assert.deepEqual(phys.queryCapsule({ x: 0, y: 100 }, { x: 200, y: 100 }, 20), [near]);
  assert.deepEqual(phys.queryPoint({ x: 100, y: 100 }), [near]);
  destroyWorld();
});

// setFixedRotation(b, false) had no caller and a wrong implementation: it
// recomputed inertia with Vertices.inertia over WORLD-space vertices and
// without matter's _inertiaScale, which is 0.25x the truth at the origin and
// 455x at (900, 400) — an error that grows with distance from (0,0), so it
// would have looked fine in any test written near the origin. Hence the two
// positions here.
test('setFixedRotation restores the inertia it pinned, wherever the body is', () => {
  createWorld();
  for (const [x, y] of [[0, 0], [900, 400]]) {
    const b = phys.createBox(x, y, 40, 40, { density: 0.004 });
    phys.addBody(b);
    const before = b.inertia;
    phys.setFixedRotation(b, true);
    assert.equal(b.inertia, Infinity, 'pinning must stop rotation dead');
    phys.setFixedRotation(b, false);
    assert.equal(b.inertia, before, `released inertia must be the pinned one at (${x}, ${y})`);
  }
  destroyWorld();
});

test('releasing a body that was never pinned invents nothing', () => {
  createWorld();
  const b = phys.createBox(900, 400, 40, 40, { density: 0.004 });
  phys.addBody(b);
  const before = b.inertia;
  phys.setFixedRotation(b, false);
  assert.equal(b.inertia, before);
  destroyWorld();
});

// matter-js has static and dynamic; planck has a real kinematic type. Mapping
// 'kinematic' onto dynamic here would make the two backends disagree the first
// time anyone used it, silently.
test('setType refuses kinematic rather than pretending', () => {
  createWorld();
  const b = phys.createBox(100, 100, 20, 20, {});
  phys.addBody(b);
  phys.setType(b, 'static');
  assert.equal(b.isStatic, true);
  phys.setType(b, 'dynamic');
  assert.equal(b.isStatic, false);
  assert.throws(() => phys.setType(b, 'kinematic'), /no kinematic body type/);
  destroyWorld();
});

// The tape encodes matter's Verlet round-trip, not the velocities the game asks
// for: Body.setVelocity stores positionPrev = position - v and reads v back out
// as a subtraction, which loses low bits at arena-scale coordinates. A second
// backend that stores the exact vector is MORE correct and diverges everywhere.
// Pinned here so that fact is executable rather than folklore.
test('setVelocity does not store the vector it is given — the parity hazard', () => {
  createWorld();
  const b = phys.createCircle(0, 0, 15, { density: 0.004 });
  phys.addBody(b);
  // mulberry32, deterministic — but drawn twice per number to fill all 53
  // mantissa bits. That detail is the test: a 32-bit-derived value has no low
  // bits to lose and round-trips exactly, so a lazier generator would report
  // 0% and hide the hazard entirely. Real velocities are the end of long
  // arithmetic chains and carry full precision.
  let a = 0x9e3779b9;
  const u32 = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  };
  const rnd = () => ((u32() >>> 5) * 2 ** 26 + (u32() >>> 6)) / 2 ** 53;
  let inexact = 0;
  const N = 2000;
  for (let i = 0; i < N; i++) {
    const v = { x: (rnd() - 0.5) * 30, y: (rnd() - 0.5) * 30 };
    phys.setPosition(b, { x: rnd() * 1280, y: rnd() * 720 });
    phys.setVelocity(b, v);
    if (phys.velocityOf(b).x !== v.x || phys.velocityOf(b).y !== v.y) inexact++;
  }
  // measured at 99.7% over 100k writes; the floor is well clear of the 0% a
  // backend that stores the vector exactly would produce
  assert.ok(inexact / N > 0.9,
    `matter round-trips velocity through positionPrev; expected nearly all writes inexact, saw ${inexact}/${N}`);
  destroyWorld();
});
