// online.js — driving a browser tab through the opening menu into a real match.
//
// Online tabs cannot use ?nomenu: that flag is what suppresses the menu, and the
// menu is where PLAY ONLINE lives. So there is no window.HS on these pages and
// assertions come from the three things a real client actually has:
//
//   the DOM        the menu, its status line, whether it went away
//   the canvas     whether anything is being rendered from server snapshots
//   the WebSocket  every frame the server sent, read from the client's side
//
// That last one is the point of this spec. server/verify-e2e.js already drives
// the protocol with its own WebSocket clients; what it cannot do is prove the
// BROWSER speaks it — that a click on PLAY ONLINE produces a hello, that a
// keypress becomes a message, that snapshots arrive and get drawn.

/**
 * Record every frame in both directions for the life of the page.
 * Must be called before the page navigates, or the socket opens unseen.
 */
export function watchSockets(page) {
  const wire = { received: [], sent: [], sockets: 0, closed: 0 };
  page.on('websocket', ws => {
    wire.sockets++;
    ws.on('framereceived', frame => {
      try { wire.received.push(JSON.parse(frame.payload)); } catch { /* binary, not ours */ }
    });
    ws.on('framesent', frame => {
      try { wire.sent.push(JSON.parse(frame.payload)); } catch { /* ignore */ }
    });
    ws.on('close', () => { wire.closed++; });
  });
  wire.got = type => wire.received.filter(m => m.t === type);
  wire.first = type => wire.received.find(m => m.t === type);
  wire.last = type => [...wire.received].reverse().find(m => m.t === type);
  wire.put = type => wire.sent.filter(m => m.t === type);
  return wire;
}

/** Wait for a condition on the recorded wire, or say what did arrive. */
export async function waitForWire(wire, predicate, { timeoutMs = 20_000, label = 'a wire condition' } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate(wire)) return;
    await new Promise(r => setTimeout(r, 100));
  }
  const seen = [...new Set(wire.received.map(m => m.t))].join(', ') || 'nothing';
  throw new Error(`timed out waiting for ${label}; the server sent: ${seen}`);
}

/**
 * Open a tab, name the wizard, and click PLAY ONLINE. Resolves once the server
 * has welcomed the tab and the menu has gone away — which is the client's own
 * definition of "I am in" (menu.js passes welcome() { menu.remove() }).
 */
export async function joinOnline(context, baseUrl, name, { expectWelcome = true } = {}) {
  const page = await context.newPage();
  const wire = watchSockets(page);
  await page.goto(`${baseUrl}/index.html`);
  await page.waitForSelector('#netmenu');
  await page.fill('#netname', name);
  await page.click('button[data-mode="online"]');
  if (expectWelcome) {
    await waitForWire(wire, w => w.got('welcome').length > 0, { label: `${name}'s welcome` });
    await page.waitForSelector('#netmenu', { state: 'detached', timeout: 15_000 });
  }
  return { page, wire, name };
}

/** Open a tab and connect WITHOUT taking a seat — a spectator. */
export async function spectate(context, baseUrl) {
  const page = await context.newPage();
  const wire = watchSockets(page);
  await page.goto(`${baseUrl}/index.html`);
  await page.waitForSelector('#netmenu');
  return { page, wire };
}

/** The players the newest snapshot says are in the room. */
export function playersInSnapshot(wire) {
  const snap = wire.last('snap');
  return snap?.ps ?? [];
}

/**
 * Press a key in a tab until the server's snapshots show it landed.
 *
 * Two tabs share one browser context and only one is frontmost. A key dispatched
 * to a background tab can be dropped before the game's window listener sees it,
 * so a single press is not reliable across tabs — and unlike a local test, there
 * is a whole round trip before the effect is visible. Bringing the tab forward
 * and pressing again is what a person at two windows would do.
 */
export async function pressUntilWire(tab, key, predicate, { attempts = 20, label = 'the key to land' } = {}) {
  for (let i = 0; i < attempts; i++) {
    if (predicate(tab.wire)) return;
    await tab.page.bringToFront();
    await tab.page.keyboard.press(key);
    for (let waited = 0; waited < 10; waited++) {
      await tab.page.waitForTimeout(100);
      if (predicate(tab.wire)) return;
    }
  }
  const seen = [...new Set(tab.wire.received.map(m => m.t))].join(', ');
  throw new Error(`pressed ${key} ${attempts} times waiting for ${label}; the server sent: ${seen}`);
}
