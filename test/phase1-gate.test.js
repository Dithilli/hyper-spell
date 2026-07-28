// phase1-gate.test.js — the gate phase 1 has to walk through.
//
// Two claims, and between them they are what "the simulation is a deterministic
// core now" means:
//
//   1. a long two-wizard run is reproducible from its seed alone
//   2. every spell in the book casts on every map in the book without leaving
//      the world corrupt
//
// CLAIM 1 IS NARROWER THAN IT USED TO SAY. It was written as "a whole
// three-round match", which was never true of the run below: it replays the
// long tape's INPUTS but under its own seed (20260725) and only 2,400 of the
// tape's 4,200 ticks, and at that seed the run stays inside round 1 — measured,
// via runTapeWithRounds. What this asserts is therefore 2,400 ticks of ordinary
// play replaying bit-for-bit, which is real but is not round-flow coverage.
// Reproducibility ACROSS round boundaries is test/golden-tape.test.js's long
// tape, which does cross them (five rounds, four boundaries) and is pinned to a
// recorded golden. Making this one cross rounds too is a follow-up: it means
// re-seeding or lengthening the gate run, which is a behaviour change to the
// gate rather than a comment fix.
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
import { reseed } from '../src/sim/rng.js';

const tape = JSON.parse(readFileSync('test/tape/three-rounds.input.json', 'utf8'));

test('GATE: a long two-wizard run is reproducible from its seed', () => {
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
  const { game } = await import('../src/sim/match.js');
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
  const mapSeeds = [];

  // THIS SWEEP HAS TO BE REPLAYABLE, AND IT WAS NOT.
  //
  // createSim() does not reset src/sim/rng.js — the stream is caller-owned by
  // design, which is the only way test/harness/tape.js can seed a run by calling
  // reseed() *before* createSim (createSim's own loadMap(0) draws the map seed
  // off it, and that draw is part of what the golden tape hashes). So 110 bare
  // createSim() calls in a row inherit wherever the previous map's round left
  // the stream: this loop was a DIFFERENT random walk on every run, and a NaN it
  // caught on map 57 could not be reproduced — not by re-running the gate, and
  // not in isolation.
  //
  // A reset hook in rng.js cannot fix that, and both shapes were measured:
  // resetting the stream to its initial seed clobbers the harnesses that reseed
  // by hand and moves BOTH goldens (`a different seed produces a different run`
  // goes red, because every seed then produces the same run); rewinding to the
  // last explicitly-set seed leaves the goldens alone but is a no-op here, since
  // loadMap reseeds from the map seed it just drew and so advances that "last
  // seed" once per iteration anyway. Seeding the iteration is the fix.
  //
  // The seed is derived from the map index alone, so map `mi` replays on its
  // own — no need to march through the 57 maps in front of it. The replay
  // assertion after the loop is what keeps that true.
  const GATE_SEED = 0x9a71e;

  for (let mi = 0; mi < MAPS.length; mi++) {
    reseed(GATE_SEED + mi);
    const { bridge, destroy } = createSim({});
    mapSeeds.push(game.mapSeed);
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

  // …and the replayability claim above is itself checked, because an unchecked
  // one is how this regressed in the first place. `game.mapSeed` is the first
  // number createSim draws off the round stream, so it is exactly "where this
  // iteration started". Re-running a sample of iterations from their seed ALONE
  // must land on the same starting point the sweep did.
  //
  // This fails loudly if the reseed() at the top of the loop is ever removed:
  // the sweep's seeds then depend on the 57 maps in front of them while the
  // replay's do not, and the two disagree.
  for (const mi of [0, Math.floor(MAPS.length / 2), MAPS.length - 1]) {
    reseed(GATE_SEED + mi);
    const { destroy } = createSim({});
    const replayed = game.mapSeed;
    destroy();
    assert.equal(replayed, mapSeeds[mi],
      `map ${mi} does not replay from its own seed — a failure found here could not be reproduced`);
  }
  // and the sweep has to have been a walk, not 110 copies of one map: identical
  // starting points everywhere would satisfy the replay check above perfectly.
  assert.equal(new Set(mapSeeds).size, MAPS.length, 'the per-map seeds collided — the sweep is not covering distinct streams');
});
