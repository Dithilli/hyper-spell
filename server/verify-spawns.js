// verify-spawns.js — sweep every map, every seed, every slot, and prove no
// wizard can open a round somewhere it can't get out of.
//
// Two passes, because a model that grades its own homework proves nothing:
//   1) escape analysis (js/maps.js) over MAPS x SEEDS x slots — reports how
//      many authored spawns are traps and asserts every FINAL spawn escapes.
//   2) real Matter physics — drop an actual wizard-sized body at each final
//      spawn, step the engine, and assert it comes to rest on solid ground
//      inside the arena rather than embedded in terrain or sunk in the lava.
//
//   node server/verify-spawns.js              # 6 seeds per map
//   node server/verify-spawns.js --seeds 20   # deeper sweep
//   node server/verify-spawns.js --map 47     # one map, verbose
'use strict';
const vm = require('vm');
const { createSimContext } = require('./sim-context');

const arg = (flag, dflt) => {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] != null ? +process.argv[i + 1] : dflt;
};
const SEEDS = arg('--seeds', 6);
const ONLY = arg('--map', -1);

const sim = createSimContext({});
const run = code => vm.runInContext(code, sim.ctx);

// make the sweep reproducible: every Math.random in the map builders and in
// loadMap's seed draw comes off one mulberry32 we control
run(`
  globalThis.__sweepSeed = 1;
  globalThis.__setSweepSeed = s => {
    let a = s >>> 0;
    Math.random = () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
`);

// one map + one seed: load it, ask for all 8 slots, grade both the authored
// spot and whatever spawnPointFor settled on
run(`
  globalThis.__probe = (mapIndex, seed) => {
    __setSweepSeed(seed);
    loadMap(mapIndex);
    players.length = 0;
    const spawns = currentMap.def.spawns;
    const out = [];
    for (let slot = 0; slot < 8; slot++) {
      const base = spawns[slot % spawns.length];
      const jitter = slot >= spawns.length ? (slot - spawns.length + 1) * 26 * (slot % 2 ? 1 : -1) : 0;
      const ax = Math.max(40, Math.min(W - 40, base.x + jitter)), ay = base.y;
      const authored = spawnEscapes(currentMap, ax, ay);
      // why it was rejected, so the sweep can tell an over-strict rule from a real trap
      const g = reachInfo(currentMap);
      const land = reachLanding(g, ax, ay);
      const why = authored ? 'ok'
        : land < 0 ? 'no landing (buried, or a straight fall into lava/void)'
        : !reachLandable(g, land) ? 'lands on a lip — no level ground either side'
        : 'walled in';
      const pt = spawnPointFor({ slot });
      const moved = pt.x !== ax || pt.y !== ay;
      out.push({ slot, ax, ay, authored, why, pt, ok: spawnEscapes(currentMap, pt.x, pt.y),
        moved: moved && Math.abs(pt.x - ax) > 8, // a sub-cell snap onto the graded point isn't a move
        nudged: moved && pt.y === ay && Math.abs(pt.x - ax) > 8 && Math.abs(pt.x - ax) <= 11 * 16 });
    }
    const g = currentMap.data.reach;
    return { name: currentMap.def.name, mapSeed: currentMap.data.seed, arenaN: g.arenaN, out };
  };
`);

// pass 2: real physics. Drop a body with the wizard's exact shape at each final
// spawn, run the engine, and see where it actually ends up.
run(`
  // one wizard per freshly built map. Eight probes sharing a world shove each
  // other off the ledge, and a world already stepped for a thousand frames has
  // its crates and asteroids somewhere the round would never start them — both
  // test something other than the spawn point.
  globalThis.__settle = (mapIndex, seed, pts) => pts.map(pt => {
    __setSweepSeed(seed);
    loadMap(mapIndex);
    const b = Bodies.circle(pt.x, pt.y, 15, { density: 0.004, friction: 0.05, frictionAir: 0.02, restitution: 0.2 });
    Composite.add(world, b);
    engine.gravity.y = currentMap.def.gravity ?? 2;
    for (let i = 0; i < 240; i++) Engine.update(engine, 1000 / 60);
    const lava = currentMap.data.lavaY;
    const gdir = (currentMap.def.gravity ?? 2) < 0 ? -1 : 1;
    const res = {
      x: Math.round(b.position.x), y: Math.round(b.position.y),
      drowned: lava != null && gdir > 0 && b.position.y > lava,
      gone: b.position.y > H + 60 || b.position.y < -200 || b.position.x < -60 || b.position.x > W + 60,
    };
    Composite.remove(world, b);
    return res;
  });
`);

let mapsChecked = 0, slotsChecked = 0, authoredBad = 0, moved = 0, nudged = 0, finalBad = 0, physicsBad = 0;
const failures = [];
const trapMaps = new Map();
const reasons = new Map();

const t0 = Date.now();
const mapCount = run('MAPS.length');
for (let i = 0; i < mapCount; i++) {
  if (ONLY >= 0 && i !== ONLY) continue;
  for (let s = 1; s <= SEEDS; s++) {
    const r = run(`__probe(${i}, ${s})`);
    mapsChecked++;
    const settled = run(`__settle(${i}, ${s}, ${JSON.stringify(r.out.map(o => o.pt))})`);
    for (const o of r.out) {
      slotsChecked++;
      if (!o.authored) {
        authoredBad++;
        trapMaps.set(r.name, (trapMaps.get(r.name) || 0) + 1);
        reasons.set(o.why, (reasons.get(o.why) || 0) + 1);
      }
      if (o.moved) { if (o.nudged) nudged++; else moved++; }
      if (!o.ok) {
        finalBad++;
        failures.push(`${r.name} seed ${s} slot ${o.slot}: model says the final spawn ${JSON.stringify(o.pt)} is still walled in`);
      }
      const ph = settled[o.slot];
      if (ph.drowned || ph.gone) {
        physicsBad++;
        failures.push(`${r.name} seed ${s} slot ${o.slot}: physics — dropped at ${JSON.stringify(o.pt)}, ended ${ph.drowned ? 'in the lava' : 'out of the world'} at (${ph.x}, ${ph.y})`);
      }
    }
    if (ONLY >= 0) {
      console.log(`\n${r.name}  (seed ${s}, arena ${r.arenaN} cells)`);
      for (const o of r.out) {
        console.log(`  slot ${o.slot}: authored (${o.ax}, ${o.ay}) ${o.authored ? 'ok' : 'TRAP'}` +
          `${o.moved ? ` -> moved to (${Math.round(o.pt.x)}, ${Math.round(o.pt.y)})` : ''}` +
          `  settled (${settled[o.slot].x}, ${settled[o.slot].y})`);
      }
    }
  }
}

const secs = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`\nswept ${mapsChecked} map builds (${slotsChecked} spawns) in ${secs}s`);
console.log(`  authored spawns that were traps : ${authoredBad} (${(authoredBad / slotsChecked * 100).toFixed(1)}%)`);
console.log(`  nudged along the same ledge     : ${nudged} (${(nudged / slotsChecked * 100).toFixed(1)}%)`);
console.log(`  relocated into the main arena   : ${moved} (${(moved / slotsChecked * 100).toFixed(1)}%)`);
console.log(`  final spawns still walled in    : ${finalBad}`);
console.log(`  final spawns physics-rejected   : ${physicsBad}`);

if (reasons.size) {
  console.log('\nwhy authored spawns were rejected:');
  for (const [why, n] of [...reasons].sort((a, b) => b[1] - a[1])) console.log(`  ${n.toString().padStart(4)}  ${why}`);
}
if (trapMaps.size) {
  console.log('\nmaps with authored traps (occurrences across the sweep):');
  for (const [name, n] of [...trapMaps].sort((a, b) => b[1] - a[1])) console.log(`  ${n.toString().padStart(4)}  ${name}`);
}
if (failures.length) {
  console.log(`\n${failures.length} failure(s):`);
  for (const f of failures.slice(0, 40)) console.log(`  ${f}`);
  if (failures.length > 40) console.log(`  ... and ${failures.length - 40} more`);
}

sim.destroy();
console.log(failures.length ? '\nFAIL' : '\nPASS — every spawn on every map can get out');
process.exit(failures.length ? 1 : 0);
