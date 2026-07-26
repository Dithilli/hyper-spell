// events.js — environmental events: rare round modifiers rolled at round start
// and announced with a banner just after FIGHT!. All physics runs host-side;
// visuals reach LAN clients and the killcam through the snapshot's `ev` field.
const ENV_EVENT_CHANCE = 0.20; // one round in five

// a wizard dropping in at round start must land on the platform, not on the
// crate stack we just piled onto it — a bounce off loose cover on a narrow sky
// island is a death before FIGHT!. Keep clutter out of the drop columns.
const SPAWN_CLEAR = 55;
function inSpawnColumn(m, x) {
  return (m.def.spawns || []).some(s => Math.abs(s.x - x) < SPAWN_CLEAR);
}

// find n platform tops spread across the map (same spirit as tomeDropSpot).
// Pass a seeded rng when the result must match across host & LAN clients.
function platformSpots(m, n, rng) {
  const rr = rng ? (a, b) => a + rng() * (b - a) : rand;
  const solids = Composite.allBodies(m.composite).filter(b =>
    b.isStatic && !b.isSensor && b.collisionFilter.mask !== 0 &&
    b.bounds.min.x > -60 && b.bounds.max.x < W + 60);
  const spots = [];
  // first pass keeps clear of the drop columns; a second, looser pass only runs
  // if that starved a cramped map of cover
  for (let pass = 0; pass < 2 && spots.length < n; pass++) {
    for (let tries = 0; tries < n * 10 && spots.length < n; tries++) {
      const x = rr(90, W - 90);
      if (pass === 0 && inSpawnColumn(m, x)) continue;
      const col = solids.filter(b => x > b.bounds.min.x + 8 && x < b.bounds.max.x - 8);
      if (!col.length) continue;
      const tops = col.map(b => b.bounds.min.y).filter(y => y > 150 && y < H - 60);
      if (!tops.length) continue;
      const y = Math.min(...tops);
      if (spots.some(s => Math.abs(s.x - x) < 70 && Math.abs(s.y - y) < 60)) continue;
      spots.push({ x, y });
    }
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
      for (const s of platformSpots(m, 12)) {
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
  ctx.lineCap = 'round';
  // twin twist for a braided stem: dark core + lit strand
  ctx.strokeStyle = '#2f5e28'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(x, yBase);
  ctx.quadraticCurveTo(x - sway, yBase - h * 0.55, x + sway, yBase - h); ctx.stroke();
  ctx.strokeStyle = '#5aa246'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x + 1, yBase);
  ctx.quadraticCurveTo(x - sway + 1, yBase - h * 0.55, x + sway + 1, yBase - h); ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const t = 0.18 + i * 0.18;
    const lx = x + Math.sin(now * 0.0016 + seed + i) * 4 * t + (i % 2 ? 8 : -8);
    const ly = yBase - h * t;
    const ang = (i % 2 ? 0.6 : -0.6) + sway * 0.05;
    const g = ctx.createLinearGradient(lx - 6, ly, lx + 6, ly);
    g.addColorStop(0, '#4f8a3d'); g.addColorStop(1, '#8fe6a2');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(lx, ly, 7, 3.8, ang, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(30,60,26,0.5)'; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(lx - Math.cos(ang) * 6, ly - Math.sin(ang) * 6); ctx.lineTo(lx + Math.cos(ang) * 6, ly + Math.sin(ang) * 6); ctx.stroke();
  }
  // a little bud at the tip
  ctx.fillStyle = '#ffd9ec';
  ctx.beginPath(); ctx.arc(x + sway, yBase - h, 2.4, 0, Math.PI * 2); ctx.fill();
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
  nightCtx.fillStyle = 'rgba(8, 4, 20, 0.88)'; // deep violet night, not dead black
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
  // warm candlelight bloom around each light source
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const l of lights) {
    const g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r * 0.7);
    g.addColorStop(0, 'rgba(255,196,120,0.14)');
    g.addColorStop(1, 'rgba(255,196,120,0)');
    ctx.fillStyle = g;
    ctx.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
  }
  ctx.restore();
}

function drawEnvVisuals(id, now, lights = []) {
  if (!id) return;
  if (id === 'winter') {
    ctx.fillStyle = 'rgba(190, 225, 255, 0.06)'; // cold wash
    ctx.fillRect(-30, -30, W + 60, H + 60);
    for (let i = 0; i < 80; i++) {
      const speed = 22 + envHash(i) * 46;
      const size = 1 + envHash(i + 400) * 2.6;
      const x = (envHash(i + 100) * (W + 40) + Math.sin(now * 0.0008 + i) * 34 + W) % (W + 40) - 20;
      const y = (envHash(i + 200) * H + now * 0.001 * speed) % (H + 20) - 10;
      ctx.globalAlpha = 0.35 + envHash(i + 300) * 0.5;
      ctx.fillStyle = '#f4fbff';
      ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
      if (size > 2.6) { // the big flakes twinkle with a sparkle cross
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(x - size - 1, y); ctx.lineTo(x + size + 1, y); ctx.moveTo(x, y - size - 1); ctx.lineTo(x, y + size + 1); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  } else if (id === 'tempest') {
    ctx.fillStyle = 'rgba(20, 24, 44, 0.22)'; // storm gloom
    ctx.fillRect(-30, -30, W + 60, H + 60);
    const wind = Math.sin(now / 1400) * 26;
    ctx.strokeStyle = 'rgba(150, 178, 220, 0.45)'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < 70; i++) {
      const x = (envHash(i) * (W + 80) + now * 0.02 * (0.6 + envHash(i + 50)) * Math.sign(wind || 1) + W) % (W + 80) - 40;
      const y = (envHash(i + 100) * H + now * 0.5 * (0.7 + envHash(i + 150) * 0.6)) % (H + 30) - 15;
      ctx.moveTo(x, y); ctx.lineTo(x + wind * 0.5, y + 18);
    }
    ctx.stroke();
    // deterministic lightning: a flash + forked bolt in some ~2.2s windows
    const bucket = Math.floor(now / 2200), seed = envHash(bucket);
    if (seed < 0.4) {
      const t = (now % 2200) / 2200;
      const flash = Math.max(0, 1 - t * 6); // quick decay over ~180ms
      if (flash > 0.01) {
        ctx.fillStyle = `rgba(210, 224, 255, ${0.5 * flash})`;
        ctx.fillRect(-30, -30, W + 60, H + 60);
        const bx = envHash(bucket + 9) * W;
        // bolt: a wide soft pass under a tight hot core, both additive. The
        // bloom pass turns that into the halo ctx.shadowBlur used to fake.
        const bolt = () => {
          ctx.beginPath(); ctx.moveTo(bx, -10);
          for (let s = 1; s <= 6; s++) ctx.lineTo(bx + (envHash(bucket * 7 + s) - 0.5) * 90, s / 6 * H * 0.7);
          ctx.stroke();
        };
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        ctx.strokeStyle = `rgba(150, 190, 255, ${flash * 0.5})`; ctx.lineWidth = 9; bolt();
        ctx.strokeStyle = `rgba(230, 238, 255, ${flash})`; ctx.lineWidth = 2.5; bolt();
        ctx.strokeStyle = `rgba(255, 255, 255, ${flash})`; ctx.lineWidth = 1; bolt();
        ctx.restore();
      }
    }
  } else if (id === 'meteors') {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      const span = H + 160;
      const prog = (now * 0.05 * (0.6 + envHash(i + 90)) + envHash(i + 60) * span) % span;
      const hx = (envHash(i) * (W + 120) - 60) + prog * 0.5, hy = prog - 80; // falls down-right
      const len = 26 + envHash(i + 30) * 40;
      const g = ctx.createLinearGradient(hx, hy, hx - len * 0.5, hy - len);
      g.addColorStop(0, 'rgba(255,220,150,0.95)'); g.addColorStop(1, 'rgba(255,120,60,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx - len * 0.5, hy - len); ctx.stroke();
      ctx.fillStyle = 'rgba(255,240,200,0.95)';
      ctx.beginPath(); ctx.arc(hx, hy, 2.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  } else if (id === 'moonshot') {
    // dreamy low-gravity: a big soft moon + lavender motes drifting UP
    const g = ctx.createRadialGradient(W * 0.82, 120, 10, W * 0.82, 120, 90);
    g.addColorStop(0, 'rgba(232,213,255,0.5)'); g.addColorStop(1, 'rgba(232,213,255,0)');
    ctx.fillStyle = g; ctx.fillRect(W * 0.82 - 90, 30, 180, 180);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 22; i++) {
      const x = (envHash(i) * W + Math.sin(now * 0.0008 + i * 2) * 44 + W) % W;
      const y = H - ((envHash(i + 40) * H + now * 0.012) % (H + 40));
      ctx.globalAlpha = 0.2 + 0.3 * Math.abs(Math.sin(now * 0.002 + i));
      ctx.fillStyle = '#e8d5ff';
      ctx.beginPath(); ctx.arc(x, y, 1.5 + (i % 3), 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore(); ctx.globalAlpha = 1;
  } else if (id === 'surge') {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 20; i++) { // rising golden sparks
      const x = (envHash(i) * W + Math.sin(now * 0.002 + i * 3) * 20 + W) % W;
      const y = H - ((envHash(i + 70) * H + now * 0.04) % (H + 30));
      ctx.globalAlpha = 0.25 + 0.35 * Math.abs(Math.sin(now * 0.004 + i));
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(x, y, 1.5 + (i % 2), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.restore();
    for (let i = 0; i < 3; i++) { // slow arcane sigils rising and fading
      const y = H - ((now * 0.02 + i * 260) % (H + 120));
      const x = envHash(i + 500) * W;
      ctx.globalAlpha = 0.3 * Math.min(1, (H - y) / 200);
      runeRing(ctx, x, y, 22, 'rgba(255,224,120,1)', now, { count: 6, lw: 1, alpha: 1, spin: 0.002 });
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
