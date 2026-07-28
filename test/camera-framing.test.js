// camera-framing.test.js — the fit-to-action camera's maths, headless.
//
// beginWorld/endWorld/clearFrame need a real 2D context and are covered by the
// browser suite; everything here is pure geometry, which is the half that can
// silently drift without anyone noticing on screen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  updateCamera, cameraViewRect, screenToWorld, setCameraEnabled, resetCamera, cameraZoom, beginWorld,
} from '../src/render/camera.js';
import { W, H } from '../src/sim/world.js';
// NOTE: a namespace import, deliberately. RENDER_SCALE is reassigned by
// initCanvas(), and destructuring it — `const { RENDER_SCALE } = await
// import(...)` — copies the value at that instant and never sees the update,
// which silently made this file assert against a stale 1.
import * as canvasMod from '../src/render/canvas.js';

// let the easing settle: lerpIn is 0.035, so ~600 frames is comfortably converged
const settle = (pts) => { for (let i = 0; i < 600; i++) updateCamera(i * 16, pts); };

test('the view rect contains every point it was given', () => {
  resetCamera();
  const pts = [
    { x: 300, y: 500, r: 26 },
    { x: 900, y: 560, r: 26 },
  ];
  settle(pts);
  const r = cameraViewRect();
  for (const p of pts) {
    assert.ok(p.x - p.r >= r.x0 && p.x + p.r <= r.x1, `${p.x} outside ${r.x0}..${r.x1}`);
    assert.ok(p.y - p.r >= r.y0 && p.y + p.r <= r.y1, `${p.y} outside ${r.y0}..${r.y1}`);
  }
});

test('a tight cluster pushes in, and a spread-out fight does not', () => {
  resetCamera();
  settle([{ x: 620, y: 520, r: 26 }, { x: 660, y: 530, r: 26 }]);
  const tight = cameraZoom();
  resetCamera();
  settle([{ x: 40, y: 80, r: 26 }, { x: 1240, y: 660, r: 26 }]);
  const wide = cameraZoom();
  assert.ok(tight > wide, `a cluster must frame tighter than a spread: ${tight} vs ${wide}`);
  assert.ok(tight <= 2.15 + 1e-9, `zoom exceeded the tuned ceiling: ${tight}`);
});

test('the view never leaves the arena', () => {
  resetCamera();
  // everyone jammed into one corner: the camera wants to centre there, and the
  // clamp is what stops the shot filling with off-map void
  settle([{ x: 10, y: 10, r: 26 }, { x: 30, y: 24, r: 26 }]);
  const r = cameraViewRect();
  assert.ok(r.x0 >= -1e-6, `view ran off the left edge: ${r.x0}`);
  assert.ok(r.y0 >= -1e-6, `view ran off the top edge: ${r.y0}`);
  assert.ok(r.x1 <= W + 1e-6, `view ran off the right edge: ${r.x1}`);
  assert.ok(r.y1 <= H + 1e-6, `view ran off the bottom edge: ${r.y1}`);
});

// The clamp inside updateCamera is not redundant with the one in cameraTarget.
// cameraTarget clamps the TARGET against the TARGET zoom; mid-ease the smoothed
// zoom is still wider than that target, so the view is bigger than the centre
// was clamped for and the edge of the world peeks in. Settling first hides this
// completely — the assertion has to run on every frame of the ease.
test('the view stays inside the arena on every frame of the ease, not just at rest', () => {
  resetCamera(); // wide: zoom 1, centred, which is where the ease-in starts
  const escapes = [];
  // a tight brawl in the corner. The target centre is clamped for the TARGET
  // zoom (2.15, half-width 298), but for the first many frames the smoothed
  // zoom is still near 1 (half-width 640) — so a centre of 298 puts the left
  // edge at -342 unless updateCamera re-clamps against the zoom it actually has.
  for (let i = 0; i < 400; i++) {
    updateCamera(i * 16, [{ x: 60, y: 660, r: 26 }, { x: 90, y: 640, r: 26 }]);
    const r = cameraViewRect();
    if (r.x0 < -1e-6 || r.y0 < -1e-6 || r.x1 > W + 1e-6 || r.y1 > H + 1e-6) {
      escapes.push(`frame ${i}: ${r.x0.toFixed(1)},${r.y0.toFixed(1)}..${r.x1.toFixed(1)},${r.y1.toFixed(1)}`);
    }
  }
  assert.deepEqual(escapes.slice(0, 5), [], `the view left the arena mid-ease:\n${escapes.slice(0, 5).join('\n')}`);
});

test('zoom never goes below 1 — the arena is one screen', () => {
  resetCamera();
  settle([{ x: -400, y: -200, r: 26 }, { x: 2000, y: 1200, r: 26 }]);
  assert.ok(cameraZoom() >= 1 - 1e-9, `zoomed out past the arena: ${cameraZoom()}`);
});

// NOTE: screenToWorld is defined in terms of cameraViewRect, so asserting the
// two agree is an algebraic identity that holds for ANY camera state — it
// passes against a mirrored, 3x-scaled beginWorld(). The test that has teeth is
// the one below, which drives the real ctx transform.
test('screenToWorld is consistent with the view rect', () => {
  resetCamera();
  settle([{ x: 640, y: 400, r: 26 }, { x: 700, y: 430, r: 26 }]);
  const r = cameraViewRect();
  const mid = screenToWorld(W / 2, H / 2);
  assert.ok(Math.abs(mid.x - (r.x0 + r.x1) / 2) < 0.5, 'screen centre maps to view centre');
  assert.ok(Math.abs(mid.y - (r.y0 + r.y1) / 2) < 0.5, 'screen centre maps to view centre');
});

// beginWorld() is the transform every world-space draw call goes through, and
// nothing else in this suite exercises it: a sign flip draws the game mirrored,
// a bad scale draws it at the wrong size, and both leave every other assertion
// here green. So drive it against a recording context and check that a world
// point lands where screenToWorld says it should.
//
// The composed transform is [a c e; b d f]: world (x,y) -> screen
// (a*x + c*y + e, b*x + d*y + f), in DEVICE px, hence the RENDER_SCALE divide.
function recordingCanvas(scale = 1) {
  const m = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  const ctx = {
    textAlign: 'center',
    setTransform(a, b, c, d, e, f) { Object.assign(m, { a, b, c, d, e, f }); },
    translate(x, y) { m.e += m.a * x + m.c * y; m.f += m.b * x + m.d * y; },
    rotate(t) {
      const s = Math.sin(t), co = Math.cos(t);
      const { a, b, c, d } = m;
      m.a = a * co + c * s; m.b = b * co + d * s;
      m.c = c * co - a * s; m.d = d * co - b * s;
    },
  };
  return {
    matrix: m,
    el: {
      width: W * scale, height: H * scale, style: {},
      getContext: () => ctx,
      getBoundingClientRect: () => ({ width: W * scale, height: H * scale }),
    },
  };
}

test('beginWorld puts world points where screenToWorld says they are', () => {
  const rec = recordingCanvas(1);
  canvasMod.initCanvas(rec.el);

  resetCamera();
  settle([{ x: 500, y: 480, r: 26 }, { x: 780, y: 520, r: 26 }]); // a real pushed-in shot
  beginWorld();
  const m = rec.matrix;

  // no shake in play, so the transform must be a pure scale+translate: no
  // rotation, no mirroring
  assert.ok(Math.abs(m.b) < 1e-9 && Math.abs(m.c) < 1e-9, `unexpected rotation/skew: b=${m.b} c=${m.c}`);
  assert.ok(m.a > 0 && m.d > 0, `the world is mirrored: a=${m.a} d=${m.d}`);
  assert.ok(Math.abs(m.a - m.d) < 1e-9, 'the world transform must be uniform');

  const project = (wx, wy) => ({
    x: (m.a * wx + m.c * wy + m.e) / canvasMod.RENDER_SCALE,
    y: (m.b * wx + m.d * wy + m.f) / canvasMod.RENDER_SCALE,
  });
  for (const [sx, sy] of [[0, 0], [W / 2, H / 2], [W, H], [W * 0.25, H * 0.75]]) {
    const world = screenToWorld(sx, sy);
    const back = project(world.x, world.y);
    assert.ok(
      Math.abs(back.x - sx) < 1e-6 && Math.abs(back.y - sy) < 1e-6,
      `screen (${sx},${sy}) -> world (${world.x.toFixed(2)},${world.y.toFixed(2)}) -> screen (${back.x.toFixed(2)},${back.y.toFixed(2)})`,
    );
  }
});

test('the world transform carries the device-pixel scale', () => {
  const rec = recordingCanvas(2); // a 2x display
  canvasMod.initCanvas(rec.el);
  assert.equal(canvasMod.RENDER_SCALE, 2, 'a 2x backing store must set RENDER_SCALE to 2');

  resetCamera();
  setCameraEnabled(false); // identity framing: the maths is checkable by hand
  updateCamera(0, []);
  beginWorld();
  const m = rec.matrix;
  assert.ok(Math.abs(m.a - 2) < 1e-9, `at zoom 1 on a 2x display the scale must be 2, got ${m.a}`);
  // world (0,0) must land at device (0,0) when the whole arena is in frame
  assert.ok(Math.abs(m.e) < 1e-6 && Math.abs(m.f) < 1e-6, `world origin is off: e=${m.e} f=${m.f}`);
  setCameraEnabled(true);
  canvasMod.initCanvas(recordingCanvas(1).el); // leave RENDER_SCALE back at 1 for other tests
});

test('a point list with no finite entries falls back to the full arena', () => {
  resetCamera();
  settle([{ x: NaN, y: NaN, r: 26 }]);
  assert.ok(Number.isFinite(cameraZoom()), 'NaN input must not poison the camera');
  const r = cameraViewRect();
  assert.ok(Number.isFinite(r.x0) && Number.isFinite(r.y1), 'the view rect must stay finite');
});

test('disabled, the camera is the identity framing', () => {
  resetCamera();
  setCameraEnabled(false);
  for (let i = 0; i < 300; i++) updateCamera(i * 16, [{ x: 100, y: 100, r: 26 }]);
  const r = cameraViewRect();
  assert.deepEqual(
    { x0: Math.round(r.x0), y0: Math.round(r.y0), x1: Math.round(r.x1), y1: Math.round(r.y1) },
    { x0: 0, y0: 0, x1: W, y1: H },
    'F9 off must reproduce the old fixed framing exactly',
  );
  setCameraEnabled(true);
});
