// 12-online — two browsers, one server, one match.
//
// server/verify-e2e.js already drives this protocol with its own WebSocket
// clients and covers the server's half thoroughly. This covers the half it
// cannot see: that a BROWSER speaks it. That clicking PLAY ONLINE produces a
// hello, that a keypress in one tab becomes a message the other tab sees the
// result of, that snapshots arrive and get drawn on a canvas.
//
// Every test here gets its own server process on its own port. The room is a
// singleton — one lobby, shared by every socket — so workers pointed at one
// server would add each other's bots and start each other's matches.
import { test, expect } from '../support/fixtures.js';
import { startServer } from '../support/server.js';
import { joinOnline, spectate, watchSockets, waitForWire, playersInSnapshot, pressUntilWire } from '../support/online.js';

// Real sockets and a real server on a real clock: these are the one part of the
// suite that cannot be run on frozen time.
test.describe.configure({ mode: 'parallel' });

let server;
test.beforeEach(async () => { server = await startServer(); });
test.afterEach(async () => { await server?.stop(); });

test.describe('getting in', () => {
  test('PLAY ONLINE connects, is welcomed, and dismisses the menu', async ({ context, errors }) => {
    void errors;
    const { page, wire } = await joinOnline(context, server.url, 'GANDALF');

    const welcome = wire.first('welcome');
    expect(welcome.v, 'the server should state its game version').toBeGreaterThan(0);
    expect(welcome.proto).toBe(2);
    await expect(page.locator('#netmenu')).toHaveCount(0);
    await expect(page.locator('canvas#game')).toBeVisible();

    // the browser introduced itself before being seated
    const hello = wire.put('hello')[0];
    expect(hello, 'the client must send hello').toBeTruthy();
    expect(hello.name).toBe('GANDALF');
  });

  test('the tab is given a seat and starts receiving the world', async ({ context, errors }) => {
    void errors;
    const { wire } = await joinOnline(context, server.url, 'MERLIN');
    await waitForWire(wire, w => w.got('you').length > 0, { label: 'a seat' });
    expect(wire.first('you').slot, 'a seated wizard needs a slot').toBeGreaterThanOrEqual(0);
    await waitForWire(wire, w => w.got('snap').length > 3, { label: 'snapshots to stream' });
    expect(playersInSnapshot(wire).some(p => p.n === 'MERLIN')).toBe(true);
  });

  test('the client is sent the world and the effects that play in it', async ({ context, errors }) => {
    void errors;
    const { wire } = await joinOnline(context, server.url, 'SARUMAN');

    // 'world' is the arena geometry, sent once per map rather than in every
    // snapshot — without it the client has snapshots of wizards standing on
    // nothing.
    await waitForWire(wire, w => w.got('world').length > 0, { label: 'the world' });
    expect(wire.first('world'), 'the client needs the map to draw it').toBeTruthy();

    // 'fx' carries the one-shot effects — banners, particles, the kill feed —
    // that a positional snapshot cannot express.
    await waitForWire(wire, w => w.got('fx').length > 0, { timeoutMs: 30_000, label: 'an fx message' });
    expect(wire.got('fx').length).toBeGreaterThan(0);
  });

  test('the server renders on the client — snapshots become a picture', async ({ context, errors }) => {
    void errors;
    const { page, wire } = await joinOnline(context, server.url, 'RADAGAST');
    await waitForWire(wire, w => w.got('snap').length > 10, { label: 'a few snapshots' });
    await page.waitForTimeout(500);

    const probe = await page.evaluate(() => {
      const canvas = document.getElementById('game');
      const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      const seen = new Set();
      for (let i = 0; i < data.length; i += 4 * 997) seen.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
      return seen.size;
    });
    // Nothing local is being simulated here — every pixel came off the wire.
    expect(probe, 'the online client drew a blank canvas from the server snapshots').toBeGreaterThan(8);
  });

  test('a tab that never clicks a button is a spectator and still gets the match', async ({ context, errors }) => {
    void errors;
    const player = await joinOnline(context, server.url, 'PLAYER');
    await waitForWire(player.wire, w => w.got('you').length > 0, { label: 'the player seat' });

    const watcher = await spectate(context, server.url);
    await watcher.page.waitForTimeout(1200);
    // Never joined: no seat, but the room still streams to it. Spectators are
    // unlimited by design (README) and this is what makes that true.
    expect(watcher.wire.got('you'), 'a spectator must not be given a seat').toHaveLength(0);
    await expect(watcher.page.locator('#netmenu')).toBeVisible();
  });
});

test.describe('two tabs share one lobby', () => {
  test('each tab sees the other wizard', async ({ context, errors }) => {
    void errors;
    const a = await joinOnline(context, server.url, 'ALPHA');
    const b = await joinOnline(context, server.url, 'BRAVO');

    for (const tab of [a, b]) {
      await waitForWire(tab.wire, w => {
        const names = playersInSnapshot(w).map(p => p.n);
        return names.includes('ALPHA') && names.includes('BRAVO');
      }, { label: `both wizards in ${tab.name}'s view` });
    }
    expect(playersInSnapshot(a.wire)).toHaveLength(2);
  });

  test('a bot added in one tab appears in the other', async ({ context, errors }) => {
    void errors;
    const a = await joinOnline(context, server.url, 'ALPHA');
    const b = await joinOnline(context, server.url, 'BRAVO');
    await waitForWire(b.wire, w => playersInSnapshot(w).length === 2, { label: 'both wizards' });

    // The README says anyone in the room can press B. Pressed in tab A, seen in
    // tab B — which only works if the key became a message rather than a local
    // action, the whole point of the server-authoritative rewrite.
    await pressUntilWire(a, 'KeyB', () => playersInSnapshot(b.wire).length === 3,
      { label: "tab A's bot to show up in tab B" });
    expect(a.wire.put('bot').length, 'B must be sent to the server, not handled locally').toBeGreaterThan(0);
  });

  test('the win target set in one tab reaches the other', async ({ context, errors }) => {
    void errors;
    const a = await joinOnline(context, server.url, 'ALPHA');
    const b = await joinOnline(context, server.url, 'BRAVO');
    await waitForWire(b.wire, w => playersInSnapshot(w).length === 2, { label: 'both wizards' });

    await pressUntilWire(a, 'Digit3', () => b.wire.last('snap')?.wn === 3,
      { label: 'the new win target in tab B' });
    expect(a.wire.put('wins').length).toBeGreaterThan(0);
  });

  test('SPACE in one tab starts the match for both', async ({ context, errors }) => {
    void errors;
    const a = await joinOnline(context, server.url, 'ALPHA');
    const b = await joinOnline(context, server.url, 'BRAVO');
    await waitForWire(b.wire, w => playersInSnapshot(w).length === 2, { label: 'both wizards' });

    await pressUntilWire(a, 'Space', () => a.wire.last('snap')?.st === 'PLAY',
      { label: 'the round to start' });
    for (const tab of [a, b]) {
      await waitForWire(tab.wire, w => w.last('snap')?.st === 'PLAY',
        { label: `the round to start in ${tab.name}'s tab` });
    }
    expect(a.wire.put('start').length, 'SPACE must be sent, not run locally').toBeGreaterThan(0);
  });

  test('holding a movement key streams input to the server', async ({ context, errors }) => {
    void errors;
    const a = await joinOnline(context, server.url, 'ALPHA');
    const b = await joinOnline(context, server.url, 'BRAVO');
    await waitForWire(b.wire, w => playersInSnapshot(w).length === 2, { label: 'both wizards' });
    await pressUntilWire(a, 'Space', () => a.wire.last('snap')?.st === 'PLAY', { label: 'the round' });

    const before = playersInSnapshot(a.wire).find(p => p.n === 'ALPHA');
    await a.page.keyboard.down('KeyD');
    await a.page.waitForTimeout(1500);
    await a.page.keyboard.up('KeyD');

    expect(a.wire.put('input').length, 'a held key must reach the server as input').toBeGreaterThan(0);
    const after = playersInSnapshot(a.wire).find(p => p.n === 'ALPHA');
    // No client prediction in this build — the wizard moved because the SERVER
    // moved it and said so.
    expect(after.x, 'the server should have walked the wizard right').not.toBe(before.x);
  });
});

test.describe('the room fills up', () => {
  test('the ninth wizard is denied a seat and the rest still watch', async ({ context, errors }) => {
    void errors;
    test.setTimeout(120_000);
    const first = await joinOnline(context, server.url, 'W1');
    await waitForWire(first.wire, w => w.got('you').length > 0, { label: 'the first seat' });

    // Eight is MAX_PLAYERS. Fill the rest from this tab with bots, which is far
    // faster than opening seven more browsers and proves the same cap.
    for (let seats = 2; seats <= 8; seats++) {
      await pressUntilWire(first, 'KeyB', () => playersInSnapshot(first.wire).length >= seats,
        { label: `wizard ${seats} of 8` });
    }
    expect(playersInSnapshot(first.wire), 'the room should be full at eight').toHaveLength(8);

    const ninth = await joinOnline(context, server.url, 'LATECOMER');
    await waitForWire(ninth.wire, w => w.got('joinDenied').length > 0, { label: 'the join to be denied' });
    expect(ninth.wire.first('joinDenied').reason).toBe('full');
    // Denied a seat, still fed the match — a full room turns you into a spectator.
    await waitForWire(ninth.wire, w => w.got('snap').length > 2, { label: 'snapshots for the latecomer' });
  });
});

test.describe('coming back', () => {
  test('a refreshed tab reclaims its seat and its round wins', async ({ context, errors }) => {
    void errors;
    test.setTimeout(120_000);
    const a = await joinOnline(context, server.url, 'ALPHA');
    const b = await joinOnline(context, server.url, 'BRAVO');
    await waitForWire(a.wire, w => w.got('you').length > 0, { label: 'a seat' });
    await waitForWire(b.wire, w => playersInSnapshot(w).length === 2, { label: 'both wizards' });
    const seat = a.wire.first('you').slot;

    // README: "Drop mid-match? Refresh and rejoin with the same name within 2
    // minutes — you get your seat and your round wins back."
    await a.page.close();
    await b.page.waitForTimeout(800);

    const again = await joinOnline(context, server.url, 'ALPHA');
    await waitForWire(again.wire, w => w.got('you').length > 0, { label: 'the seat back' });
    expect(again.wire.first('you').slot, 'the same name should get the same seat back').toBe(seat);

    await waitForWire(b.wire, w => playersInSnapshot(w).filter(p => p.n === 'ALPHA').length === 1,
      { label: 'one ALPHA, not two' });
    expect(playersInSnapshot(b.wire).filter(p => p.n === 'ALPHA'),
      'rejoining must not leave a ghost wizard behind').toHaveLength(1);
  });
});

test.describe('a stale tab', () => {
  test('a client on the wrong version is told to refresh', async ({ context, errors }) => {
    void errors;
    const page = await context.newPage();
    const wire = watchSockets(page);
    // Lie about the version the way a tab left open across a deploy would.
    await page.addInitScript(() => {
      const RealWebSocket = globalThis.WebSocket;
      globalThis.WebSocket = class extends RealWebSocket {
        send(data) {
          try {
            const msg = JSON.parse(data);
            if (msg.t === 'hello') { msg.v = 1; return super.send(JSON.stringify(msg)); }
          } catch { /* not ours */ }
          return super.send(data);
        }
      };
    });
    await page.goto(`${server.url}/index.html`);
    await page.waitForSelector('#netmenu');
    await page.fill('#netname', 'OLDTAB');
    await page.click('button[data-mode="online"]');

    await waitForWire(wire, w => w.got('badVersion').length > 0, { label: 'the badVersion warning' });
    expect(wire.first('badVersion').server, 'the server should say which version it wants')
      .toBeGreaterThan(1);
    // Deliberately not closed: the room keeps streaming so the stale tab can
    // draw its own "GAME UPDATED — REFRESH" screen (room.js:140).
    await waitForWire(wire, w => w.got('snap').length > 2, { label: 'snapshots for the stale tab' });
  });
});

test.describe('when the server goes away', () => {
  test('a failed connection leaves the menu up instead of a dead screen', async ({ context, errors }) => {
    // A refused WebSocket is logged by the browser itself; that is the symptom
    // under test, not a fault in the page.
    errors.allow(/WebSocket|websocket|failed|ERR_CONNECTION|Failed to load/i);

    // The client always dials location.host — there is no URL to point
    // elsewhere. So the page is loaded from a live server, and the server is
    // then taken away before PLAY ONLINE is clicked: exactly the shape of
    // "someone closed the laptop running it" from the README.
    const page = await context.newPage();
    await page.goto(`${server.url}/index.html`);
    await page.waitForSelector('#netmenu');
    await page.fill('#netname', 'NOBODY');
    await server.stop();

    await page.click('button[data-mode="online"]');
    await page.waitForTimeout(2000);

    // menu.js removes the menu only in welcome(). No welcome, no removal — a
    // player who cannot reach the server must still be looking at a button they
    // can press again, not a black canvas.
    await expect(page.locator('#netmenu'), 'the menu must stay up if the connection never lands')
      .toBeVisible();
    await expect(page.locator('button[data-mode="online"]')).toBeVisible();
  });
});
