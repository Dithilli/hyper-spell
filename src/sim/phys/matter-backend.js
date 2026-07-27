// matter-backend.js — the matter-js implementation of the physics facade.
//
// THIS IS THE ONLY MODULE IN THE PROJECT THAT IMPORTS matter-js.
// test/module-boundaries.test.js enforces that. Everything else in src/sim
// talks to physics through src/sim/phys/facade.js, which is what lets phase 2
// drop a planck.js backend in beside this one and A/B the two for parity
// instead of rewriting twenty files again.
//
// A "body handle" is, for this backend, a matter-js body. Callers still read
// b.position / b.velocity / b.label and hang gameplay properties off it; the
// facade owns the *operations*, not the representation. A planck backend will
// need a handle object that presents the same readable surface.
import Matter from 'matter-js';

const { Common, Engine, Bodies, Body, Composite, Constraint, Events, Query, Vector, Vertices } = Matter;

let engine = null;
let root = null;

// ---------------------------------------------------------------- lifecycle

export function createEngine() {
  resetPhysRandom();
  engine = Engine.create();
  root = engine.world;
  return engine;
}

export function destroyEngine() {
  if (engine) {
    Composite.clear(root, false);
    Engine.clear(engine);
  }
  engine = null;
  root = null;
}

// matter-js keeps ONE process-global RNG, Common._seed, and Body.create draws
// from it for every non-static body: `Common.choose([...])` picks a default
// fillStyle before the caller's colour (if any) overrides it. So the stream
// advances once per body created anywhere in the process, forever, and a body
// we DON'T colour — a Crate Drop crate is the live example — takes whatever
// that stream happens to be on. That made the wire colour of such a body a
// function of how much simulation had already run in the process: a second
// createSim() reproduced its predecessor's positions exactly and disagreed on
// the colour. Resetting it on every createEngine() is the same contract as
// world.js's reset hooks — a rebuilt world starts where the first one did —
// and it is the last piece of the sim's randomness that the seed did not reach
// (see src/sim/rng.js). test/determinism.test.js guards it.
export function resetPhysRandom() { Common._seed = 0; }
export function physRandomSeed() { return Common._seed; }

// -------------------------------------------------------------- body making

export function createCircle(x, y, r, opts) { return Bodies.circle(x, y, r, opts); }
export function createBox(x, y, w, h, opts) { return Bodies.rectangle(x, y, w, h, opts); }
export function createPolygon(x, y, sides, r, opts) { return Bodies.polygon(x, y, sides, r, opts); }

// A fresh negative collision-filter group: bodies sharing it never collide.
export function newCollisionGroup() { return Body.nextGroup(true); }

// --------------------------------------------------------------- membership

export function addBody(b) { Composite.add(root, b); }
export function removeBody(b, deep = false) { Composite.remove(root, b, deep); }

// Container-scoped forms. Maps own a composite of their own so a round can be
// torn down in one call, so "the world" is not the only container in play.
export function createComposite() { return Composite.create(); }
export function addTo(container, item) { Composite.add(container, item); }
export function removeFrom(container, item, deep = false) { Composite.remove(container, item, deep); }

export function allBodies(container = root) { return Composite.allBodies(container); }
export function allJoints(container = root) { return Composite.allConstraints(container); }
export function bodyById(id, container = root) { return Composite.get(container, id, 'body'); }

// ------------------------------------------------------------- body writes

export function setPosition(b, p) { Body.setPosition(b, p); }
export function setAngle(b, a) { Body.setAngle(b, a); }
export function setAngularVelocity(b, w) { Body.setAngularVelocity(b, w); }

// Authoritative override: the body's previous velocity is discarded. Spawns,
// launches, teleports and resets.
export function setVelocity(b, v) { Body.setVelocity(b, v); }

// GAMEPLAY PUSH. Mass-independent BY DESIGN — see spec §5.3. A Gust shoves an
// anvil (density 0.02), a grand piano (0.018) and a wizard (0.004) with equal
// authority, because that is what makes a chaotic brawler readable. Do not
// "correct" this into applyImpulse; doing so silently rebalances ~70 spells.
// Every site is classified in docs/superpowers/plans/velocity-classification.md.
export function addVelocity(b, dv) {
  Body.setVelocity(b, { x: b.velocity.x + dv.x, y: b.velocity.y + dv.y });
}

// The physical operation, kept available and kept distinct.
export function applyImpulse(b, j) {
  Body.setVelocity(b, { x: b.velocity.x + j.x / b.mass, y: b.velocity.y + j.y / b.mass });
}

export function applyForce(b, at, f) { Body.applyForce(b, at, f); }

export function setType(b, type) { Body.setStatic(b, type === 'static'); }
// Infinite inertia pins the body upright. Turning it back off recomputes the
// real inertia from the body's own vertices rather than guessing a number —
// matter-js does not keep the original, and a plausible-looking fudge here
// would be a silently wrong body.
export function setFixedRotation(b, on) {
  Body.setInertia(b, on ? Infinity : Vertices.inertia(b.vertices, b.mass));
}
// Material and filter writes. Trivial here because a matter-js body IS the
// handle, but they are operations rather than field pokes on purpose: a planck
// handle has no `frictionAir`, and the 22 call sites that used to assign these
// directly would have been 22 things the backend swap silently missed.
export function setFrictionAir(b, v) { b.frictionAir = v; }
export function setFriction(b, v) { b.friction = v; }
export function setRestitution(b, v) { b.restitution = v; }
export function setFixtureEnabled(b, on) { b.isSensor = !on; }
export function setFilter(b, filter) { Object.assign(b.collisionFilter, filter); }

// NOT a matter-js property: 0.19 has no per-body gravity scale, so `gravityScale`
// is a tag this game invented and src/sim/tick.js reads back to apply a
// counter-force by hand. It is declared here because a planck backend has the
// real thing and phase 2 should route through one name — but the ~8 sites that
// tag a projectile still assign `fb.gravityScale` directly, because today that
// is gameplay bookkeeping and routing it through physics would be a lie.
export function setGravityScale(b, s) { b.gravityScale = s; }

// Relative scale, applied cumulatively — matter-js's own Body.scale semantics.
// Prefer rescaleBody(): repeated Body.scale drifts vertices and mass (defect
// B5). This exists because three call sites are load-bearing on the drifting
// behaviour today and task 8 is a pure refactor.
export function scaleBody(b, sx, sy) { Body.scale(b, sx, sy); }

// Absolute, never cumulative — Body.scale applied repeatedly drifts vertices
// and mass (defect B5). Rebuild from the body's canonical scale.
export function rescaleBody(b, targetScale) {
  const from = b.__scale ?? 1;
  if (Math.abs(targetScale - from) < 1e-9) return;
  Body.scale(b, targetScale / from, targetScale / from);
  b.__scale = targetScale;
}

// ------------------------------------------------------------------ gravity

export function setGravity(v) {
  if (v.x !== undefined) engine.gravity.x = v.x;
  if (v.y !== undefined) engine.gravity.y = v.y;
  if (v.scale !== undefined) engine.gravity.scale = v.scale;
}
export function setGravityY(y) { engine.gravity.y = y; }
export function gravityY() { return engine.gravity.y; }
export function gravityScale() { return engine.gravity.scale; }

// ------------------------------------------------------------------ queries

// A real segment test, not a stepping loop: an 8px platform between two
// samples is a hit, not a miss.
//
// matter-js builds a throwaway rectangle body for the ray, and Body.create
// draws a default fillStyle off Common._seed for every non-static body (see
// resetPhysRandom above). A query must not move the RNG the simulation is
// seeded on, so the seed is saved and restored around the call.
export function queryRay(from, to, opts = {}) {
  const bodies = opts.bodies ?? allBodies();
  const seed = Common._seed;
  let hits;
  try {
    hits = Query.ray(bodies, from, to, opts.width ?? 1e-100);
  } finally {
    Common._seed = seed;
  }
  let best = null, bestD = Infinity;
  for (const c of hits) {
    const body = c.body ?? c.bodyA;
    if (opts.filter && !opts.filter(body)) continue;
    const point = nearestSupport(c, from) ?? body.position;
    const d = Math.hypot(point.x - from.x, point.y - from.y);
    if (d < bestD) { bestD = d; best = { body, point, normal: c.normal ?? { x: 0, y: 0 }, distance: d }; }
  }
  return best;
}

function nearestSupport(collision, from) {
  let best = null, bestD = Infinity;
  for (const s of collision.supports ?? []) {
    const d = Math.hypot(s.x - from.x, s.y - from.y);
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
}

export function queryRegion(aabb, opts = {}) {
  const bodies = opts.bodies ?? allBodies();
  const found = Query.region(bodies, aabb);
  return opts.filter ? found.filter(opts.filter) : found;
}

export function queryPoint(pt, opts = {}) {
  const bodies = opts.bodies ?? allBodies();
  const found = Query.point(bodies, pt);
  return opts.filter ? found.filter(opts.filter) : found;
}

export function queryRadius(center, r, opts = {}) {
  const bodies = opts.bodies ?? allBodies();
  const out = [];
  for (const b of bodies) {
    if (opts.filter && !opts.filter(b)) continue;
    if (Math.hypot(b.position.x - center.x, b.position.y - center.y) <= r) out.push(b);
  }
  return out;
}

// Bodies whose centre lies within halfWidth of the segment from→to.
export function queryCapsule(from, to, halfWidth, opts = {}) {
  const bodies = opts.bodies ?? allBodies();
  const dx = to.x - from.x, dy = to.y - from.y;
  const len2 = dx * dx + dy * dy;
  const out = [];
  for (const b of bodies) {
    if (opts.filter && !opts.filter(b)) continue;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((b.position.x - from.x) * dx + (b.position.y - from.y) * dy) / len2));
    const px = from.x + t * dx, py = from.y + t * dy;
    if (Math.hypot(b.position.x - px, b.position.y - py) <= halfWidth) out.push(b);
  }
  return out;
}

// ------------------------------------------------------------------- joints

export function createJoint(desc) { return Constraint.create(desc); }
export function removeJoint(j, container = root) { Composite.remove(container, j); }

// The two world-space endpoints of a joint, for drawing and for snapshots.
export function jointEnds(c) {
  const a = c.bodyA ? Vector.add(c.bodyA.position, Vector.rotate(c.pointA, c.bodyA.angle)) : c.pointA;
  const b = c.bodyB ? Vector.add(c.bodyB.position, Vector.rotate(c.pointB, c.bodyB.angle)) : c.pointB;
  return [a, b];
}

// ------------------------------------------------------------ step, contacts

export function physStep(dtMs) { Engine.update(engine, dtMs); }

// One contact callback per engine. The handler is called with the raw pair
// list; a pair is { bodyA, bodyB }.
export function onContact(handler) {
  Events.on(engine, 'collisionStart', (e) => handler(e.pairs));
}

// ------------------------------------------------------------------ readers
//
// Tasks 8, 9 and 12 assert against these, so they are part of the contract,
// not conveniences.

export function positionOf(b) { return b.position; }
export function velocityOf(b) { return b.velocity; }
export function angleOf(b) { return b.angle; }
export function angularVelocityOf(b) { return b.angularVelocity; }
export function massOf(b) { return b.mass; }

export function radiusOf(b) {
  if (b.circleRadius) return b.circleRadius;
  let max = 0;
  for (const v of b.vertices) max = Math.max(max, Math.hypot(v.x - b.position.x, v.y - b.position.y));
  return max;
}
