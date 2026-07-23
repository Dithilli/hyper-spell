// core.js — shared engine, canvas, helpers
const { Engine, Bodies, Body, Composite, Constraint, Events, Query, Vector } = Matter;

// bump when gameplay/wire format changes — stale tabs get told to refresh
const GAME_VERSION = 9; // v9: server-authoritative sim — the server runs the match, every browser renders

const W = 1280, H = 720;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

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
