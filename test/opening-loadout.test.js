// opening-loadout.test.js — nobody opens a round empty-handed.
//
// The dealt hand rolls on the seeded stream, so it is match state like any
// other: two peers on the same round must deal the same hand, or their spell
// slots disagree from the first frame.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../src/sim/content.js';
import { createSim } from '../src/platform/node.js';
import { reseed } from '../src/sim/rng.js';
import { MAPS } from '../src/sim/maps/builders.js';
import { startRound, currentMap } from '../src/sim/match.js';
import { players } from '../src/sim/player/lifecycle.js';
import { platformSpots } from '../src/sim/events.js';
import { SPELLS } from '../src/sim/spells/registry.js';

function openingHands(seed, seats = 4, map = 0) {
  reseed(seed);
  const { bridge } = createSim();
  for (let i = 0; i < seats; i++) bridge.addPlayer({ name: `p${i}` });
  startRound(map);
  return players.map(p => p.slots.filter(Boolean));
}

test('every wizard starts the round holding a spell', () => {
  const empty = [];
  for (const seed of [1, 2, 3]) {
    for (let m = 0; m < 12; m++) {
      const hands = openingHands(seed, 4, m);
      hands.forEach((h, i) => { if (!h.length) empty.push(`seed ${seed} map ${m} slot ${i}`); });
    }
  }
  assert.deepEqual(empty.slice(0, 8), [], `wizards opened unarmed:\n${empty.slice(0, 8).join('\n')}`);
});

test('the dealt spells are real, castable spells', () => {
  const bad = [];
  for (const hand of openingHands(9)) {
    for (const id of hand) if (!SPELLS[id]) bad.push(id);
  }
  assert.deepEqual(bad, [], `dealt ids that are not spells: ${bad.join(', ')}`);
});

// Match state, so it has to be reproducible: a client dealing a different
// opening hand from the host disagrees about the match from the first frame.
test('the opening hand is seed-reproducible', () => {
  assert.deepEqual(openingHands(42), openingHands(42), 'the same seed must deal the same hand');
});

test('different seeds deal different hands', () => {
  assert.notDeepEqual(openingHands(1), openingHands(2), 'the loadout must actually be rolled');
});

// Four wizards opening with the same spell is a worse round than four opening
// with four. The dealer retries against what it has already dealt.
test('the table is dealt distinct spells where it can be', () => {
  let dupes = 0, rounds = 0;
  for (const seed of [5, 6, 7, 8, 9, 10]) {
    const first = openingHands(seed, 4).map(h => h[0]);
    rounds++;
    if (new Set(first).size < first.length) dupes++;
  }
  assert.ok(dupes <= 1, `${dupes}/${rounds} openings dealt a duplicate spell to the table`);
});

// The other half of 3c2b225's opening: cover must not be planted in the column
// a wizard drops through, or it bounces off a crate stack before FIGHT!.
test('seeded cover keeps out of the drop columns', () => {
  reseed(3);
  const { bridge } = createSim();
  bridge.addPlayer({ name: 'probe' });
  let inColumn = 0, total = 0;
  for (let i = 0; i < MAPS.length; i++) {
    startRound(i);
    const spawns = currentMap.def.spawns || [];
    for (const s of platformSpots(currentMap, 3)) {
      total++;
      if (spawns.some(sp => Math.abs(sp.x - s.x) < 55)) inColumn++;
    }
  }
  assert.ok(total > 100, `only ${total} cover spots sampled`);
  // Not zero: the second, looser pass exists precisely so a cramped map still
  // gets cover rather than none. It should be rare, though.
  assert.ok(inColumn / total < 0.2,
    `${inColumn}/${total} cover spots landed in a spawn drop column`);
});
