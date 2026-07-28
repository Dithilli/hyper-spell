// Guards the two properties test/harness/hash.js exists to provide. The golden
// tape test cannot guard them: if the digest quietly stopped covering a field,
// the tape would still replay to itself, and re-recording would bless the gap.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hashSnapshot } from './harness/hash.js';
import { makeClock } from './harness/clock.js';
import { reseed } from '../src/sim/rng.js';
import { createSim } from '../src/platform/node.js';

// The complete set of fields the digest is allowed to skip. Written out here on
// purpose: adding an exclusion to hash.js must break this test and force the
// omission to be justified in review rather than absorbed silently.
// Mirrors IGNORED_SNAPSHOT_KEYS in test/harness/hash.js. `sv` joins 't' and 'v'
// because it is the server's wall clock at send time: hashing a performance.now()
// reading would make every golden tape differ from itself on the next run.
const ALLOWED_SNAPSHOT_OMISSIONS = ['t', 'v', 'sv'];
const ALLOWED_BODY_OMISSIONS = ['id'];

// A value no snapshot field ever legitimately holds, so substituting it always
// counts as a real change.
const PERTURB = '<<perturbed>>';

const perturbed = (snap, mutate) => {
  const copy = structuredClone(snap);
  mutate(copy);
  return hashSnapshot(copy);
};

// A snapshot carrying every field src/sim/snapshot.js can emit, including the ones a
// quiet single-round tape never populates (polygon/vertex bodies, critter and
// decoy and boss summons, phantom/spin statics, fusion charges, segs, fxLite),
// plus `rp` — the killcam flag src/net/server-bridge.js stamps on a replay
// frame. The digest is key-driven so it always covered rp; this fixture could
// not see it until a tape triggered a death, which the three-round tape does.
const richSnapshot = () => ({
  // `sv` is the server's wall clock at send time, stamped by takeWireSnapshot for
  // the client's playout buffer. It is on the digest's ignore-list — it reads
  // performance.now(), so hashing it would make every tape irreproducible — but
  // it IS a field of the live payload, so the fixture has to carry it or this
  // guard reports it as unaccounted growth forever.
  t: 'snap', v: '9.0.0', sv: 1712576105123,
  st: 'PLAY', mi: 3, rn: 1, wr: null, msd: 1712576105, lv: 640, wn: 3, rp: 1,
  md: 'wave', bw: 4, ev: 'quake', bd: [2, 7], aw: { mvp: 0 }, sr: { bolt: 3 },
  bs: { n: 'THE MAW', c: '#ff4d4d', hp: 400, mhp: 900 },
  segs: [[0, 10, 20, 30, 40], [1, 50, 60, 70, 80]],
  fxLite: [{ k: 'zone', x: 100, y: 200, r: 45, c: '#a55eea' }],
  ps: [{
    s: 0, n: 'TAPEA', c: '#4ecdff', h: '#ffd700',
    x: 140, y: 106, vx: 1.2, vy: -3.4, an: 0.07, f: 1, wp: 0.83,
    hp: 150, al: 1, sc: 1, fz: 1, fl: 1, iv: 1, rf: 1, pg: 1, hu: 1,
    gx: 12, gy: 34, sp: 'bolt', rd: 1,
    s0: 'shard', s1: 'beehive', h0: 2, h1: 1, c0: 0.5, c1: 1,
    mc: 2, w: 1, b: 1, off: 1,
  }],
  bodies: [
    { id: 1, l: 'projectile', x: 300, y: 200, a: 0.125, c: '#ff6b81', r: 6 },
    { id: 2, l: 'crate', x: 400, y: 500, a: 0, c: '#8a7a5c', w: 40, h: 40 },
    { id: 3, l: 'rock', x: 500, y: 500, a: 0.5, c: '#3a3226', n: 6, r: 22 },
    { id: 4, l: 'blob', x: 600, y: 500, a: 0.25, c: '#2c2438', v: [1, 2, 3, 4, 5, 6] },
    { id: 5, l: 'critter', x: 700, y: 500, a: 0.3, c: '#e8d5ff', r: 8, cd: -1 },
    { id: 6, l: 'decoy', x: 800, y: 500, a: 0.4, c: '#fff', r: 15, dc: ['#4ecdff', '#ffd700'] },
    { id: 7, l: 'boss', x: 900, y: 400, a: 0.6, c: '#ff4d4d', r: 40, bt: 'maw' },
    { id: 8, l: 'phase', x: 1000, y: 300, a: 0.7, c: '#5d4a33', w: 80, h: 20, ph: 0, spn: 1 },
    { id: 9, l: 'tome', x: 220, y: 600, a: 0.9, sp: 'firestorm' },
  ],
});

test('every snapshot field is hashed unless it is on the documented ignore-list', () => {
  const snap = richSnapshot();
  const baseline = hashSnapshot(snap);

  for (const key of Object.keys(snap)) {
    // `bodies` is consumed structurally (sorted per-body), so it has to be
    // perturbed with a body list rather than a scalar.
    const mutate = key === 'bodies'
      ? (s) => { s.bodies = [{ id: 99, l: PERTURB, x: 0, y: 0, a: 0 }]; }
      : (s) => { s[key] = PERTURB; };
    const changed = perturbed(snap, mutate) !== baseline;
    if (ALLOWED_SNAPSHOT_OMISSIONS.includes(key)) {
      assert.equal(changed, false, `${key} is on the ignore-list but still reached the digest`);
    } else {
      assert.equal(changed, true, `snapshot field '${key}' escaped the digest`);
    }
  }

  for (const key of Object.keys(snap.ps[0])) {
    assert.notEqual(perturbed(snap, (s) => { s.ps[0][key] = PERTURB; }), baseline,
      `ps[].${key} escaped the digest`);
  }

  // union of every key any body shape can carry
  const bodyKeys = [...new Set(snap.bodies.flatMap(Object.keys))];
  for (const key of bodyKeys) {
    const i = snap.bodies.findIndex((b) => key in b);
    const changed = perturbed(snap, (s) => { s.bodies[i][key] = PERTURB; }) !== baseline;
    if (ALLOWED_BODY_OMISSIONS.includes(key)) {
      assert.equal(changed, false, `bodies[].${key} is on the ignore-list but still reached the digest`);
    } else {
      assert.equal(changed, true, `bodies[].${key} escaped the digest`);
    }
  }
});

// The check above proves the rule against a hand-written snapshot; this one
// proves the hand-written snapshot has not drifted from what the sim emits.
// Both tapes, because they populate disjoint parts of the wire: the short one
// is a quiet single round, and the long one crosses round boundaries, so it is
// the only one that reaches ROUND_END, a winner, and the killcam's `rp`.
for (const [name, file, ticks] of [
  ['a single quiet round', 'test/tape/one-round.input.json', 300],
  ['a run that crosses round boundaries', 'test/tape/three-rounds.input.json', 4200],
]) {
  test(`the live snapshot carries no field the digest is blind to — ${name}`, () => {
    const tape = JSON.parse(readFileSync(file, 'utf8'));
    const clock = makeClock(0);
    reseed(12345); // the sim owns its stream — seed it before createSim's loadMap(0) draws
    const sim = createSim({ clock });
    const bridge = sim.bridge;
    try {
      const slots = tape.players.map((p) => bridge.addPlayer({ name: p.name }));
      bridge.start();
      const seenTop = new Set(), seenPs = new Set(), seenBody = new Set();
      for (let i = 0; i < ticks; i++) {
        const frame = tape.frames[Math.min(i, tape.frames.length - 1)];
        for (const slot of slots) {
          const msg = frame?.[String(slot)];
          if (msg) bridge.setInput(slot, msg);
        }
        bridge.stepSim();
        clock.advance(1000 / 60); // keeps the env clock alongside simNow() — see test/harness/tape.js
        const snap = bridge.takeWireSnapshot();
        for (const k of Object.keys(snap)) seenTop.add(k);
        for (const p of snap.ps) for (const k of Object.keys(p)) if (p[k] !== undefined) seenPs.add(k);
        for (const b of snap.bodies) for (const k of Object.keys(b)) if (b[k] !== undefined) seenBody.add(k);
      }
      const known = richSnapshot();
      const knownBody = new Set(known.bodies.flatMap(Object.keys));
      for (const k of seenTop) assert.ok(k in known, `live snapshot grew field '${k}' — add it to richSnapshot()`);
      for (const k of seenPs) assert.ok(k in known.ps[0], `live ps[] grew field '${k}' — add it to richSnapshot()`);
      for (const k of seenBody) assert.ok(knownBody.has(k), `live bodies[] grew field '${k}' — add it to richSnapshot()`);
    } finally {
      sim.destroy();
    }
  });
}

// The killcam flag has to actually be reached, or the fixture entry above is a
// claim nobody checks. `rp` rides only the frames server-bridge swaps in while
// game.replay is live, which needs a death — which needs a round to end.
test('the long tape reaches the killcam, so rp is a field the fixture had to grow', () => {
  const tape = JSON.parse(readFileSync('test/tape/three-rounds.input.json', 'utf8'));
  const clock = makeClock(0);
  reseed(12345);
  const sim = createSim({ clock });
  const bridge = sim.bridge;
  try {
    const slots = tape.players.map((p) => bridge.addPlayer({ name: p.name }));
    bridge.start();
    let replayFrames = 0;
    for (let i = 0; i < 4200; i++) {
      const frame = tape.frames[Math.min(i, tape.frames.length - 1)];
      for (const slot of slots) {
        const msg = frame?.[String(slot)];
        if (msg) bridge.setInput(slot, msg);
      }
      bridge.stepSim();
      clock.advance(1000 / 60);
      if (bridge.takeWireSnapshot().rp) replayFrames++;
    }
    assert.ok(replayFrames > 0, 'no killcam frame in the long tape — rp is untested');
  } finally {
    sim.destroy();
  }
});

test('body order is a total order, so Set iteration order cannot reach the digest', () => {
  // src/sim/snapshot.js rounds body x/y to integers, so gibs from one explosion
  // routinely share label+x+y and differ only in angle. A sort that tie-breaks
  // on label/x/y alone would leave those two in Set order.
  const wrap = (bodies) => ({ t: 'snap', v: '1', st: 'PLAY', mi: 0, rn: 1, wr: null, ps: [], bodies });
  const a = { id: 1, l: 'gib', x: 100, y: 200, a: 0.25, c: '#ff6b81', r: 3 };
  const b = { id: 2, l: 'gib', x: 100, y: 200, a: 0.75, c: '#ff6b81', r: 3 };

  assert.equal(hashSnapshot(wrap([a, b])), hashSnapshot(wrap([b, a])),
    'two bodies differing only in angle hashed differently when swapped');

  // ...and the tie-break must not be achieved by ignoring the field either
  for (const [name, mutation] of [
    ['angle', { a: 0.76 }], ['colour', { c: '#4ecdff' }], ['radius', { r: 4 }],
  ]) {
    assert.notEqual(hashSnapshot(wrap([a, b])), hashSnapshot(wrap([a, { ...b, ...mutation }])),
      `bodies differing only in ${name} collided`);
  }
});

// Same property, for segs. src/sim/snapshot.js emits them in
// Composite.allConstraints order, i.e. the order a map builder added its planks
// and chains — construction order, not sim state. The three-round tape is the
// first golden to reach a map with constraints at all, so this guard exists
// from the moment the trap becomes reachable.
test('seg order cannot reach the digest, and seg content still can', () => {
  const wrap = (segs) => ({ t: 'snap', v: '1', st: 'PLAY', mi: 0, rn: 1, wr: null, ps: [], bodies: [], segs });
  const a = [0, 10, 20, 30, 40];
  const b = [1, 50, 60, 70, 80];

  assert.equal(hashSnapshot(wrap([a, b])), hashSnapshot(wrap([b, a])),
    'two segs hashed differently when swapped');

  // every field of a seg still has to move the digest
  for (let i = 0; i < a.length; i++) {
    const moved = a.map((v, j) => (j === i ? v + 1 : v));
    assert.notEqual(hashSnapshot(wrap([a, b])), hashSnapshot(wrap([moved, b])),
      `segs[0][${i}] escaped the digest`);
  }
  // and a seg appearing twice is not the same as appearing once
  assert.notEqual(hashSnapshot(wrap([a, b])), hashSnapshot(wrap([a, a, b])),
    'a duplicated seg collided with the original list');
});
