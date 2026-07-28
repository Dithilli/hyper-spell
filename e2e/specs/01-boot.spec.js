// 01-boot — the page loads and the game is alive on it.
//
// Everything else in this suite assumes these. @engine marks the two that
// Firefox and WebKit also run, because a canvas or module failure specific to an
// engine shows up here or nowhere.
import { test, expect } from '../support/fixtures.js';
import { GamePage } from '../support/game.js';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// The checkout under test, which is this one unless HS_E2E_GAME_DIR points the
// suite at another (see GAME_DIR in playwright.config.js).
const REPO = process.env.HS_E2E_GAME_DIR || join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const listJs = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? listJs(join(dir, e.name)) : e.name.endsWith('.js') ? [join(dir, e.name)] : []);

test.describe('boot', () => {
  test('@engine the real page loads a canvas and logs nothing', async ({ page, errors }) => {
    void errors;
    await page.goto('/index.html');
    const canvas = page.locator('canvas#game');
    await expect(canvas).toBeVisible();
    expect(await canvas.getAttribute('width')).toBe('1280');
    expect(await canvas.getAttribute('height')).toBe('720');
    await expect(page).toHaveTitle('HYPERSPELL');
  });

  test('@engine the arena paints', async ({ page, errors }) => {
    void errors;
    const game = new GamePage(page);
    await game.boot();
    await game.advance(500); // real rAF frames, real draw()
    await game.expectPainted();
  });

  // This game changes every day. A suite that silently tests a bundle built last
  // week reports a green board for code nobody ran, so the freshness of dist/ is
  // itself worth asserting rather than trusting globalSetup to have worked.
  test('dist/ was built from the current src/', async () => {
    const source = readFileSync(join(REPO, 'src/version.js'), 'utf8');
    const version = source.match(/GAME_VERSION\s*=\s*(\d+)/)[1];
    const bundle = readFileSync(join(REPO, 'dist/hyperspell.js'), 'utf8');
    expect(bundle, 'dist/hyperspell.js does not carry the current GAME_VERSION')
      .toContain(`GAME_VERSION = ${version}`);

    const newestSrc = Math.max(...listJs(join(REPO, 'src')).map(f => statSync(f).mtimeMs));
    const built = statSync(join(REPO, 'dist/hyperspell.js')).mtimeMs;
    expect(built, 'dist/hyperspell.js is older than src/ — the suite is testing a stale bundle')
      .toBeGreaterThanOrEqual(newestSrc);
  });

  test('the game boots into an empty lobby on map 0', async ({ game }) => {
    const state = await game.state();
    expect(state.state).toBe('LOBBY');
    expect(state.mode).toBe('versus');
    expect(state.winsNeeded).toBe(5);
    expect(await game.playerCount()).toBe(0);
    expect(await game.read(() => !!globalThis.HS.currentMap)).toBe(true);
  });

  test('the content the game advertises is all registered', async ({ game }) => {
    const counts = await game.read(() => ({
      spells: Object.keys(globalThis.HS.SPELLS).length,
      maps: globalThis.HS.MAPS.length,
      bosses: globalThis.HS.BOSSES.length,
      secret: globalThis.HS.SECRET_BOSSES.length,
    }));
    // README promises "~104 spells, ~104 maps"; the floor is what matters — an
    // empty registry is the failure this catches.
    expect(counts.spells).toBeGreaterThanOrEqual(100);
    expect(counts.maps).toBeGreaterThanOrEqual(100);
    expect(counts.bosses).toBeGreaterThan(0);
    expect(counts.secret).toBeGreaterThan(0);
  });

  test('every map has a unique name', async ({ game }) => {
    const names = await game.read(() => globalThis.HS.MAPS.map(m => m.name));
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    expect(dupes, `duplicate map names: ${[...new Set(dupes)].join(', ')}`).toEqual([]);
  });

  test('the corner links point at pages that exist', async ({ page, errors }) => {
    void errors;
    await page.goto('/index.html');
    for (const [id, href] of [['#galleryLink', 'art-gallery.html'], ['#guideLink', 'spell-guide.html']]) {
      const link = page.locator(id);
      await expect(link).toHaveAttribute('href', href);
      const res = await page.request.get(`/${href}`);
      expect(res.status(), `${href} should be served`).toBe(200);
    }
  });

  test('the canvas keeps its 16:9 aspect when the window is small', async ({ page, errors }) => {
    void errors;
    await page.goto('/index.html');
    await page.setViewportSize({ width: 800, height: 600 });
    const box = await page.locator('canvas#game').boundingBox();
    expect(Math.abs(box.width / box.height - 16 / 9)).toBeLessThan(0.02);
    expect(box.width).toBeLessThanOrEqual(800);
  });
});
