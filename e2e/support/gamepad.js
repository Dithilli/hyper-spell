// gamepad.js — a fake HID pad, because CI has no controllers.
//
// The Gamepad API is poll-only: nothing dispatches events, the game just reads
// navigator.getGamepads() every frame (join.js:126, input-gamepad.js:10). So a
// faithful fake is a fake of that one function, and everything downstream —
// seating, the letter-ribbon name wheel, the lobby shortcuts, movement, casting
// — runs the game's real code against it.
//
// Must be installed before the page loads, so call this before GamePage.boot().

/** @param {import('@playwright/test').Page} page */
export async function installFakeGamepads(page) {
  await page.addInitScript(() => {
    const pads = [];
    const makePad = (index, pressed, axes) => ({
      index,
      id: 'HYPERSPELL test pad (STANDARD GAMEPAD)',
      connected: true,
      mapping: 'standard',
      timestamp: 0,
      axes: [axes[0] ?? 0, axes[1] ?? 0, axes[2] ?? 0, axes[3] ?? 0],
      // 17 buttons is the standard mapping; the game indexes up to 15.
      buttons: Array.from({ length: 17 }, (_, i) => ({
        pressed: pressed.includes(i), touched: pressed.includes(i), value: pressed.includes(i) ? 1 : 0,
      })),
    });

    globalThis.__pad = {
      plug(index = 0) { pads[index] = makePad(index, [], []); },
      unplug(index = 0) { pads[index] = null; },
      set(index, { buttons = [], axes = [] } = {}) { pads[index] = makePad(index, buttons, axes); },
      clear() { pads.length = 0; },
    };

    // Defined on the instance so it shadows Navigator.prototype.getGamepads.
    Object.defineProperty(navigator, 'getGamepads', {
      configurable: true,
      value: () => pads.slice(),
    });
  });
}

/**
 * Press and release pad buttons across real frames.
 *
 * Every pad control in the game is edge-detected against the previous frame's
 * button set, so a press that goes down and up without a frame between them is
 * invisible — the same trap the keyboard has.
 */
export async function padPress(game, buttons, { index = 0, frames = 2 } = {}) {
  const list = Array.isArray(buttons) ? buttons : [buttons];
  await game.read(([i, b]) => globalThis.__pad.set(i, { buttons: b }), [index, list]);
  await game.advance(Math.ceil((1000 / 60) * frames));
  await game.read(i => globalThis.__pad.set(i, { buttons: [] }), index);
  await game.advance(Math.ceil(1000 / 60));
}

/**
 * Press pad buttons until they take effect, the keyboard's pressUntil for pads.
 *
 * Same trap: pad controls are edge-detected against the previous frame, joining
 * is locked out for the first 350ms of sim time, and a press spent inside that
 * window is gone rather than queued. Waiting cannot bring back a lost edge.
 */
export async function padPressUntil(game, buttons, predicate, { index = 0, attempts = 25, label = 'the pad press to take' } = {}) {
  for (let i = 0; i < attempts; i++) {
    if (await game.read(predicate)) return;
    await padPress(game, buttons, { index });
    if (await game.read(predicate)) return;
    await game.advance(100);
  }
  throw new Error(`pressed pad ${JSON.stringify(buttons)} ${attempts} times waiting for ${label}`);
}

/** Hold the stick or a d-pad direction for a while, then centre it. */
export async function padHold(game, { buttons = [], axes = [], index = 0, ticks = 30 } = {}) {
  await game.read(([i, b, a]) => globalThis.__pad.set(i, { buttons: b, axes: a }), [index, buttons, axes]);
  await game.advanceSim(ticks);
  await game.read(i => globalThis.__pad.set(i, { buttons: [], axes: [] }), index);
}
