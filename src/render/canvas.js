// canvas.js — the drawing surface.
//
// js/core.js grabbed #game and its 2d context the moment the script loaded.
// Nothing headless has a canvas, so acquiring it is now an explicit call the
// browser entry makes; `ctx` is a live binding every render module imports.
export let canvas = null;
export let ctx = null;

// ---------- device-pixel-ratio backing store ----------
// The game is 100% vector canvas, so the backing store used to be a fixed
// 1280x720 that the browser bilinear-upscaled to whatever the display was —
// every edge in the game was blurred on any screen bigger (or denser) than
// 720p. Size the buffer to real device pixels instead and let one render-space
// transform carry the difference. RENDER_SCALE is world px -> device px, and is
// a live binding: src/render/camera.js reads it on every beginWorld().
export let RENDER_SCALE = 1;

const DESIGN_W = 1280, DESIGN_H = 720;
const MAX_SUPERSAMPLE = 2; // fill-rate ceiling: never render past 2x the design size

export function initCanvas(el) {
  canvas = el;
  // opaque context: the backdrop paints every pixel, so the compositor never
  // needs to blend the canvas against the page
  ctx = el.getContext('2d', { alpha: false });
  fitCanvasToDisplay();
  if (typeof addEventListener === 'function') addEventListener('resize', fitCanvasToDisplay);
  return ctx;
}

export function fitCanvasToDisplay() {
  // headless (server sim / tests) has no layout — stay at the design size
  if (!canvas || !canvas.style || typeof canvas.getBoundingClientRect !== 'function') return;
  const dpr = globalThis.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const cssW = rect.width || DESIGN_W;
  const scale = Math.min((cssW * dpr) / DESIGN_W, MAX_SUPERSAMPLE);
  const bw = Math.max(1, Math.round(DESIGN_W * scale));
  // Kept in sync unconditionally, BEFORE the early return. The guard below is
  // about not clobbering ctx state when the backing store is already the right
  // size — which is not the same question as whether RENDER_SCALE is already
  // right. Deriving it only on the resize path means a canvas that arrives at
  // the correct width some other way (the element's own width attribute, a
  // re-init) leaves the transform scaling by 1 into a buffer that is not 1:1,
  // and the whole game draws into a corner of it.
  RENDER_SCALE = bw / DESIGN_W;
  if (canvas.width === bw) return; // nothing changed — don't clobber ctx state
  canvas.width = bw;
  canvas.height = Math.max(1, Math.round(DESIGN_H * scale));
  // canvas.width resets every ctx property; the per-frame draw path re-sets what
  // it needs, but text alignment is assumed by a lot of HUD code
  ctx.textAlign = 'center';
}

export function drawBody(body) {
  ctx.beginPath();
  const v = body.vertices;
  ctx.moveTo(v[0].x, v[0].y);
  for (let i = 1; i < v.length; i++) ctx.lineTo(v[i].x, v[i].y);
  ctx.closePath();
  ctx.fill();
}
