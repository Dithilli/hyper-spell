// 14-manifest-drift — did the game change today?
//
// This is the spec that makes the rest of the suite survive a game that changes
// daily. Specs 06, 07 and 10 iterate e2e/manifest.json, so if the manifest and
// the game disagree, those sweeps are testing a game that no longer exists.
//
// A failure here is not necessarily a bug. It usually means you added something,
// and the fix is one command:
//
//     npm run e2e:update      # re-read the game
//     git diff e2e/manifest.json   # a changelog of what today did to the surface
//
// What it protects against is the other case: content or controls disappearing
// without anyone deciding they should.
import { test, expect } from '../support/fixtures.js';
import { loadManifest, liveSurface, sourceSurface } from '../tools/surface.js';

const manifest = loadManifest();
const UPDATE = 'run `npm run e2e:update` and review the diff if this change was intended';

test.describe('the manifest still describes this game', () => {
  test('the spellbook matches', async ({ game }) => {
    const live = await liveSurface(game.page);
    expect(Object.keys(live.spells).sort(), `the spell list has drifted — ${UPDATE}`)
      .toEqual(Object.keys(manifest.spells).sort());

    const changed = Object.entries(live.spells)
      .filter(([id, s]) => {
        const was = manifest.spells[id];
        return was && (s.name !== was.name || s.cooldown !== was.cooldown || s.color !== was.color);
      })
      .map(([id, s]) => `${id}: ${manifest.spells[id].name}/${manifest.spells[id].cooldown}ms ` +
        `→ ${s.name}/${s.cooldown}ms`);
    expect(changed, `spell stats have changed — ${UPDATE}`).toEqual([]);
  });

  test('the map book matches', async ({ game }) => {
    const live = await liveSurface(game.page);
    expect(live.maps.map(m => m.name), `the map list has drifted — ${UPDATE}`)
      .toEqual(manifest.maps.map(m => m.name));

    const changed = live.maps
      .filter((m, i) => {
        const was = manifest.maps[i];
        return was && (m.gravity !== was.gravity || m.wrap !== was.wrap || m.spawns !== was.spawns);
      })
      .map(m => m.name);
    expect(changed, `these maps changed shape — ${UPDATE}`).toEqual([]);
  });

  test('the boss roster matches', async ({ game }) => {
    const live = await liveSurface(game.page);
    expect(live.bosses.map(b => b.id), `the boss roster has drifted — ${UPDATE}`)
      .toEqual(manifest.bosses.map(b => b.id));
    expect(live.secretBosses.map(b => b.id), `the secret boss roster has drifted — ${UPDATE}`)
      .toEqual(manifest.secretBosses.map(b => b.id));
    expect(live.enemyTypes, `the enemy roster has drifted — ${UPDATE}`).toEqual(manifest.enemyTypes);
  });

  test('the tuning constants match', async ({ game }) => {
    const live = await liveSurface(game.page);
    expect(live.constants, `a game constant changed — ${UPDATE}`).toEqual(manifest.constants);
  });
});

test.describe('the controls still look like the manifest', () => {
  // Read from src/, not the browser: keybindings and net message arms exist only
  // as code. This is also exactly what the coverage auditor reads, so a drift
  // here means the auditor is checking a stale list.
  const source = sourceSurface();

  test('the keybindings match', () => {
    expect(source.keyCodes, `a keybinding was added or removed — ${UPDATE}`).toEqual(manifest.source.keyCodes);
    expect(source.keymaps, `a keymap changed — ${UPDATE}`).toEqual(manifest.source.keymaps);
  });

  test('the game states match', () => {
    expect(source.gameStates, `a game state was added or removed — ${UPDATE}`).toEqual(manifest.source.gameStates);
  });

  test('the network messages match', () => {
    expect(source.netMessages, `the client handles a different set of server messages — ${UPDATE}`)
      .toEqual(manifest.source.netMessages);
  });

  test('the menu buttons and storage keys match', () => {
    expect(source.menuModes, `the opening menu changed — ${UPDATE}`).toEqual(manifest.source.menuModes);
    expect(source.storageKeys, `the game reads or writes different storage — ${UPDATE}`)
      .toEqual(manifest.source.storageKeys);
  });

  test('no new user-facing file has appeared unnoticed', () => {
    expect(source.platformFiles, `src/platform/ gained or lost a file — ${UPDATE}`)
      .toEqual(manifest.source.platformFiles);
    expect(source.renderFiles, `src/render/ gained or lost a file — ${UPDATE}`)
      .toEqual(manifest.source.renderFiles);
  });
});
