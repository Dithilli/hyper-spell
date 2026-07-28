#!/usr/bin/env node
// make-long-tape.js — (re)generate the INPUT half of the three-round tape.
//
// It lives beside record-tape.js and outside test/ for the same reason that one
// does (see the note at the top of record-tape.js): a generator swept up by a
// bare `node --test` would rewrite the very fixture the golden is recorded
// against.
//
// The frames are a pure function of the frame index — no randomness, no clock —
// so re-running this always produces a byte-identical file. It is checked in;
// run it only if you deliberately change the pattern, and then re-record:
//
//   node scripts/make-long-tape.js && npm run tape:record
//
// WHY THIS PATTERN. The tape has one job the one-round tape cannot do: get the
// sim through several round boundaries, so the golden covers startRound, the
// tick-scheduled round-end resolution and the killcam. That needs wizards who
// actually kill each other, and a wizard starts a round unarmed — spells come
// from tomes that rain onto random parts of the floor. So the two inputs are
// built around traversal:
//
//   * a slow SWEEP (period 300 frames = 5s, the two slots in antiphase) walks
//     each wizard the width of the arena and back. That is what collects tomes
//     wherever they land and what puts the two in the same place often enough
//     to trade damage; a short oscillation leaves both parked on their spawn
//     with empty slots forever. (Measured: a 24-frame oscillation ran 2400
//     ticks with zero deaths and never left round 1.)
//   * a fast CAST edge (period 8) fires whatever is in the slot as soon as its
//     cooldown allows — casts are edge-triggered, so the input has to return to
//     0 between shots.
//   * jumps, the second slot and the occasional block keep the rest of the
//     input surface alive rather than testing one code path 4,200 times.
//
// Aim tracks the direction of travel with a slight elevation, so bolts fly at
// whatever the wizard is walking towards.
import { writeFileSync } from 'node:fs';

const FRAMES = 4200;   // matches the golden's tick count: no frame is a repeat
const SWEEP = 300;     // arena-crossing march, in frames
const CAST = 8;        // cast on/off period — the edge is what actually fires
const JUMP = 40;

const frames = [];
for (let i = 0; i < FRAMES; i++) {
  const rightward = i % SWEEP < SWEEP / 2;
  const m0 = rightward ? 1 : -1;
  const m1 = -m0; // antiphase: they march towards each other, then apart
  const c = i % CAST < CAST / 2 ? 1 : 0;
  const aim = (m) => (m > 0 ? -0.18 : Math.PI + 0.18);
  frames.push({
    '0': {
      m: m0,
      j: i % JUMP === 0 ? 1 : 0,
      c,
      c2: i % (CAST * 2) < 3 ? 1 : 0,
      b: i % 240 === 120 ? 1 : 0,
      a: aim(m0),
    },
    '1': {
      m: m1,
      j: (i + JUMP / 2) % JUMP === 0 ? 1 : 0,
      c,
      c2: i % (CAST * 3) < 3 ? 1 : 0,
      b: i % 240 === 60 ? 1 : 0,
      a: aim(m1),
    },
  });
}

writeFileSync(
  'test/tape/three-rounds.input.json',
  JSON.stringify({ players: [{ name: 'TAPEA' }, { name: 'TAPEB' }], frames }) + '\n',
);
console.log(`wrote ${frames.length} frames`);
