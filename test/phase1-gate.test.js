// phase1-gate.test.js — the gate phase 1 has to walk through.
//
// Two claims, and between them they are what "the simulation is a deterministic
// core now" means:
//
//   1. a whole three-round match is reproducible from its seed alone
//   2. every spell in the book casts on every map in the book without leaving
//      the world corrupt
//
// The second is slow — 110 maps x 142 spells x 30 ticks is about 470,000 steps
// — and that is the point. It is the only thing in the suite that has ever
// touched the far corners of the content: the maps nobody picks, the spells
// nobody slots. If it finds something, it has done its job; do not tune the
// assertion to make it quiet.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runTape } from './harness/tape.js';

const tape = JSON.parse(readFileSync('test/tape/three-rounds.input.json', 'utf8'));

test('GATE: a full three-round match is reproducible from its seed', () => {
  const a = runTape({ tape, ticks: 2400, seed: 20260725 });
  const b = runTape({ tape, ticks: 2400, seed: 20260725 });
  assert.deepEqual(a, b);
  // A sim frozen into doing nothing satisfies deepEqual perfectly, so the run
  // has to be shown to be a run. 2,400 ticks of two wizards fighting produce
  // thousands of distinct world states; a handful would mean the world stopped.
  assert.ok(new Set(a).size > 1000, `the match barely moved: ${new Set(a).size} distinct states in ${a.length} ticks`);
});

test('GATE: every spell casts on every map without corrupting the world', { timeout: 900000 }, async () => {
  const { SPELLS } = await import('../src/sim/spells/registry.js');
  const { MAPS } = await import('../src/sim/maps/builders.js');
  const { createSim } = await import('../src/platform/node.js');
  const { matchSpellTally } = await import('../src/sim/telemetry.js');
  const ids = Object.keys(SPELLS);
  // telCast() fires inside castSpell, one line past the cooldown gate, so this
  // counts CASTS THAT HAPPENED. Everything else in this test — no NaN, no leak,
  // an empty queue — holds trivially on a world where nothing was ever cast,
  // and `castsMade` below only counts attempts. Without this the gate's own
  // headline claim is the one thing it does not check.
  const castsInTally = () => Object.values(matchSpellTally).reduce((n, s) => n + s.casts, 0);

  // THE INVENTORY IS A FLOOR, THE COVERAGE IS AN EQUALITY, and the difference
  // is deliberate.
  //
  // The plan asked for `MAPS.length === 114`. There are 110 maps and there
  // always were — the map book was not touched by this refactor, and the
  // in-game HUD reads "1/110". The plan's figure was simply wrong, so this
  // asserts the real one.
  //
  // But it asserts it as `>=`, because an exact count is the wrong shape for
  // what this gate protects. Adding map 111 is ordinary content work and must
  // not turn the phase gate red; LOSING maps — a truncated book, a content
  // module that half-loaded, a registration loop that exited early — is the
  // failure this must catch, and a floor catches all of those. What an exact
  // count would add over a floor is a tripwire on legitimate growth, which is
  // a nuisance that gets deleted the first time it fires.
  //
  // The thing that must be exact is the COVERAGE, and that is asserted below
  // from a counter the loop increments. A floor on the inventory with a loop
  // that quietly stopped at map 3 would be exactly the "passes for the wrong
  // reason" failure this plan keeps finding; the counter is what closes it.
  assert.ok(ids.length >= 140, `expected the full spell book, got ${ids.length}`);
  assert.ok(MAPS.length >= 110, `the map book lost maps: ${MAPS.length}`);

  let mapsVisited = 0;
  let castsMade = 0;
  let castsLanded = 0;
  const leaks = [];
  const silent = [];

  for (let mi = 0; mi < MAPS.length; mi++) {
    const { bridge, destroy } = createSim({});
    try {
      bridge.addPlayer({ name: 'A' });
      bridge.addPlayer({ name: 'B' });
      bridge.start();
      const tallyAtMapStart = castsInTally();
      for (const id of ids) {
        const before = castsInTally();
        bridge.debugCastSpell(0, id, mi);
        castsMade++;
        // per-spell, so a book where ONE spell silently stops casting is named
        // rather than averaged away by the 141 that still do
        if (castsInTally() === before) silent.push(`${id} on map ${mi} (${MAPS[mi].name})`);
        for (let t = 0; t < 30; t++) bridge.stepSim();
        const snap = bridge.takeWireSnapshot();
        for (const p of snap.ps) {
          assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), `NaN position after ${id} on map ${mi} (${MAPS[mi].name})`);
          assert.ok(Number.isFinite(p.hp), `NaN hp after ${id} on map ${mi} (${MAPS[mi].name})`);
        }
      }
      castsLanded += castsInTally() - tallyAtMapStart;
      const audit = bridge.audit();
      if (audit.effects >= 200) leaks.push(`map ${mi} (${MAPS[mi].name}): ${audit.effects} effects`);
      // the cosmetic queue is drained every tick; a host whose drain stopped
      // would grow one forever, and this is the cheapest place to notice
      assert.equal(audit.emitted, 0, `undrained cosmetic events on map ${mi}`);
      mapsVisited++;
    } finally {
      destroy();
    }
  }

  assert.deepEqual(leaks, [], `effect leaks:\n${leaks.join('\n')}`);
  assert.deepEqual(silent.slice(0, 20), [], `${silent.length} casts never happened:\n${silent.slice(0, 20).join('\n')}`);
  assert.equal(mapsVisited, MAPS.length, 'the gate did not reach every map');
  assert.equal(castsMade, MAPS.length * ids.length, 'the gate did not attempt every spell on every map');
  // attempts == casts. `castsMade` alone is a loop counter and would survive
  // debugCastSpell being gutted to a no-op; this is what makes the sentence
  // "every spell casts on every map" true rather than merely claimed.
  assert.equal(castsLanded, castsMade, `${castsMade - castsLanded} of ${castsMade} attempted casts never reached castSpell`);
});
