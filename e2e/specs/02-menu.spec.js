// 02-menu — the opening screen, on the page a player actually loads.
//
// This is the only spec that runs against plain /index.html. Everywhere else the
// suite uses ?nomenu, which suppresses mountMenu() — so if the menu were not
// tested here it would not be tested at all. It is also the game's only real
// DOM, which is why these assertions read elements instead of sim state.
import { test, expect } from '../support/fixtures.js';

test.describe('opening menu', () => {
  test.beforeEach(async ({ page, errors }) => {
    void errors;
    await page.goto('/index.html');
    await expect(page.locator('#netmenu')).toBeVisible();
  });

  test('offers a name and the two ways to play', async ({ page }) => {
    await expect(page.locator('#hslogo')).toHaveText('HYPERSPELL');
    await expect(page.locator('#hstag')).toHaveText('WIZARDS · PHYSICS · VIOLENCE');
    await expect(page.locator('#netname')).toBeVisible();
    const buttons = page.locator('#netmenu button');
    await expect(buttons).toHaveCount(2);
    await expect(buttons.nth(0)).toHaveAttribute('data-mode', 'couch');
    await expect(buttons.nth(1)).toHaveAttribute('data-mode', 'online');
  });

  test('the name box caps a wizard name at 12 characters', async ({ page }) => {
    await expect(page.locator('#netname')).toHaveAttribute('maxlength', '12');
    await page.locator('#netname').fill('ABCDEFGHIJKLMNOPQRSTUV');
    expect((await page.locator('#netname').inputValue()).length).toBeLessThanOrEqual(12);
  });

  /**
   * The regression this guards is nasty and invisible: the game's shortcuts are
   * window-level keydown listeners, so without menu.js's stopPropagation a
   * wizard named "BOB" would add a bot with the B and set the win target to 3
   * with a 3 — silently, before the match even starts.
   *
   * Asserted the way the guard works: a window-level bubble listener (exactly
   * what join.js installs) must not see keys typed into the name box.
   */
  test('typing a name does not reach the game shortcuts', async ({ page }) => {
    await page.evaluate(() => {
      globalThis.__leaked = [];
      addEventListener('keydown', e => globalThis.__leaked.push(e.code));
      addEventListener('keyup', e => globalThis.__leaked.push(e.code));
    });
    await page.locator('#netname').click();
    await page.locator('#netname').type('B3MRT');
    expect(await page.evaluate(() => globalThis.__leaked),
      'keys typed into the name box reached the window — they would fire game shortcuts').toEqual([]);
  });

  test('a typed name is remembered for next time', async ({ page }) => {
    await page.locator('#netname').fill('GANDALF');
    await page.locator('button[data-mode="couch"]').click();
    expect(await page.evaluate(() => localStorage.getItem('hs-name-0'))).toBe('GANDALF');

    await page.reload();
    await expect(page.locator('#netname')).toHaveValue('GANDALF');
  });

  test('a name is cleaned before it is stored', async ({ page }) => {
    // cleanName keeps word characters, space, - ' ! and . — and drops the rest.
    await page.locator('#netname').fill('A<B>&C');
    await page.locator('button[data-mode="couch"]').click();
    expect(await page.evaluate(() => localStorage.getItem('hs-name-0'))).toBe('ABC');
  });

  test('an empty name is not stored over a previous one', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('hs-name-0', 'MERLIN'));
    await page.reload();
    await page.locator('#netname').fill('');
    await page.locator('button[data-mode="couch"]').click();
    expect(await page.evaluate(() => localStorage.getItem('hs-name-0'))).toBe('MERLIN');
  });

  test('COUCH dismisses the menu and reveals the arena', async ({ page }) => {
    await page.locator('button[data-mode="couch"]').click();
    await expect(page.locator('#netmenu')).toHaveCount(0);
    await expect(page.locator('canvas#game')).toBeVisible();
  });

  test('COUCH marks the name as already asked so the lobby does not re-ask', async ({ page }) => {
    await page.locator('#netname').fill('RADAGAST');
    await page.locator('button[data-mode="couch"]').click();
    // join.js:45 reads this to skip reopening a name editor over the lobby,
    // where stray keypresses would silently append letters to the wizard's name.
    expect(await page.evaluate(() => globalThis.nameSetViaMenu)).toBe(true);
  });

  test('clicking the menu background does nothing', async ({ page }) => {
    await page.locator('#hstag').click();
    await expect(page.locator('#netmenu')).toBeVisible();
  });

  // A double-clicked index.html has no server to play online against, so js/net.js
  // never offered the choice. The port kept that behaviour and this proves it.
  test('a file:// page goes straight to the couch with no menu', async ({ page, errors }) => {
    errors.allow(/Failed to load resource/i); // file:// favicon
    const { fileURLToPath } = await import('node:url');
    const { dirname, join } = await import('node:path');
    const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
    await page.goto(`file://${join(repo, 'index.html')}`);
    await page.waitForTimeout(500);
    await expect(page.locator('#netmenu')).toHaveCount(0);
    await expect(page.locator('canvas#game')).toBeVisible();
  });
});
