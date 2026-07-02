// game.js — state machine, round/match flow, main loop, rendering
const kbControllers = [new KeyboardController(KEYMAPS[0]), new KeyboardController(KEYMAPS[1])];
const assignedPads = new Set();
const padPrev = {};

const game = { state: 'LOBBY', winsNeeded: 5, winner: null, mapIndex: 0 };
let currentMap = null;
let banner = '', bannerColor = '#fff', bannerUntil = 0;

function setBanner(text, color, ms = 1400) {
  banner = text;
  bannerColor = color;
  bannerUntil = performance.now() + ms;
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
  Composite.add(world, m.composite);
  currentMap = m;
  game.mapIndex = index;
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
    setBanner(`${winner.name} WINS THE ROUND`, winner.color, 1800);
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
  for (const { bodyA, bodyB } of pairs) {
    for (const [a, b] of [[bodyA, bodyB], [bodyB, bodyA]]) {
      if (a.label === 'projectile' && b.label !== 'lava' && projectiles.has(a)) {
        projectiles.delete(a);
        a.onHit?.(a, b);
        Composite.remove(world, a);
      }
      if (a.label === 'tome' && b.label === 'player') pickupTome(a, b.player);
      if (a.label === 'hat' && b.label === 'player') pickupHat(a, b.player);
      if (a.label === 'icicle' && !a.isStatic && b.label === 'player' && !a.dmgDone) {
        a.dmgDone = true;
        damagePlayer(b.player, 60);
        addShake(6);
      }
      if (b.label === 'lava') {
        if (a.label === 'player') killPlayer(a.player);
        else if (!a.isStatic) {
          spawnParticles(a.position.x, (currentMap.data.lavaY ?? H - 14) + 4, '#ff5e57', 8, 4);
          projectiles.delete(a);
          tomes.delete(a);
          hats.delete(a);
          gibs.delete(a);
          Composite.remove(world, a, true);
        }
      }
    }
  }
});

// ---------- per-frame upkeep ----------
function postPhysics(now) {
  for (const fb of [...projectiles]) {
    if (Math.random() < 0.7) {
      particles.push({ kind: 'square', x: fb.position.x, y: fb.position.y, vx: rand(-0.5, 0.5), vy: rand(-0.5, 0.5), life: 14, maxLife: 14, color: fb.color || '#ffb347', r: 2.5 });
    }
    if (fb.expireAt && now > fb.expireAt) {
      projectiles.delete(fb);
      fb.onHit?.(fb, null);
      Composite.remove(world, fb);
      continue;
    }
    const { x, y } = fb.position;
    if (y > H + 100 || x < -100 || x > W + 100) removeProjectile(fb);
  }
  for (const gib of [...gibs]) {
    if (now > gib.dieAt || gib.position.y > H + 100) {
      gibs.delete(gib);
      Composite.remove(world, gib);
    }
  }
}

// ---------- drawing ----------
function drawCrate(b) {
  ctx.fillStyle = '#b08948';
  drawBody(b);
  ctx.save();
  ctx.translate(b.position.x, b.position.y);
  ctx.rotate(b.angle);
  ctx.strokeStyle = '#8a6a35';
  ctx.lineWidth = 2;
  ctx.strokeRect(-11, -11, 22, 22);
  ctx.beginPath(); ctx.moveTo(-11, -11); ctx.lineTo(11, 11); ctx.stroke();
  ctx.restore();
}

function drawMapBodies() {
  for (const b of Composite.allBodies(currentMap.composite)) {
    if (b.label === 'lava') continue;
    if (b.label === 'crate') { drawCrate(b); continue; }
    ctx.fillStyle = b.render.fillStyle || '#171221';
    drawBody(b);
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

function drawLava() {
  const y = currentMap.data.lavaY;
  if (y == null) return;
  const g = ctx.createLinearGradient(0, y, 0, Math.min(y + 60, H));
  g.addColorStop(0, '#ff5e57');
  g.addColorStop(1, '#a8262a');
  ctx.fillStyle = g;
  ctx.fillRect(0, y, W, H - y);
  if (Math.random() < 0.3) {
    particles.push({ kind: 'square', x: rand(0, W), y: y + 4, vx: 0, vy: rand(-1.5, -0.5), life: 30, maxLife: 30, color: '#ff8c5a', r: 3 });
  }
}

function drawGibs() {
  for (const gib of gibs) {
    ctx.fillStyle = gib.color;
    drawBody(gib);
  }
}

function drawProjectiles() {
  for (const fb of projectiles) {
    const r = fb.circleRadius || 7;
    ctx.fillStyle = fb.color || '#ffb347';
    ctx.beginPath(); ctx.arc(fb.position.x, fb.position.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff3d6';
    ctx.beginPath(); ctx.arc(fb.position.x, fb.position.y, r * 0.45, 0, Math.PI * 2); ctx.fill();
  }
}

function drawHUD(now) {
  if (game.state === 'LOBBY' || game.state === 'VICTORY') return;
  ctx.textAlign = 'center';
  for (const p of players) {
    const x = [150, W - 150, 450, W - 450][p.slot];
    ctx.font = 'bold 20px Georgia';
    ctx.fillStyle = p.color;
    ctx.fillText(p.name, x, 34);
    ctx.strokeStyle = p.color;
    for (let w = 0; w < game.winsNeeded; w++) {
      ctx.beginPath();
      ctx.arc(x - 40 + w * 20, 50, 6, 0, Math.PI * 2);
      if (w < p.roundWins) ctx.fill();
      else { ctx.lineWidth = 1.5; ctx.stroke(); }
    }
    ctx.font = '13px Georgia';
    ctx.fillStyle = '#9c8ab8';
    ctx.fillText(SPELLS[p.spellId].name, x, 72);
  }
  if (now < bannerUntil) {
    ctx.font = 'bold 52px Georgia';
    ctx.fillStyle = bannerColor;
    ctx.fillText(banner, W / 2, 150);
  }
}

function drawLobby() {
  ctx.fillStyle = 'rgba(12,8,18,0.72)';
  ctx.fillRect(W / 2 - 430, 55, 860, 250);
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
  ctx.fillText(players.length >= 2 ? 'PRESS SPACE / START TO FIGHT — FIRST TO 5 WINS' : 'NEED AT LEAST 2 WIZARDS', W / 2, 288);
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
  ctx.fillStyle = currentMap.def.bg || '#241d2e';
  ctx.fillRect(-30, -30, W + 60, H + 60);
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.beginPath();
  ctx.arc(320, 190, 130, 0, Math.PI * 2);
  ctx.arc(950, 260, 170, 0, Math.PI * 2);
  ctx.fill();

  drawMapBodies();
  drawLava();
  drawTomes(now);
  drawGibs();
  drawProjectiles();
  for (const e of activeEffects) e.draw?.(now);
  drawParticles();
  for (const p of players) if (p.alive) drawWizard(p, now);

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
