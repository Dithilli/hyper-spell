import { createHash } from 'node:crypto';

// A canonical, order-stable digest of the wire snapshot.
//
// The digest is derived from Object.keys(snap) rather than a hand-picked field
// list, so a field added to the snapshot by a later refactor is covered by the
// oracle automatically instead of silently escaping it. The only fields left out
// are the ones named below, and each exclusion is a deliberate, justified
// decision rather than an omission.

// Top-level snapshot keys excluded from the digest.
const IGNORED_SNAPSHOT_KEYS = new Set([
  // The constant string 'snap' that takeWireSnapshot stamps on every payload as
  // a wire routing tag (server/sim-bridge.js) — transport framing, not sim state.
  't',
  // GAME_VERSION. It moves on deliberate releases, not on refactors, so hashing
  // it would invalidate every golden file on an unrelated version bump.
  'v',
  // The server's wall clock at send time, stamped by takeWireSnapshot for the
  // client's playout buffer (src/net/client.js). It is the one field in the
  // payload deliberately NOT a function of sim state: it reads performance.now(),
  // so hashing it would make every tape non-reproducible by construction and the
  // goldens would differ on every run. Transport metadata in the same sense as
  // `t` — it describes the delivery, not the world. The guard in
  // test/harness-hash.test.js caught it the moment it appeared, which is the
  // ignore-list working rather than being worked around.
  'sv',
]);

// Per-body keys excluded from the digest.
const IGNORED_BODY_KEYS = new Set([
  // Matter assigns body ids from a global creation counter. A refactor may
  // legitimately construct bodies in a different order without the simulation
  // differing — the same reason the body list is sorted below rather than
  // trusted in iteration order.
  'id',
]);

// Numbers are rounded to 6 decimals so that formatting noise (e.g. -0 vs 0) does
// not produce false failures, while real drift still does.
const r6 = (n) => (Number.isFinite(n) ? Math.round(n * 1e6) / 1e6 : String(n));

// Rewrite into a form whose JSON encoding depends only on content, never on key
// insertion order: keys sorted, numbers rounded, absent values dropped.
function canonicalize(value) {
  if (typeof value === 'number') return r6(value);
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      if (value[key] === undefined) continue;
      out[key] = canonicalize(value[key]);
    }
    return out;
  }
  return value === undefined ? null : value;
}

// projectiles/summons/gibs are Sets, whose iteration order can legitimately
// differ after a refactor without the simulation differing. Sorting each body's
// full canonical encoding is a total order over the whole body, so two entries
// can only tie when they are byte-identical — in which case their relative order
// cannot change the digest. Sorting on a prefix of the fields would not be a
// total order: src/sim/snapshot.js rounds body x/y to integers, so several gibs from
// one explosion routinely share a position and would fall back to Set order.
function canonicalBodies(bodies) {
  return bodies
    .map((body) => {
      const kept = {};
      for (const key of Object.keys(body)) {
        if (!IGNORED_BODY_KEYS.has(key)) kept[key] = body[key];
      }
      return JSON.stringify(canonicalize(kept));
    })
    .sort();
}

// segs has the same problem bodies does, one layer down: src/sim/snapshot.js
// builds it by walking Composite.allConstraints, whose order is the order a map
// builder happened to add its planks and chains. Reordering two Composite.add
// calls changes nothing about the simulation, and until the tape reached a map
// with constraints at all this was unreachable — the three-round tape reaches
// them, so the trap is now live and is closed the same way: sort on the full
// canonical encoding, which is a total order (two segs can only tie when they
// are byte-identical, and then their order cannot move the digest). Nothing
// downstream cares either — a seg is drawn as a line, and the draw order of
// hairline segments is not sim state.
// Non-array input falls through to the generic path so that a perturbation test
// substituting a scalar still hashes rather than throwing.
const canonicalSegs = (segs) => (Array.isArray(segs)
  ? segs.map((s) => JSON.stringify(canonicalize(s))).sort()
  : canonicalize(segs));

export function hashSnapshot(snap) {
  const canonical = {};
  for (const key of Object.keys(snap).sort()) {
    if (IGNORED_SNAPSHOT_KEYS.has(key)) continue;
    if (key === 'bodies') canonical[key] = canonicalBodies(snap.bodies);
    else if (key === 'segs') canonical[key] = canonicalSegs(snap.segs);
    else canonical[key] = canonicalize(snap[key]);
  }
  return createHash('sha1').update(JSON.stringify(canonical)).digest('hex').slice(0, 16);
}
