// 13-aux-pages — the two pages linked from the corner of the arena.
//
// Both are generated from the game's own tables, and both are the kind of page
// nobody opens for weeks. The spell guide says of itself that it is "generated
// live from the game's own spellbook, so it is always true" — this is what makes
// that sentence checkable.
import { test, expect } from '../support/fixtures.js';
import { loadManifest } from '../tools/surface.js';

const manifest = loadManifest();
const spellNames = Object.values(manifest.spells).map(s => s.name);

test.describe('the spell guide', () => {
  test('@engine loads and renders its generated content', async ({ page, errors }) => {
    void errors;
    await page.goto('/spell-guide.html');
    await expect(page).toHaveTitle(/Spell Guide/i);
    // The page's inline script reads globals published by dist/spell-guide.js.
    // A missing one is a ReferenceError on the first statement, which aborts the
    // script and leaves the page blank below the static prose — so "there are
    // tables at all" is the real assertion here.
    await expect(page.locator('table').first()).toBeVisible();
    expect(await page.locator('table').count()).toBeGreaterThan(0);
  });

  test('every spell in the game appears in the guide', async ({ page, errors }) => {
    void errors;
    await page.goto('/spell-guide.html');
    await page.waitForSelector('table');
    const text = await page.locator('body').innerText();

    const missing = spellNames.filter(name => !text.includes(name));
    expect(missing,
      `the guide claims to be generated from the spellbook, but ${missing.length} spells are not in it`)
      .toEqual([]);
  });

  test('the guide agrees with the game about cooldowns', async ({ page, errors }) => {
    void errors;
    await page.goto('/spell-guide.html');
    await page.waitForSelector('table');
    // CAST_FLOOR is the floor every declared cooldown is raised to, and the
    // guide draws the ENFORCED number. A guide showing the declared one would be
    // telling players a spell is faster than it is.
    const floor = await page.evaluate(() => globalThis.CAST_FLOOR);
    expect(floor, 'the guide needs CAST_FLOOR to report honest cooldowns').toBeGreaterThan(0);

    const liveNames = await page.evaluate(() => Object.values(globalThis.SPELLS).map(s => s.name));
    expect(liveNames.sort()).toEqual([...spellNames].sort());
  });

  test('the fusion families are all published to the page', async ({ page, errors }) => {
    void errors;
    await page.goto('/spell-guide.html');
    const families = await page.evaluate(() =>
      ['F_FIRE', 'F_ICE', 'F_ZAP', 'F_AIR', 'F_EARTH', 'F_VOID', 'F_LIFE', 'F_TRICK']
        .map(k => [k, Array.isArray(globalThis[k]) ? globalThis[k].length : null]));
    const broken = families.filter(([, n]) => !n);
    expect(broken.map(([k]) => k), 'these fusion families reached the page empty or undefined').toEqual([]);
  });

  test('the back link returns to the arena', async ({ page, errors }) => {
    void errors;
    await page.goto('/spell-guide.html');
    await expect(page.locator('a.back')).toHaveAttribute('href', 'index.html');
    await page.locator('a.back').click();
    await expect(page.locator('canvas#game')).toBeVisible();
  });
});

test.describe('the art gallery', () => {
  test('@engine loads with every section filled in', async ({ page, errors }) => {
    void errors;
    await page.goto('/art-gallery.html');
    // Each grid is populated by the page's own script; an empty one means that
    // script died partway.
    for (const id of ['champs', 'cards', 'biomes', 'terrain', 'effects']) {
      const grid = page.locator(`#${id}`);
      await expect(grid, `#${id} is missing`).toBeAttached();
      await expect
        .poll(() => grid.locator('> *').count(), { timeout: 15_000, message: `#${id} never filled in` })
        .toBeGreaterThan(0);
    }
  });

  test('the gallery canvases actually paint', async ({ page, errors }) => {
    void errors;
    await page.goto('/art-gallery.html');
    await page.waitForFunction(() => document.querySelectorAll('canvas').length > 0, null, { timeout: 15_000 });
    await page.waitForTimeout(1200); // the gallery animates; give it frames

    const painted = await page.evaluate(() => {
      const out = { total: 0, blank: 0 };
      for (const canvas of document.querySelectorAll('canvas')) {
        if (!canvas.width || !canvas.height) continue;
        out.total++;
        const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        let lit = 0;
        for (let i = 3; i < data.length; i += 4 * 97) if (data[i] > 8) lit++;
        if (lit === 0) out.blank++;
      }
      return out;
    });
    expect(painted.total, 'the gallery drew no canvases at all').toBeGreaterThan(0);
    expect(painted.blank, `${painted.blank} of ${painted.total} gallery canvases are blank`).toBe(0);
  });
});
