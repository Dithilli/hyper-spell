// 09-waves — wave survival, the solo/co-op mode behind M in the lobby.
//
// Different rules from versus: one wizard is enough to start, the round ends
// only on a full-party wipe, and every tenth wave is a boss.
import { test, expect } from '../support/fixtures.js';
import { loadManifest } from '../tools/surface.js';

const { constants, enemyTypes } = loadManifest();

test.describe('starting a run', () => {
  test('M turns the lobby into wave survival', async ({ game }) => {
    await game.toggleMode();
    expect((await game.state()).mode).toBe('wave');
    await game.addBot(1);
    await game.startMatch();
    expect((await game.state()).state).toBe('PLAY');
    expect((await game.state()).wave, 'a run opens on wave 1').toBe(1);
  });

  test('wave 1 sends enemies', async ({ game }) => {
    await game.toggleMode();
    await game.addBot(1);
    await game.startMatch();
    await game.waitFor(() => globalThis.HS.enemies.size > 0 || globalThis.HS.pendingSpawns.length > 0,
      { timeoutMs: 30_000, label: 'the first wave to arrive' });
    const counts = await game.read(() => ({ live: globalThis.HS.enemies.size, queued: globalThis.HS.pendingSpawns.length }));
    expect(counts.live + counts.queued, 'a wave with no enemies is not a wave').toBeGreaterThan(0);
  });

  test('every enemy type the game knows can be spawned', async ({ game }) => {
    await game.toggleMode();
    await game.addBot(1);
    await game.startMatch();

    const failed = [];
    for (const type of enemyTypes) {
      const ok = await game.read(t => {
        const H = globalThis.HS;
        const before = H.enemies.size;
        H.spawnEnemy(t, 640, 200, 1);
        return H.enemies.size > before;
      }, type);
      if (!ok) failed.push(type);
    }
    expect(failed, 'these enemy types spawned nothing').toEqual([]);
  });

  test('an enemy can be damaged and killed through the real path', async ({ game }) => {
    await game.toggleMode();
    await game.addBot(1);
    await game.startMatch();
    const result = await game.read(() => {
      const H = globalThis.HS;
      H.clearEnemies();
      H.spawnEnemy('swordsman', 640, 200, 1);
      // `enemies` holds BODIES; the enemy record hangs off body.enemy, and that
      // is what damageEnemy/killEnemy take.
      const e = [...H.enemies][0].enemy;
      const before = H.enemies.size;
      H.damageEnemy(e, 1);
      H.killEnemy(e);
      return { before, after: H.enemies.size };
    });
    expect(result.after, 'a killed enemy should leave the arena').toBeLessThan(result.before);
  });
});

test.describe('wave progression', () => {
  test('clearing a wave advances to the next one', async ({ game }) => {
    await game.toggleMode();
    await game.addBot(1);
    await game.startMatch();
    expect((await game.state()).wave).toBe(1);

    // Clear the field the way a party does — nothing left alive — and let the
    // intermission run.
    await game.read(() => { globalThis.HS.pendingSpawns.length = 0; globalThis.HS.clearEnemies(); });
    await game.waitFor(() => globalThis.HS.game.wave > 1, { timeoutMs: 60_000, stepMs: 250, label: 'wave 2' });
    expect((await game.state()).wave).toBeGreaterThan(1);
  });

  test('the difficulty tier climbs every five waves', async ({ game }) => {
    const tiers = await game.read(() => [1, 5, 6, 10, 11, 20].map(n => globalThis.HS.waveTier(n)));
    expect(tiers[0]).toBe(1);
    expect(tiers[2], 'wave 6 should be a tier above wave 5').toBeGreaterThan(tiers[1]);
    expect(tiers[5], 'wave 20 should be harder than wave 1').toBeGreaterThan(tiers[0]);
  });

  test('every tenth wave is a boss wave', async ({ game }) => {
    const every = constants.BOSS_EVERY;
    const composition = await game.read(n => globalThis.HS.waveComposition(n), every);
    expect(every).toBe(10);
    expect(composition, 'waveComposition must describe the boss wave too').toBeTruthy();
  });

  test('a late wave is capped instead of drowning the couch', async ({ game }) => {
    // The cap lives in waveComposition, which slices the roster and warns —
    // spawnEnemy itself is uncapped by design, since bosses and spells summon
    // through it too.
    const sizes = await game.read(() => [1, 10, 30, 60, 200].map(n => globalThis.HS.waveComposition(n).length));
    expect(Math.max(...sizes),
      `no wave may ask for more than ${constants.WAVE_ENEMY_CAP} enemies at once`)
      .toBeLessThanOrEqual(constants.WAVE_ENEMY_CAP);
    expect(sizes[0], 'wave 1 should be small').toBeLessThan(constants.WAVE_ENEMY_CAP);
    expect(sizes[4], 'a very late wave should be pinned at the cap').toBe(constants.WAVE_ENEMY_CAP);
  });
});

test.describe('ending a run', () => {
  test('a full party wipe ends the run', async ({ game }) => {
    await game.toggleMode();
    await game.addBot(1);
    await game.startMatch();
    await game.kill(0);
    await game.waitFor(() => globalThis.HS.game.state === 'RUN_OVER', { timeoutMs: 30_000, label: 'the run to end' });
    expect((await game.state()).state).toBe('RUN_OVER');
  });

  test('one wizard down out of two does not end a co-op run', async ({ game }) => {
    await game.toggleMode();
    await game.addBot(2);
    await game.startMatch();
    await game.kill(0);
    await game.advanceSim(120);
    expect((await game.state()).state, 'the run continues while anyone still stands').toBe('PLAY');
  });

  test('R after a run returns to the lobby still in wave mode', async ({ game }) => {
    await game.toggleMode();
    await game.addBot(1);
    await game.startMatch();
    await game.kill(0);
    await game.waitFor(() => globalThis.HS.game.state === 'RUN_OVER', { timeoutMs: 30_000, label: 'the run to end' });
    await game.reset();
    expect((await game.state()).state).toBe('LOBBY');
  });
});
