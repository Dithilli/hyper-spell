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
