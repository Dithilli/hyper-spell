// camera-framing.test.js — the fit-to-action camera's maths, headless.
//
// beginWorld/endWorld/clearFrame need a real 2D context and are covered by the
// browser suite; everything here is pure geometry, which is the half that can
// silently drift without anyone noticing on screen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  updateCamera, cameraViewRect, screenToWorld, setCameraEnabled, resetCamera, cameraZoom,
} from '../src/render/camera.js';
import { W, H } from '../src/sim/world.js';

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

test('screenToWorld inverts the world transform', () => {
  resetCamera();
  settle([{ x: 640, y: 400, r: 26 }, { x: 700, y: 430, r: 26 }]);
  const r = cameraViewRect();
  const mid = screenToWorld(W / 2, H / 2);
  assert.ok(Math.abs(mid.x - (r.x0 + r.x1) / 2) < 0.5, 'screen centre maps to view centre');
  assert.ok(Math.abs(mid.y - (r.y0 + r.y1) / 2) < 0.5, 'screen centre maps to view centre');
  const corner = screenToWorld(0, 0);
  assert.ok(Math.abs(corner.x - r.x0) < 1e-6 && Math.abs(corner.y - r.y0) < 1e-6, 'the origin maps to the rect origin');
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
