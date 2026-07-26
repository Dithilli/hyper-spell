// canvas.js — the drawing surface.
//
// js/core.js grabbed #game and its 2d context the moment the script loaded.
// Nothing headless has a canvas, so acquiring it is now an explicit call the
// browser entry makes; `ctx` is a live binding every render module imports.
export let canvas = null;
export let ctx = null;

export function initCanvas(el) {
  canvas = el;
  ctx = el.getContext('2d');
  return ctx;
}

export function drawBody(body) {
  ctx.beginPath();
  const v = body.vertices;
  ctx.moveTo(v[0].x, v[0].y);
  for (let i = 1; i < v.length; i++) ctx.lineTo(v[i].x, v[i].y);
  ctx.closePath();
  ctx.fill();
}
