// maps/builders.js — the map registry and the shared builders every map def
// composes its arena from.
import { W, H } from '../world.js';
import {
  addBody as addWorldBody, addTo, addVelocity, allBodies, createBox,
  createCircle, createJoint, createPolygon, removeFrom, setAngularVelocity,
  setPosition, setType, setVelocity,
} from '../phys/facade.js';
import { perSecond, simNow } from '../time.js';
import { simRandom, rand, pick } from '../rng.js';
import { spawnParticle, spawnParticles, spawnBurst, addShake } from '../fx.js';
import { sfx } from '../sfx.js';
import { currentMap } from '../match.js';
import { players, gibs } from '../player/lifecycle.js';
import { applyFreeze } from '../player/status.js';
import { explode, skyBolt } from '../spells/core.js';
import { platformSpots } from '../events.js';

export const MAPS = [];
export function defineMap(def) { MAPS.push(def); }

export function addBody(m, body, color) {
  if (color) body.render.fillStyle = color;
  addTo(m.composite, body);
  return body;
}

export function addStatic(m, x, y, w, h, opts = {}) {
  const b = createBox(x, y, w, h, {
    isStatic: true,
    friction: opts.friction ?? 0.6,
    restitution: opts.restitution ?? 0,
    angle: opts.angle ?? 0,
    label: opts.label || 'terrain',
  });
  b.w = w; b.h = h;
  return addBody(m, b, opts.color || '#171221');
}

// ---- destructibles: cover that blows apart chunk by chunk under fire ----
// A static block with hp. Explosions and projectile hits chip it; at 0 hp it
// bursts into debris AND a small blast — cover is temporary, and standing next
// to it when it finally gives is a mistake. kind ('wood'|'stone'|'ice'|'crate')
// flavors the death: ice flash-freezes whoever is close.
export function addDestructible(m, x, y, w, h, opts = {}) {
  const b = createBox(x, y, w, h, { isStatic: true, friction: 0.6, restitution: opts.rest ?? 0, angle: opts.angle ?? 0, label: 'destructible' });
  b.w = w; b.h = h;
  b.maxHp = opts.hp ?? 45;
  b.hp = b.maxHp;
  b.dcolor = opts.color || '#6b4a2a';
  b.debrisN = opts.debris ?? 4;
  b.kind = opts.kind || 'wood';
  return addBody(m, b, b.dcolor);
}

export function damageDestructible(b, dmg) {
  if (b.hp == null || b.hp <= 0) return;
  // ambient life: the FIRST hit on an untouched canopy startles a few birds out
  if (b.hp === b.maxHp && b.kind === 'wood' && isLeafy(b.dcolor) && simRandom() < 0.75) {
    spawnBurst(b.position.x, b.position.y - 10, '#2c2438', 3, { kind: 'bird', dir: -Math.PI / 2, spread: 1.8, speed: 2.5, up: 3, g: -0.02, life: 85, r: 3 });
  }
  b.hp -= dmg;
  spawnParticles(b.position.x + rand(-b.w / 2, b.w / 2), b.position.y + rand(-b.h / 2, b.h / 2), b.dcolor, 3, 3, 20);
  if (b.hp <= 0) breakDestructible(b);
}

export function breakDestructible(b) {
  const { x, y } = b.position;
  removeFrom(currentMap.composite, b);
  (currentMap.data.broken ||= []).push([Math.round(x), Math.round(y)]); // for LAN clients to mirror
  spawnParticles(x, y, b.dcolor, 16, 6, 40);
  for (let i = 0; i < (b.debrisN || 4); i++) {
    const g = createBox(x + rand(-b.w / 3, b.w / 3), y + rand(-b.h / 3, b.h / 3), rand(6, 13), rand(6, 13), { density: 0.001, frictionAir: 0.02, label: 'gib' });
    g.color = b.dcolor;
    g.dieAt = simNow() + 2600;
    setVelocity(g, { x: rand(-6, 6), y: rand(-9, -2) });
    setAngularVelocity(g, rand(-0.5, 0.5));
    gibs.add(g);
    addWorldBody(g);
  }
  // the death blast: modest damage/knock so shredding someone's cover pays off
  // without turning every hedge into a landmine. Chips neighboring segments too,
  // so a chewed-up pillar can cascade. hp<=0 guard above keeps that finite.
  explode(x, y, 80, 10, 9, null);
  if (b.kind === 'ice') {
    const now = simNow();
    for (const q of players) {
      if (!q.alive) continue;
      if (Math.hypot(q.body.position.x - x, q.body.position.y - y) < 100) applyFreeze(q, Math.max(q.frozenUntil || 0, now + 450));
    }
    spawnParticles(x, y, '#eaffff', 12, 5, 30);
    sfx.freeze?.();
  }
  addShake(3);
  sfx.thud?.();
}

// a stack of frosty destructible blocks — frost-theme cover with a chilly death
export function addIceBlock(m, x, groundY, tall = 2) {
  for (let i = 0; i < tall; i++) {
    addDestructible(m, x, groundY - 23 - i * 46, 46, 44, { hp: 55, color: i % 2 ? '#9fd8f0' : '#bfe8ff', debris: 5, kind: 'ice' });
  }
}

// ---- biome set-pieces: one big storybook landmark per arena ----
// All built from stacked destructibles (the addTree recipe): a real silhouette
// that fights back, comes apart gradually, and explodes at the end.

// a tapering glacier spire — wide frosty base to a jagged translucent tip
export function addGlacierSpire(m, x, groundY, s = 1) {
  const widths = [66, 50, 36, 24];
  let y = groundY;
  for (let i = 0; i < widths.length; i++) {
    const h = (i === widths.length - 1 ? 56 : 42) * s;
    addDestructible(m, x + (i % 2 ? 3 : -2) * s, y - h / 2, widths[i] * s, h, { hp: 55, color: i % 2 ? '#9fd8f0' : '#bfe8ff', debris: 5, kind: 'ice' });
    y -= h;
  }
}

// a fang of volcanic glass — its cracks glow hotter as it nears the end
export function addObsidianFang(m, x, groundY, s = 1) {
  const widths = [58, 42, 28, 16];
  let y = groundY;
  for (let i = 0; i < widths.length; i++) {
    const h = (i === widths.length - 1 ? 48 : 40) * s;
    addDestructible(m, x + (i % 2 ? -3 : 2) * s, y - h / 2, widths[i] * s, h, { hp: 70, color: i % 2 ? '#241a2e' : '#2e2238', debris: 5, kind: 'obsidian' });
    y -= h;
  }
}

// a giant swamp mushroom: choppable cream stalk, bouncy speckled cap
export function addGiantMushroom(m, x, groundY, s = 1) {
  const stalkH = 44 * s;
  for (let i = 0; i < 2; i++) addDestructible(m, x, groundY - stalkH / 2 - i * stalkH, 28 * s, stalkH, { hp: 45, color: i % 2 ? '#ded2b4' : '#e8dcc0', debris: 4, kind: 'shroom' });
  addDestructible(m, x, groundY - 2 * stalkH - 15 * s, 116 * s, 30 * s, { hp: 60, color: '#c75e54', debris: 7, kind: 'shroom', rest: 1.1 });
}

// a ruined arch: two mossy pillars carrying a lintel you can fight on top of
export function addStoneArch(m, x, groundY, s = 1) {
  for (const side of [-1, 1]) addCoverPillar(m, x + side * 70 * s, groundY, 130 * s, 34 * s, '#8a7a5c');
  addDestructible(m, x, groundY - 130 * s - 12 * s, 190 * s, 24 * s, { hp: 60, color: '#9a8a68', debris: 6, kind: 'stone' });
}

// a cluster of leaning void crystals, glinting in the dark
export function addCrystalCluster(m, x, groundY, s = 1) {
  for (const [dx, ang, w, h, c] of [
    [-26, -0.32, 24, 88, '#8a6de0'],
    [4, 0.08, 30, 120, '#a88df0'],
    [32, 0.38, 20, 70, '#c8b8ff'],
  ]) {
    addDestructible(m, x + dx * s, groundY - (h / 2) * s + 4, w * s, h * s, { hp: 55, color: c, debris: 5, kind: 'ice', angle: ang });
  }
}

// one landmark per arena, matched to the biome — skipped on cozy duel maps
export function ensureSetPiece(m, rng) {
  if (m.def.cozy || rng() < 0.25) return; // usually present, never guaranteed — maps stay varied
  const spots = platformSpots(m, 3, rng);
  if (!spots.length) return;
  const spot = spots[Math.floor(rng() * spots.length)];
  const x = Math.max(120, Math.min(W - 120, spot.x)), y = spot.y + 8;
  const c = m.def.cover;
  const s = 0.85 + rng() * 0.4;
  if (c === 'ice') addGlacierSpire(m, x, y, s);
  else if (c === 'rock') addObsidianFang(m, x, y, s);
  else if (c === 'tree') { if (m.def.muddy) addGiantMushroom(m, x, y, s); else addTree(m, x, y, 1.1 * s); }
  else if (c === 'pillar') { if (m.def.stars) addCrystalCluster(m, x, y, s); else addStoneArch(m, x, y, Math.min(s, 1)); }
  // crate biomes keep their crate identity — no landmark needed
}

// theme-flavored destructible cover: what you duck behind depends on the biome.
// kind comes from the map def (theme defaults), falling back on map flags.
export function addThemedCover(m, x, groundY, rr, pk) {
  const kind = m.def?.cover || (m.def?.icy ? 'ice' : 'pillar');
  if (kind === 'tree') addTree(m, x, groundY, rr(0.55, 0.75));
  else if (kind === 'ice') { if (rr(0, 1) < 0.3) addGlacierSpire(m, x, groundY, rr(0.55, 0.75)); else addIceBlock(m, x, groundY, pk([2, 2, 3])); }
  else if (kind === 'rock') addDestructible(m, x, groundY - 24, 54, 46, { hp: 65, color: '#5a5245', debris: 6, kind: 'stone' });
  else if (kind === 'crate') addDestructible(m, x, groundY - 24, 46, 46, { hp: 45, color: '#9a7440', debris: 5, kind: 'crate' });
  else addCoverPillar(m, x, groundY, pk([90, 120, 130]));
}

// a big tree — hide behind the trunk or under the canopy; chip it and it slowly
// blows apart. scale ~1 is a normal tree, 1.4 a giant.
export function addTree(m, x, groundY, scale = 1) {
  const trunkW = 34 * scale, seg = 42 * scale, segs = 4;
  for (let i = 0; i < segs; i++) {
    addDestructible(m, x, groundY - seg / 2 - i * seg, trunkW, seg, { hp: 60, color: i % 2 ? '#5a3d22' : '#6b4a2a', debris: 5 });
  }
  const cy = groundY - segs * seg;
  for (const [dx, dy, w, h, c] of [
    [0, -26 * scale, 130 * scale, 62 * scale, '#3f7d3a'],
    [-72 * scale, 8 * scale, 84 * scale, 58 * scale, '#356b33'],
    [72 * scale, 8 * scale, 84 * scale, 58 * scale, '#356b33'],
    [-34 * scale, -68 * scale, 96 * scale, 56 * scale, '#4a8f42'],
    [42 * scale, -64 * scale, 88 * scale, 54 * scale, '#4a8f42'],
  ]) {
    addDestructible(m, x + dx, cy + dy, w, h, { hp: 40, color: c, debris: 6 });
  }
}

// a covered nook you can tuck into — floor + back wall + roof, open on one side
export function addAlcove(m, x, floorY, w = 160, h = 96, side = 1, color) {
  addStatic(m, x, floorY, w, 20, { color });
  addStatic(m, x + side * (w / 2 - 12), floorY - h / 2, 24, h, { color });
  addStatic(m, x, floorY - h + 10, w, 20, { color });
}

// a vertical wall with a crawl-through gap (a tunnel) centered at gapC
export function addWallGap(m, x, y0, y1, gapC, gapH = 84, wallW = 48, color) {
  const topH = (gapC - gapH / 2) - y0;
  const botH = y1 - (gapC + gapH / 2);
  if (topH > 8) addStatic(m, x, y0 + topH / 2, wallW, topH, { color });
  if (botH > 8) addStatic(m, x, (gapC + gapH / 2) + botH / 2, wallW, botH, { color });
}

// a destructible pillar of cover you can duck behind
export function addCoverPillar(m, x, groundY, h = 120, w = 40, color = '#6b6b7a') {
  const segs = Math.max(2, Math.round(h / 40));
  const seg = h / segs;
  for (let i = 0; i < segs; i++) addDestructible(m, x, groundY - seg / 2 - i * seg, w, seg, { hp: 50, color, debris: 4, kind: 'stone' });
}

export function addLava(m, y = H - 22, acid = false) {
  m.data.lavaY = y;
  m.data.acid = acid;
  m.data.lavaBody = createBox(W / 2, y + 30, W * 2, 60, { isStatic: true, isSensor: true, label: 'lava' });
  addTo(m.composite, m.data.lavaBody);
}

export function buildCrateStack(m, cx, bottomY, cols, rows) {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const crate = createBox(cx - (cols - 1) * 14 + col * 28, bottomY - row * 28, 26, 26, { density: 0.0015, friction: 0.4, label: 'crate' });
      addBody(m, crate, '#b08948');
    }
  }
}

export function buildCratePyramid(m, cx, bottomY, baseCols) {
  for (let row = 0; row < baseCols; row++) {
    const cols = baseCols - row;
    for (let col = 0; col < cols; col++) {
      const crate = createBox(cx - (cols - 1) * 14 + col * 28, bottomY - row * 28, 26, 26, { density: 0.0015, friction: 0.4, label: 'crate' });
      addBody(m, crate, '#b08948');
    }
  }
}

export function buildBridge(m, x0, x1, y) {
  const n = 9, step = (x1 - x0) / n;
  let prev = null;
  for (let i = 0; i < n; i++) {
    const plank = createBox(x0 + step * (i + 0.5), y, Math.abs(step) - 4, 10, { density: 0.002, friction: 0.5, label: 'plank' });
    plank.rope = true; // walk across it all you like — but the slack won't catch a sky-drop
    addBody(m, plank, '#8a6f4d');
    const link = prev
      ? createJoint({ bodyA: prev, bodyB: plank, pointA: { x: step / 2, y: 0 }, pointB: { x: -step / 2, y: 0 }, stiffness: 0.9, length: 4 })
      : createJoint({ bodyB: plank, pointA: { x: x0, y }, pointB: { x: -step / 2, y: 0 }, stiffness: 0.9, length: 4 });
    link.label = 'breakable';
    addTo(m.composite, link);
    prev = plank;
  }
  const end = createJoint({ bodyA: prev, pointA: { x: step / 2, y: 0 }, pointB: { x: x1, y }, stiffness: 0.9, length: 4 });
  end.label = 'breakable';
  addTo(m.composite, end);
}

export function addSeesaw(m, x, y, w = 220) {
  const plank = createBox(x, y, w, 12, { density: 0.004, friction: 0.6, label: 'plank' });
  plank.w = w; plank.h = 12;
  addBody(m, plank, '#8a6f4d');
  const pivot = createJoint({ pointA: { x, y }, bodyB: plank, pointB: { x: 0, y: 0 }, stiffness: 1, length: 0 });
  pivot.label = 'pivot';
  addTo(m.composite, pivot);
  addStatic(m, x, y + 34, 14, 44);
}

export function addChandelier(m, x, topY, dropLen, r = 26) {
  const ball = createCircle(x, topY + dropLen, r, { density: 0.008, friction: 0.4, label: 'ball' });
  addBody(m, ball, '#100c18');
  const rope = createJoint({ pointA: { x, y: topY }, bodyB: ball, stiffness: 0.95, length: dropLen });
  rope.label = 'breakable';
  addTo(m.composite, rope);
}

export function addHangingPlatform(m, x, topY, dropLen, w = 150) {
  const plat = createBox(x, topY + dropLen, w, 14, { density: 0.003, friction: 0.6, label: 'plank' });
  plat.w = w; plat.h = 14;
  addBody(m, plat, '#8a6f4d');
  for (const side of [-1, 1]) {
    const rope = createJoint({
      pointA: { x: x + side * (w / 2 - 10), y: topY },
      bodyB: plat, pointB: { x: side * (w / 2 - 10), y: 0 },
      stiffness: 0.9, length: dropLen,
    });
    rope.label = 'breakable';
    addTo(m.composite, rope);
  }
}

export function addBarrels(m, xs, y) {
  for (const x of xs) {
    const b = createCircle(x, y, 14, { density: 0.002, friction: 0.3, restitution: 0.3, label: 'barrel' });
    addBody(m, b, '#7d5a9e');
  }
}

export function addPendulumBall(m, x, topY, len, r = 45, shove = 14) {
  const ball = createCircle(x, topY + len, r, { density: 0.01, friction: 0.3, restitution: 0.4, label: 'ball' });
  addBody(m, ball, '#100c18');
  const chain = createJoint({ pointA: { x, y: topY }, bodyB: ball, stiffness: 1, length: len });
  chain.label = 'chain';
  addTo(m.composite, chain);
  setVelocity(ball, { x: shove, y: 0 });
  (m.data.pendulums ??= []).push(ball);
  return ball;
}

export function keepPendulumsSwinging(m) {
  for (const b of m.data.pendulums || []) {
    if (Math.hypot(b.velocity.x, b.velocity.y) < 2.5) {
      addVelocity(b, { x: perSecond(b.position.x < W / 2 ? 1.5 : -1.5), y: 0 });
    }
  }
}

export function addSpinner(m, x, y, len, rate = 0.02, color = '#2c2438') {
  const b = addStatic(m, x, y, len, 16, { color });
  b.spin = rate;
  return b;
}

export function addMover(m, x, y, w, h, { ay = 80, period = 3000, color } = {}) {
  const b = addStatic(m, x, y, w, h, { color });
  b.kinematic = true;
  (m.data.movers ??= []).push({ b, x, y, ay, phase: rand(0, 6.28), period });
  return b;
}

export function updateMovers(m, now) {
  for (const mv of m.data.movers || []) {
    setPosition(mv.b, { x: mv.x, y: mv.y + Math.sin((now / mv.period) * Math.PI * 2 + mv.phase) * mv.ay });
  }
}

export function addBumper(m, x, y, r = 22) {
  const b = createCircle(x, y, r, { isStatic: true, restitution: 1.4, label: 'bouncy' });
  return addBody(m, b, '#ff8fc7');
}

export function addIcicles(m, xs, y = 80) {
  m.data.icicles = [];
  for (const x of xs) {
    const ice = createPolygon(x, y, 3, 24, { isStatic: true, density: 0.008, angle: Math.PI / 2, label: 'icicle' });
    addBody(m, ice, '#bfe8ff');
    m.data.icicles.push({ body: ice, shakeAt: 0, fallen: false });
  }
}

export function updateIcicles(m, now) {
  for (const ic of m.data.icicles || []) {
    if (ic.fallen) continue;
    if (ic.body._blast && !ic.shakeAt) ic.shakeAt = now;
    const ix = ic.body.position.x;
    if (!ic.shakeAt) {
      const trig = players.some(p => p.alive && Math.abs(p.body.position.x - ix) < 42 && p.body.position.y > ic.body.position.y);
      if (trig) ic.shakeAt = now;
    } else if (now - ic.shakeAt > 350) {
      ic.fallen = true;
      setType(ic.body, 'dynamic');
      setVelocity(ic.body, { x: 0, y: 2 });
    } else if (simRandom() < 0.3) {
      spawnParticle({ kind: 'square', x: ix + rand(-8, 8), y: ic.body.position.y + 20, vx: 0, vy: 1, life: 20, maxLife: 20, color: '#bfe8ff', r: 2 });
    }
  }
}

// gentle sideways force on every dynamic body (wind)
//
// `fx` is a legacy per-frame magnitude — every caller in maps/book.js and
// events.js authored theirs against a 60Hz frame — so the conversion lives here
// rather than at each of the seven call sites.
export function applyWind(fx) {
  const dv = perSecond(fx);
  for (const b of allBodies()) {
    if (b.isStatic || b.isSensor) continue;
    addVelocity(b, { x: dv, y: 0 });
  }
}

// periodic hazards: geysers, boulders, sky strikes, crate rain
export function updateGeysers(m, now) {
  for (const g of m.data.geysers || []) {
    if (now > (g.nextAt || 0)) {
      g.nextAt = now + rand(2500, 5000);
      explode(g.x, g.y, 90, 16, 6);
    }
  }
}

export function updateStrikes(m, now, interval = 2800, dmg = 22) {
  if (now > (m.data.nextStrike || (m.data.nextStrike = now + interval))) {
    m.data.nextStrike = now + rand(interval * 0.6, interval * 1.4);
    const xs = m.data.strikeXs;
    skyBolt(xs ? pick(xs) + rand(-40, 40) : rand(80, W - 80), dmg, null);
  }
}

export function updateCrateRain(m, now, cap = 26, interval = 2600) {
  if (now > (m.data.nextCrate || 0)) {
    m.data.nextCrate = now + interval;
    if ((m.data.rained || 0) < cap) {
      m.data.rained = (m.data.rained || 0) + 1;
      const crate = createBox(rand(100, W - 100), -40, 26, 26, { density: 0.0015, friction: 0.4, label: 'crate' });
      addBody(m, crate, '#b08948');
    }
  }
}

export function updateBoulders(m, now, interval = 5000) {
  if (now > (m.data.nextBoulder || (m.data.nextBoulder = now + 2500))) {
    m.data.nextBoulder = now + interval;
    const side = pick([-1, 1]);
    const rock = createCircle(side < 0 ? -20 : W + 20, m.data.boulderY ?? 100, 24, { density: 0.01, friction: 0.4, restitution: 0.2, label: 'ball' });
    addBody(m, rock, '#5a5245');
    setVelocity(rock, { x: -side * rand(8, 14), y: 0 });
  }
}

// canopy blocks are greener than they are red — those are the ones that shed
// leaves (and startle birds); trunks stay quiet. Lives here rather than with the
// draw code because damageDestructible reads it (js/game.js:775).
export function isLeafy(hex) {
  if (typeof hex !== 'string' || hex[0] !== '#') return false;
  return parseInt(hex.slice(3, 5), 16) > parseInt(hex.slice(1, 3), 16) + 20;
}
