// maps.js — map registry and shared builders
const MAPS = [];
function defineMap(def) { MAPS.push(def); }

function addBody(m, body, color) {
  if (color) body.render.fillStyle = color;
  Composite.add(m.composite, body);
  return body;
}

function addStatic(m, x, y, w, h, opts = {}) {
  const b = Bodies.rectangle(x, y, w, h, {
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
function addDestructible(m, x, y, w, h, opts = {}) {
  const b = Bodies.rectangle(x, y, w, h, { isStatic: true, friction: 0.6, restitution: opts.rest ?? 0, angle: opts.angle ?? 0, label: 'destructible' });
  b.w = w; b.h = h;
  b.maxHp = opts.hp ?? 45;
  b.hp = b.maxHp;
  b.dcolor = opts.color || '#6b4a2a';
  b.debrisN = opts.debris ?? 4;
  b.kind = opts.kind || 'wood';
  return addBody(m, b, b.dcolor);
}

function damageDestructible(b, dmg) {
  if (b.hp == null || b.hp <= 0) return;
  // ambient life: the FIRST hit on an untouched canopy startles a few birds out
  if (b.hp === b.maxHp && b.kind === 'wood' && isLeafy(b.dcolor) && Math.random() < 0.75) {
    spawnBurst(b.position.x, b.position.y - 10, '#2c2438', 3, { kind: 'bird', dir: -Math.PI / 2, spread: 1.8, speed: 2.5, up: 3, g: -0.02, life: 85, r: 3 });
  }
  b.hp -= dmg;
  spawnParticles(b.position.x + rand(-b.w / 2, b.w / 2), b.position.y + rand(-b.h / 2, b.h / 2), b.dcolor, 3, 3, 20);
  if (b.hp <= 0) breakDestructible(b);
}

function breakDestructible(b) {
  const { x, y } = b.position;
  Composite.remove(currentMap.composite, b);
  (currentMap.data.broken ||= []).push([Math.round(x), Math.round(y)]); // for LAN clients to mirror
  spawnParticles(x, y, b.dcolor, 16, 6, 40);
  for (let i = 0; i < (b.debrisN || 4); i++) {
    const g = Bodies.rectangle(x + rand(-b.w / 3, b.w / 3), y + rand(-b.h / 3, b.h / 3), rand(6, 13), rand(6, 13), { density: 0.001, frictionAir: 0.02, label: 'gib' });
    g.color = b.dcolor;
    g.dieAt = performance.now() + 2600;
    Body.setVelocity(g, { x: rand(-6, 6), y: rand(-9, -2) });
    Body.setAngularVelocity(g, rand(-0.5, 0.5));
    gibs.add(g);
    Composite.add(world, g);
  }
  // the death blast: modest damage/knock so shredding someone's cover pays off
  // without turning every hedge into a landmine. Chips neighboring segments too,
  // so a chewed-up pillar can cascade. hp<=0 guard above keeps that finite.
  explode(x, y, 80, 10, 9, null);
  if (b.kind === 'ice') {
    const now = performance.now();
    for (const q of players) {
      if (!q.alive) continue;
      if (Math.hypot(q.body.position.x - x, q.body.position.y - y) < 100) { q.frozenUntil = Math.max(q.frozenUntil || 0, now + 450); q.body.frictionAir = 0.001; }
    }
    spawnParticles(x, y, '#eaffff', 12, 5, 30);
    sfx.freeze?.();
  }
  addShake(3);
  sfx.thud?.();
}

// a stack of frosty destructible blocks — frost-theme cover with a chilly death
function addIceBlock(m, x, groundY, tall = 2) {
  for (let i = 0; i < tall; i++) {
    addDestructible(m, x, groundY - 23 - i * 46, 46, 44, { hp: 55, color: i % 2 ? '#9fd8f0' : '#bfe8ff', debris: 5, kind: 'ice' });
  }
}

// ---- biome set-pieces: one big storybook landmark per arena ----
// All built from stacked destructibles (the addTree recipe): a real silhouette
// that fights back, comes apart gradually, and explodes at the end.

// a tapering glacier spire — wide frosty base to a jagged translucent tip
function addGlacierSpire(m, x, groundY, s = 1) {
  const widths = [66, 50, 36, 24];
  let y = groundY;
  for (let i = 0; i < widths.length; i++) {
    const h = (i === widths.length - 1 ? 56 : 42) * s;
    addDestructible(m, x + (i % 2 ? 3 : -2) * s, y - h / 2, widths[i] * s, h, { hp: 55, color: i % 2 ? '#9fd8f0' : '#bfe8ff', debris: 5, kind: 'ice' });
    y -= h;
  }
}

// a fang of volcanic glass — its cracks glow hotter as it nears the end
function addObsidianFang(m, x, groundY, s = 1) {
  const widths = [58, 42, 28, 16];
  let y = groundY;
  for (let i = 0; i < widths.length; i++) {
    const h = (i === widths.length - 1 ? 48 : 40) * s;
    addDestructible(m, x + (i % 2 ? -3 : 2) * s, y - h / 2, widths[i] * s, h, { hp: 70, color: i % 2 ? '#241a2e' : '#2e2238', debris: 5, kind: 'obsidian' });
    y -= h;
  }
}

// a giant swamp mushroom: choppable cream stalk, bouncy speckled cap
function addGiantMushroom(m, x, groundY, s = 1) {
  const stalkH = 44 * s;
  for (let i = 0; i < 2; i++) addDestructible(m, x, groundY - stalkH / 2 - i * stalkH, 28 * s, stalkH, { hp: 45, color: i % 2 ? '#ded2b4' : '#e8dcc0', debris: 4, kind: 'shroom' });
  addDestructible(m, x, groundY - 2 * stalkH - 15 * s, 116 * s, 30 * s, { hp: 60, color: '#c75e54', debris: 7, kind: 'shroom', rest: 1.1 });
}

// a ruined arch: two mossy pillars carrying a lintel you can fight on top of
function addStoneArch(m, x, groundY, s = 1) {
  for (const side of [-1, 1]) addCoverPillar(m, x + side * 70 * s, groundY, 130 * s, 34 * s, '#8a7a5c');
  addDestructible(m, x, groundY - 130 * s - 12 * s, 190 * s, 24 * s, { hp: 60, color: '#9a8a68', debris: 6, kind: 'stone' });
}

// a cluster of leaning void crystals, glinting in the dark
function addCrystalCluster(m, x, groundY, s = 1) {
  for (const [dx, ang, w, h, c] of [
    [-26, -0.32, 24, 88, '#8a6de0'],
    [4, 0.08, 30, 120, '#a88df0'],
    [32, 0.38, 20, 70, '#c8b8ff'],
  ]) {
    addDestructible(m, x + dx * s, groundY - (h / 2) * s + 4, w * s, h * s, { hp: 55, color: c, debris: 5, kind: 'ice', angle: ang });
  }
}

// one landmark per arena, matched to the biome — skipped on cozy duel maps
function ensureSetPiece(m, rng) {
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
function addThemedCover(m, x, groundY, rr, pk) {
  const kind = m.def?.cover || (m.def?.icy ? 'ice' : 'pillar');
  if (kind === 'tree') addTree(m, x, groundY, rr(0.55, 0.75));
  else if (kind === 'ice') { if (rr(0, 1) < 0.3) addGlacierSpire(m, x, groundY, rr(0.55, 0.75)); else addIceBlock(m, x, groundY, pk([2, 2, 3])); }
  else if (kind === 'rock') addDestructible(m, x, groundY - 24, 54, 46, { hp: 65, color: '#5a5245', debris: 6, kind: 'stone' });
  else if (kind === 'crate') addDestructible(m, x, groundY - 24, 46, 46, { hp: 45, color: '#9a7440', debris: 5, kind: 'crate' });
  else addCoverPillar(m, x, groundY, pk([90, 120, 130]));
}

// a big tree — hide behind the trunk or under the canopy; chip it and it slowly
// blows apart. scale ~1 is a normal tree, 1.4 a giant.
function addTree(m, x, groundY, scale = 1) {
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
function addAlcove(m, x, floorY, w = 160, h = 96, side = 1, color) {
  addStatic(m, x, floorY, w, 20, { color });
  addStatic(m, x + side * (w / 2 - 12), floorY - h / 2, 24, h, { color });
  addStatic(m, x, floorY - h + 10, w, 20, { color });
}

// a vertical wall with a crawl-through gap (a tunnel) centered at gapC
function addWallGap(m, x, y0, y1, gapC, gapH = 84, wallW = 48, color) {
  const topH = (gapC - gapH / 2) - y0;
  const botH = y1 - (gapC + gapH / 2);
  if (topH > 8) addStatic(m, x, y0 + topH / 2, wallW, topH, { color });
  if (botH > 8) addStatic(m, x, (gapC + gapH / 2) + botH / 2, wallW, botH, { color });
}

// a destructible pillar of cover you can duck behind
function addCoverPillar(m, x, groundY, h = 120, w = 40, color = '#6b6b7a') {
  const segs = Math.max(2, Math.round(h / 40));
  const seg = h / segs;
  for (let i = 0; i < segs; i++) addDestructible(m, x, groundY - seg / 2 - i * seg, w, seg, { hp: 50, color, debris: 4, kind: 'stone' });
}

function addLava(m, y = H - 22, acid = false) {
  m.data.lavaY = y;
  m.data.acid = acid;
  m.data.lavaBody = Bodies.rectangle(W / 2, y + 30, W * 2, 60, { isStatic: true, isSensor: true, label: 'lava' });
  Composite.add(m.composite, m.data.lavaBody);
}

function buildCrateStack(m, cx, bottomY, cols, rows) {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const crate = Bodies.rectangle(cx - (cols - 1) * 14 + col * 28, bottomY - row * 28, 26, 26, { density: 0.0015, friction: 0.4, label: 'crate' });
      addBody(m, crate, '#b08948');
    }
  }
}

function buildCratePyramid(m, cx, bottomY, baseCols) {
  for (let row = 0; row < baseCols; row++) {
    const cols = baseCols - row;
    for (let col = 0; col < cols; col++) {
      const crate = Bodies.rectangle(cx - (cols - 1) * 14 + col * 28, bottomY - row * 28, 26, 26, { density: 0.0015, friction: 0.4, label: 'crate' });
      addBody(m, crate, '#b08948');
    }
  }
}

function buildBridge(m, x0, x1, y) {
  const n = 9, step = (x1 - x0) / n;
  let prev = null;
  for (let i = 0; i < n; i++) {
    const plank = Bodies.rectangle(x0 + step * (i + 0.5), y, Math.abs(step) - 4, 10, { density: 0.002, friction: 0.5, label: 'plank' });
    plank.rope = true; // walk across it all you like — but the slack won't catch a sky-drop
    addBody(m, plank, '#8a6f4d');
    const link = prev
      ? Constraint.create({ bodyA: prev, bodyB: plank, pointA: { x: step / 2, y: 0 }, pointB: { x: -step / 2, y: 0 }, stiffness: 0.9, length: 4 })
      : Constraint.create({ bodyB: plank, pointA: { x: x0, y }, pointB: { x: -step / 2, y: 0 }, stiffness: 0.9, length: 4 });
    link.label = 'breakable';
    Composite.add(m.composite, link);
    prev = plank;
  }
  const end = Constraint.create({ bodyA: prev, pointA: { x: step / 2, y: 0 }, pointB: { x: x1, y }, stiffness: 0.9, length: 4 });
  end.label = 'breakable';
  Composite.add(m.composite, end);
}

function addSeesaw(m, x, y, w = 220) {
  const plank = Bodies.rectangle(x, y, w, 12, { density: 0.004, friction: 0.6, label: 'plank' });
  plank.w = w; plank.h = 12;
  addBody(m, plank, '#8a6f4d');
  const pivot = Constraint.create({ pointA: { x, y }, bodyB: plank, pointB: { x: 0, y: 0 }, stiffness: 1, length: 0 });
  pivot.label = 'pivot';
  Composite.add(m.composite, pivot);
  addStatic(m, x, y + 34, 14, 44);
}

function addChandelier(m, x, topY, dropLen, r = 26) {
  const ball = Bodies.circle(x, topY + dropLen, r, { density: 0.008, friction: 0.4, label: 'ball' });
  addBody(m, ball, '#100c18');
  const rope = Constraint.create({ pointA: { x, y: topY }, bodyB: ball, stiffness: 0.95, length: dropLen });
  rope.label = 'breakable';
  Composite.add(m.composite, rope);
}

function addHangingPlatform(m, x, topY, dropLen, w = 150) {
  const plat = Bodies.rectangle(x, topY + dropLen, w, 14, { density: 0.003, friction: 0.6, label: 'plank' });
  plat.w = w; plat.h = 14;
  addBody(m, plat, '#8a6f4d');
  for (const side of [-1, 1]) {
    const rope = Constraint.create({
      pointA: { x: x + side * (w / 2 - 10), y: topY },
      bodyB: plat, pointB: { x: side * (w / 2 - 10), y: 0 },
      stiffness: 0.9, length: dropLen,
    });
    rope.label = 'breakable';
    Composite.add(m.composite, rope);
  }
}

function addBarrels(m, xs, y) {
  for (const x of xs) {
    const b = Bodies.circle(x, y, 14, { density: 0.002, friction: 0.3, restitution: 0.3, label: 'barrel' });
    addBody(m, b, '#7d5a9e');
  }
}

function addPendulumBall(m, x, topY, len, r = 45, shove = 14) {
  const ball = Bodies.circle(x, topY + len, r, { density: 0.01, friction: 0.3, restitution: 0.4, label: 'ball' });
  addBody(m, ball, '#100c18');
  const chain = Constraint.create({ pointA: { x, y: topY }, bodyB: ball, stiffness: 1, length: len });
  chain.label = 'chain';
  Composite.add(m.composite, chain);
  Body.setVelocity(ball, { x: shove, y: 0 });
  (m.data.pendulums ??= []).push(ball);
  return ball;
}

function keepPendulumsSwinging(m) {
  for (const b of m.data.pendulums || []) {
    if (Math.hypot(b.velocity.x, b.velocity.y) < 2.5) {
      Body.setVelocity(b, { x: b.velocity.x + (b.position.x < W / 2 ? 1.5 : -1.5), y: b.velocity.y });
    }
  }
}

function addSpinner(m, x, y, len, rate = 0.02, color = '#2c2438') {
  const b = addStatic(m, x, y, len, 16, { color });
  b.spin = rate;
  return b;
}

function addMover(m, x, y, w, h, { ay = 80, period = 3000, color } = {}) {
  const b = addStatic(m, x, y, w, h, { color });
  b.kinematic = true;
  (m.data.movers ??= []).push({ b, x, y, ay, phase: rand(0, 6.28), period });
  return b;
}

function updateMovers(m, now) {
  for (const mv of m.data.movers || []) {
    Body.setPosition(mv.b, { x: mv.x, y: mv.y + Math.sin((now / mv.period) * Math.PI * 2 + mv.phase) * mv.ay });
  }
}

function addBumper(m, x, y, r = 22) {
  const b = Bodies.circle(x, y, r, { isStatic: true, restitution: 1.4, label: 'bouncy' });
  return addBody(m, b, '#ff8fc7');
}

function addIcicles(m, xs, y = 80) {
  m.data.icicles = [];
  for (const x of xs) {
    const ice = Bodies.polygon(x, y, 3, 24, { isStatic: true, density: 0.008, angle: Math.PI / 2, label: 'icicle' });
    addBody(m, ice, '#bfe8ff');
    m.data.icicles.push({ body: ice, shakeAt: 0, fallen: false });
  }
}

function updateIcicles(m, now) {
  for (const ic of m.data.icicles || []) {
    if (ic.fallen) continue;
    if (ic.body._blast && !ic.shakeAt) ic.shakeAt = now;
    const ix = ic.body.position.x;
    if (!ic.shakeAt) {
      const trig = players.some(p => p.alive && Math.abs(p.body.position.x - ix) < 42 && p.body.position.y > ic.body.position.y);
      if (trig) ic.shakeAt = now;
    } else if (now - ic.shakeAt > 350) {
      ic.fallen = true;
      Body.setStatic(ic.body, false);
      Body.setVelocity(ic.body, { x: 0, y: 2 });
    } else if (Math.random() < 0.3) {
      particles.push({ kind: 'square', x: ix + rand(-8, 8), y: ic.body.position.y + 20, vx: 0, vy: 1, life: 20, maxLife: 20, color: '#bfe8ff', r: 2 });
    }
  }
}

// gentle sideways force on every dynamic body (wind)
function applyWind(fx) {
  for (const b of Composite.allBodies(world)) {
    if (b.isStatic || b.isSensor) continue;
    Body.setVelocity(b, { x: b.velocity.x + fx, y: b.velocity.y });
  }
}

// periodic hazards: geysers, boulders, sky strikes, crate rain
function updateGeysers(m, now) {
  for (const g of m.data.geysers || []) {
    if (now > (g.nextAt || 0)) {
      g.nextAt = now + rand(2500, 5000);
      explode(g.x, g.y, 90, 16, 6);
    }
  }
}

function updateStrikes(m, now, interval = 2800, dmg = 22) {
  if (now > (m.data.nextStrike || (m.data.nextStrike = now + interval))) {
    m.data.nextStrike = now + rand(interval * 0.6, interval * 1.4);
    const xs = m.data.strikeXs;
    skyBolt(xs ? pick(xs) + rand(-40, 40) : rand(80, W - 80), dmg, null);
  }
}

function updateCrateRain(m, now, cap = 26, interval = 2600) {
  if (now > (m.data.nextCrate || 0)) {
    m.data.nextCrate = now + interval;
    if ((m.data.rained || 0) < cap) {
      m.data.rained = (m.data.rained || 0) + 1;
      const crate = Bodies.rectangle(rand(100, W - 100), -40, 26, 26, { density: 0.0015, friction: 0.4, label: 'crate' });
      addBody(m, crate, '#b08948');
    }
  }
}

// ---- post-build map extras ----
// Everything below runs AFTER def.build, seeded, on host AND LAN clients alike
// (statics never ride the snapshot, so both sides must generate the identical
// layout from the shared per-round seed — see buildMapExtras).

// scatter a few destructible props on platform tops — cover to hide behind,
// clutter to knock around. Runs on every map after its builder.
function scatterProps(m, rng) {
  const rr = (a, b) => a + rng() * (b - a);
  const pk = arr => arr[Math.floor(rng() * arr.length)];
  const spots = platformSpots(m, 3 + Math.floor(rng() * 3), rng);
  for (const s of spots) {
    const roll = rng();
    if (roll < 0.26) buildCrateStack(m, s.x, s.y - 14, pk([1, 2]), pk([1, 2, 3]));
    else if (roll < 0.4) addBarrels(m, [s.x - 14, s.x + 14], s.y - 16);
    else if (roll < 0.54) buildCrateStack(m, s.x, s.y - 14, 2, pk([3, 4])); // a wall to duck behind
    else if (roll < 0.9) addThemedCover(m, s.x, s.y + 8, rr, pk);           // biome cover to duck behind
    else {
      const big = Bodies.rectangle(s.x, s.y - 24, 42, 42, { density: 0.004, friction: 0.6, label: 'crate' });
      addBody(m, big, '#9a7440');
    }
  }
}

// scan the walkable profile and plant stepping platforms in any void too wide to
// clear with a running double jump — no more expanses you simply can't cross.
// Designed gaps in the mapbook top out around 170px; anything wider gets help.
const GAP_MAX = 190;   // widest void we leave alone
const GAP_STEP = 165;  // max span between inserted steppers
function ensureTraversable(m, rng) {
  if ((m.def.gravity ?? 2) < 0) return; // ceiling-walker maps play by their own rules
  const rr = (a, b) => a + rng() * (b - a);
  const walkable = Composite.allBodies(m.composite).filter(b =>
    !b.isSensor && b.label !== 'spikes' && b.collisionFilter.mask !== 0 &&
    (b.isStatic || b.label === 'plank') &&
    b.bounds.min.x > -60 && b.bounds.max.x < W + 60);
  const deathY = (m.data.lavaY ?? H) - 24;
  const step = 16;
  const cols = [];
  for (let x = 24; x <= W - 24; x += step) {
    const tops = walkable
      .filter(b => x > b.bounds.min.x + 2 && x < b.bounds.max.x - 2)
      .map(b => b.bounds.min.y)
      .filter(y => y > 90 && y < deathY);
    cols.push({ x, y: tops.length ? Math.min(...tops) : null });
  }
  let i = 0;
  while (i < cols.length) {
    if (cols[i].y != null) { i++; continue; }
    let j = i;
    while (j < cols.length && cols[j].y == null) j++;
    const leftEdge = i > 0 ? cols[i - 1] : null;
    const rightEdge = j < cols.length ? cols[j] : null;
    const x0 = leftEdge ? leftEdge.x : cols[i].x;
    const x1 = rightEdge ? rightEdge.x : cols[j - 1].x;
    const width = x1 - x0;
    if (width > GAP_MAX) {
      const edgeY = Math.min(leftEdge?.y ?? 560, rightEdge?.y ?? 560);
      const n = Math.max(1, Math.ceil(width / GAP_STEP) - 1);
      // steppers sit near the lower neighbor's height so both sides can make the hop
      for (let k = 1; k <= n; k++) {
        const px = Math.max(60, Math.min(W - 60, x0 + (width * k) / (n + 1)));
        const py = Math.max(150, Math.min(deathY - 80, edgeY + rr(-40, 25)));
        // borrow the nearest platform's palette so inserts read as native terrain
        let color = '#171221', bd = 1e9;
        for (const b of walkable) {
          const d = Math.hypot(b.position.x - px, b.position.y - py);
          if (d < bd) { bd = d; color = b.render.fillStyle || color; }
        }
        addStatic(m, px, py, rr(104, 148), 22, { color, friction: m.def.icy ? 0.01 : 0.6 });
        if (rng() < 0.35) addThemedCover(m, px, py - 11, rr, arr => arr[Math.floor(rng() * arr.length)]); // an obstacle to duck behind mid-crossing
      }
    }
    i = j + 1;
  }
}

// guarantee every map has real destructible cover, whatever its builder did
function ensureCover(m, rng) {
  const rr = (a, b) => a + rng() * (b - a);
  const pk = arr => arr[Math.floor(rng() * arr.length)];
  const want = m.def.cozy ? 2 : 3;
  const have = Composite.allBodies(m.composite).filter(b => b.label === 'destructible').length;
  if (have >= want * 3) return; // builder already made a cover-rich map (trees are many segments)
  const spots = platformSpots(m, want, rng);
  for (const s of spots) addThemedCover(m, s.x, s.y + 8, rr, pk);
}

// the one entry point: seed-deterministic extras, run identically on host & client
function buildMapExtras(m, seed) {
  const rng = makeRng(seed);
  ensureTraversable(m, rng);
  scatterProps(m, rng);
  ensureCover(m, rng);
  ensureSetPiece(m, rng);
}

// ---- escape analysis: no wizard starts a round somewhere it can't get out of ----
// Spawns are authored as sky positions — the wizard falls and lands wherever the
// terrain, plus everything the seeded passes above just planted, puts it. A
// sealed pocket (a shaft between two crate stacks, a nook a set-piece grew a
// roof over, a spawn buried inside a ceiling slab) is a whole round spent
// watching. So model the arena as a coarse grid and ask the only question that
// matters: from where this wizard LANDS, can it reach the rest of the map?
//
// Read-only — nothing here touches the composite, so it can run on the host
// alone without desyncing LAN clients (only the resulting spawn position, which
// already rides the snapshot, differs).
const REACH_CELL = 16;    // grid step
const REACH_PAD = 15;     // the wizard's radius: grow terrain by it and the wizard is a point
const REACH_CLIMB = 21;   // cells of travel a jump (~200px) plus an air jump (~150px) buys
const REACH_SHARE = 0.35; // reach less of the main arena than this and you're walled in

function buildReach(m) {
  const cols = Math.ceil(W / REACH_CELL), rows = Math.ceil(H / REACH_CELL);
  const n = cols * rows;
  // solid: everything you can stand on or bump into. firm: the subset steady
  // enough to fall onto from the sky. A rope bridge carries a wizard who walks
  // across it but a sky-drop punches through the slack; cover is a 46px block
  // (often a leaning crystal) that flicks a falling wizard off sideways. Both
  // are fine ground once you're on them — neither is a landing pad.
  const solid = new Uint8Array(n), firm = new Uint8Array(n);
  const V = Matter.Vertices;
  for (const b of Composite.allBodies(m.composite)) {
    // planks are dynamic but they're ground all the same — a rope bridge or a
    // hanging platform is the only floor some of the sky maps have
    if ((!b.isStatic && b.label !== 'plank') || b.isSensor || b.collisionFilter.mask === 0 || b.label === 'lava') continue;
    const solidOnly = !!b.rope || b.label === 'destructible';
    const x0 = Math.max(0, Math.floor((b.bounds.min.x - REACH_PAD) / REACH_CELL));
    const x1 = Math.min(cols - 1, Math.floor((b.bounds.max.x + REACH_PAD) / REACH_CELL));
    const y0 = Math.max(0, Math.floor((b.bounds.min.y - REACH_PAD) / REACH_CELL));
    const y1 = Math.min(rows - 1, Math.floor((b.bounds.max.y + REACH_PAD) / REACH_CELL));
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const i = cy * cols + cx;
        if (solid[i] && (solidOnly || firm[i])) continue;
        const x = cx * REACH_CELL + REACH_CELL / 2, y = cy * REACH_CELL + REACH_CELL / 2;
        // centre plus four body-radius probes: a one-cell crack isn't a corridor
        if (V.contains(b.vertices, { x, y }) ||
            V.contains(b.vertices, { x: x - REACH_PAD, y }) || V.contains(b.vertices, { x: x + REACH_PAD, y }) ||
            V.contains(b.vertices, { x, y: y - REACH_PAD }) || V.contains(b.vertices, { x, y: y + REACH_PAD })) {
          solid[i] = 1;
          if (!solidOnly) firm[i] = 1;
        }
      }
    }
  }
  const gdir = (m.def.gravity ?? 2) < 0 ? -1 : 1; // ceiling-walker maps fall the other way
  const deadFrom = gdir > 0 ? (m.data.lavaY ?? H + 40) - 8 : null; // lava is a floor you fall through
  const pass = new Uint8Array(n), stand = new Uint8Array(n), footing = new Uint8Array(n);
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const i = cy * cols + cx;
      if (solid[i]) continue;
      if (deadFrom != null && (cy + 1) * REACH_CELL > deadFrom) continue;
      const head = i - gdir * cols; // 32px of headroom, or the ball doesn't fit
      if (head < 0 || head >= n || solid[head]) continue;
      pass[i] = 1;
      const foot = i + gdir * cols;
      if (foot < 0 || foot >= n) continue;
      if (solid[foot]) stand[i] = 1;
      if (firm[foot]) footing[i] = 1;
    }
  }
  return { cols, rows, solid, pass, stand, footing, gdir, wrap: !!m.def.wrap, escape: new Map() };
}

// every cell you can get to from `start`, tagged with the climb budget left on
// arrival. Standing refills the budget; going up spends it; drifting sideways
// through the air spends it too, so nobody "flies" across the map at altitude.
function reachFrom(g, start) {
  const { cols, pass, stand, gdir, wrap } = g;
  const best = new Int16Array(pass.length).fill(-1);
  best[start] = REACH_CLIMB;
  const stack = [start];
  while (stack.length) {
    const i = stack.pop();
    const b = best[i];
    const cx = i % cols, cy = (i - cx) / cols;
    const step = (ni, nb) => {
      if (nb < 0 || ni < 0 || ni >= pass.length || !pass[ni]) return;
      const v = stand[ni] ? REACH_CLIMB : nb;
      if (v <= best[ni]) return;
      best[ni] = v;
      stack.push(ni);
    };
    step(i + gdir * cols, b);      // falling is free
    step(i - gdir * cols, b - 1);  // climbing costs
    const air = stand[i] ? b : b - 1;
    if (cx > 0) step(i - 1, air); else if (wrap) step(cy * cols + cols - 1, air);
    if (cx < cols - 1) step(i + 1, air); else if (wrap) step(cy * cols, air);
  }
  return best;
}

function reachCount(g, best) {
  let n = 0;
  for (let i = 0; i < best.length; i++) if (best[i] >= 0 && g.stand[i]) n++;
  return n;
}

// where a wizard dropped at (x, y) actually comes to rest. -1 means the drop is
// no good at all: buried in geometry, or a straight fall into the lava/void.
function reachLanding(g, x, y) {
  const { cols, rows, pass, stand, gdir } = g;
  const cx = Math.max(0, Math.min(cols - 1, Math.floor(x / REACH_CELL)));
  const cy = Math.max(0, Math.min(rows - 1, Math.floor(y / REACH_CELL)));
  let i = cy * cols + cx;
  if (!pass[i]) return -1;
  for (let t = 0; t < rows; t++) {
    if (stand[i]) return i;
    const next = i + gdir * cols;
    if (next < 0 || next >= pass.length || !pass[next]) return -1;
    i = next;
  }
  return -1;
}

// how much of the map you can work with from a given landing cell (memoised —
// eight wizards landing on one platform is one flood fill, not eight)
function reachEscape(g, land) {
  let n = g.escape.get(land);
  if (n == null) { n = reachCount(g, reachFrom(g, land)); g.escape.set(land, n); }
  return n;
}

function reachInfo(m) {
  if (m.data.reach) return m.data.reach;
  const g = buildReach(m);
  // the main arena is simply the biggest region anything can reach; every
  // sealed pocket measures a tiny fraction of it
  const seeds = m.def.spawns.map(s => reachLanding(g, s.x, s.y));
  for (let cx = 2; cx < g.cols; cx += 5) {
    for (let cy = 0; cy < g.rows; cy++) {
      const i = cy * g.cols + cx;
      if (g.stand[i]) { seeds.push(i); break; }
    }
  }
  g.arenaN = 1;
  for (const i of seeds) if (i >= 0) g.arenaN = Math.max(g.arenaN, reachEscape(g, i));
  m.data.reach = g;
  return g;
}

// somewhere you can actually come down onto: level ground either side, so a
// wizard falling from the sky lands on the platform instead of clipping its lip
// and tumbling off. The grid is dilated by half a body, so this is ~a wizard's
// width of margin from the real edge.
function reachLandable(g, i) {
  const cx = i % g.cols;
  return !!g.footing[i] && cx > 0 && cx < g.cols - 1 && !!g.footing[i - 1] && !!g.footing[i + 1];
}

// the question spawnPointFor asks: drop a wizard here and can it get out again?
function spawnEscapes(m, x, y) {
  const g = reachInfo(m);
  const land = reachLanding(g, x, y);
  return land >= 0 && reachLandable(g, land) && reachEscape(g, land) >= g.arenaN * REACH_SHARE;
}

// loose cover settles on platform tops, and the grid above only knows about
// statics — landing square on a crate stack and pinballing off a sky island is
// as fatal as landing in a pit. So the drop column has to be clear of anything
// that rolls. Planks don't count: a rope bridge is a fine place to come down.
const DROP_LABELS = new Set(['crate', 'barrel', 'ball']);
function dropColumnClear(m, x, y0, y1) {
  const lo = Math.min(y0, y1), hi = Math.max(y0, y1);
  for (const b of Composite.allBodies(m.composite)) {
    if (b.isStatic || b.isSensor || !DROP_LABELS.has(b.label)) continue;
    if (b.bounds.max.x < x - 18 || b.bounds.min.x > x + 18) continue;
    if (b.bounds.max.y < lo || b.bounds.min.y > hi) continue;
    return false;
  }
  return true;
}

// the whole guarantee in one call. Three outcomes, least invasive first:
// the authored spot as designed; a nudge of a few cells along the same ledge
// when the drop only clips its edge; a relocation into the main arena when the
// spot is a genuine trap — buried in terrain, a straight fall into the lava, or
// a pocket walled off from everywhere else.
function safeSpawnPoint(m, x, y, busy = []) {
  const g = reachInfo(m);
  const escapes = i => i >= 0 && reachEscape(g, i) >= g.arenaN * REACH_SHARE;
  const sound = (nx, i) => reachLandable(g, i) && escapes(i) &&
    dropColumnClear(m, nx, y, ((i - (i % g.cols)) / g.cols) * REACH_CELL);
  const land = reachLanding(g, x, y);
  if (escapes(land)) {
    if (sound(x, land)) return { x, y };
    for (let d = 1; d <= 6; d++) {
      for (const side of [-1, 1]) {
        const nx = x + side * d * REACH_CELL;
        if (nx < 40 || nx > W - 40) continue;
        const ni = reachLanding(g, nx, y);
        if (ni >= 0 && sound(nx, ni)) return { x: nx, y };
      }
    }
  }
  return arenaSpawnNear(m, x, y, busy) || { x, y };
}

function reachSpots(g) {
  if (g.spots) return g.spots;
  g.spots = [];
  for (let i = 0; i < g.stand.length; i++) {
    const cx = i % g.cols;
    if (cx < 3 || cx > g.cols - 4) continue; // not squeezed against the side walls
    if (!reachLandable(g, i)) continue;
    g.spots.push({ i, x: cx * REACH_CELL + REACH_CELL / 2, y: ((i - cx) / g.cols) * REACH_CELL + REACH_CELL / 2 });
  }
  return g.spots;
}

// the nearest standing spot that IS escapable, skipping wherever the wizards
// already on the field are standing. Returns a drop-in point above it.
function arenaSpawnNear(m, x, y, busy = []) {
  const g = reachInfo(m);
  const cost = s => Math.abs(s.x - x) + Math.abs(s.y - y) * 0.35;
  const ranked = reachSpots(g)
    .filter(s => !busy.some(q => Math.hypot(q.x - s.x, q.y - s.y) < 70))
    .sort((a, b) => cost(a) - cost(b));
  for (let k = 0; k < ranked.length && k < 40; k++) {
    const s = ranked[k];
    if (reachEscape(g, s.i) < g.arenaN * REACH_SHARE) continue;
    // drop in from as high as the column above is clear, so it still reads as an arrival
    let lift = 0;
    while (lift < 8) {
      const above = s.i - g.gdir * g.cols * (lift + 1);
      if (above < 0 || above >= g.pass.length || !g.pass[above]) break;
      lift++;
    }
    const y0 = s.y - g.gdir * lift * REACH_CELL;
    if (!dropColumnClear(m, s.x, y0, s.y)) continue;
    return { x: s.x, y: y0 };
  }
  return null;
}

function updateBoulders(m, now, interval = 5000) {
  if (now > (m.data.nextBoulder || (m.data.nextBoulder = now + 2500))) {
    m.data.nextBoulder = now + interval;
    const side = pick([-1, 1]);
    const rock = Bodies.circle(side < 0 ? -20 : W + 20, m.data.boulderY ?? 100, 24, { density: 0.01, friction: 0.4, restitution: 0.2, label: 'ball' });
    addBody(m, rock, '#5a5245');
    Body.setVelocity(rock, { x: -side * rand(8, 14), y: 0 });
  }
}
