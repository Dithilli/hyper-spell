// game.js — state machine, round/match flow, collisions, main loop, rendering
const kbControllers = [new KeyboardController(KEYMAPS[0]), new KeyboardController(KEYMAPS[1])];
const assignedPads = new Set();
const padPrev = {};

const game = { state: 'LOBBY', winsNeeded: 5, winner: null, mapIndex: 0, baseGravity: 2 };
let currentMap = null;
let banner = '', bannerColor = '#fff', bannerUntil = 0, bannerHyper = false;

function setBanner(text, color, ms = 1400, hyper = false) {
  banner = text;
  bannerColor = color;
  bannerUntil = performance.now() + ms;
  bannerHyper = hyper;
}

function loadMap(index) {
  for (const fb of projectiles) Composite.remove(world, fb);
  projectiles.clear();
  for (const g of gibs) Composite.remove(world, g);
  gibs.clear();
  for (const t of tomes) Composite.remove(world, t);
  tomes.clear();
  for (const h of hats) Composite.remove(world, h);
  hats.clear();
  for (const s of summons) Composite.remove(world, s);
  summons.clear();
  activeEffects.length = 0;
  particles.length = 0;
  if (currentMap) Composite.remove(world, currentMap.composite);
  const def = MAPS[index];
  const m = { def, composite: Composite.create(), data: {} };
  for (const x of [-30, W + 30]) {
    const wall = Bodies.rectangle(x, H / 2, 60, H * 3, { isStatic: true });
    wall.render.fillStyle = '#171221';
    Composite.add(m.composite, wall);
  }
  def.build(m);
  if (def.stars) {
    m.data.starfield = Array.from({ length: 70 }, () => ({ x: rand(0, W), y: rand(0, H - 160), r: rand(0.5, 1.8), tw: rand(0, 6.28) }));
  }
  Composite.add(world, m.composite);
  currentMap = m;
  game.mapIndex = index;
  game.baseGravity = def.gravity ?? 2;
  engine.gravity.y = game.baseGravity;
}

function startRound(index) {
  loadMap(index);
  for (const p of players) {
    p.spellId = 'fireball';
    despawnPlayer(p);
    spawnPlayer(p, currentMap.def.spawns[p.slot]);
  }
  game.state = 'PLAY';
  game.fightAt = performance.now() + 1100;
  game.fightShown = false;
  scheduleTomes(performance.now());
  setBanner(currentMap.def.name, '#e8d5ff', 1000);
}

game.onDeath = (p) => {
  if (game.state === 'LOBBY') {
    setTimeout(() => {
      if (game.state === 'LOBBY' && !p.alive) spawnPlayer(p, currentMap.def.spawns[p.slot]);
    }, 1200);
    return;
  }
  if (game.state !== 'PLAY') return;
  setTimeout(checkRoundEnd, 650);
};

function checkRoundEnd() {
  if (game.state !== 'PLAY') return;
  const alive = players.filter(p => p.alive);
  if (alive.length > 1) return;
  const winner = alive[0] || null;
  game.state = 'ROUND_END';
  game.winner = winner;
  if (winner) {
    winner.roundWins++;
    setBanner(`${winner.name} +1`, winner.color, 1800);
  } else {
    setBanner('DRAW', '#e8d5ff', 1800);
  }
  sfx.roundWin();
  slowMo(0.3, 900);
  setTimeout(() => {
    if (game.state !== 'ROUND_END') return;
    if (winner && winner.roundWins >= game.winsNeeded) startVictory(winner);
    else startRound(nextMapIndex());
  }, 1900);
}

function nextMapIndex() {
  let i;
  do { i = Math.floor(Math.random() * MAPS.length); } while (i === game.mapIndex && MAPS.length > 1);
  return i;
}

function startVictory(p) {
  game.state = 'VICTORY';
  game.winner = p;
  sfx.victory();
  doFlash(p.color, 0.4);
}

function resetMatch() {
  for (const p of players) p.roundWins = 0;
  game.state = 'LOBBY';
  loadMap(0);
  for (const p of players) {
    despawnPlayer(p);
    spawnPlayer(p, currentMap.def.spawns[p.slot]);
  }
  setBanner('LOBBY', '#e8d5ff', 900);
}

addEventListener('keydown', e => {
  if (e.code === 'Space' && game.state === 'LOBBY' && players.length >= 2) startRound(game.mapIndex);
  if (e.code === 'KeyR') resetMatch();
  if (game.state === 'LOBBY' && /^Digit[1-9]$/.test(e.code)) {
    game.winsNeeded = +e.code.slice(5);
    setBanner(`FIRST TO ${game.winsNeeded}`, '#e8d5ff', 900);
  }
});

// ---------- joining ----------
function joinPlayer(controller) {
  if (players.length >= 4) return;
  const p = createPlayer(players.length, controller);
  spawnPlayer(p, currentMap.def.spawns[p.slot]);
  sfx.pickup();
  setBanner(`${p.name} JOINED`, p.color, 900);
}

function scanJoins() {
  if (game.state === 'VICTORY' || players.length >= 4) return;
  for (const kc of kbControllers) {
    if (kc.assigned) continue;
    if (kc.poll().castPressed) {
      kc.assigned = true;
      joinPlayer(kc);
    }
  }
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const pad of pads) {
    if (!pad || assignedPads.has(pad.index)) continue;
    const pressed = pad.buttons.some(b => b.pressed);
    const prev = padPrev[pad.index] || false;
    padPrev[pad.index] = pressed;
    if (pressed && !prev) {
      ensureAudio();
      assignedPads.add(pad.index);
      joinPlayer(new GamepadController(pad.index));
    }
  }
}

// ---------- collisions ----------
Events.on(engine, 'collisionStart', ({ pairs }) => {
  const now = performance.now();
  for (const { bodyA, bodyB } of pairs) {
    for (const [a, b] of [[bodyA, bodyB], [bodyB, bodyA]]) {
      if (a.label === 'projectile' && b.label !== 'lava' && projectiles.has(a)) {
        if (b.label === 'player' && now < (b.player.reflectUntil || 0)) {
          Body.setVelocity(a, { x: -a.velocity.x * 1.1, y: -Math.abs(a.velocity.y) * 0.5 - 2 });
          a.collisionFilter.group = b.player.group;
          a.owner = b.player;
          spawnParticles(a.position.x, a.position.y, '#4ecdff', 8, 4);
        } else if (!a.noContactBoom) {
          if (!a.keepOnHit) projectiles.delete(a);
          a.onHit?.(a, b);
          if (!a.keepOnHit) Composite.remove(world, a);
        }
      }
      if (a.contactDamage && b.label === 'player' && b.player !== a.owner) {
        const relSpeed = Math.hypot(a.velocity.x - b.velocity.x, a.velocity.y - b.velocity.y);
        if (relSpeed > 3 && now > (a._cdAt || 0)) {
          a._cdAt = now + 400;
          damagePlayer(b.player, a.contactDamage * Math.min(1, relSpeed / 10));
        }
      }
      if (a.contactExplode && b.label === 'player' && b.player !== a.owner) {
        const ce = a.contactExplode;
        const pos = { ...a.position };
        removeSummon(a);
        projectiles.delete(a);
        explode(pos.x, pos.y, ce.radius, ce.power, ce.dmg, a.owner);
      }
      if (a.label === 'banana' && b.label === 'player' && summons.has(a) && now > (a.armAt || 0)) {
        const q = b.player;
        q.slipUntil = now + 1000;
        Body.setAngularVelocity(q.body, pick([-1, 1]) * 0.8);
        Body.setVelocity(q.body, { x: q.body.velocity.x * 1.5, y: q.body.velocity.y - 4 });
        spawnText(q.body.position.x, q.body.position.y - 40, 'SLIP!', '#ffe135');
        removeSummon(a);
        sfx.squeak();
      }
      if (a.label === 'tome' && b.label === 'player') pickupTome(a, b.player);
      if (a.label === 'hat' && b.label === 'player') pickupHat(a, b.player);
      if (a.label === 'icicle' && !a.isStatic && b.label === 'player' && !a.dmgDone) {
        a.dmgDone = true;
        damagePlayer(b.player, 60);
        addShake(6);
      }
      if (a.label === 'spikes' && b.label === 'player') {
        const q = b.player;
        if (now > (q.lastSpikeAt || 0)) {
          q.lastSpikeAt = now + 600;
          damagePlayer(q, 20);
          Body.setVelocity(q.body, { x: q.body.velocity.x, y: -9 });
        }
      }
      if (b.label === 'lava') {
        if (a.label === 'player') killPlayer(a.player);
        else if (!a.isStatic) {
          spawnParticles(a.position.x, a.position.y, currentMap.data.acid ? '#9be15d' : '#ff5e57', 8, 4);
          projectiles.delete(a);
          tomes.delete(a);
          hats.delete(a);
          gibs.delete(a);
          summons.delete(a);
          Composite.remove(world, a, true);
        }
      }
    }
  }
});

// ---------- per-frame upkeep ----------
function wrapBody(b) {
  if (b.position.x < -20) Body.setPosition(b, { x: W + 15, y: b.position.y });
  if (b.position.x > W + 20) Body.setPosition(b, { x: -15, y: b.position.y });
}

function postPhysics(now) {
  const wrap = currentMap.def.wrap;
  for (const fb of [...projectiles]) {
    fb.update?.(fb, now);
    if (Math.random() < 0.7) {
      particles.push({ kind: 'square', x: fb.position.x, y: fb.position.y, vx: rand(-0.5, 0.5), vy: rand(-0.5, 0.5), life: 14, maxLife: 14, color: fb.color || '#ffb347', r: 2.5 });
    }
    if (fb.expireAt && now > fb.expireAt) {
      projectiles.delete(fb);
      fb.onHit?.(fb, null);
      Composite.remove(world, fb);
      continue;
    }
    if (wrap) wrapBody(fb);
    const { x, y } = fb.position;
    if (y > H + 100 || (!wrap && (x < -100 || x > W + 100))) removeProjectile(fb);
  }
  for (const b of [...summons]) {
    if (now > b.dieAt || b.position.y > H + 140) { removeSummon(b); continue; }
    if (wrap) wrapBody(b);
    if (b.critter && now > b.critter.hopAt && Math.abs(b.velocity.y) < 1) {
      b.critter.hopAt = now + rand(400, 800);
      if (b.position.x < 70) b.critter.dir = 1;
      if (b.position.x > W - 70) b.critter.dir = -1;
      Body.setVelocity(b, { x: b.critter.dir * rand(2, b.critter.speed), y: -b.critter.hop });
    }
    if (b.label === 'mine' && b.mineBlast) {
      if (!b.armAt) b.armAt = now + 1000;
      else if (now > b.armAt) {
        for (const q of players) {
          if (!q.alive) continue;
          if (q === b.owner && now < b.armAt + 2500) continue;
          if (Math.hypot(q.body.position.x - b.position.x, q.body.position.y - b.position.y) < 50) {
            const mb = b.mineBlast;
            const pos = { ...b.position };
            removeSummon(b);
            explode(pos.x, pos.y, mb.radius, mb.power, mb.dmg, b.owner);
            break;
          }
        }
      }
    }
  }
  for (const gib of [...gibs]) {
    if (now > gib.dieAt || gib.position.y > H + 100) {
      gibs.delete(gib);
      Composite.remove(world, gib);
    }
  }
}

// ---------- drawing ----------
function drawBodyRounded(b, color) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  const v = b.vertices;
  ctx.moveTo(v[0].x, v[0].y);
  for (let i = 1; i < v.length; i++) ctx.lineTo(v[i].x, v[i].y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawCrate(b) {
  drawBodyRounded(b, '#b08948');
  ctx.save();
  ctx.translate(b.position.x, b.position.y);
  ctx.rotate(b.angle);
  ctx.strokeStyle = 'rgba(90,66,30,0.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(-9, -9, 18, 18);
  ctx.beginPath(); ctx.moveTo(-9, -9); ctx.lineTo(9, 9); ctx.stroke();
  ctx.restore();
}

function drawSpikes(b) {
  ctx.save();
  ctx.translate(b.position.x, b.position.y);
  ctx.rotate(b.angle);
  const w = b.w || 100, h = b.h || 20;
  ctx.fillStyle = b.render.fillStyle || '#8a2f3d';
  ctx.beginPath();
  ctx.moveTo(-w / 2, h / 2);
  const teeth = Math.max(3, Math.round(w / 18));
  for (let i = 0; i < teeth; i++) {
    ctx.lineTo(-w / 2 + (i + 0.5) * (w / teeth), -h / 2 - 4);
    ctx.lineTo(-w / 2 + (i + 1) * (w / teeth), h / 2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMapBodies(now) {
  for (const b of Composite.allBodies(currentMap.composite)) {
    if (b.label === 'lava') continue;
    if (b.phantom) ctx.globalAlpha = b.phantomSolid === false ? 0.18 : 0.85;
    if (b.label === 'crate') drawCrate(b);
    else if (b.label === 'spikes') drawSpikes(b);
    else drawBodyRounded(b, b.render.fillStyle || '#171221');
    ctx.globalAlpha = 1;
  }
  for (const c of Composite.allConstraints(currentMap.composite)) {
    if (c.label !== 'breakable' && c.label !== 'chain') continue;
    const [a, b] = constraintEnds(c);
    if (c.label === 'chain') {
      ctx.strokeStyle = '#0d0a14';
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      ctx.fillStyle = '#2c2438';
      for (let t = 12; t < d; t += 26) {
        ctx.beginPath();
        ctx.arc(a.x + (b.x - a.x) * t / d, a.y + (b.y - a.y) * t / d, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.strokeStyle = '#5d4a33';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
  }
}

function drawLava(now) {
  const y = currentMap.data.lavaY;
  if (y == null) return;
  const acid = currentMap.data.acid;
  const cTop = acid ? '#9be15d' : '#ff5e57';
  const cBot = acid ? '#39702e' : '#a8262a';
  const g = ctx.createLinearGradient(0, y, 0, H);
  g.addColorStop(0, cTop);
  g.addColorStop(1, cBot);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-10, H + 10);
  ctx.lineTo(-10, y + 8);
  for (let x = 0; x <= W + 32; x += 32) {
    ctx.lineTo(x, y + 6 + Math.sin(now * 0.002 + x * 0.02) * 5);
  }
  ctx.lineTo(W + 10, H + 10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = acid ? 'rgba(220,255,160,0.5)' : 'rgba(255,180,120,0.5)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let x = 0; x <= W + 32; x += 32) {
    const yy = y + 6 + Math.sin(now * 0.002 + x * 0.02) * 5;
    x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
  }
  ctx.stroke();
  if (Math.random() < 0.3) {
    particles.push({ kind: 'square', x: rand(0, W), y: y + 8, vx: 0, vy: rand(-1.5, -0.5), life: 30, maxLife: 30, color: acid ? '#c5f97d' : '#ff8c5a', r: 3 });
  }
}

function drawGibs() {
  for (const gib of gibs) drawBodyRounded(gib, gib.color);
}

function drawProjectiles() {
  for (const fb of projectiles) {
    const r = fb.circleRadius || 7;
    ctx.shadowColor = fb.color || '#ffb347';
    ctx.shadowBlur = 12;
    ctx.fillStyle = fb.color || '#ffb347';
    ctx.beginPath(); ctx.arc(fb.position.x, fb.position.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(fb.position.x, fb.position.y, r * 0.45, 0, Math.PI * 2); ctx.fill();
  }
}

function drawSummons(now) {
  for (const b of summons) {
    const col = b.render.fillStyle || '#c0c0cc';
    if (b.label === 'crate') { drawCrate(b); continue; }
    if (b.label === 'critter') {
      drawBodyRounded(b, col);
      const dir = b.critter ? b.critter.dir : 1;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(b.position.x + dir * 4, b.position.y - 3, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(b.position.x + dir * 4.8, b.position.y - 3, 1, 0, Math.PI * 2); ctx.fill();
      continue;
    }
    if (b.label === 'decoy') {
      const p = b.decoyOf;
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(b.position.x, b.position.y - 4, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = p.hat;
      ctx.beginPath();
      ctx.moveTo(b.position.x - 9, b.position.y - 10);
      ctx.lineTo(b.position.x + 9, b.position.y - 10);
      ctx.lineTo(b.position.x + 2, b.position.y - 26);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      continue;
    }
    if (b.label === 'saw') {
      drawBodyRounded(b, col);
      ctx.save();
      ctx.translate(b.position.x, b.position.y);
      ctx.rotate(b.angle);
      ctx.strokeStyle = '#7a7a8c';
      ctx.lineWidth = 2;
      const r = (b.circleRadius || 15) + 3;
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (r - 6), Math.sin(a) * (r - 6));
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.stroke();
      }
      ctx.restore();
      continue;
    }
    if (b.label === 'mine') {
      drawBodyRounded(b, col);
      ctx.fillStyle = Math.sin(now * 0.008) > 0 ? '#ff4444' : '#661111';
      ctx.beginPath(); ctx.arc(b.position.x, b.position.y - 6, 2.5, 0, Math.PI * 2); ctx.fill();
      continue;
    }
    if (b.label === 'piano') {
      drawBodyRounded(b, col);
      ctx.save();
      ctx.translate(b.position.x, b.position.y);
      ctx.rotate(b.angle);
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(-34, 4, 68, 10);
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 1;
      for (let i = -30; i <= 30; i += 8) { ctx.beginPath(); ctx.moveTo(i, 4); ctx.lineTo(i, 14); ctx.stroke(); }
      ctx.restore();
      continue;
    }
    drawBodyRounded(b, col);
  }
}

let vignetteCache = null;
function getVignette() {
  if (!vignetteCache) {
    vignetteCache = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95);
    vignetteCache.addColorStop(0, 'rgba(0,0,0,0)');
    vignetteCache.addColorStop(1, 'rgba(0,0,0,0.38)');
  }
  return vignetteCache;
}

function drawBackdrop(now) {
  ctx.fillStyle = currentMap.def.bg || '#241d2e';
  ctx.fillRect(-30, -30, W + 60, H + 60);
  for (const [bx, by, br] of [[320, 190, 210], [950, 260, 270], [620, 520, 320]]) {
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
    g.addColorStop(0, 'rgba(255,255,255,0.05)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(bx - br, by - br, br * 2, br * 2);
  }
  const stars = currentMap.data.starfield;
  if (stars) {
    for (const s of stars) {
      ctx.globalAlpha = 0.4 + 0.4 * Math.sin(now * 0.002 + s.tw);
      ctx.fillStyle = '#e8e8ff';
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    ctx.globalAlpha = 1;
  }
  if (currentMap.data.voidTop) {
    const g = ctx.createLinearGradient(0, 0, 0, 60);
    g.addColorStop(0, 'rgba(165,94,234,0.5)');
    g.addColorStop(1, 'rgba(165,94,234,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, 60);
  }
}

function drawHUD(now) {
  if (game.state === 'LOBBY' || game.state === 'VICTORY') return;
  ctx.textAlign = 'center';
  ctx.font = '12px Georgia';
  ctx.fillStyle = '#675a7d';
  ctx.fillText(`${currentMap.def.name} · ${game.mapIndex + 1}/${MAPS.length}`, W / 2, 18);
  for (const p of players) {
    const x = [150, W - 150, 450, W - 450][p.slot];
    ctx.font = 'bold 20px Georgia';
    ctx.fillStyle = p.color;
    ctx.fillText(p.name, x, 38);
    ctx.strokeStyle = p.color;
    const pipStart = x - (game.winsNeeded - 1) * 9;
    for (let w = 0; w < game.winsNeeded; w++) {
      ctx.beginPath();
      ctx.arc(pipStart + w * 18, 54, 5.5, 0, Math.PI * 2);
      if (w < p.roundWins) ctx.fill();
      else { ctx.lineWidth = 1.5; ctx.stroke(); }
    }
    ctx.font = '13px Georgia';
    ctx.fillStyle = '#9c8ab8';
    ctx.fillText(SPELLS[p.spellId].name, x, 74);
  }
  if (now < bannerUntil) {
    if (bannerHyper) {
      const pulse = 1 + 0.12 * Math.sin(now * 0.03);
      ctx.save();
      ctx.translate(W / 2, 160);
      ctx.scale(pulse, pulse);
      ctx.font = 'bold 78px Georgia';
      ctx.shadowColor = '#a55eea';
      ctx.shadowBlur = 34;
      ctx.fillStyle = `hsl(${(now * 0.4) % 360}, 90%, 78%)`;
      ctx.fillText(banner, 0, 0);
      ctx.restore();
      ctx.shadowBlur = 0;
    } else {
      ctx.font = 'bold 52px Georgia';
      ctx.fillStyle = bannerColor;
      ctx.fillText(banner, W / 2, 150);
    }
  }
}

function drawLobby() {
  ctx.fillStyle = 'rgba(12,8,18,0.72)';
  ctx.fillRect(W / 2 - 430, 55, 860, 265);
  ctx.textAlign = 'center';
  ctx.font = 'bold 64px Georgia';
  ctx.fillStyle = '#e8d5ff';
  ctx.fillText('HYPERSPELL', W / 2, 130);
  ctx.font = '16px Georgia';
  ctx.fillStyle = '#9c8ab8';
  ctx.fillText('press E · ENTER · or any gamepad button to join', W / 2, 162);
  for (let i = 0; i < 4; i++) {
    const x = W / 2 - 300 + i * 200;
    const p = players[i];
    ctx.strokeStyle = p ? p.color : '#4a3f5e';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 70, 185, 140, 60);
    ctx.font = 'bold 20px Georgia';
    ctx.fillStyle = p ? p.color : '#4a3f5e';
    ctx.fillText(p ? p.name + ' ✦' : 'JOIN', x, 218);
    ctx.font = '12px Georgia';
    ctx.fillStyle = '#675a7d';
    ctx.fillText(['WASD + E', '← → ↑ + ENTER', 'GAMEPAD', 'GAMEPAD'][i], x, 238);
  }
  ctx.font = 'bold 20px Georgia';
  ctx.fillStyle = players.length >= 2 ? '#7bd88f' : '#675a7d';
  ctx.fillText(
    players.length >= 2
      ? `SPACE / START TO FIGHT — FIRST TO ${game.winsNeeded} WINS`
      : 'NEED AT LEAST 2 WIZARDS',
    W / 2, 288);
  ctx.font = '13px Georgia';
  ctx.fillStyle = '#675a7d';
  ctx.fillText(`press 1–9 to set the win target (${game.winsNeeded})`, W / 2, 310);
}

function drawVictory(now) {
  ctx.fillStyle = 'rgba(10,6,16,0.6)';
  ctx.fillRect(0, 0, W, H);
  const p = game.winner;
  drawWizardFigure(p, W / 2, 400, 4.5, now);
  ctx.textAlign = 'center';
  ctx.font = 'bold 58px Georgia';
  ctx.fillStyle = p.color;
  ctx.fillText(`${p.name} WINS THE MATCH`, W / 2, 180);
  ctx.font = '20px Georgia';
  ctx.fillStyle = '#e8d5ff';
  ctx.fillText('press CAST for a rematch', W / 2, 560);
  if (Math.random() < 0.6) {
    particles.push({ kind: 'confetti', x: rand(0, W), y: -10, vx: rand(-1, 1), vy: rand(1, 3), life: 120, maxLife: 120, color: pick(['#4ecdc4', '#ff6b81', '#ffd166', '#a55eea', '#e8d5ff']), r: 4 });
  }
}

function draw(now) {
  const sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake;
  shake *= 0.88;
  ctx.setTransform(1, 0, 0, 1, sx, sy);
  ctx.clearRect(-30, -30, W + 60, H + 60);
  drawBackdrop(now);
  drawMapBodies(now);
  drawLava(now);
  drawTomes(now);
  drawSummons(now);
  drawGibs();
  drawProjectiles();
  for (const e of activeEffects) e.draw?.(now);
  drawParticles();
  for (const p of players) if (p.alive) drawWizard(p, now);

  ctx.fillStyle = getVignette();
  ctx.fillRect(0, 0, W, H);

  if (flashAlpha > 0.01) {
    ctx.globalAlpha = flashAlpha;
    ctx.fillStyle = flashColor;
    ctx.fillRect(-30, -30, W + 60, H + 60);
    ctx.globalAlpha = 1;
  }
  flashAlpha *= 0.86;

  drawHUD(now);
  if (game.state === 'LOBBY') drawLobby();
  if (game.state === 'VICTORY') drawVictory(now);
}

// ---------- main loop ----------
let last = performance.now();
function frame(now) {
  const rawDt = Math.min(now - last, 33);
  last = now;
  updateTimeScale(now);
  const dt = rawDt * timeScale;

  scanJoins();
  for (const p of players) p.input = p.controller.poll();
  if (game.state === 'LOBBY' && players.length >= 2 && players.some(p => p.input.startPressed)) startRound(game.mapIndex);
  if (game.state === 'VICTORY' && players.some(p => p.input.castPressed)) resetMatch();

  if (game.state === 'PLAY' && !game.fightShown && now > game.fightAt) {
    game.fightShown = true;
    setBanner('FIGHT!', '#7bd88f', 700);
    sfx.fight();
  }

  updatePlayers(now);
  if (game.state === 'PLAY') updateTomes(now);
  updateEffects(now, dt);
  currentMap.def.update?.(currentMap, now, dt);

  // spinners + phantom platforms
  for (const b of Composite.allBodies(currentMap.composite)) {
    if (b.spin) Body.setAngle(b, b.angle + b.spin * (dt / 16.7));
    if (b.phantom) {
      const solid = Math.sin(now * b.phantom.speed + b.phantom.offset) > -0.2;
      if (solid !== b.phantomSolid) {
        b.phantomSolid = solid;
        b.collisionFilter.mask = solid ? 0xFFFFFFFF : 0;
      }
    }
  }

  // lobbed projectiles fly on reduced gravity — cancel part of it each tick
  for (const fb of projectiles) {
    if (fb.gravityScale < 1) {
      Body.applyForce(fb, fb.position, { x: 0, y: -engine.gravity.y * engine.gravity.scale * fb.mass * (1 - fb.gravityScale) });
    }
  }
  Engine.update(engine, Math.max(dt, 0.5));
  postPhysics(now);
  updateParticles(timeScale);
  draw(now);
  requestAnimationFrame(frame);
}

loadMap(0);
requestAnimationFrame(frame);
