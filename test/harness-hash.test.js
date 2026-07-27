// Guards the two properties test/harness/hash.js exists to provide. The golden
// tape test cannot guard them: if the digest quietly stopped covering a field,
// the tape would still replay to itself, and re-recording would bless the gap.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hashSnapshot } from './harness/hash.js';
import { makeClock } from './harness/clock.js';
import { seededRandom } from './harness/seeded-random.js';
import { createSim } from '../src/platform/node.js';
import { advanceTick } from '../src/sim/time.js';

// The complete set of fields the digest is allowed to skip. Written out here on
// purpose: adding an exclusion to hash.js must break this test and force the
// omission to be justified in review rather than absorbed silently.
const ALLOWED_SNAPSHOT_OMISSIONS = ['t', 'v'];
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
// decoy and boss summons, phantom/spin statics, fusion charges, segs, fxLite).
const richSnapshot = () => ({
  t: 'snap', v: '9.0.0',
  st: 'PLAY', mi: 3, rn: 1, wr: null, msd: 1712576105, lv: 640, wn: 3,
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

test('the live snapshot carries no field the digest is blind to', () => {
  // The check above proves the rule against a hand-written snapshot; this one
  // proves the hand-written snapshot has not drifted from what the sim emits.
  const tape = JSON.parse(readFileSync('test/tape/one-round.input.json', 'utf8'));
  const clock = makeClock(0);
  const sim = createSim({ clock, random: seededRandom(12345) });
  const bridge = sim.bridge;
  try {
    const slots = tape.players.map((p) => bridge.addPlayer({ name: p.name }));
    bridge.start();
    const seenTop = new Set(), seenPs = new Set(), seenBody = new Set();
    for (let i = 0; i < 300; i++) {
      const frame = tape.frames[Math.min(i, tape.frames.length - 1)];
      for (const slot of slots) {
        const msg = frame?.[String(slot)];
        if (msg) bridge.setInput(slot, msg);
      }
      bridge.stepSim(clock.now(), 1000 / 60);
      advanceTick(); // this rig is its own tick loop — see test/harness/tape.js
      clock.advance(1000 / 60);
      const snap = bridge.takeWireSnapshot(clock.now());
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
