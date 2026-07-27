// spatial-queries.test.js — the simulation asks physics *where things are*
// instead of walking the world and guessing.
//
// Two families of defect live here:
//
//   B2/B9/B12  the stepping loops. groundYAt stepped y by 12 and raycastHit
//              stepped along the aim by 10, so an 8px ledge could fall entirely
//              between two samples and read as empty air. Both are single
//              segment queries now.
//   B11        a projectile spawned 28px along the aim with no check, so
//              casting into a wall put the ball inside the wall.
//
// And one hazard the conversion had to clear first: matter-js's own Query.ray
// documents that "intersection points are not provided". It reports contact
// SUPPORTS — vertices — so an unqualified `hit.point` is a *corner of the body*,
// or the body's centre when the support list is empty. Measured before the
// rewrite: a horizontal ray into a 40x400 wall whose near face is at x=380
// reported (420, 560), the far bottom corner, 205px from the truth; a ray down
// onto the full-width ground slab reported x=0 for a ray cast at x=300. A beam
// endpoint and a ground height are both *positions*, so the backend now computes
// the real segment/edge intersection and the tests below pin it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as phys from '../src/sim/phys/facade.js';
import { column, createWorld, destroyWorld } from '../src/sim/world.js';
import { groundYAt, raycastHit, shoot, projectiles } from '../src/sim/spells/core.js';

// a player-shaped stub: raycastHit and shoot read position, aimAngle and group
function stubPlayer(x, y, aimAngle = 0) {
  const body = phys.createCircle(x, y, 15, { density: 0.004, label: 'player' });
  phys.addBody(body);
  return { body, group: 0, aimAngle };
}

test('groundYAt finds an 8px-thick platform', () => {
  createWorld();
  // The old implementation stepped y by 12, so an 8px platform could fall
  // entirely between two samples and read as "no ground here".
  const thin = phys.createBox(640, 300, 300, 8, { isStatic: true });
  phys.addBody(thin);
  const y = groundYAt(640);
  assert.ok(Math.abs(y - 296) < 6, `expected the platform top (~296), got ${y}`);
  destroyWorld();
});

// The looser assertion above would also pass on a 12px stepping loop that
// happened to land inside the slab. This one would not: the top is at 301, which
// no multiple of 12 can reach, and it pins the exact surface rather than a
// neighbourhood of it.
test('groundYAt returns the platform top exactly, not a quantised sample', () => {
  createWorld();
  const slab = phys.createBox(640, 341, 400, 80, { isStatic: true }); // top = 301
  phys.addBody(slab);
  assert.equal(groundYAt(640), 301);
  destroyWorld();
});

test('a raycast hits a thin platform edge-on', () => {
  createWorld();
  const thin = phys.createBox(400, 500, 400, 10, { isStatic: true });
  phys.addBody(thin);
  const hit = phys.queryRay({ x: 220, y: 495 }, { x: 580, y: 495 });
  assert.ok(hit, 'a horizontal ray along a 10px platform must hit it');
  destroyWorld();
});

// The case above starts ON the platform's top edge, so it is answered by the
// "the segment begins inside this body" branch rather than by an edge crossing.
// This one starts in clear air 50px to the left, so only a real intersection can
// find it — and it pins where.
test('a raycast that starts in the open still enters a 10px platform', () => {
  createWorld();
  const thin = phys.createBox(400, 500, 400, 10, { isStatic: true }); // x 200..600, y 495..505
  phys.addBody(thin);
  const hit = phys.queryRay({ x: 150, y: 500 }, { x: 580, y: 500 });
  assert.ok(hit, 'a horizontal ray through a 10px platform must hit it');
  assert.equal(hit.point.x, 200, 'the left face');
  assert.equal(hit.point.y, 500);
  // not deepEqual/strictEqual against 0: flipping the normal to face the ray
  // negates a zero component into -0, which is the same number everywhere except
  // in an identity comparison
  assert.equal(hit.normal.x, -1, 'the normal faces back down the ray');
  assert.ok(Math.abs(hit.normal.y) === 0, `a vertical face has no vertical normal; got ${hit.normal.y}`);

  // and from the other side, to pin the sign convention rather than one number
  const back = phys.queryRay({ x: 650, y: 500 }, { x: 220, y: 500 });
  assert.equal(back.point.x, 600, 'the right face');
  assert.equal(back.normal.x, 1);
  destroyWorld();
});

// The three shapes the game actually casts rays at. Each one caught the old
// support-vertex approximation out; the numbers in the messages are what it
// returned.
test('queryRay reports where the segment meets the body, not a vertex of it', () => {
  createWorld();
  const wall = phys.createBox(400, 360, 40, 400, { isStatic: true }); // x 380..420, y 160..560
  phys.addBody(wall);
  const side = phys.queryRay({ x: 100, y: 360 }, { x: 900, y: 360 });
  assert.equal(side.body, wall);
  assert.equal(side.point.x, 380, 'the near face, not the far bottom corner (was 420)');
  assert.equal(side.point.y, 360, 'on the ray, not at the corner (was 560)');
  assert.ok(Math.abs(side.distance - 280) < 1e-9, `distance to the near face; got ${side.distance}`);
  destroyWorld();
});

test('queryRay does not fall back to the body centre when supports are empty', () => {
  createWorld();
  const ground = phys.createBox(640, 690, 1280, 40, { isStatic: true }); // top y = 670
  phys.addBody(ground);
  const down = phys.queryRay({ x: 300, y: 0 }, { x: 300, y: 720 });
  assert.equal(down.point.x, 300, 'a ray cast at x=300 cannot hit at some other x (was 0)');
  assert.equal(down.point.y, 670);
  destroyWorld();
});

test('queryRay hits a circle at its surface, on the ray', () => {
  createWorld();
  const ball = phys.createCircle(500, 300, 60, { isStatic: true });
  phys.addBody(ball);
  const hit = phys.queryRay({ x: 100, y: 300 }, { x: 900, y: 300 });
  assert.equal(hit.body, ball);
  assert.equal(hit.point.y, 300, 'the intersection is on the ray (was 360, the bottom of the hull)');
  // matter approximates a circle with a polygon, and the ray must agree with the
  // hull the engine actually collides against, so this is a near-radius bound
  assert.ok(Math.abs(hit.point.x - 440) < 2, `near face ~440, got ${hit.point.x}`);
  destroyWorld();
});

test('raycastHit stops at the surface it hit, not at a 10px sample inside it', () => {
  createWorld();
  const wall = phys.createBox(700, 300, 40, 400, { isStatic: true }); // near face x = 680
  phys.addBody(wall);
  const p = stubPlayer(300, 300);
  const { hit, pt } = raycastHit(p);
  assert.equal(hit, wall);
  assert.equal(pt.x, 680, 'the beam ends on the wall face');
  assert.equal(pt.y, 294, 'the muzzle is 6px above centre and the aim is flat');
  destroyWorld();
});

test('raycastHit still reaches its full 1400px when nothing is in the way', () => {
  createWorld();
  const p = stubPlayer(300, 300);
  const { hit, pt, from } = raycastHit(p);
  assert.equal(hit, null);
  assert.equal(pt.x, from.x + 1400);
  destroyWorld();
});

// B11. The muzzle sits 28px along the aim with no check, so casting with your
// back to a wall put the projectile inside it — where it either squeezed out
// sideways or never left at all.
test('a projectile fired into a wall spawns outside the wall', () => {
  createWorld();
  const wall = phys.createBox(430, 300, 40, 200, { isStatic: true }); // near face x = 410
  phys.addBody(wall);
  const p = stubPlayer(400, 300);
  const fb = shoot(p, { r: 5, speed: 20, color: '#fff' });
  assert.ok(fb.position.x < 410, `the 28px muzzle offset lands at 428, inside the wall; got ${fb.position.x}`);
  assert.ok(fb.position.x > 380, `and must not be flung backwards; got ${fb.position.x}`);
  projectiles.delete(fb);
  destroyWorld();
});

test('an unobstructed cast still uses the full muzzle offset', () => {
  createWorld();
  const p = stubPlayer(400, 300);
  const fb = shoot(p, { r: 5, speed: 20, color: '#fff' });
  assert.equal(fb.position.x, 428);
  assert.equal(fb.position.y, 294);
  projectiles.delete(fb);
  destroyWorld();
});

// Compound bodies collide through their parts, never through the parent hull
// matter auto-fits around them, so segmentHit skips parts[0]. Nothing in
// src/sim builds a compound today, which is exactly why this needs pinning:
// without it, a ray through the GAP between two parts reports a hit on the hull
// that spans them. Assembled from facade boxes rather than Body.setParts,
// because test/module-boundaries.test.js bans Matter namespaces in test/ too.
test('a ray through the gap in a compound body misses it', () => {
  createWorld();
  const left = phys.createBox(200, 300, 80, 80, { isStatic: true });   // x 160..240
  const right = phys.createBox(600, 300, 80, 80, { isStatic: true });  // x 560..640
  const hull = phys.createBox(400, 300, 480, 80, { isStatic: true });  // x 160..640 — spans the gap
  const compound = { type: 'body', parts: [hull, left, right], bounds: hull.bounds };
  compound.parent = compound;              // matter refuses to add a body that is someone's part
  for (const part of compound.parts) part.parent = compound;
  const composite = phys.createComposite();
  phys.addTo(composite, compound);
  assert.equal(phys.allBodies(composite).length, 1, 'the compound really is in the world');

  // straight down the gap at x = 400: inside the hull, outside both parts
  const gap = phys.queryRay({ x: 400, y: 100 }, { x: 400, y: 500 }, { container: composite });
  assert.equal(gap, null, 'the parent hull is not a collidable outline');
  // and the parts themselves are still found
  const onPart = phys.queryRay({ x: 200, y: 100 }, { x: 200, y: 500 }, { container: composite });
  assert.equal(onPart.body, compound, 'the hit is reported as the compound, not the part');
  assert.equal(onPart.point.y, 260, 'the top of the left part');
  destroyWorld();
});

// column() is unbounded in y on purpose. The loops it replaced — updraft,
// tornado, firestorm — tested x alone and had no y bound at all, so clipping the
// column to 0..H would silently drop a crate lobbed over the ceiling and break
// the equivalence the whole conversion rests on.
test('column() reaches above the ceiling and below the floor', () => {
  createWorld();
  const high = phys.createBox(640, -200, 40, 40, {});  // well above y = 0
  const low = phys.createBox(640, 900, 40, 40, {});    // well below y = H
  const aside = phys.createBox(300, 300, 40, 40, {});
  for (const b of [high, low, aside]) phys.addBody(b);
  const found = phys.queryRegion(column(600, 680));
  assert.ok(found.includes(high), 'a body lobbed over the ceiling is still in the column');
  assert.ok(found.includes(low), 'and one below the floor');
  assert.ok(!found.includes(aside), 'but not one in a different column');
  destroyWorld();
});

// The Disintegrate/Railgun beams are the only queryCapsule callers, and neither
// tape casts them — quartering the half-width leaves the whole suite green
// otherwise. Their 26 and 28 are declared numbers, so the half-width has to be
// pinned somewhere. test/facade.test.js only puts its body exactly ON the
// segment, where any half-width matches; these two sit either side of the rim.
test('queryCapsule takes the half-width it is given, on both sides of the rim', () => {
  createWorld();
  const inside = phys.createCircle(400, 275, 4, { density: 0.004 });   // 25px off the line
  const outside = phys.createCircle(500, 273, 4, { density: 0.004 });  // 27px off the line
  const behind = phys.createCircle(100, 300, 4, { density: 0.004 });   // on the line, before the muzzle
  const past = phys.createCircle(900, 300, 4, { density: 0.004 });     // on the line, past the tip
  for (const b of [inside, outside, behind, past]) phys.addBody(b);
  // Disintegrate's beam: a 500px segment from (200,300) with a 26px half-width
  const found = phys.queryCapsule({ x: 200, y: 300 }, { x: 700, y: 300 }, 26);
  assert.deepEqual(found, [inside], `expected only the 25px-off body; got ${found.length}`);
  destroyWorld();
});

// Two process-global counters inside matter-js sit behind Query.ray, because it
// builds a throwaway Bodies.rectangle for every cast. Rays now run every tick
// for every beam and every ground probe, so both would move far faster than
// before. The seed one is already pinned in test/facade.test.js; the id counter
// is not pinned anywhere, and the tape hash deliberately ignores `id`, so
// nothing else in the suite can see it drift.
test('casting rays allocates no bodies — the id counter does not move', () => {
  createWorld();
  const wall = phys.createBox(400, 360, 40, 400, { isStatic: true });
  phys.addBody(wall);
  const before = phys.createCircle(0, 0, 5, {});
  for (let i = 0; i < 100; i++) {
    phys.queryRay({ x: 100, y: 360 }, { x: 900, y: 360 });
    phys.queryRay({ x: 0, y: 0 }, { x: 1280, y: 720 });
  }
  const after = phys.createCircle(0, 0, 5, {});
  assert.equal(after.id - before.id, 1, `200 rays allocated ${after.id - before.id - 1} bodies`);
  destroyWorld();
});

test('casting rays does not move the physics RNG under tick-rate volume', () => {
  createWorld();
  const wall = phys.createBox(400, 360, 40, 400, { isStatic: true });
  phys.addBody(wall);
  const seed = phys.physRandomSeed();
  for (let i = 0; i < 500; i++) phys.queryRay({ x: 100, y: 360 }, { x: 900, y: 360 });
  assert.equal(phys.physRandomSeed(), seed);
  destroyWorld();
});
