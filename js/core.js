// core.js — shared engine, canvas, helpers
const { Engine, Bodies, Body, Composite, Constraint, Events, Query, Vector } = Matter;

// bump when gameplay/wire format changes — stale tabs get told to refresh
const GAME_VERSION = 5;

const W = 1280, H = 720;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const engine = Engine.create();
engine.gravity.y = 2;
const world = engine.world;

// 'couch' (local only) | 'host' (simulating + broadcasting) | 'client' (rendering remote state)
let netMode = 'couch';

const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

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
