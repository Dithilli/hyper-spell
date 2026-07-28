// spawn-escape.test.js — no wizard opens a round somewhere it cannot leave.
//
// The guarantee has three parts and this file checks all three, because they
// fail differently: the analysis has to RUN on every map (a map whose grid
// comes back empty silently approves everything), the spot it picks has to be
// escapable (the actual guarantee), and a wizard actually dropped there has to
// end up standing on something (the guarantee's contact with the physics, which
// is the only part a grid cannot prove on its own).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../src/sim/content.js';
import { createSim } from '../src/platform/node.js';
import { reseed } from '../src/sim/rng.js';
import { MAPS } from '../src/sim/maps/builders.js';
import {
  reachInfo, spawnEscapes, safeSpawnPoint, reachLanding, reachEscape, cellEscapes, REACH_SHARE,
} from '../src/sim/maps/reach.js';
import { game, startRound, currentMap } from '../src/sim/match.js';
import { players, spawnPointFor } from '../src/sim/player/lifecycle.js';
import { stepSim } from '../src/sim/tick.js';
import { H } from '../src/sim/world.js';

// Every map, one seed. The grid is a function of the built map, so this is the
// cheap sweep; the multi-seed sweep below is the expensive one.
test('every map builds a reach grid with somewhere to stand', () => {
  reseed(1);
  const { bridge } = createSim();
  bridge.addPlayer({ name: 'probe' });
  const broken = [];
  for (let i = 0; i < MAPS.length; i++) {
    startRound(i);
    const g = reachInfo(currentMap);
    const standable = g.stand.reduce((n, v) => n + v, 0);
    if (!g || !g.cols || !g.rows) broken.push(`${MAPS[i].name}: no grid`);
    else if (standable === 0) broken.push(`${MAPS[i].name}: nowhere to stand at all`);
    else if (g.arenaN <= 1) broken.push(`${MAPS[i].name}: arena measured as ${g.arenaN} cells`);
  }
  assert.deepEqual(broken, [], `maps whose escape analysis is degenerate:\n${broken.join('\n')}`);
});

// The guarantee itself, across seeds — the seeded passes plant crates, cover and
// set-pieces, so a spawn that is fine on seed 1 can be sealed on seed 5.
//
// The criterion is reachEscape against the REACH_SHARE threshold, not
// spawnEscapes. Those differ, and the difference matters: spawnEscapes also
// requires reachLandable — level firm ground either side — which is a question
// about landing QUALITY, not about being trapped. A wizard that comes down on a
// destructible slab can walk the whole arena; it just isn't a pristine landing
// pad, and safeSpawnPoint is allowed to accept it when nothing better is free.
// Asserting the stricter thing here reported four Twin Bridges spawns as having
// "no way out" when their reach was 82 cells of an 82-cell arena.
test('every wizard lands somewhere it can leave, across seeds', () => {
  const stranded = [];
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    reseed(seed);
    const { bridge } = createSim();
    for (let s = 0; s < 4; s++) bridge.addPlayer({ name: `p${s}` });
    for (let i = 0; i < MAPS.length; i++) {
      startRound(i);
      const g = reachInfo(currentMap);
      for (const p of players) {
        const spot = spawnPointFor(p);
        const land = reachLanding(g, spot.x, spot.y);
        const reachable = land >= 0 && reachEscape(g, land) >= g.arenaN * REACH_SHARE;
        if (!reachable) {
          stranded.push(`${MAPS[i].name} seed ${seed} slot ${p.slot} @ ${Math.round(spot.x)},${Math.round(spot.y)}` +
            ` (land=${land}, reach=${land >= 0 ? reachEscape(g, land) : 'n/a'}/${g.arenaN})`);
        }
      }
    }
  }
  assert.deepEqual(stranded.slice(0, 12), [], `spawns with no way out (${stranded.length} total):\n${stranded.slice(0, 12).join('\n')}`);
});

// The physics check. The grid can be right about geometry and still wrong about
// what a falling body does, so drop the wizards for real and see where they are
// two seconds later. This is the assertion 898d796 added upstream after the
// grid-only version passed on maps that still dropped wizards into the void.
// Watched every tick, not sampled at the end, and it measures FALLING OUT OF
// THE WORLD rather than dying. Two earlier versions of this got it wrong in
// opposite directions:
//   - `p.alive && y > H + 60` can never fire: a wizard that leaves the world is
//     killed by it, so the guard excluded exactly the failure case. That
//     version passed while server/verify-spawns.js reported nine real ones.
//   - `!p.alive` over-fires: on Rising Lava, Gale Force and The Pendulum a
//     wizard can be legitimately killed by the map within two seconds of a
//     perfectly good spawn. That is the map being lethal, not the spawn being
//     a trap, and this test is about spawns.
function fallsOutOfWorld(seats, seeds) {
  const fallen = new Set();
  for (const seed of seeds) {
    reseed(seed);
    const { bridge } = createSim();
    for (let s = 0; s < seats; s++) bridge.addPlayer({ name: `p${s}` });
    for (let i = 0; i < MAPS.length; i++) {
      startRound(i);
      for (let t = 0; t < 120; t++) {
        stepSim();
        for (const p of players) {
          if (p.body && p.body.position.y > H + 60) {
            fallen.add(`${MAPS[i].name} seed ${seed}: ${p.name} left the world at y=${Math.round(p.body.position.y)}`);
          }
        }
      }
    }
  }
  return [...fallen];
}

// ONE wizard per round isolates the spawn point from wizards shoving each
// other, which is the only way to read this number as being about spawn
// quality. It is the granularity server/verify-spawns.js drops probes at, and
// for the same reason.
test('a lone wizard never falls out of the world from its spawn', () => {
  const list = fallsOutOfWorld(1, [11, 12]);
  assert.deepEqual(list, [], `spawns that drop a solo wizard into the void:\n${list.join('\n')}`);
});

// Four wizards arriving together is a different question — they collide on
// landing — and it is the case the busy-aware nudge in reach.js exists for.
// A ratchet rather than zero, because the survivors are on maps whose own
// dynamics are lethal within two seconds: Phantom Floors withdraws the floor,
// The Maw pulls everything down a hole, The Climb floods with lava.
//
// The numbers that matter, 110 maps x 2 seeds x 4 wizards, deterministic:
//   7  before this task (the old groundInColumn spawn)
//  10  escape analysis, busy on neither path (upstream)
//   8  escape analysis, busy-aware at 44px separation
//   7  escape analysis, busy-aware at 70px separation (here)
// The ceiling is the measured 7. It is level with what this replaced rather
// than better, and that is the honest reading: the analysis packs wizards onto
// the ledges it judges sound, and keeping them apart is what pays that back.
// The lone-wizard test above is the one that isolates spawn quality (1 -> 0).
test('four wizards landing together stay within the measured ceiling', () => {
  const list = fallsOutOfWorld(4, [11, 12]);
  assert.ok(list.length <= 7, `${list.length} wizards fell (ceiling 7):\n${list.join('\n')}`);
});

// safeSpawnPoint has three outcomes and they are NOT equivalent, which is the
// whole design: the authored spot as designed; a nudge of a few cells along the
// same ledge; a relocation into the arena. A nudge preserves the map author's
// composition, a relocation discards it — so the bar is that relocation stays
// the last resort, not that the spot never moves at all.
//
// Measured over the 110 maps: 215 as authored, 324 nudged, 49 relocated. Nearly
// half the authored spawns fail the raw escape test, which is the reason this
// analysis exists at all.
test('relocation is the last resort, not the usual answer', () => {
  reseed(3);
  const { bridge } = createSim();
  bridge.addPlayer({ name: 'probe' });
  let asAuthored = 0, nudged = 0, relocated = 0, finalBad = 0;
  for (let i = 0; i < MAPS.length; i++) {
    startRound(i);
    for (const s of currentMap.def.spawns) {
      const out = safeSpawnPoint(currentMap, s.x, s.y);
      // y only changes on the relocation path; x is snapped to the cell centre,
      // so half a cell of drift still counts as the authored spot
      if (out.y !== s.y) relocated++;
      else if (Math.abs(out.x - s.x) <= 8) asAuthored++;
      else nudged++;
      if (!spawnEscapes(currentMap, out.x, out.y)) finalBad++;
    }
  }
  const total = asAuthored + nudged + relocated;
  // THE guarantee, and the only hard one: whatever it picked, you can leave it
  assert.equal(finalBad, 0, `${finalBad}/${total} chosen spawns still cannot escape`);
  assert.ok(relocated / total < 0.2, `relocated ${relocated}/${total} — discarding map composition rather than nudging`);
  assert.ok(asAuthored > 0, 'no spawn survived as authored — the analysis is rejecting everything');
});

// Determinism: this runs inside the sim on every peer now, not host-only, so
// two peers on the same seed must grade the same map identically.
test('the analysis is a pure function of the built map', () => {
  const grade = () => {
    reseed(21);
  const { bridge } = createSim();
    bridge.addPlayer({ name: 'probe' });
    const out = [];
    for (let i = 0; i < MAPS.length; i++) {
      startRound(i);
      for (const s of currentMap.def.spawns) {
        const p = safeSpawnPoint(currentMap, s.x, s.y);
        out.push(`${i}:${Math.round(p.x)},${Math.round(p.y)}`);
      }
    }
    return out.join('|');
  };
  assert.equal(grade(), grade(), 'the same seed must grade the same spawns');
});

// spawnEscapes is what this file and server/verify-spawns.js grade the
// guarantee with, so a spawnEscapes that cannot say "no" makes every other
// assertion here vacuous. It used to: mutating it to `return true` left all
// seven tests green and the sweep reporting a perfect score.
//
// Landing a wizard inside solid terrain is the unambiguous no — there is no
// landing cell at all, so this holds for any threshold and any map.
test('spawnEscapes can say no', () => {
  reseed(4);
  const { bridge } = createSim();
  bridge.addPlayer({ name: 'probe' });
  let rejected = 0, accepted = 0;
  for (let i = 0; i < MAPS.length; i++) {
    startRound(i);
    const g = reachInfo(currentMap);
    // walk the grid for a cell that IS solid: dropped there, a wizard is buried
    for (let c = 0; c < g.solid.length; c++) {
      if (!g.solid[c]) continue;
      const x = (c % g.cols) * 16 + 8, y = ((c - (c % g.cols)) / g.cols) * 16 + 8;
      if (spawnEscapes(currentMap, x, y)) accepted++; else rejected++;
      break;
    }
  }
  assert.equal(accepted, 0, `${accepted} maps called a point inside solid terrain escapable`);
  assert.ok(rejected > 100, `only ${rejected} maps exercised the rejection path`);
});

// The lava guard is the difference between "the floor is at y=600" and "the
// floor is lava and you die on it". Deleting it left every test green and the
// sweep passing, on a branch where 78 of 110 maps have a lava line.
test('a spawn over lava is not treated as a landing', () => {
  reseed(6);
  const { bridge } = createSim();
  bridge.addPlayer({ name: 'probe' });
  const lavaMaps = [];
  for (let i = 0; i < MAPS.length; i++) {
    startRound(i);
    if (currentMap.data.lavaY == null) continue;
    lavaMaps.push(MAPS[i].name);
    const g = reachInfo(currentMap);
    // any cell whose centre sits below the lava line must not be standable,
    // whatever geometry is down there — you cannot stand on lava
    // `pass`, not `stand`. deadFrom clears PASSABILITY below the lava line, and
    // that is what stops reachLanding walking a falling wizard THROUGH the lava
    // onto whatever floor is under it and calling that a landing. Asserting on
    // `stand` proves nothing: below the lava line there is usually no solid
    // geometry either way, so it holds with the guard deleted.
    const lavaRow = Math.floor((currentMap.data.lavaY - 8) / 16);
    let below = 0;
    for (let cy = lavaRow + 1; cy < g.rows; cy++) {
      for (let cx = 0; cx < g.cols; cx++) below += g.pass[cy * g.cols + cx];
    }
    assert.equal(below, 0, `${MAPS[i].name}: ${below} passable cells below lavaY=${currentMap.data.lavaY}`);
  }
  assert.ok(lavaMaps.length > 50, `only ${lavaMaps.length} maps had a lava line — the guard is barely exercised`);
});

// The threshold is the whole judgement: a pocket you can leave measures a real
// fraction of the arena, a sealed one measures a sliver. If REACH_SHARE ever
// stops discriminating, every spawn passes and the guarantee is vacuous.
//
// Counts only cells that HAVE a landing, because `land < 0` (buried, or a
// straight fall into the void) is a rejection the threshold had no part in —
// an earlier version of this test pooled the two and passed with REACH_SHARE
// set to 0.
test('the escape threshold actually rejects something', () => {
  reseed(7);
  const { bridge } = createSim();
  bridge.addPlayer({ name: 'probe' });
  let rejected = 0, accepted = 0;
  for (let i = 0; i < MAPS.length; i++) {
    startRound(i);
    const g = reachInfo(currentMap);
    // sample the whole arena, not just the authored spawns: most of a map is
    // not a valid spawn, and a threshold that accepts every point in the plane
    // is not a threshold
    for (let x = 60; x < 1220; x += 120) {
      for (let y = 80; y < 640; y += 120) {
        const land = reachLanding(g, x, y);
        if (land < 0) continue; // not a threshold decision — skip, don't score
        if (cellEscapes(g, land)) accepted++; else rejected++;
      }
    }
  }
  assert.ok(accepted > 0, 'the threshold accepts nothing — the analysis is broken');
  assert.ok(rejected > 0, 'the threshold rejects nothing — REACH_SHARE is not discriminating');
});
