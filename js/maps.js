// maps.js — map registry, shared builders, hazard hooks
const MAPS = [];
function defineMap(def) { MAPS.push(def); }

function addBody(m, body, color) {
  if (color) body.render.fillStyle = color;
  Composite.add(m.composite, body);
  return body;
}

function addStatic(m, x, y, w, h, opts = {}) {
  const b = Bodies.rectangle(x, y, w, h, { isStatic: true, friction: opts.friction ?? 0.6 });
  return addBody(m, b, opts.color || '#171221');
}

function addLava(m, y = H - 22) {
  m.data.lavaY = y;
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

defineMap({
  name: 'LAVA FOUNDRY', bg: '#241d2e',
  spawns: [{ x: 120, y: 440 }, { x: W - 120, y: 440 }, { x: 260, y: 440 }, { x: W - 260, y: 440 }],
  build(m) {
    addStatic(m, 170, 520, 340, 40);
    addStatic(m, W - 170, 520, 340, 40);
    addStatic(m, W / 2, 660, 260, 40);
    buildCrateStack(m, W / 2, 612, 4, 7);
    buildBridge(m, 340, 570, 480);
    buildBridge(m, W - 340, W - 570, 480);
    addChandelier(m, W / 2, -10, 190, 30);
    addBarrels(m, [90, 130, W - 90, W - 130], 480);
    addLava(m);
  },
});

defineMap({
  name: 'THE PENDULUM', bg: '#221c2b',
  spawns: [{ x: 110, y: 410 }, { x: W - 110, y: 410 }, { x: W / 2 - 240, y: 580 }, { x: W / 2 + 240, y: 580 }],
  build(m) {
    addStatic(m, W / 2, 645, 660, 40);
    addStatic(m, 110, 470, 220, 36);
    addStatic(m, W - 110, 470, 220, 36);
    buildCrateStack(m, W / 2 + 200, 611, 3, 3);
    addBarrels(m, [W / 2 - 180, W / 2 - 220], 600);
    addHangingPlatform(m, 330, -10, 260, 150);
    addHangingPlatform(m, W - 330, -10, 260, 150);
    const ball = Bodies.circle(W / 2, 320, 45, { density: 0.01, friction: 0.3, restitution: 0.4, label: 'ball' });
    addBody(m, ball, '#100c18');
    const chain = Constraint.create({ pointA: { x: W / 2, y: -80 }, bodyB: ball, stiffness: 1, length: 400 });
    chain.label = 'chain';
    Composite.add(m.composite, chain);
    Body.setVelocity(ball, { x: 14, y: 0 });
    m.data.ball = ball;
    addLava(m);
  },
  update(m) {
    const b = m.data.ball;
    if (Math.hypot(b.velocity.x, b.velocity.y) < 2.5) {
      Body.setVelocity(b, { x: b.velocity.x + (b.position.x < W / 2 ? 1.5 : -1.5), y: b.velocity.y });
    }
  },
});

defineMap({
  name: 'FROST CAVERN', bg: '#1c2531', icy: true,
  spawns: [{ x: 150, y: 480 }, { x: W - 150, y: 480 }, { x: 420, y: 480 }, { x: W - 420, y: 480 }],
  build(m) {
    addStatic(m, 250, 560, 500, 40, { friction: 0.01, color: '#3d5a73' });
    addStatic(m, W - 250, 560, 500, 40, { friction: 0.01, color: '#3d5a73' });
    addSeesaw(m, W / 2, 590, 240);
    buildCrateStack(m, 250, 532, 2, 2);
    buildCrateStack(m, W - 250, 532, 2, 2);
    m.data.icicles = [];
    for (const x of [180, 330, 480, 640, 800, 950, 1100]) {
      const ice = Bodies.polygon(x, 80, 3, 24, { isStatic: true, density: 0.008, angle: Math.PI / 2, label: 'icicle' });
      addBody(m, ice, '#bfe8ff');
      m.data.icicles.push({ body: ice, shakeAt: 0, fallen: false });
    }
    addLava(m);
  },
  update(m, now) {
    for (const ic of m.data.icicles) {
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
  },
});

defineMap({
  name: 'RISING LAVA', bg: '#2b1d22',
  spawns: [{ x: W / 2 - 100, y: 600 }, { x: W / 2 + 100, y: 600 }, { x: 240, y: 460 }, { x: W - 240, y: 460 }],
  build(m) {
    addStatic(m, W / 2, 640, 320, 36);
    addStatic(m, 240, 500, 240, 32);
    addStatic(m, W - 240, 500, 240, 32);
    addStatic(m, W / 2, 380, 260, 32);
    addStatic(m, 170, 250, 200, 32);
    addStatic(m, W - 170, 250, 200, 32);
    addStatic(m, W / 2, 140, 220, 32);
    buildCrateStack(m, W / 2, 358, 3, 2);
    addBarrels(m, [240, 280, W - 240, W - 280], 470);
    addHangingPlatform(m, 460, 30, 130, 130);
    addHangingPlatform(m, W - 460, 30, 130, 130);
    addLava(m);
  },
  update(m, now, dt) {
    m.data.lavaY = Math.max(210, m.data.lavaY - 14 * dt / 1000);
    Body.setPosition(m.data.lavaBody, { x: W / 2, y: m.data.lavaY + 30 });
  },
});
