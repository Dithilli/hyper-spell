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

function updateBoulders(m, now, interval = 5000) {
  if (now > (m.data.nextBoulder || (m.data.nextBoulder = now + 2500))) {
    m.data.nextBoulder = now + interval;
    const side = pick([-1, 1]);
    const rock = Bodies.circle(side < 0 ? -20 : W + 20, m.data.boulderY ?? 100, 24, { density: 0.01, friction: 0.4, restitution: 0.2, label: 'ball' });
    addBody(m, rock, '#5a5245');
    Body.setVelocity(rock, { x: -side * rand(8, 14), y: 0 });
  }
}
