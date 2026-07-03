// events.js — environmental events: rare round modifiers rolled at round start
// and announced with a banner just after FIGHT!. All physics runs host-side;
// visuals reach LAN clients and the killcam through the snapshot's `ev` field.
const ENV_EVENT_CHANCE = 0.05; // rare on purpose — one round in twenty

// find n platform tops spread across the map (same spirit as tomeDropSpot)
function vineSpots(m, n) {
  const solids = Composite.allBodies(m.composite).filter(b =>
    b.isStatic && !b.isSensor && b.collisionFilter.mask !== 0 &&
    b.bounds.min.x > -60 && b.bounds.max.x < W + 60);
  const spots = [];
  for (let tries = 0; tries < n * 10 && spots.length < n; tries++) {
    const x = rand(90, W - 90);
    const col = solids.filter(b => x > b.bounds.min.x + 8 && x < b.bounds.max.x - 8);
    if (!col.length) continue;
    const tops = col.map(b => b.bounds.min.y).filter(y => y > 150 && y < H - 60);
    if (!tops.length) continue;
    const y = Math.min(...tops);
    if (spots.some(s => Math.abs(s.x - x) < 70 && Math.abs(s.y - y) < 60)) continue;
    spots.push({ x, y });
  }
  return spots;
}

function killVine(v) {
  const vines = currentMap.data.vines;
  if (!vines || !vines.includes(v)) return;
  vines.splice(vines.indexOf(v), 1);
  Composite.remove(currentMap.composite, v);
  spawnParticles(v.position.x, v.position.y, '#7bd88f', 12, 4);
  sfx.squeak();
}

const ENV_EVENTS = [
  {
    id: 'overgrowth', name: 'OVERGROWTH', color: '#7bd88f',
    start(m, now) {
      m.data.vines = [];
      for (const s of vineSpots(m, 12)) {
        const v = Bodies.rectangle(s.x, s.y - 24, 22, 48, { isStatic: true, isSensor: true, label: 'vine' });
        v.render.fillStyle = '#4f8a3d';
        v.kinematic = true; // so the snapshot carries it to clients and the killcam
        v.bornAt = now;
        Composite.add(m.composite, v);
        m.data.vines.push(v);
      }
    },
    update(m, now) {
      for (const p of players) {
        if (!p.alive) continue;
        for (const v of m.data.vines || []) {
          if (Math.abs(p.body.position.x - v.position.x) < 26 && Math.abs(p.body.position.y - v.position.y) < 44) {
            p.vineSlowUntil = now + 130;
            break;
          }
        }
      }
    },
  },
  {
    id: 'winter', name: 'WINTER', color: '#bfe8ff',
    start(m) {
      m.data.eventIcy = true;
      for (const b of Composite.allBodies(m.composite)) {
        if (b.isStatic && !b.isSensor) b.friction = 0.01;
      }
    },
  },
  {
    id: 'tempest', name: 'TEMPEST', color: '#9ef0f0',
    update(m, now) {
      applyWind(Math.sin(now / 1400) * 0.38);
      updateStrikes(m, now, 3200, 20);
    },
  },
  {
    id: 'meteors', name: 'METEOR SHOWER', color: '#ff8c5a',
    update(m, now) {
      if (now > (m.data.nextMeteor || (m.data.nextMeteor = now + 1600))) {
        m.data.nextMeteor = now + rand(1800, 3200);
        const fb = dropProjectile(null, rand(80, W - 80), -30, { r: 11, vx: rand(-3, 3), vy: 10, color: '#ff8c5a', density: 0.006, expireMs: 9000 });
        fb.onHit = (self) => explode(self.position.x, self.position.y, 95, 14, 16, null);
      }
    },
  },
  {
    id: 'moonshot', name: 'MOONSHOT', color: '#e8d5ff',
    start() {
      game.baseGravity *= 0.45;
      engine.gravity.y *= 0.45;
    },
  },
  {
    id: 'nightfall', name: 'NIGHTFALL', color: '#3d2f5c',
  },
  {
    id: 'quake', name: 'EARTHQUAKE', color: '#b08948',
    update(m, now) {
      if (now > (m.data.nextQuake || (m.data.nextQuake = now + 2600))) {
        m.data.nextQuake = now + rand(3500, 6000);
        m.data.quakeUntil = now + 900;
        sfx.explosion();
      }
      if (now < (m.data.quakeUntil || 0)) {
        addShake(1.3);
        if (Math.random() < 0.25) {
          for (const b of Composite.allBodies(world)) {
            if (b.isStatic || b.isSensor) continue;
            Body.setVelocity(b, { x: b.velocity.x + rand(-1.6, 1.6), y: b.velocity.y - rand(0, 1.2) });
          }
        }
      }
    },
  },
  {
    id: 'rubber', name: 'RUBBER WORLD', color: '#ff8fc7',
    start(m) {
      for (const b of Composite.allBodies(m.composite)) {
        if (b.isStatic && !b.isSensor) b.restitution = 0.9;
      }
    },
  },
  {
    id: 'critters', name: 'CRITTER PLAGUE', color: '#9be15d',
    update(m, now) {
      if (now > (m.data.nextCritter || (m.data.nextCritter = now + 2000))) {
        m.data.nextCritter = now + rand(2200, 3600);
        if ([...summons].filter(b => b.label === 'critter').length < 8) {
          const side = pick([-1, 1]);
          const b = Bodies.circle(side < 0 ? -14 : W + 14, rand(80, 300), 9, { density: 0.002, friction: 0.5, restitution: 0.4, label: 'critter' });
          b.critter = { hopAt: 0, dir: -side, hop: 6, speed: 4 };
          summon(b, { life: 22000, color: pick(['#9be15d', '#e15d5d', '#c084fc']), contactDamage: 6 });
          Body.setVelocity(b, { x: -side * 4, y: 0 });
        }
      }
    },
  },
  {
    id: 'surge', name: 'ARCANE SURGE', color: '#ffd166',
    update(m, now) {
      if (now > (m.data.nextSurge || (m.data.nextSurge = now + 1200))) {
        m.data.nextSurge = now + rand(1400, 2200);
        if (tomes.size < 10) spawnTome(now);
      }
    },
  },
];

function envEventById(id) {
  return ENV_EVENTS.find(e => e.id === id) || null;
}

function rollEnvEvent(now) {
  game.envEvent = null;
  if (Math.random() >= ENV_EVENT_CHANCE) return;
  const def = pick(ENV_EVENTS);
  game.envEvent = { def, announced: false };
  def.start?.(currentMap, now);
}

function updateEnvEvent(now, dt) {
  const ev = game.envEvent;
  if (!ev || game.state !== 'PLAY') return;
  if (!ev.announced && now > (game.fightAt || 0) + 800) {
    ev.announced = true;
    setBanner(ev.def.name, ev.def.color, 1700);
    doFlash(ev.def.color, 0.18);
    sfx.event();
  }
  if (ev.announced) ev.def.update?.(currentMap, now, dt);
}

// ---------- visuals (shared by live draw, LAN clients, and the killcam) ----------

// deterministic hash so the ambient weather layers need no particle state
function envHash(i) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function drawVineAt(x, yBase, h, now) {
  const seed = Math.round(x);
  const sway = Math.sin(now * 0.0016 + seed) * 4;
  ctx.strokeStyle = '#4f8a3d';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, yBase);
  ctx.quadraticCurveTo(x - sway, yBase - h * 0.55, x + sway, yBase - h);
  ctx.stroke();
  ctx.fillStyle = '#7bd88f';
  for (let i = 0; i < 4; i++) {
    const t = 0.25 + i * 0.2;
    const lx = x + Math.sin(now * 0.0016 + seed + i) * 4 * t + (i % 2 ? 7 : -7);
    const ly = yBase - h * t;
    ctx.beginPath();
    ctx.ellipse(lx, ly, 6, 3.5, (i % 2 ? 0.6 : -0.6) + sway * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }
}

let nightCanvas = null, nightCtx = null;
function drawNightfall(lights) {
  if (!nightCanvas) {
    nightCanvas = document.createElement('canvas');
    nightCanvas.width = W;
    nightCanvas.height = H;
    nightCtx = nightCanvas.getContext('2d');
  }
  nightCtx.globalCompositeOperation = 'source-over';
  nightCtx.fillStyle = 'rgba(4, 2, 12, 0.86)';
  nightCtx.clearRect(0, 0, W, H);
  nightCtx.fillRect(0, 0, W, H);
  nightCtx.globalCompositeOperation = 'destination-out';
  for (const l of lights) {
    const g = nightCtx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
    g.addColorStop(0, 'rgba(0,0,0,0.95)');
    g.addColorStop(0.6, 'rgba(0,0,0,0.55)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    nightCtx.fillStyle = g;
    nightCtx.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
  }
  ctx.drawImage(nightCanvas, 0, 0);
}

function drawEnvVisuals(id, now, lights = []) {
  if (!id) return;
  if (id === 'winter') {
    ctx.fillStyle = 'rgba(190, 225, 255, 0.05)';
    ctx.fillRect(-30, -30, W + 60, H + 60);
    ctx.fillStyle = '#f4fbff';
    for (let i = 0; i < 60; i++) {
      const speed = 30 + envHash(i) * 50;
      const x = (envHash(i + 100) * (W + 40) + Math.sin(now * 0.001 + i) * 30 + W) % (W + 40) - 20;
      const y = (envHash(i + 200) * H + now * 0.001 * speed) % (H + 20) - 10;
      ctx.globalAlpha = 0.35 + envHash(i + 300) * 0.45;
      ctx.fillRect(x, y, 2.5, 2.5);
    }
    ctx.globalAlpha = 1;
  } else if (id === 'tempest') {
    const wind = Math.sin(now / 1400) * 26;
    ctx.strokeStyle = 'rgba(120, 150, 200, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 40; i++) {
      const x = (envHash(i) * (W + 80) + now * 0.02 * (0.6 + envHash(i + 50)) * Math.sign(wind) + W) % (W + 80) - 40;
      const y = (envHash(i + 100) * H + now * 0.35 * (0.7 + envHash(i + 150) * 0.6)) % (H + 30) - 15;
      ctx.moveTo(x, y);
      ctx.lineTo(x + wind * 0.4, y + 14);
    }
    ctx.stroke();
  } else if (id === 'meteors') {
    ctx.fillStyle = '#ff8c5a';
    for (let i = 0; i < 14; i++) {
      const x = (envHash(i) * W + Math.sin(now * 0.0012 + i) * 24 + W) % W;
      const y = H - ((envHash(i + 60) * H + now * 0.02 * (0.5 + envHash(i + 90))) % H);
      ctx.globalAlpha = 0.25 + envHash(i + 30) * 0.3;
      ctx.fillRect(x, y, 2.5, 2.5);
    }
    ctx.globalAlpha = 1;
  } else if (id === 'moonshot') {
    ctx.fillStyle = '#e8d5ff';
    for (let i = 0; i < 18; i++) {
      const x = (envHash(i) * W + Math.sin(now * 0.0008 + i * 2) * 40 + W) % W;
      const y = H - ((envHash(i + 40) * H + now * 0.012) % H);
      ctx.globalAlpha = 0.2 + 0.25 * Math.sin(now * 0.003 + i);
      ctx.fillRect(x, y, 3, 3);
    }
    ctx.globalAlpha = 1;
  } else if (id === 'surge') {
    ctx.fillStyle = '#ffd166';
    for (let i = 0; i < 16; i++) {
      const x = (envHash(i) * W + Math.sin(now * 0.002 + i * 3) * 18 + W) % W;
      const y = (envHash(i + 70) * H + now * 0.03) % H;
      ctx.globalAlpha = 0.2 + 0.3 * Math.abs(Math.sin(now * 0.004 + i));
      ctx.fillRect(x, y, 2.5, 2.5);
    }
    ctx.globalAlpha = 1;
  } else if (id === 'nightfall') {
    drawNightfall(lights);
  }
}

// live world → light sources for nightfall (host & couch)
function drawEnvVisualsLive(now) {
  const ev = game.envEvent;
  if (!ev || !ev.announced) return;
  let lights = [];
  if (ev.def.id === 'nightfall') {
    for (const p of players) if (p.alive) lights.push({ x: p.body.position.x, y: p.body.position.y, r: 160 });
    for (const fb of projectiles) lights.push({ x: fb.position.x, y: fb.position.y, r: 90 });
    for (const t of tomes) lights.push({ x: t.position.x, y: t.position.y, r: 70 });
  }
  drawEnvVisuals(ev.def.id, now, lights);
}

// snapshot → light sources for nightfall (LAN clients & the killcam)
function envLightsFromSnap(snap, ghosts) {
  const lights = [];
  for (const g of ghosts) if (g.alive) lights.push({ x: g._x, y: g._y, r: 160 });
  for (const e of snap.bodies || []) {
    if (e.l === 'projectile') lights.push({ x: e.x, y: e.y, r: 90 });
    if (e.l === 'tome') lights.push({ x: e.x, y: e.y, r: 70 });
  }
  return lights;
}
