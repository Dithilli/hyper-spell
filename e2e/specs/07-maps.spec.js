// 07-maps — every arena in the game, built and drawn in a real browser.
//
// The map list comes from e2e/manifest.json, so an arena added today is swept
// today. The walkable-void scan is ported from smoke-test.html, which measured
// the same thing but had to be opened by a human and read by eye.
//
// What every map must be:
//   1. buildable            — build() runs and puts bodies in the world
//   2. crossable            — no unjumpable expanse of nothing to walk on
//   3. survivable           — wizards spawn on it and are still alive a second later
//   4. drawable             — the renderer paints it without throwing
//   5. deterministic        — the same seed builds the same extras, host and client
import { test, expect } from '../support/fixtures.js';
import { GamePage } from '../support/game.js';
import { loadManifest } from '../tools/surface.js';

const MAPS = loadManifest().maps;

const BATCH = 20;
const batches = [];
for (let i = 0; i < MAPS.length; i += BATCH) batches.push({ start: i, maps: MAPS.slice(i, i + BATCH) });

test.describe('the map book', () => {
  test('the manifest and the running game hold the same maps', async ({ game }) => {
    const live = await game.read(() => globalThis.HS.MAPS.map(m => m.name));
    expect(live, 'run `npm run e2e:update` if this is an intended change').toEqual(MAPS.map(m => m.name));
  });

  test('every map is named, buildable and has spawn points', async () => {
    expect(MAPS.filter(m => !m.name).length, 'an unnamed map').toBe(0);
    expect(MAPS.filter(m => !m.buildable).map(m => m.name), 'maps with no build()').toEqual([]);
    expect(MAPS.filter(m => m.spawns < 2).map(m => m.name),
      'a versus map needs at least two spawn points').toEqual([]);
  });
});

for (const { start, maps } of batches) {
  test.describe(`arenas ${start + 1}-${start + maps.length}`, () => {
    test.setTimeout(240_000);

    test(`${maps[0].name} … ${maps[maps.length - 1].name} all build, hold wizards, and draw`, async ({ page, errors }) => {
      void errors;
      const game = new GamePage(page);
      await game.boot();
      await game.seatKeyboardPlayer(0);
      await game.seatKeyboardPlayer(1);
      await game.startMatch();

      const empty = [];        // built nothing
      const uncrossable = [];  // a gap no wizard could cross
      const noCover = [];      // nothing destructible to hide behind
      const killedOnSpawn = []; // spawned wizards straight into a death

      for (const [offset, def] of maps.entries()) {
        const index = start + offset;
        await game.restartRound(index, { awaitFight: false });

        const bodies = await game.mapBodies();
        if (bodies.length === 0) { empty.push(def.name); continue; }

        // The walkable-void scan, from smoke-test.html: step across the arena
        // and measure the longest run with nothing standable under it. Ceiling
        // maps (negative gravity) are walked on from below and are exempt.
        if (def.gravity >= 0) {
          const { W, H, deathY } = await game.read(() => ({
            W: globalThis.HS.W, H: globalThis.HS.H,
            deathY: (globalThis.HS.currentMap.data.lavaY ?? globalThis.HS.H) - 24,
          }));
          const standable = bodies.filter(b =>
            !b.isSensor && b.label !== 'spikes' && b.mask !== 0 &&
            (b.isStatic || b.label === 'plank') &&
            b.min.x > -60 && b.max.x < W + 60);
          let worstGap = 0, run = 0;
          for (let x = 24; x <= W - 24; x += 16) {
            const solid = standable.some(b => x > b.min.x + 2 && x < b.max.x - 2 &&
              b.min.y > 90 && b.min.y < deathY);
            if (solid) { worstGap = Math.max(worstGap, run); run = 0; } else run += 16;
          }
          worstGap = Math.max(worstGap, run);
          if (worstGap > 200) uncrossable.push(`${def.name} (${worstGap}px of nothing)`);
        }

        const destructibles = bodies.filter(b => b.label === 'destructible').length;
        if (destructibles < 2) noCover.push(`${def.name} (${destructibles})`);

        // A second of real physics on the map: wizards must still be alive and
        // on it, not sunk through the floor or dropped into the lava at spawn.
        // One second is inside the 1.1s FIGHT countdown, so anything that dies
        // here died before the round was even fightable.
        await game.advanceSim(60);
        if (!(await game.players()).every(p => p.alive)) {
          // Don't report on one sample. Several arenas drive an oscillating
          // wind off sim time, so whether a spawn is fatal depends on where in
          // the cycle the round happened to load — and a sweep that reported
          // whichever map it caught this run would name a different map every
          // time and be ignored within a week. Re-run the map across the cycle
          // and report how often it actually kills.
          // Eight samples, 70 ticks apart, so they span a whole wind cycle — the
          // slowest oscillator in the book is sin(now / 1500), about 9.4s or 565
          // ticks. Sampling less than one cycle made the verdict depend on where
          // the sweep happened to land, which is how a borderline map ends up
          // reported one run and not the next.
          const PHASES = 8;
          let fatal = 0;
          for (let phase = 0; phase < PHASES; phase++) {
            await game.restartRound(index, { awaitFight: false });
            await game.advanceSim(phase * 70);
            await game.restartRound(index, { awaitFight: false });
            await game.advanceSim(60);
            if (!(await game.players()).every(p => p.alive)) fatal++;
          }
          if (fatal >= PHASES / 2) killedOnSpawn.push(`${def.name} (${fatal}/${PHASES} starts)`);
        }
      }

      expect(empty, 'these maps built no geometry at all').toEqual([]);
      expect(uncrossable, 'these maps have a gap no wizard could cross').toEqual([]);
      expect(killedOnSpawn, 'these maps killed a wizard within a second of spawning them').toEqual([]);
      expect(noCover, 'these maps offer fewer than two destructible pieces of cover').toEqual([]);
    });
  });
}

test.describe('map behaviour', () => {
  test('every map draws without throwing', async ({ page, errors }) => {
    void errors; // the console guard IS the assertion for all 110
    test.setTimeout(240_000);
    const game = new GamePage(page);
    await game.boot();
    await game.addBot(2);
    await game.startMatch();

    const blank = [];
    for (let i = 0; i < MAPS.length; i++) {
      await game.restartRound(i, { awaitFight: false });
      await game.advance(120); // real animation frames, so draw() actually runs
      const probe = await game.paintProbe();
      if (probe.distinctColors < 8) blank.push(`${MAPS[i].name} (${probe.distinctColors} colours)`);
    }
    expect(blank, 'these maps rendered as a blank canvas').toEqual([]);
  });

  test('the same seed builds the same arena twice over', async ({ game }) => {
    // Host and client build their extras independently and must agree, or the
    // crate one player hides behind is not there for the other.
    // Built through the real loadMap, seeded through the real rng, rather than
    // hand-assembling a composite: what has to agree between host and client is
    // the arena the game builds, not one a test builds.
    const fingerprint = await game.read(seed => {
      const H = globalThis.HS;
      const walk = c => [...(c.bodies || []), ...(c.composites || []).flatMap(walk)];
      const build = s => {
        H.reseed(s);
        H.loadMap(3);
        return walk(H.currentMap.composite)
          .map(b => `${Math.round(b.position.x)},${Math.round(b.position.y)},${b.label}`).sort().join('|');
      };
      return { a: build(seed), b: build(seed), different: build(seed + 1) };
    }, 424242);
    expect(fingerprint.a, 'the same seed must build the same arena').toBe(fingerprint.b);
    expect(fingerprint.a, 'different seeds built identical arenas — the rng is dead').not.toBe(fingerprint.different);
  });

  test('a map with wrap carries a wizard off one edge and back on the other', async ({ game }) => {
    const wrapIndex = MAPS.findIndex(m => m.wrap);
    test.skip(wrapIndex < 0, 'no wrapping maps in the book');
    await game.seatKeyboardPlayer(0);
    await game.seatKeyboardPlayer(1);
    await game.startMatch();
    await game.restartRound(wrapIndex);

    await game.hold('KeyA', 240); // walk left, off the edge
    const x = (await game.player(0)).x;
    expect(x, 'a wrapping map must put the wizard back on the far side').toBeGreaterThan(0);
  });

  test('low gravity maps really do fall slower', async ({ game }) => {
    const heavy = MAPS.findIndex(m => m.gravity >= 2);
    const light = MAPS.findIndex(m => m.gravity > 0 && m.gravity < 1.5);
    test.skip(heavy < 0 || light < 0, 'the book has no gravity contrast to measure');

    const fallSpeed = async index => {
      await game.restartRound(index, { awaitFight: false });
      await game.read(() => {
        const H = globalThis.HS;
        const p = H.players[0];
        H.despawnPlayer(p);
        H.spawnPlayer(p, { x: H.W / 2, y: 80 });
      });
      await game.advanceSim(18);
      return (await game.player(0)).vy;
    };

    await game.seatKeyboardPlayer(0);
    await game.seatKeyboardPlayer(1);
    await game.startMatch();
    expect(await fallSpeed(light), 'a low-gravity map should not drop a wizard as fast as a heavy one')
      .toBeLessThan(await fallSpeed(heavy));
  });
});
