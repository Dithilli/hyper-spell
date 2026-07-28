// 06-spells — every spell in the book, cast in a real browser.
//
// The list comes from e2e/manifest.json, which is read out of the running game,
// so a spell added today is swept today without anyone editing this file. That
// is the whole point: 142 spells is already more than anyone will hand-write
// tests for, and the number goes up most weeks.
//
// What each spell must survive:
//   1. casting without throwing        (the console guard in fixtures.js)
//   2. being accepted                  (the slot's cooldown stamp advances)
//   3. doing something                 (the world fingerprint gains something)
//   4. refusing an instant second cast (every cooldown is >= 250ms)
//
// The arena is two IDLE KEYBOARD wizards — no bots, no AI, nobody moving. A
// still world is what makes "the fingerprint changed" mean "the spell did it".
import { test, expect } from '../support/fixtures.js';
import { GamePage } from '../support/game.js';
import { loadManifest } from '../tools/surface.js';

const SPELLS = Object.entries(loadManifest().spells);

// A static, open map for the whole sweep: no moving platforms and no map
// update() nudging an idle wizard, which would read as a spell effect.
const ARENA = 0;

// Split so a failure names a batch of ~24 rather than one 142-spell test, and so
// the batches run in parallel across workers.
const BATCH = 24;
const batches = [];
for (let i = 0; i < SPELLS.length; i += BATCH) batches.push(SPELLS.slice(i, i + BATCH));

/** Fields whose INCREASE is evidence a spell acted. Decay only ever lowers them. */
const GROWABLE = ['effects', 'projectiles', 'summons', 'particles', 'enemies', 'shake'];
/** Fields whose ANY change is evidence: nothing else in a still arena touches them. */
const MUTABLE = ['hp', 'timers', 'sizes', 'mega', 'hats', 'pos', 'vel', 'gravity'];

function evidenceOf(before, after) {
  const found = [];
  for (const k of GROWABLE) if (after[k] > before[k]) found.push(k);
  for (const k of MUTABLE) if (after[k] !== before[k]) found.push(k);
  return found;
}

async function idleArena(page) {
  const game = new GamePage(page);
  await game.boot();
  // Two keyboard seats, so neither wizard has an AI that would move it.
  await game.seatKeyboardPlayer(0);
  await game.seatKeyboardPlayer(1);
  await game.startMatch();
  return game;
}

test.describe('the spellbook', () => {
  test('the manifest and the running game hold the same spells', async ({ game }) => {
    const live = await game.read(() => Object.keys(globalThis.HS.SPELLS).sort());
    expect(live, 'run `npm run e2e:update` if this is an intended change')
      .toEqual(SPELLS.map(([id]) => id).sort());
  });

  test('every spell is named, coloured and castable', async () => {
    const broken = SPELLS.filter(([, s]) => !s.name || !s.color || !s.castable || !(s.cooldown > 0));
    expect(broken.map(([id]) => id), 'a spell with no name, colour, cast or cooldown is unfinished').toEqual([]);
  });
});

for (const [index, batch] of batches.entries()) {
  const first = batch[0][0], last = batch[batch.length - 1][0];
  test.describe(`casting spells ${index * BATCH + 1}-${index * BATCH + batch.length}`, () => {
    test.setTimeout(180_000);

    test(`${first} … ${last} all cast, act, and respect their cooldown`, async ({ page, errors }) => {
      void errors;
      const game = await idleArena(page);

      const inert = [];      // cast fine, but changed nothing observable
      const notAccepted = []; // the cast never registered at all
      const spammable = [];   // fired again instantly, ignoring its cooldown

      for (const [id, spell] of batch) {
        // A fresh arena per spell: no leftover projectiles, no lingering status
        // from the last one, and the tome schedule restarts so a drop cannot be
        // mistaken for this spell's doing.
        await game.restartRound(ARENA);
        await game.huddle();               // Shove and friends need a body in reach
        await game.grantSpell(id, { slot: 0, playerIndex: 0 });
        // Something for Butterfingers to knock out of the other wizard's hands.
        await game.grantSpell('fireball', { slot: 0, playerIndex: 1 });
        await game.advanceSim(4);          // let the moved wizard settle

        const before = await game.fingerprint();
        const castBefore = await game.lastCastAt(0);

        await game.page.keyboard.down('KeyE');
        await game.advanceSim(4);
        const castAfter = await game.lastCastAt(0);
        if (!(castAfter > castBefore)) notAccepted.push(id);

        // Sampled twice, and this matters. Particles, bolts and screen shake are
        // born at the cast and gone within a few hundred milliseconds; by the
        // time the world has settled they have decayed back past where they
        // started, and a spell that plainly did something reads as inert.
        const instant = await game.fingerprint();

        // Still holding the key. The invariant is stated in the game's own
        // terms — "no second cast INSIDE the cooldown" — rather than assuming
        // barely any time passes between these two reads. It does not always:
        // the page keeps running between calls, and under a loaded machine a
        // legal recast one tick past a 480ms cooldown was being reported as a
        // spell ignoring it.
        await game.advanceSim(4);
        const recast = await game.lastCastAt(0);
        if (recast !== castAfter) {
          const effective = await game.read(i => globalThis.HS.effectiveCooldown(i), id);
          const gap = recast - castAfter;
          if (gap < effective) {
            spammable.push(`${id}: recast ${Math.round(gap)}ms after the last cast, ` +
              `inside its ${effective}ms cooldown (declared ${spell.cooldown}ms)`);
          }
        }
        await game.page.keyboard.up('KeyE');

        await game.advanceSim(25); // and again once the spell has reached the world
        const settled = await game.fingerprint();

        const evidence = [...evidenceOf(before, instant), ...evidenceOf(before, settled)];
        if (!evidence.length) inert.push(id);
      }

      expect(notAccepted, 'these spells were in the slot but never fired').toEqual([]);
      expect(spammable, 'these spells fired twice inside their own cooldown').toEqual([]);
      expect(inert, 'these spells cast without changing anything in the world').toEqual([]);
    });
  });
}

test.describe('casting rules', () => {
  test('an empty slot casts nothing', async ({ page, errors }) => {
    void errors;
    const game = await idleArena(page);
    await game.read(() => { globalThis.HS.players[0].slots[0] = null; });
    const before = await game.lastCastAt(0);
    await game.page.keyboard.down('KeyE');
    await game.advanceSim(10);
    await game.page.keyboard.up('KeyE');
    expect(await game.lastCastAt(0)).toBe(before);
  });

  test('the two slots hold different spells and fire independently', async ({ page, errors }) => {
    void errors;
    const game = await idleArena(page);
    await game.grantSpell('fireball', { slot: 0 });
    await game.grantSpell('frost', { slot: 1 });

    const before = [await game.lastCastAt(0), await game.lastCastAt(1)];
    await game.page.keyboard.down('KeyQ'); // slot B only
    await game.advanceSim(6);
    await game.page.keyboard.up('KeyQ');

    expect(await game.lastCastAt(1), 'Q should fire slot B').toBeGreaterThan(before[1]);
    expect(await game.lastCastAt(0), 'Q must not fire slot A').toBe(before[0]);
  });

  test('a cooldown expires and the spell fires again', async ({ page, errors }) => {
    void errors;
    const game = await idleArena(page);
    await game.grantSpell('fireball', { slot: 0 }); // 450ms
    await game.page.keyboard.down('KeyE');
    await game.advanceSim(4);
    const first = await game.lastCastAt(0);
    await game.advanceSim(40); // ~666ms, comfortably past 450ms
    const second = await game.lastCastAt(0);
    await game.page.keyboard.up('KeyE');
    expect(second, 'holding the key should recast once the cooldown lapses').toBeGreaterThan(first);
  });

  test('a dead wizard casts nothing', async ({ page, errors }) => {
    void errors;
    const game = await idleArena(page);
    await game.grantSpell('fireball', { slot: 0 });
    await game.kill(0);
    await game.advanceSim(2);
    const before = await game.lastCastAt(0);
    await game.page.keyboard.down('KeyE');
    await game.advanceSim(10);
    await game.page.keyboard.up('KeyE');
    expect(await game.lastCastAt(0), 'the dead do not cast').toBe(before);
  });
});
