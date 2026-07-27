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

const { Bounds, Common, Engine, Bodies, Body, Composite, Constraint, Events, Query, Vector, Vertices } = Matter;

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
//
// READ THIS BEFORE WRITING A SECOND BACKEND. matter-js does NOT store the
// vector you hand it. Body.setVelocity is Verlet: it writes
// `positionPrev = position - v * timeScale` and then reads the velocity back
// out as `(position - positionPrev) / timeScale`. Subtracting a ~1e1 velocity
// from a ~1e3 arena coordinate and adding it back loses low bits, so the value
// the body ends up with differs from `v` in **99.7% of writes** (measured over
// 100k writes at realistic arena positions: mean absolute error 3.2e-14, max
// 1.1e-13).
//
// The golden tape therefore encodes matter's position round-trip, not the
// velocities this simulation asks for. A planck backend implementing this as
// `setLinearVelocity(v)` — the CORRECT implementation — stores the exact vector
// and so diverges from the tape immediately, at every one of the 107 velocity
// writes. Bit-exact A/B parity through this operation is probably not
// attainable; see the "first-order hazard" section of
// docs/superpowers/plans/velocity-classification.md.
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

// matter-js bodies are static or dynamic; there is no kinematic type. planck
// has a real one, so silently mapping 'kinematic' onto dynamic would make the
// two backends disagree the first time anyone used it, in a way nothing would
// catch. Refuse instead. (The game's moving platforms are static bodies driven
// by setPosition, which is the kinematic behaviour without the type.)
export function setType(b, type) {
  if (type === 'kinematic') {
    throw new Error("setType: matter-js has no kinematic body type. Drive a static body with setPosition, or add real support to both backends.");
  }
  Body.setStatic(b, type === 'static');
}

// Infinite inertia pins the body upright.
//
// Releasing it restores the inertia the body had when it was pinned, stashed
// here — matter-js does not keep one, and it cannot be recomputed after the
// fact. `Vertices.inertia(b.vertices, b.mass)` LOOKS like the recomputation and
// is not: matter measures inertia from centroid-relative vertices and then
// multiplies by Body._inertiaScale (4), while b.vertices are world-space. That
// gives 0.25x the true value at the origin and 455x at (900, 400) — an error
// that grows with how far the body has walked from (0,0), which is the most
// treacherous shape a wrong number can have.
//
// A body released without ever having been pinned has nothing to restore, so
// this leaves it alone rather than inventing a figure.
export function setFixedRotation(b, on) {
  if (on) {
    if (b.__inertiaBeforePin === undefined) b.__inertiaBeforePin = b.inertia;
    Body.setInertia(b, Infinity);
  } else if (b.__inertiaBeforePin !== undefined) {
    Body.setInertia(b, b.__inertiaBeforePin);
    b.__inertiaBeforePin = undefined;
  }
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

// PER-BODY, and not a matter-js property: 0.19 has no per-body gravity scale,
// so `gravityScale` is a tag this game invented and src/sim/tick.js reads back
// to apply a counter-force by hand. Declared because planck has the real thing
// and phase 2 should route through one name — but the 5 sites that tag a
// projectile still assign `fb.gravityScale` directly, because today that is
// gameplay bookkeeping and routing it through physics would be a lie.
//
// Named setBodyGravityScale, not setGravityScale, so it cannot be mistaken for
// a pair with worldGravityScale() below — that one reads the WORLD's
// gravity.scale and has nothing to do with this.
export function setBodyGravityScale(b, s) { b.gravityScale = s; }

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
// The WORLD's gravity scale (matter's engine.gravity.scale), not a body's.
export function worldGravityScale() { return engine.gravity.scale; }

// ------------------------------------------------------------------ queries
//
// Every query takes the same options object: `filter`, a predicate the backend
// applies while it searches, and `container`, a composite to search instead of
// the whole world (maps own one, so "is there a platform here?" can be asked of
// the map rather than of every gib in flight).
//
// There is deliberately NO option to hand in a pre-filtered array of bodies.
// That is the one shape that cannot survive a backend swap: a planck backend
// answers these out of its broadphase tree, and a caller-supplied list is a
// list the tree has never heard of, so honouring it would mean falling back to
// a linear scan — the very thing these operations exist to replace.

// A real segment test, not a stepping loop: an 8px platform between two
// samples is a hit, not a miss. And a real INTERSECTION: `point` is where the
// segment crosses the body's outline.
//
// THIS DOES NOT USE Matter.Query.ray, and the three reasons are all load-bearing.
//
// 1. Query.ray does not compute intersections. Matter's own docs say so —
//    "Intersection points are not provided". It runs SAT between the body and a
//    throwaway 1e-100-wide rectangle and hands back the contact SUPPORTS, which
//    are VERTICES. Reading a hit position out of them yields a corner of the
//    body, or the body's centre when the support list comes back empty.
//    Measured against the shapes this game actually casts at: a horizontal ray
//    into a 40x400 wall whose near face is at x=380 reported (420, 560) — the
//    far bottom corner, 205px away; a ray straight down at x=300 onto the
//    full-width ground slab reported x=0. `point` feeds beam endpoints and
//    ground heights, so both were unusable.
// 2. Bodies.rectangle draws a default fillStyle off Common._seed for every
//    non-static body (see resetPhysRandom above), so an unguarded Query.ray
//    moved the RNG the simulation is seeded on. That needed a save/restore.
// 3. Bodies.rectangle also burns a Common._nextId. Body ids ride the wire
//    (src/sim/snapshot.js), and rays now run every tick, so the counter would
//    have raced ahead by thousands per round.
//
// Doing the geometry here retires all three: the coarse pass is a pure AABB
// overlap, the fine pass is segment-vs-edge, and nothing is allocated in the
// engine at all. test/spatial-queries.test.js pins each one.
export function queryRay(from, to, opts = {}) {
  const bodies = allBodies(opts.container);
  const dx = to.x - from.x, dy = to.y - from.y;
  const span = {
    min: { x: Math.min(from.x, to.x), y: Math.min(from.y, to.y) },
    max: { x: Math.max(from.x, to.x), y: Math.max(from.y, to.y) },
  };
  let best = null;
  for (const body of bodies) {
    if (opts.filter && !opts.filter(body)) continue;
    if (!Bounds.overlaps(body.bounds, span)) continue;
    const h = segmentHit(body, from, dx, dy, span);
    if (h && (best === null || h.t < best.t)) best = h;
  }
  if (!best) return null;
  return {
    body: best.body,
    point: { x: from.x + dx * best.t, y: from.y + dy * best.t },
    normal: best.normal,
    distance: best.t * Math.hypot(dx, dy),
  };
}

// Nearest crossing of the segment from + t*(dx, dy), t in [0, 1], with the
// outline of `body`, as the parameter t. Compound bodies collide through their
// parts, not through the parent's hull, so parts[0] is skipped exactly as
// matter's own broadphase skips it. A segment that STARTS inside the body
// reports t = 0: the old stepping loop found such a body at its very first
// sample, and a beam must not shoot out through the far wall of the thing it is
// already buried in.
function segmentHit(body, from, dx, dy, span) {
  const parts = body.parts;
  let t = Infinity, normal = null;
  for (let i = parts.length > 1 ? 1 : 0; i < parts.length; i++) {
    const part = parts[i];
    if (!Bounds.overlaps(part.bounds, span)) continue;
    if (Vertices.contains(part.vertices, from)) return { body, t: 0, normal: { x: 0, y: 0 } };
    const vs = part.vertices;
    for (let j = 0; j < vs.length; j++) {
      const a = vs[j], b = vs[(j + 1) % vs.length];
      const ex = b.x - a.x, ey = b.y - a.y;
      const den = dx * ey - dy * ex;
      if (den === 0) continue; // parallel to this edge
      const wx = a.x - from.x, wy = a.y - from.y;
      const ts = (wx * ey - wy * ex) / den;
      if (ts < 0 || ts > 1 || ts >= t) continue;
      const u = (dy * wx - dx * wy) / den;
      if (u < 0 || u > 1) continue; // crossing is off the end of the edge
      t = ts;
      const len = Math.hypot(ex, ey) || 1;
      let nx = ey / len, ny = -ex / len;
      // Face the incoming segment. A GUARD, not a correction: matter winds its
      // vertices so this already points outward for every body the game builds,
      // and no test can reach the flip today. It stays because the sign of a
      // normal is a contract of this operation and winding is not a contract of
      // whatever builds the vertices — Bodies.fromVertices decomposing a concave
      // outline, or a second backend, need not agree.
      if (nx * dx + ny * dy > 0) { nx = -nx; ny = -ny; }
      normal = { x: nx, y: ny };
    }
  }
  return t === Infinity ? null : { body, t, normal };
}

export function queryRegion(aabb, opts = {}) {
  const bodies = allBodies(opts.container);
  const found = Query.region(bodies, aabb);
  return opts.filter ? found.filter(opts.filter) : found;
}

export function queryPoint(pt, opts = {}) {
  const bodies = allBodies(opts.container);
  const found = Query.point(bodies, pt);
  return opts.filter ? found.filter(opts.filter) : found;
}

export function queryRadius(center, r, opts = {}) {
  const bodies = allBodies(opts.container);
  const out = [];
  for (const b of bodies) {
    if (opts.filter && !opts.filter(b)) continue;
    if (Math.hypot(b.position.x - center.x, b.position.y - center.y) <= r) out.push(b);
  }
  return out;
}

// Bodies whose centre lies within halfWidth of the segment from→to.
export function queryCapsule(from, to, halfWidth, opts = {}) {
  const bodies = allBodies(opts.container);
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
