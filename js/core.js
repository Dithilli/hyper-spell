// core.js — shared engine, canvas, helpers
const { Engine, Bodies, Body, Composite, Constraint, Events, Query, Vector } = Matter;

// bump when gameplay/wire format changes — stale tabs get told to refresh
const GAME_VERSION = 9; // v9: server-authoritative sim — the server runs the match, every browser renders

const W = 1280, H = 720;
const canvas = document.getElementById('game');
// opaque context: the backdrop paints every pixel, so the compositor never needs
// to blend the canvas against the page
const ctx = canvas.getContext('2d', { alpha: false });

// ---------- device-pixel-ratio backing store ----------
// The game is 100% vector canvas, so the backing store used to be a fixed
// 1280x720 that the browser bilinear-upscaled to whatever the display was —
// every edge in the game was blurred on any screen bigger (or denser) than
// 720p. Size the buffer to real device pixels instead and let one render-space
// transform carry the difference. RENDER_SCALE is world px -> device px.
let RENDER_SCALE = 1;
const MAX_SUPERSAMPLE = 2; // fill-rate ceiling: never render past 2x the design size

function fitCanvasToDisplay() {
  // headless (server sim / tests) has no layout — stay at the design size
  if (!canvas.style || typeof canvas.getBoundingClientRect !== 'function') return;
  const dpr = globalThis.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const cssW = rect.width || W;
  const scale = Math.min((cssW * dpr) / W, MAX_SUPERSAMPLE);
  const bw = Math.max(1, Math.round(W * scale));
  if (canvas.width === bw) return; // nothing changed — don't clobber ctx state
  canvas.width = bw;
  canvas.height = Math.max(1, Math.round(H * scale));
  RENDER_SCALE = canvas.width / W;
  // canvas.width resets every ctx property; the per-frame draw path re-sets what
  // it needs, but text alignment is assumed by a lot of HUD code
  ctx.textAlign = 'center';
}

if (typeof addEventListener === 'function') {
  addEventListener('resize', fitCanvasToDisplay);
  fitCanvasToDisplay();
}

const engine = Engine.create();
engine.gravity.y = 2;
const world = engine.world;

// 'couch' (this machine runs the sim, everyone local) | 'online' (the server runs
// the sim; this browser sends inputs and renders snapshots)
let netMode = 'couch';

const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// deterministic RNG (mulberry32) — host and LAN clients must generate identical
// post-build map extras (stepping platforms, scattered cover) from a shared seed,
// because static bodies never ride the snapshot
function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawBody(body) {
  ctx.beginPath();
  const v = body.vertices;
  ctx.moveTo(v[0].x, v[0].y);
  for (let i = 1; i < v.length; i++) ctx.lineTo(v[i].x, v[i].y);
  ctx.closePath();
  ctx.fill();
}

function constraintEnds(c) {
  const a = c.bodyA ? Vector.add(c.bodyA.position, Vector.rotate(c.pointA, c.bodyA.angle)) : c.pointA;
  const b = c.bodyB ? Vector.add(c.bodyB.position, Vector.rotate(c.pointB, c.bodyB.angle)) : c.pointB;
  return [a, b];
}
