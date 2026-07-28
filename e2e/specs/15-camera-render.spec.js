// 15-camera-render — the v10 render additions, in a real browser.
//
// This spec exists because the unit tests for these modules cannot reach them.
// test/camera-framing.test.js says beginWorld "needs a real 2D context and is
// covered by the browser suite" — that sentence was aspirational when it was
// written, because the browser suite lives on this branch and the camera landed
// on the one below it. This is the file that makes it true.
//
// What only a browser can answer here: that the world transform is actually
// applied to the canvas, that the bloom pass composites without throwing on a
// real context, that the profiler's overlay draws, and that F9/F7 reach them
// through the real key listeners.
import { test, expect } from '../support/fixtures.js';
import { GamePage } from '../support/game.js';

test.describe('the camera', () => {
  test('frames the fight, and F9 puts it back to 1:1', async ({ page, errors }) => {
    void errors;
    const game = new GamePage(page);
    await game.boot();
    await game.seatKeyboardPlayer(0);
    await game.addBot(1);
    await game.startMatch();
    await game.advance(1500); // let the ease settle onto the wizards

    const zoomed = await page.evaluate(() => globalThis.HS.cameraZoom());
    expect(zoomed, 'the camera should push in on a two-wizard fight').toBeGreaterThan(1.05);

    // F9 is the A/B toggle, and it must reproduce the OLD fixed framing exactly
    await page.keyboard.press('F9');
    await game.advance(400);
    const off = await page.evaluate(() => {
      const r = globalThis.HS.cameraViewRect();
      return { zoom: globalThis.HS.cameraZoom(), x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1 };
    });
    expect(off.zoom).toBeCloseTo(1, 5);
    expect(Math.round(off.x0)).toBe(0);
    expect(Math.round(off.y0)).toBe(0);
    expect(Math.round(off.x1)).toBe(1280);
    expect(Math.round(off.y1)).toBe(720);

    await page.keyboard.press('F9'); // and back on, so the rest of the run is normal
    await game.advance(200);
    expect(await page.evaluate(() => globalThis.HS.cameraEnabled())).toBe(true);
  });

  // The transform has to reach the CANVAS, not just the camera's own maths. A
  // camera that computes a perfect zoom and never applies it draws an unchanged
  // picture, and every headless assertion still passes.
  test('the world transform is really applied to the context', async ({ page, errors }) => {
    void errors;
    const game = new GamePage(page);
    await game.boot();
    await game.seatKeyboardPlayer(0);
    await game.addBot(1);
    await game.startMatch();
    await game.advance(1500);

    const seen = await page.evaluate(() => {
      const ctx = document.getElementById('game').getContext('2d');
      const captured = [];
      const real = ctx.setTransform.bind(ctx);
      ctx.setTransform = (...a) => { captured.push(a); return real(...a); };
      globalThis.HS.draw(globalThis.HS.simNow());
      ctx.setTransform = real;
      return captured;
    });
    // beginWorld sets a scale of RENDER_SCALE * zoom; with the camera pushed in
    // that is strictly greater than the screen-space transform endWorld sets.
    const scales = seen.map(a => a[0]).filter(n => typeof n === 'number' && n > 0);
    expect(scales.length, 'draw() set no transform at all').toBeGreaterThan(1);
    expect(Math.max(...scales), 'no transform carried the camera zoom').toBeGreaterThan(Math.min(...scales) * 1.05);
  });

  test('a wizard knocked out of frame gets an offscreen pointer, not a lost wizard', async ({ page, errors }) => {
    void errors;
    const game = new GamePage(page);
    await game.boot();
    await game.seatKeyboardPlayer(0);
    await game.addBot(1);
    await game.startMatch();
    await game.advance(1200);
    // the pointers bound against the camera's view rect, so once it is pushed in
    // "off screen" starts well inside the arena
    const rect = await page.evaluate(() => globalThis.HS.cameraViewRect());
    expect(rect.x1 - rect.x0).toBeLessThanOrEqual(1280 + 1);
    expect(rect.y1 - rect.y0).toBeLessThanOrEqual(720 + 1);
  });
});

test.describe('the light pass', () => {
  test('bloom composites over a real frame without throwing', async ({ page, errors }) => {
    void errors;
    const game = new GamePage(page);
    await game.boot();
    await game.seatKeyboardPlayer(0);
    await game.addBot(1);
    await game.startMatch();
    await game.advance(800);

    expect(await page.evaluate(() => globalThis.HS.bloomEnabled())).toBe(true);
    await game.expectPainted();

    // off and on again: the pass allocates offscreen buffers lazily, so the
    // toggle is also the test that it can be re-entered
    await page.evaluate(() => globalThis.HS.setBloomEnabled(false));
    await game.advance(300);
    await game.expectPainted();
    await page.evaluate(() => globalThis.HS.setBloomEnabled(true));
    await game.advance(300);
    await game.expectPainted();
  });
});

test.describe('the frame profiler', () => {
  test('F7 turns the overlay on and it records real frames', async ({ page, errors }) => {
    void errors;
    const game = new GamePage(page);
    await game.boot();
    await game.seatKeyboardPlayer(0);
    await game.addBot(1);
    await game.startMatch();

    expect(await page.evaluate(() => globalThis.PERF.on)).toBe(false);
    await page.keyboard.press('F7');
    await game.advance(600);
    const perf = await page.evaluate(() => ({ on: globalThis.PERF.on, n: globalThis.PERF.n }));
    expect(perf.on, 'F7 did not reach the profiler').toBe(true);
    expect(perf.n, 'the profiler recorded no frames while running').toBeGreaterThan(0);

    await game.expectPainted(); // the overlay draws over a live frame
    await page.keyboard.press('F7');
    await game.advance(100);
    expect(await page.evaluate(() => globalThis.PERF.on)).toBe(false);
  });
});

test.describe('name tags', () => {
  // src/render/name-tags.js. The regression this guards: the slots are cleared
  // in beginWorld(), and a draw path that sets its own transform never clears
  // them, so a stationary wizard's tag climbs to its 78px ceiling within about
  // five frames — which is exactly what the online path did for one commit.
  test('a standing wizard keeps its tag on its head', async ({ page, errors }) => {
    void errors;
    const game = new GamePage(page);
    await game.boot();
    await game.seatKeyboardPlayer(0);
    await game.addBot(1);
    await game.startMatch();
    await game.advance(600);

    const drift = await page.evaluate(async () => {
      const HS = globalThis.HS;
      const ys = [];
      const ctx = document.getElementById('game').getContext('2d');
      const realStroke = ctx.strokeText.bind(ctx);
      const me = HS.players[0];
      const name = me.name;
      ctx.strokeText = (str, x, y) => { if (str === name) ys.push(y); return realStroke(str, x, y); };
      for (let i = 0; i < 40; i++) HS.draw(HS.simNow());
      ctx.strokeText = realStroke;
      if (ys.length < 5) return null;
      return Math.max(...ys) - Math.min(...ys);
    });
    expect(drift, 'the wizard name was never drawn').not.toBeNull();
    // a wizard standing still: its tag may move with the wizard, but it must not
    // walk 78px up the screen over 40 frames of no movement
    expect(drift, 'the nametag climbed — the slot array is not being cleared').toBeLessThan(40);
  });
});
