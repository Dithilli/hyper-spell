// 13-sessions — starting a session, sharing its code, and getting in with it.
//
// The whole online entry path as a player meets it: the menu screens, the
// six-character code, the invite link, and the gate that keeps a browser with
// no code out of the match. Runs against plain /index.html (like 02-menu),
// because the menu is what is under test.
//
// A fresh server per test, not the shared one: a server holds exactly one
// session, and every test here begins from "nobody has hosted yet".
import { test, expect } from '../support/fixtures.js';
import { startServer } from '../support/server.js';

const CHAR = '[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]';
const CODE_RE = new RegExp(`^${CHAR}{3}-${CHAR}{3}$`);

let server;
test.beforeEach(async () => { server = await startServer(); });
test.afterEach(async () => { await server?.stop(); });

// name → PLAY ONLINE → the session screen
async function online(page, name, query = '') {
  await page.goto(`${server.url}/index.html${query}`);
  await expect(page.locator('#netmenu')).toBeVisible();
  await page.locator('#netname').fill(name);
  await page.locator('button[data-mode="online"]').click();
}

test.describe('session codes', () => {
  test('the first player is offered a session to start, and gets a code', async ({ page }) => {
    await online(page, 'HOST');
    await expect(page.locator('button[data-act="host"]')).toBeVisible();
    await page.locator('button[data-act="host"]').click();

    const code = page.locator('#hscodebig');
    await expect(code).toBeVisible();
    expect((await code.textContent()).trim()).toMatch(CODE_RE);
    await expect(page.locator('button[data-act="copy"]')).toBeVisible();

    // ENTER THE LOBBY dismisses the menu and leaves you in the match
    await page.locator('button[data-act="play"]').click();
    await expect(page.locator('#netmenu')).toHaveCount(0);
  });

  test('a second player is asked for the code, and the wrong one is refused', async ({ page, context }) => {
    const hostPage = await context.newPage();
    await online(hostPage, 'HOST');
    await hostPage.locator('button[data-act="host"]').click();
    const code = (await hostPage.locator('#hscodebig').textContent()).trim();

    await online(page, 'GUEST');
    // the server told this menu a session is already live
    await expect(page.locator('#hscode')).toBeVisible();
    await page.locator('#hscode').fill('ZZZ-999');
    await page.locator('button[data-act="join"]').click();
    await expect(page.locator('#netstatus')).toContainText('does not match');
    await expect(page.locator('#netmenu')).toBeVisible();

    // …and the right one, in the shape a person would type it, gets in
    await page.locator('#hscode').fill(code.toLowerCase());
    await page.locator('button[data-act="join"]').click();
    await expect(page.locator('#netmenu')).toHaveCount(0);
    await hostPage.close();
  });

  test('an invite link joins with no typing at all', async ({ page, context }) => {
    const hostPage = await context.newPage();
    await online(hostPage, 'HOST');
    await hostPage.locator('button[data-act="host"]').click();
    const code = (await hostPage.locator('#hscodebig').textContent()).trim().replace('-', '');

    await online(page, 'INVITED', `?code=${code}`);
    // no code box to fill in: the link carried it
    await expect(page.locator('#netmenu')).toHaveCount(0);
    await hostPage.close();
  });

  test('a browser without the code is never sent the match', async ({ page, context }) => {
    const hostPage = await context.newPage();
    await online(hostPage, 'HOST');
    await hostPage.locator('button[data-act="host"]').click();
    await hostPage.locator('button[data-act="play"]').click();

    // count snapshot frames arriving on a socket that never presented a code
    await online(page, 'LURKER');
    const snaps = await page.evaluate(() => new Promise((resolve) => {
      const ws = new WebSocket(`ws://${location.host}/ws`);
      let n = 0;
      ws.onmessage = (ev) => { if (JSON.parse(ev.data).t === 'snap') n++; };
      ws.onopen = () => {
        ws.send(JSON.stringify({ t: 'hello', v: 9, name: 'LURKER' }));
        setTimeout(() => { ws.close(); resolve(n); }, 1500);
      };
    }));
    expect(snaps, 'a codeless connection was streamed the match').toBe(0);
    await hostPage.close();
  });
});
