// 10-bosses — every boss in the game, summoned and fought in a browser.
//
// The roster comes from e2e/manifest.json, so a boss added today is fought
// today. Secret bosses are included: they are 12% of boss rounds and have two
// demo keys of their own (T and N), which makes them the least-played and
// most-likely-to-rot content in the game.
import { test, expect } from '../support/fixtures.js';
import { loadManifest } from '../tools/surface.js';

const { bosses, secretBosses, constants } = loadManifest();
const roster = [...bosses.map(b => ({ ...b, secret: false })), ...secretBosses.map(b => ({ ...b, secret: true }))];

test.describe('the roster', () => {
  test('the manifest and the running game hold the same bosses', async ({ game }) => {
    const live = await game.read(() => ({
      bosses: globalThis.HS.BOSSES.map(b => b.id),
      secret: globalThis.HS.SECRET_BOSSES.map(b => b.id),
    }));
    expect(live.bosses, 'run `npm run e2e:update` if this is an intended change').toEqual(bosses.map(b => b.id));
    expect(live.secret).toEqual(secretBosses.map(b => b.id));
  });

  for (const boss of roster) {
    test(`${boss.name} spawns, takes damage, and dies`, async ({ game }) => {
      test.setTimeout(90_000);
      await game.startRoundWithBots(2);

      const spawned = await game.read(id => {
        const H = globalThis.HS;
        const bs = H.spawnBoss(H.simNow(), { bossId: id });
        return bs ? { id: bs.def.id, name: bs.def.name, hp: bs.hp, maxHp: bs.maxHp, title: bs.title } : null;
      }, boss.id);

      expect(spawned, `${boss.name} did not spawn`).not.toBeNull();
      expect(spawned.id).toBe(boss.id);
      expect(spawned.hp, 'a boss with no health is not a fight').toBeGreaterThan(0);
      expect(spawned.hp).toBe(spawned.maxHp);

      // It runs: a boss that throws in its own update is the failure the console
      // guard catches here.
      await game.advanceSim(120);

      // Untouchable until the awaken banner lands — the telegraph is deliberate
      // (boss.js C12), so damage before it must not register.
      const beforeAnnounce = await game.read(dmg => {
        const H = globalThis.HS;
        H.game.boss.announced = false;
        const was = H.game.boss.hp;
        H.damageBoss(dmg, null, null);
        return { was, now: H.game.boss.hp };
      }, 50);
      expect(beforeAnnounce.now, 'a boss must be untouchable until it has been announced')
        .toBe(beforeAnnounce.was);

      const afterAnnounce = await game.read(dmg => {
        const H = globalThis.HS;
        H.game.boss.announced = true;
        const was = H.game.boss.hp;
        H.damageBoss(dmg, null, null);
        return { was, now: H.game.boss.hp };
      }, 50);
      expect(afterAnnounce.now, 'an announced boss must take damage').toBeLessThan(afterAnnounce.was);

      // And it can be finished off.
      await game.read(() => {
        const H = globalThis.HS;
        H.game.boss.announced = true;
        H.damageBoss(H.game.boss.hp + 1, null, null);
      });
      await game.advanceSim(30);
      expect(await game.read(() => globalThis.HS.game.boss), `${boss.name} survived a killing blow`).toBeNull();
    });
  }
});

test.describe('boss rounds', () => {
  test('a boss scales with the number of wizards fighting it', async ({ game }) => {
    await game.startRoundWithBots(2);
    const two = await game.read(() => {
      const H = globalThis.HS;
      const bs = H.spawnBoss(H.simNow(), { bossId: 'dragon' });
      const hp = bs.maxHp;
      H.slayBoss();
      return hp;
    });

    await game.reset();
    await game.addBot(4);
    await game.startMatch();
    const six = await game.read(() => {
      const H = globalThis.HS;
      const bs = H.spawnBoss(H.simNow(), { bossId: 'dragon' });
      return bs.maxHp;
    });
    expect(six, 'six wizards should face a bigger dragon than two').toBeGreaterThan(two);
  });

  test('a wipe against a boss resets everyone to zero round wins', async ({ game }) => {
    await game.startRoundWithBots(2);
    await game.read(() => {
      const H = globalThis.HS;
      H.spawnBoss(H.simNow(), { bossId: 'golem' });
      for (const p of H.players) p.roundWins = 2;
    });
    await game.kill(0);
    await game.kill(1);
    await game.waitFor(() => globalThis.HS.game.state === 'ROUND_END', { timeoutMs: 30_000, label: 'the wipe to resolve' });
    // A co-op boss fight is not won by outliving the others — losing to it
    // wipes the score (match.js checkRoundEnd, the game.boss branch).
    expect((await game.players()).every(p => p.roundWins === 0)).toBe(true);
    expect(await game.read(() => globalThis.HS.game.winner)).toBeNull();
  });

  test('isBossRound tells the truth', async ({ game }) => {
    await game.startRoundWithBots(2);
    expect(await game.read(() => globalThis.HS.isBossRound())).toBe(false);
    await game.read(() => globalThis.HS.spawnBoss(globalThis.HS.simNow(), { bossId: 'kraken' }));
    expect(await game.read(() => globalThis.HS.isBossRound())).toBe(true);
  });

  test(`bosses are scheduled every ${constants.BOSS_EVERY} rounds`, async ({ game }) => {
    expect(await game.read(() => globalThis.HS.BOSS_EVERY)).toBe(constants.BOSS_EVERY);
  });
});

test.describe('the secret boss demo keys', () => {
  // README-adjacent behaviour: T and N drop straight into a named boss fight,
  // and they join you if the lobby is empty. Made for showing the game off, so
  // they break silently and nobody notices until the demo.
  for (const [key, id, name] of [['KeyT', 'rizard', 'THE RIZARD'], ['KeyN', 'manu', 'MANU']]) {
    test(`${key} drops straight into ${name}`, async ({ game }) => {
      expect(await game.playerCount()).toBe(0);
      await game.pressUntil(key, () => globalThis.HS.game.state === 'PLAY' && !!globalThis.HS.game.boss,
        { label: `the ${name} fight` });

      expect(await game.playerCount(), 'the demo key should seat you if the lobby is empty').toBeGreaterThan(0);
      expect((await game.state()).state).toBe('PLAY');
      expect(await game.read(() => globalThis.HS.game.boss.def.id)).toBe(id);
      expect((await game.state()).mode, 'the demo is a versus fight').toBe('versus');

      await game.advanceSim(120); // it has to actually run
      expect(await game.read(() => globalThis.HS.game.boss.hp)).toBeGreaterThan(0);
    });
  }

  test('a demo key does not fire while a name is being typed', async ({ game }) => {
    await game.seatKeyboardPlayer(0, { confirmName: false });
    await game.type('T');
    expect(await game.read(() => globalThis.HS.game.boss), 'T typed into a name must not summon a boss').toBeFalsy();
    expect(await game.nameEditBuffer()).toBe('T');
  });
});
