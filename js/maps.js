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
  const b = Bodies.rectangle(x, y, w, h, { isStatic: true, friction: 0.6, label: 'destructible' });
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

// theme-flavored destructible cover: what you duck behind depends on the biome.
// kind comes from the map def (theme defaults), falling back on map flags.
function addThemedCover(m, x, groundY, rr, pk) {
  const kind = m.def?.cover || (m.def?.icy ? 'ice' : 'pillar');
  if (kind === 'tree') addTree(m, x, groundY, rr(0.55, 0.75));
  else if (kind === 'ice') addIceBlock(m, x, groundY, pk([2, 2, 3]));
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
