// game.js — state machine, round/match flow, collisions, main loop, rendering
const kbControllers = [new KeyboardController(KEYMAPS[0], true), new KeyboardController(KEYMAPS[1])];
const assignedPads = new Set();
const padPrev = {};
const padBtnPrev = {}; // padIndex -> Set of button indices held last frame (lobby nav edges)

// mode: 'versus' (last-wizard-standing match) | 'wave' (co-op/solo PvE survival, js/enemies.js)
const game = { state: 'LOBBY', winsNeeded: 5, winner: null, mapIndex: 0, baseGravity: 2, mode: 'versus', wave: 0, waveState: 'active' };

// wave mode is playable solo; versus needs an opponent
function minPlayers() { return game.mode === 'wave' ? 1 : 2; }
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
  // seeded extras (gap steppers, scattered cover) — the seed rides the snapshot
  // so LAN clients regenerate the exact same statics
  game.mapSeed = (Math.random() * 0xffffffff) >>> 0;
  m.data.seed = game.mapSeed;
  buildMapExtras(m, game.mapSeed);
  if (def.stars) {
    m.data.starfield = Array.from({ length: 70 }, () => ({ x: rand(0, W), y: rand(0, H - 160), r: rand(0.5, 1.8), tw: rand(0, 6.28) }));
  }
  Composite.add(world, m.composite);
  currentMap = m;
  game.mapIndex = index;
  game.baseGravity = def.gravity ?? 2;
  engine.gravity.y = game.baseGravity;
  game.envEvent = null;
  game.boss = null;
}

function startRound(index) {
  clearReplay();
  if (game.state === 'LOBBY') { resetMatchStats(); resetMatchTelemetry(); } // fresh match, fresh ledger
  game.totalRounds = (game.totalRounds || 0) + 1;
  resetTelemetry(); // fresh per-round balance tally
  const bossTime = game.totalRounds % BOSS_EVERY === 0;
  let tries = 0;
  while (bossTime && MAPS[index].cozy && ++tries < 60) index = Math.floor(Math.random() * MAPS.length);
  loadMap(index);
  for (const p of players) {
    clearSpells(p);
    despawnPlayer(p);
    spawnPlayer(p, spawnPointFor(p));
  }
  game.state = 'PLAY';
  game.fightAt = performance.now() + 1100;
  game.fightShown = false;
  scheduleTomes(performance.now());
  if (bossTime) spawnBoss(performance.now());
  else rollEnvEvent(performance.now());
  setBanner(bossTime ? 'BOSS BATTLE' : currentMap.def.name, bossTime ? '#ffd166' : '#e8d5ff', 1000);
}

game.onDeath = (p) => {
  if (game.state === 'LOBBY') {
    setTimeout(() => {
      if (game.state === 'LOBBY' && !p.alive) spawnPlayer(p, spawnPointFor(p));
    }, 1200);
    return;
  }
  if (game.state !== 'PLAY') return;
  setTimeout(checkRoundEnd, 650);
};

function checkRoundEnd() {
  if (game.state !== 'PLAY') return;
  const alive = players.filter(p => p.alive);
  if (game.mode === 'wave') {
    // PvE survival: the run ends only on a full-party wipe. The fallen stay down
    // until the next wave's intermission revives them (see updateWaveMode).
    if (alive.length === 0) endRun();
    return;
  }
  if (game.boss) {
    // co-op boss fight: the round runs while anyone stands; a wipe wipes the score
    if (alive.length > 0) return;
    game.state = 'ROUND_END';
    game.winner = null;
    flushRoundTelemetry();
    const replayMs = startReplay(performance.now());
    for (const p of players) p.roundWins = 0;
    setBanner(`${game.boss.def.name} PREVAILS — START OVER`, game.boss.def.color, 1800 + replayMs);
    sfx.death();
    slowMo(0.3, 900);
    setTimeout(() => {
      if (game.state === 'ROUND_END') startRound(nextMapIndex());
    }, 1900 + replayMs);
    return;
  }
  if (alive.length > 1) return;
  const winner = alive[0] || null;
  game.state = 'ROUND_END';
  game.winner = winner;
  flushRoundTelemetry();
  const replayMs = startReplay(performance.now()); // 0 if the round was too short
  if (winner) {
    winner.roundWins++;
    setBanner(`${winner.name} +1`, winner.color, 1800 + replayMs);
  } else {
    setBanner('DRAW', '#e8d5ff', 1800 + replayMs);
  }
  sfx.roundWin();
  slowMo(0.3, 900);
  setTimeout(() => {
    if (game.state !== 'ROUND_END') return;
    if (winner && winner.roundWins >= game.winsNeeded) startVictory(winner);
    else startRound(nextMapIndex());
  }, 1900 + replayMs);
}

function nextMapIndex() {
  const crowded = players.length >= 6; // cozy maps can't hold a big lobby
  let i, tries = 0;
  do { i = Math.floor(Math.random() * MAPS.length); }
  while ((i === game.mapIndex || (crowded && MAPS[i].cozy)) && ++tries < 60);
  return i;
}

function startVictory(p) {
  game.state = 'VICTORY';
  game.winner = p;
  game.awards = computeAwards();
  game.spellReport = computeSpellReport();
  sfx.victory();
  doFlash(p.color, 0.4);
}

function resetMatch() {
  clearReplay();
  for (const p of players) p.roundWins = 0;
  game.state = 'LOBBY';
  loadMap(0);
  for (const p of players) {
    despawnPlayer(p);
    spawnPlayer(p, spawnPointFor(p));
  }
  setBanner('LOBBY', '#e8d5ff', 900);
}

// lobby name entry: keyboard joiners type a name, ENTER confirms, ESC keeps default
let nameEdit = null; // { p, buffer, storeKey }
let nameEditEndAt = 0;
function cleanName(s) {
  return String(s || '').replace(/[^\w \-'!.]/g, '').slice(0, 12); // case is kept — Alinea is Alinea
}

// custom colors must stay visible against the dark arenas: colors darker than
// a floor luminance get blended toward white just enough to read (black → charcoal)
function readableColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const MIN = 96;
  if (lum >= MIN) return hex;
  const t = (MIN - lum) / (255 - lum);
  const up = c => Math.round(c + (255 - c) * t).toString(16).padStart(2, '0');
  return `#${up(r)}${up(g)}${up(b)}`;
}
function beginNameEdit(p, storeKey) {
  const saved = cleanName(localStorage.getItem(storeKey) || '');
  // the opening net menu already asked player 1 for a name — don't reopen a live
  // edit session in the lobby, where stray keypresses silently append letters
  if (storeKey === 'hs-name-0' && globalThis.nameSetViaMenu) {
    if (saved) p.name = saved;
    return;
  }
  nameEdit = { p, storeKey, buffer: saved };
  if (nameEdit.buffer) p.name = nameEdit.buffer; // saved name applies even if they skip
}

// gamepad players have no keyboard, so they name their wizard with an on-screen
// letter ribbon: ◀ ▶ pick a letter, A appends it, B deletes, START confirms.
const PAD_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -!';
function beginPadNameEdit(p, padIndex) {
  const storeKey = `hs-name-pad-${padIndex}`;
  const saved = cleanName(localStorage.getItem(storeKey) || '');
  nameEdit = { p, storeKey, buffer: saved, pad: padIndex, letter: 0 };
}
// drive the letter ribbon from a joined pad's edge-triggered buttons
function padWheelInput(edge) {
  if (edge(14)) nameEdit.letter = (nameEdit.letter + PAD_ALPHABET.length - 1) % PAD_ALPHABET.length; // ◀
  if (edge(15)) nameEdit.letter = (nameEdit.letter + 1) % PAD_ALPHABET.length;                       // ▶
  if (edge(0) && nameEdit.buffer.length < 12) nameEdit.buffer = cleanName(nameEdit.buffer + PAD_ALPHABET[nameEdit.letter]); // A: append
  if (edge(1)) nameEdit.buffer = nameEdit.buffer.slice(0, -1); // B: backspace
  if (edge(9) || edge(3)) { // START / Y: confirm
    if (nameEdit.buffer) { nameEdit.p.name = nameEdit.buffer; localStorage.setItem(nameEdit.storeKey, nameEdit.buffer); }
    nameEdit = null;
    nameEditEndAt = performance.now(); // brief lockout so the confirm press isn't reused to start
  }
}
addEventListener('keydown', e => {
  if (!nameEdit) return;
  if (game.state !== 'LOBBY') { nameEdit = null; return; }
  e.preventDefault();
  if (e.code === 'Enter' || e.code === 'NumpadEnter') {
    if (nameEdit.buffer) {
      nameEdit.p.name = nameEdit.buffer;
      localStorage.setItem(nameEdit.storeKey, nameEdit.buffer);
    }
    nameEdit = null;
    nameEditEndAt = performance.now(); // brief join/start lockout so this keypress isn't reused
  } else if (e.code === 'Escape') {
    nameEdit = null;
    nameEditEndAt = performance.now();
  } else if (e.code === 'Backspace') {
    nameEdit.buffer = nameEdit.buffer.slice(0, -1);
  } else if (e.key.length === 1 && nameEdit.buffer.length < 12) {
    nameEdit.buffer = cleanName(nameEdit.buffer + e.key);
  }
}, true); // capture: swallow keys before the game shortcuts below see them

function setWins(n) {
  game.winsNeeded = Math.max(1, Math.min(20, n));
  setBanner(`FIRST TO ${game.winsNeeded}`, '#e8d5ff', 900);
}
// start from the lobby into whichever mode is selected
function beginFromLobby() {
  if (game.state !== 'LOBBY' || players.length < minPlayers()) return;
  if (game.mode === 'wave') startRun();
  else startRound(game.mapIndex);
}
function toggleMode() {
  if (game.state !== 'LOBBY') return;
  game.mode = game.mode === 'wave' ? 'versus' : 'wave';
  setBanner(game.mode === 'wave' ? 'WAVE SURVIVAL' : 'VERSUS', '#ffd166', 1100);
}

// DEMO: drop straight into a solo fight against a named secret boss (T = THE
// RIZARD, Y = MANU). Made for showing Conor & Manu — joins you if the lobby's empty.
function fightSecretBoss(id) {
  if (netMode === 'online') return;
  nameEdit = null;
  if (players.length === 0) { kbControllers[0].assigned = true; joinPlayer(kbControllers[0]); } // WASD + mouse
  game.mode = 'versus';
  game.totalRounds = 0;
  clearReplay();
  resetMatchStats(); resetMatchTelemetry(); resetTelemetry();
  for (const p of players) p.roundWins = 0;
  let idx = 0, tries = 0;
  do { idx = Math.floor(Math.random() * MAPS.length); } while (MAPS[idx].cozy && ++tries < 60); // open arena
  loadMap(idx);
  for (const p of players) { clearSpells(p); despawnPlayer(p); spawnPlayer(p, spawnPointFor(p)); }
  game.state = 'PLAY';
  game.fightAt = performance.now() + 900;
  game.fightShown = false;
  scheduleTomes(performance.now());
  const bs = spawnBoss(performance.now(), { bossId: id });
  setBanner('⚔  ' + (bs && bs.def ? bs.def.name : 'SECRET BOSS') + '  ⚔', bs && bs.def ? bs.def.color : '#ffd166', 1500, true);
}

addEventListener('keydown', e => {
  if (netMode === 'online' || nameEdit) return; // online, these become messages to the server
  if (e.code === 'KeyT') { fightSecretBoss('rizard'); return; } // demo: instant THE RIZARD fight
  if (e.code === 'KeyN') { fightSecretBoss('manu'); return; }   // demo: instant MANU fight (Y is reserved for naming)
  if (e.code === 'Space' && game.state === 'LOBBY' && players.length >= minPlayers()) beginFromLobby();
  if (e.code === 'KeyB' && game.state === 'LOBBY') addBot();
  if (e.code === 'KeyM' && game.state === 'LOBBY') toggleMode();
  if (e.code === 'KeyR') resetMatch();
  if (game.state === 'LOBBY' && /^Digit[1-9]$/.test(e.code)) setWins(+e.code.slice(5));
  if (game.state === 'LOBBY' && (e.code === 'Equal' || e.code === 'Minus')) setWins(game.winsNeeded + (e.code === 'Equal' ? 1 : -1));
});

// ---------- joining ----------
function joinPlayer(controller, name) {
  if (players.length >= MAX_PLAYERS) return;
  // lowest free slot, not players.length — online play can remove a mid-roster
  // player, and slots are wire identity (colors, spawns) that must never collide
  let slot = 0;
  while (players.some(p => p.slot === slot)) slot++;
  const p = createPlayer(slot, controller);
  if (name) p.name = name;
  spawnPlayer(p, spawnPointFor(p));
  sfx.pickup();
  setBanner(`${p.name} JOINED`, p.color, 900);
}

function scanJoins() {
  if (game.state === 'VICTORY' || game.state === 'RUN_OVER' || players.length >= MAX_PLAYERS) return;
  if (nameEdit || performance.now() < nameEditEndAt + 350) return; // typing a name, not joining
  for (const kc of kbControllers) {
    if (kc.assigned) continue;
    if (kc.poll().castPressed) {
      kc.assigned = true;
      joinPlayer(kc);
      if (game.state === 'LOBBY') beginNameEdit(players[players.length - 1], `hs-name-${kc === kbControllers[0] ? 0 : 1}`);
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
      // seed the button-edge memory with the joining press so it isn't re-read
      // this frame as a lobby action (add-bot, name, etc.)
      padBtnPrev[pad.index] = new Set(pad.buttons.flatMap((b, i) => b.pressed ? [i] : []));
      joinPlayer(new GamepadController(pad.index));
    }
  }
}

// lobby navigation for already-joined pads, so a controller-only couch never
// needs the keyboard: Y names your wizard, BACK adds a bot, d-pad ± the win target.
function scanLobbyPads() {
  if (game.state !== 'LOBBY') return;
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const pad of pads) {
    if (!pad || !assignedPads.has(pad.index)) continue; // only joined pads navigate
    const prev = padBtnPrev[pad.index] || new Set();
    const edge = b => !!pad.buttons[b]?.pressed && !prev.has(b);
    if (nameEdit && nameEdit.pad === pad.index) {
      padWheelInput(edge);
    } else if (!nameEdit) { // one name editor at a time; other pads wait their turn
      const owner = players.find(p => p.controller instanceof GamepadController && p.controller.index === pad.index);
      if (edge(3) && owner) beginPadNameEdit(owner, pad.index); // Y → name your wizard
      if (edge(8)) addBot();                                    // BACK → add a bot
      if (edge(2)) toggleMode();                                // X → versus / wave survival
      if (edge(12)) setWins(game.winsNeeded + 1);               // d-pad up → win target +
      if (edge(13)) setWins(game.winsNeeded - 1);               // d-pad down → win target -
    }
    padBtnPrev[pad.index] = new Set(pad.buttons.flatMap((b, i) => b.pressed ? [i] : []));
  }
}

// ---------- collisions ----------
Events.on(engine, 'collisionStart', ({ pairs }) => {
  const now = performance.now();
  for (const { bodyA, bodyB } of pairs) {
    for (const [a, b] of [[bodyA, bodyB], [bodyB, bodyA]]) {
      if (a.label === 'projectile' && b.label !== 'lava' && projectiles.has(a)) {
        if (b.label === 'vine') killVine(b);
        if (b.label === 'boss' && a.owner) damageBoss(22, a.position, a.owner);
        if (b.label === 'enemy' && a.owner && a.owner !== 'boss') damageEnemy(b.enemy, 22, a.position, a.owner);
        if (b.label === 'decoy') { spawnParticles(b.position.x, b.position.y, '#e8d5ff', 16, 5); removeSummon(b); } // a mirror image soaks the shot, then bursts
        if (b.label === 'destructible') damageDestructible(b, 12); // bolts chip cover, not just explosions
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
          damagePlayer(b.player, a.contactDamage * Math.min(1, relSpeed / 10), a.owner);
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
        statFor(q).slips++;
        q.slipUntil = now + 1000;
        Body.setAngularVelocity(q.body, pick([-1, 1]) * 0.8);
        Body.setVelocity(q.body, { x: q.body.velocity.x * 1.5, y: q.body.velocity.y - 4 });
        spawnText(q.body.position.x, q.body.position.y - 40, 'SLIP!', '#ffe135');
        removeSummon(a);
        sfx.squeak();
      }
      // STOMP: a grown wizard coming down onto a smaller one crushes them
      if (a.label === 'player' && b.label === 'player') {
        const big = a.player, small = b.player;
        if ((big.sizeScale || 1) >= 1.6 && (big.sizeScale || 1) > (small.sizeScale || 1) + 0.3
          && big.body.position.y < small.body.position.y - 6 && big.body.velocity.y > 2
          && small.alive && now > (small._stompAt || 0)) {
          small._stompAt = now + 600;
          damagePlayer(small, 12 + Math.round(((big.sizeScale || 1) - 1) * 22), big);
          Body.setVelocity(small.body, { x: small.body.velocity.x, y: 7 });
          Body.setVelocity(big.body, { x: big.body.velocity.x, y: -9 }); // bounce off the landing
          addShake(6); sfx.thud?.();
          spawnParticles(small.body.position.x, small.body.position.y - 10, '#a7e88f', 14, 6);
          spawnText(small.body.position.x, small.body.position.y - 44, 'STOMP!', '#a7e88f');
        }
      }
      if (a.label === 'tramp' && b.label === 'player') {
        // actively fling anyone who touches it — passive restitution alone felt dead
        Body.setVelocity(b, { x: b.velocity.x, y: -20 });
        b.player.airJumps = 1; // refund a mid-air jump so it feels springy
        spawnParticles(b.position.x, b.position.y + 14, '#ff8fc7', 10, 5);
        addShake(3);
        sfx.boing?.();
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
        else if (a.label === 'boss') { if (!a.isStatic) Body.setVelocity(a, { x: a.velocity.x, y: -14 }); } // bosses shrug off lava
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
    if (b.label !== 'boss' && (now > b.dieAt || b.position.y > H + 140)) { removeSummon(b); continue; }
    if (wrap) wrapBody(b);
    if (b.critter && now > b.critter.hopAt && Math.abs(b.velocity.y) < 1) {
      b.critter.hopAt = now + rand(400, 800);
      if (b.position.x < 70) b.critter.dir = 1;
      if (b.position.x > W - 70) b.critter.dir = -1;
      Body.setVelocity(b, { x: b.critter.dir * rand(2, b.critter.speed), y: -b.critter.hop });
    }
    if (b.label === 'saw') {
      // a rolling ground hazard: keep it spinning across the arena, bouncing off the walls
      if (b.position.x < 40) b.sawDir = 1;
      if (b.position.x > W - 40) b.sawDir = -1;
      Body.setVelocity(b, { x: (b.sawDir || 1) * 9, y: b.velocity.y });
      Body.setAngularVelocity(b, (b.sawDir || 1) * 0.9);
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
  drawStoryCrate(ctx, { vertices: b.vertices, x: b.position.x, y: b.position.y, angle: b.angle });
}

// ---------- hazard art (shared by live map bodies AND network/killcam ghosts) ----------
function bodyRadius(b, fallback = 14) {
  if (b.circleRadius) return b.circleRadius;
  if (b.vertices && b.vertices.length) {
    return Math.hypot(b.vertices[0].x - b.position.x, b.vertices[0].y - b.position.y);
  }
  return fallback;
}

function drawIcicle(b, now) {
  const r = bodyRadius(b, 24);
  ctx.save();
  ctx.translate(b.position.x, b.position.y);
  ctx.rotate(b.angle); // spike points along local +x (down while hanging)
  const g = ctx.createLinearGradient(-r * 0.5, 0, r, 0);
  g.addColorStop(0, '#eaf9ff');
  g.addColorStop(0.55, '#bfe8ff');
  g.addColorStop(1, '#6fb6e0');
  ctx.fillStyle = g;
  ctx.beginPath(); // main tapered spike with a jagged base
  ctx.moveTo(-r * 0.5, -r * 0.6);
  ctx.lineTo(r * 1.08, 0);
  ctx.lineTo(-r * 0.5, r * 0.6);
  ctx.lineTo(-r * 0.28, r * 0.32);
  ctx.lineTo(-r * 0.52, r * 0.14);
  ctx.lineTo(-r * 0.3, -r * 0.04);
  ctx.lineTo(-r * 0.52, -r * 0.26);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d8f4ff'; // two little side fangs
  ctx.beginPath();
  ctx.moveTo(-r * 0.1, -r * 0.52); ctx.lineTo(r * 0.42, -r * 0.34); ctx.lineTo(r * 0.05, -r * 0.2);
  ctx.moveTo(-r * 0.1, r * 0.52); ctx.lineTo(r * 0.42, r * 0.34); ctx.lineTo(r * 0.05, r * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; // cold shine down the spine
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-r * 0.3, -r * 0.16);
  ctx.lineTo(r * 0.72, -r * 0.04);
  ctx.stroke();
  ctx.restore();
}

function drawBarrel(b) {
  const r = bodyRadius(b);
  const { x, y } = b.position;
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.2, x, y, r);
  g.addColorStop(0, '#a37ec9');
  g.addColorStop(0.7, '#7d5a9e');
  g.addColorStop(1, '#4e3766');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.save(); // plank seams + rim hoop rotate with the roll
  ctx.translate(x, y);
  ctx.rotate(b.angle);
  ctx.strokeStyle = 'rgba(30,18,44,0.55)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI / 3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85);
    ctx.lineTo(-Math.cos(a) * r * 0.85, -Math.sin(a) * r * 0.85);
    ctx.stroke();
  }
  ctx.strokeStyle = '#c9a86a';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#e0c185'; // rivets on the hoop
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + 0.4;
    ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86, 1.6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawBumperBody(b, now) {
  const r = bodyRadius(b, 22);
  const { x, y } = b.position;
  const pulse = 1 + 0.05 * Math.sin(now * 0.006 + x * 0.05);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * pulse);
  g.addColorStop(0, '#ffe1ef');
  g.addColorStop(0.55, '#ff8fc7');
  g.addColorStop(1, '#d4569a');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r * pulse, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffd3e8';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(x, y, r * pulse * 0.72, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x, y, r * 0.2, 0, Math.PI * 2); ctx.fill();
}

function drawWreckingBall(b) {
  const r = bodyRadius(b, 40);
  const { x, y } = b.position;
  const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.45, r * 0.1, x, y, r * 1.05);
  g.addColorStop(0, '#4e4a5e');
  g.addColorStop(0.5, '#211c30');
  g.addColorStop(1, '#0b0812');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.save(); // studs ride the spin
  ctx.translate(x, y);
  ctx.rotate(b.angle);
  ctx.fillStyle = '#5d5870';
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8, Math.max(1.6, r * 0.07), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; // specular glint
  ctx.beginPath(); ctx.ellipse(x - r * 0.38, y - r * 0.42, r * 0.2, r * 0.11, -0.6, 0, Math.PI * 2); ctx.fill();
}

function drawRock(b, col) {
  drawBodyRounded(b, col || '#5a5245');
  const r = bodyRadius(b, 20);
  const snow = col === '#f4fbff';
  ctx.save();
  ctx.translate(b.position.x, b.position.y);
  ctx.rotate(b.angle);
  ctx.fillStyle = snow ? 'rgba(120,160,190,0.18)' : 'rgba(0,0,0,0.28)'; // craters
  for (const [dx, dy, cr] of [[-0.35, -0.15, 0.16], [0.25, 0.2, 0.22], [0.1, -0.4, 0.12]]) {
    ctx.beginPath(); ctx.ellipse(dx * r, dy * r, cr * r, cr * r * 0.75, dx, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = snow ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.14)';
  ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.35, r * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawPivotBolt(b) {
  ctx.fillStyle = '#0d0a14';
  ctx.beginPath(); ctx.arc(b.position.x, b.position.y, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#6a6280';
  ctx.beginPath(); ctx.arc(b.position.x, b.position.y, 2.5, 0, Math.PI * 2); ctx.fill();
}

// dispatcher — returns true if it handled the body
function drawHazardBody(b, now) {
  const col = (b.render && b.render.fillStyle) || b.color;
  if (b.label === 'icicle') { drawIcicle(b, now); return true; }
  if (b.label === 'barrel') { drawBarrel(b); return true; }
  if (b.label === 'bouncy') { drawBumperBody(b, now); return true; }
  if (b.label === 'ball') {
    if (col === '#100c18') drawWreckingBall(b);
    else drawRock(b, col);
    return true;
  }
  return false;
}

// stone vents for geyser maps (pure decoration; the blast itself is the explosion)
function drawGeysers(now) {
  for (const g of currentMap.data.geysers || []) {
    ctx.fillStyle = '#3a3040';
    ctx.beginPath();
    ctx.ellipse(g.x - 14, g.y + 8, 16, 9, 0.15, 0, Math.PI * 2);
    ctx.ellipse(g.x + 14, g.y + 8, 16, 9, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c1524';
    ctx.beginPath(); ctx.ellipse(g.x, g.y + 4, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
    const soon = g.nextAt && g.nextAt - now < 700;
    if (soon || Math.random() < 0.08) { // simmer, then boil right before the blast
      particles.push({ kind: 'square', x: g.x + rand(-8, 8), y: g.y + 2, vx: 0, vy: soon ? rand(-4, -2) : -1, life: 18, maxLife: 18, color: soon ? '#ffb347' : '#8a7f9e', r: soon ? 3 : 2 });
    }
  }
}

// swamp gas vents (Goo Swamp · Gas Vents): mossy nozzles + an ever-rising gas
// shimmer so the lift columns read on EVERY screen. Clients rebuild the map
// locally, so this draws straight from map data — zero net traffic. The strong
// eruption puffs ride the fx channel from the host's map update (spawnBurst).
function drawGasVents(now) {
  for (const v of currentMap.data.vents || []) {
    // mossy mound with a glowing slit
    ctx.fillStyle = '#25331f';
    ctx.beginPath();
    ctx.ellipse(v.x - 13, v.y + 8, 15, 8, 0.12, 0, Math.PI * 2);
    ctx.ellipse(v.x + 13, v.y + 8, 15, 8, -0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#141d10';
    ctx.beginPath(); ctx.ellipse(v.x, v.y + 4, 9, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.35 + 0.25 * Math.sin(now / 300 + v.x);
    ctx.fillStyle = '#aef05a';
    ctx.beginPath(); ctx.ellipse(v.x, v.y + 3, 6, 2.6, 0, 0, Math.PI * 2); ctx.fill();
    // stateless rising marsh gas — deterministic per screen, identical intent
    for (let i = 0; i < 10; i++) {
      const ph = envHash(Math.round(v.x) + i * 31);
      const yy = v.y - ((now * (0.045 + ph * 0.03) + ph * 500) % 260);
      const t = (v.y - yy) / 260;
      const sway = Math.sin(now * 0.003 + i * 2.1 + v.x) * (8 + ph * 10) * t;
      ctx.globalAlpha = 0.3 * (1 - t);
      ctx.fillStyle = i % 3 ? '#aef05a' : '#7bd88f';
      ctx.beginPath(); ctx.arc(v.x + sway, yy, 2 + ph * 2.5 + t * 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

function drawSpikes(b) {
  drawStorySpikes(ctx, {
    x: b.position.x, y: b.position.y, angle: b.angle,
    w: b.w || 100, h: b.h || 20, color: b.render.fillStyle || '#8a2f3d',
  });
}

// a destructible block: per-kind storybook material (artkit), plus a whisper of
// ambient life. The particles here are pushed LOCALLY — host and LAN clients
// each run this draw over their own (identical, seeded) blocks, so the ambience
// costs zero net traffic.
function drawDestructible(b, now = performance.now()) {
  const frac = Math.max(0, (b.hp ?? b.maxHp) / (b.maxHp || 1));
  drawStoryDestructible(ctx, {
    x: b.position.x, y: b.position.y, w: b.w || 40, h: b.h || 40,
    angle: b.angle || 0, kind: b.kind || 'wood', frac, color: b.dcolor || '#6b4a2a', now,
  });
  const { x, y } = b.position;
  const w = b.w || 40, h = b.h || 40;
  const k = b.kind;
  if (k === 'ice') {
    if (Math.random() < 0.006) particles.push({ kind: 'glint', x: x + rand(-w / 2, w / 2), y: y + rand(-h / 2, h / 2), vx: 0, vy: 0, life: 34, maxLife: 34, color: '#eaffff', r: 3 });
    if (Math.random() < 0.003) particles.push({ kind: 'square', x: x + rand(-w / 2, w / 2), y: y - h / 2, vx: rand(-0.3, 0.3), vy: 0.4, life: 40, maxLife: 40, color: '#ffffff', r: 1.5, g: 0.02 });
  } else if (k === 'obsidian') {
    if (Math.random() < 0.01) particles.push({ x: x + rand(-w / 2, w / 2), y: y - h / 2, vx: rand(-0.2, 0.2), vy: -rand(0.4, 1), life: 36, maxLife: 36, color: '#ff7043', r: 1.6, g: -0.02 });
  } else if (k === 'wood' && isLeafy(b.dcolor)) {
    if (Math.random() < 0.004) particles.push({ kind: 'leaf', x: x + rand(-w / 2, w / 2), y: y + h / 2 - 4, vx: rand(-0.4, 0.4), vy: 0.3, life: 70, maxLife: 70, color: b.dcolor, r: 2.6 });
  } else if (k === 'stone') {
    if (Math.random() < 0.0015) particles.push({ kind: 'square', x: x + rand(-w / 2, w / 2), y: y + rand(0, h / 2), vx: 0, vy: 0.5, life: 26, maxLife: 26, color: '#9a8f7a', r: 1.3, g: 0.04 });
  }
}

// canopy blocks are greener than they are red — those are the ones that shed
// leaves (and startle birds); trunks stay quiet
function isLeafy(hex) {
  if (typeof hex !== 'string' || hex[0] !== '#') return false;
  return parseInt(hex.slice(3, 5), 16) > parseInt(hex.slice(1, 3), 16) + 20;
}

// biome of the current arena → which animated crust the terrain grows
function mapCrustKind() {
  const d = currentMap.data, def = currentMap.def;
  if (def.icy || d.eventIcy) return 'snow';
  if (d.lavaY != null || d.acid) return 'char';
  if (d.starfield || d.voidTop) return 'crystal';
  return 'grass';
}

// structural terrain (platforms, walls, moving/rotating bars) gets the storybook
// stone-and-crust treatment; loose dynamic debris keeps the plain rounded look.
// (An offscreen pre-render of the static stone was tried here and benchmarked
// slower on the GPU path than just drawing the vectors — full frame is ~6.6ms
// either way, so the simple per-frame draw stays.)
function drawTerrainBody(b, now) {
  if (b.isStatic || b.kinematic || b.spin) {
    drawStoryTerrain(ctx, {
      vertices: b.vertices, bounds: b.bounds, angle: b.angle, now,
      color: b.render.fillStyle || '#2a2336', crust: mapCrustKind(),
      flip: engine.gravity.y < 0,
    });
  } else {
    drawBodyRounded(b, b.render.fillStyle || '#171221');
  }
}

function drawMapBodies(now) {
  for (const b of Composite.allBodies(currentMap.composite)) {
    if (b.label === 'lava') continue;
    if (b.phantom) ctx.globalAlpha = b.phantomSolid === false ? 0.18 : 0.85;
    if (b.label === 'crate') drawCrate(b);
    else if (b.label === 'destructible') drawDestructible(b, now);
    else if (b.label === 'spikes') drawSpikes(b);
    else if (b.label === 'vine') drawVineAt(b.position.x, b.bounds.max.y, Math.min(48, (now - (b.bornAt || now)) * 0.04 + 10), now);
    else if (drawHazardBody(b, now)) { /* icicles, barrels, bumpers, balls */ }
    else {
      drawTerrainBody(b, now);
      if (b.spin) drawPivotBolt(b);
    }
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

// wave-mode enemies: a labelled silhouette + type-specific detail, with a hurt
// flash and a shrinking HP bar so hits read clearly on the couch TV.
function drawEnemy(b, now) {
  const e = b.enemy;
  if (!e) { drawBodyRounded(b, b.color || '#c98a4a'); return; }
  const x = b.position.x, y = b.position.y;
  const dir = Math.abs(b.velocity.x) > 0.2 ? Math.sign(b.velocity.x) : (b._face || 1);
  b._face = dir;
  const hurt = now - (e.hurtAt || 0) < 110;
  // the swordsman paints its OWN hooded-rogue silhouette (no plain body box) —
  // everything else keeps the rounded-blob base + a detail pass on top
  if (e.type !== 'swordsman') drawBodyRounded(b, hurt ? '#ffffff' : e.color);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (e.type === 'swordsman') {
    // a sneaky rogue: hunched, hooded cloak + a short reverse-grip dagger. The
    // cloak fully hides the collision box, so no "terrible square" reads through.
    const cloak = hurt ? '#ffffff' : e.color;
    const bob = Math.sin(now * 0.008 + x * 0.05) * 1.2; // subtle skulking sway
    // --- cloak body: narrow hunched shoulders flaring to a ragged hem ---
    ctx.fillStyle = hurt ? '#ffffff' : shade(cloak, -0.28);
    ctx.beginPath();
    ctx.moveTo(-9, -8);                       // back shoulder (hunched high)
    ctx.quadraticCurveTo(-15, 8, -13, 21);    // back drape
    ctx.lineTo(-8, 17); ctx.lineTo(-3, 22);   // ragged hem tips
    ctx.lineTo(3, 17); ctx.lineTo(9, 22);
    ctx.lineTo(12, 15);
    ctx.quadraticCurveTo(11, 0, 6, -9);       // front lean (leaning forward = sneaking)
    ctx.closePath(); ctx.fill();
    // lit front fold so the silhouette has depth
    ctx.fillStyle = hurt ? '#ffffff' : cloak;
    ctx.beginPath();
    ctx.moveTo(6, -9); ctx.quadraticCurveTo(10, 4, 9, 20);
    ctx.lineTo(3, 17); ctx.lineTo(0, 21); ctx.quadraticCurveTo(2, 4, 2, -8);
    ctx.closePath(); ctx.fill();
    // --- hood: a pointed cowl tilted forward over a shadowed face ---
    ctx.fillStyle = hurt ? '#ffffff' : shade(cloak, -0.42);
    ctx.beginPath();
    ctx.moveTo(-8, -6 + bob);
    ctx.quadraticCurveTo(-7, -22 + bob, 7, -22 + bob);   // peak leans forward
    ctx.quadraticCurveTo(13, -18 + bob, 12, -6 + bob);   // brow juts out
    ctx.quadraticCurveTo(2, -3 + bob, -8, -6 + bob);
    ctx.closePath(); ctx.fill();
    // face void + a glint of eyes peering from the dark
    ctx.fillStyle = 'rgba(8,6,14,0.92)';
    ctx.beginPath(); ctx.ellipse(4, -11 + bob, 6, 4.5, -0.15, 0, Math.PI * 2); ctx.fill();
    if (!hurt) {
      ctx.fillStyle = '#bfe8ff';
      ctx.beginPath(); ctx.arc(5, -11 + bob, 1.5, 0, Math.PI * 2); ctx.arc(9, -11.5 + bob, 1.3, 0, Math.PI * 2); ctx.fill();
    }
    // --- dagger: short blade, low reverse grip in the leading hand ---
    ctx.save();
    ctx.translate(9, 9);
    ctx.rotate(0.5);
    ctx.strokeStyle = '#3a2c1c'; ctx.lineWidth = 3;                     // wrapped grip
    ctx.beginPath(); ctx.moveTo(-3, -4); ctx.lineTo(1, 3); ctx.stroke();
    ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 3;                     // crossguard
    ctx.beginPath(); ctx.moveTo(-4, 1); ctx.lineTo(4, -1); ctx.stroke();
    ctx.fillStyle = hurt ? '#ffffff' : '#cfd8e8';                      // broad short dagger
    ctx.beginPath();
    ctx.moveTo(-2, -2); ctx.lineTo(3, 2);                              // back of the blade off the guard
    ctx.lineTo(13, 6); ctx.lineTo(3, 4); ctx.closePath();             // belly + point
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1;      // spine glint
    ctx.beginPath(); ctx.moveTo(0, -0.5); ctx.lineTo(12, 5.5); ctx.stroke();
    ctx.restore();
    ctx.restore();
    // HP bar handled below; skip the shared eyes/blob detail for the rogue
    if (e.hp < e.maxHp) {
      const w = Math.max(20, (b.bounds.max.x - b.bounds.min.x));
      const top = b.bounds.min.y - 8;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x - w / 2, top, w, 4);
      ctx.fillStyle = '#ff5e57'; ctx.fillRect(x - w / 2, top, w * Math.max(0, e.hp / e.maxHp), 4);
    }
    return;
  } else if (e.type === 'archer') {
    ctx.strokeStyle = '#5a3d22'; ctx.lineWidth = 3;                     // bow
    ctx.beginPath(); ctx.arc(12, 0, 14, -1.1, 1.1); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1;       // string
    ctx.beginPath(); ctx.moveTo(12 + 14 * Math.cos(-1.1), 14 * Math.sin(-1.1)); ctx.lineTo(12 + 14 * Math.cos(1.1), 14 * Math.sin(1.1)); ctx.stroke();
  } else if (e.type === 'bug') {
    ctx.strokeStyle = e.color; ctx.lineWidth = 2;                       // scuttling legs
    for (const s of [-1, 1]) for (const o of [-4, 0, 4]) { ctx.beginPath(); ctx.moveTo(s * 6, o); ctx.lineTo(s * 13, o + Math.sin(now * 0.02 + o) * 3); ctx.stroke(); }
  } else if (e.type === 'ogre') {
    ctx.fillStyle = '#7a5a33';                                         // club
    ctx.save(); ctx.translate(20, -6); ctx.rotate(-0.5); ctx.fillRect(-4, -4, 8, 34); ctx.beginPath(); ctx.arc(0, 30, 9, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  // eyes (glowing, angrier for the heavy)
  ctx.fillStyle = e.type === 'ogre' ? '#ff5555' : '#fff';
  const ey = e.type === 'bug' ? -3 : -6, er = e.type === 'ogre' ? 3 : 2;
  ctx.beginPath(); ctx.arc(3, ey, er, 0, Math.PI * 2); ctx.arc(9, ey, er, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // HP bar (only once damaged)
  if (e.hp < e.maxHp) {
    const w = Math.max(20, (b.bounds.max.x - b.bounds.min.x));
    const top = b.bounds.min.y - 8;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x - w / 2, top, w, 4);
    ctx.fillStyle = '#ff5e57'; ctx.fillRect(x - w / 2, top, w * Math.max(0, e.hp / e.maxHp), 4);
  }
}

// draws any dynamic body (real or network ghost) by label
function drawDynamicBody(b, now) {
  const col = (b.render && b.render.fillStyle) || b.color || '#c0c0cc';
  if (b.label === 'projectile') {
    const r = b.circleRadius || 7;
    // additive halo instead of ctx.shadowBlur: one gradient fill rather than a
    // full re-rasterisation of the shape, and it feeds the bloom pass so
    // overlapping projectiles light each other up instead of stacking stickers
    const pcol = b.color || '#ffb347';
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glowOrb(ctx, b.position.x, b.position.y, r * 2.6, pcol, 0.5);
    ctx.restore();
    ctx.fillStyle = pcol;
    ctx.beginPath(); ctx.arc(b.position.x, b.position.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(b.position.x, b.position.y, r * 0.45, 0, Math.PI * 2); ctx.fill();
    return;
  }
  if (b.label === 'crate') { drawCrate(b); return; }
  if (b.label === 'boss') { drawBossBody(b, now); return; }
  if (b.label === 'vine') {
    const ys = b.vertices ? b.vertices.map(v => v.y) : [b.position.y - 24, b.position.y + 24];
    drawVineAt(b.position.x, Math.max(...ys), Math.max(...ys) - Math.min(...ys), now);
    return;
  }
  if (b.label === 'critter') {
    drawBodyRounded(b, col);
    const dir = b.critter ? b.critter.dir : 1;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(b.position.x + dir * 4, b.position.y - 3, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(b.position.x + dir * 4.8, b.position.y - 3, 1, 0, Math.PI * 2); ctx.fill();
    return;
  }
  if (b.label === 'enemy') { drawEnemy(b, now); return; }
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
    return;
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
    return;
  }
  if (b.label === 'mine') {
    drawBodyRounded(b, col);
    ctx.fillStyle = Math.sin(now * 0.008) > 0 ? '#ff4444' : '#661111';
    ctx.beginPath(); ctx.arc(b.position.x, b.position.y - 6, 2.5, 0, Math.PI * 2); ctx.fill();
    return;
  }
  if (b.label === 'anvil') {
    ctx.save(); ctx.translate(b.position.x, b.position.y); ctx.rotate(b.angle);
    ctx.fillStyle = '#4a4a55';
    ctx.fillRect(-22, -13, 34, 10);                                                   // top face
    ctx.beginPath(); ctx.moveTo(12, -13); ctx.lineTo(25, -8); ctx.lineTo(12, -3); ctx.closePath(); ctx.fill(); // horn
    ctx.fillStyle = '#3d3d47';
    ctx.fillRect(-6, -3, 12, 6);                                                       // waist
    ctx.beginPath(); ctx.moveTo(-16, 14); ctx.lineTo(16, 14); ctx.lineTo(10, 3); ctx.lineTo(-10, 3); ctx.closePath(); ctx.fill(); // flared base
    ctx.strokeStyle = '#26262e'; ctx.lineWidth = 1.3; ctx.strokeRect(-22, -13, 34, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(-22, -13, 34, 2.5);         // top glint
    ctx.restore();
    return;
  }
  if (b.label === 'boulderS') {
    const r = b.circleRadius || 26;
    ctx.save(); ctx.translate(b.position.x, b.position.y); ctx.rotate(b.angle);
    ctx.fillStyle = '#6b6357';
    ctx.beginPath();
    const n = 9;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const rr = r * (0.8 + ((i * 41) % 13) / 40); const px = Math.cos(a) * rr, py = Math.sin(a) * rr; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#3f3a32'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.strokeStyle = '#524b40'; ctx.lineWidth = 1;                                    // cracks / facets
    ctx.beginPath(); ctx.moveTo(-r * 0.35, -r * 0.4); ctx.lineTo(r * 0.05, 0); ctx.lineTo(-r * 0.25, r * 0.45); ctx.moveTo(r * 0.05, 0); ctx.lineTo(r * 0.5, -r * 0.15); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.35, r * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return;
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
    return;
  }
  if (drawHazardBody(b, now)) return; // icicles, barrels, bumpers, balls (live + ghosts)
  drawBodyRounded(b, col);
  if (b.spin) drawPivotBolt(b);
}

function drawProjectiles(now) {
  for (const fb of projectiles) drawDynamicBody(fb, now);
}

function drawSummons(now) {
  for (const b of summons) drawDynamicBody(b, now);
}

function drawReticle(now) {
  if (!mouse.present) return;
  const p = players.find(q => q.controller === kbControllers[0]);
  if (!p || !p.alive) return;
  // drawn in world space at the aim point, but sized in screen px — a reticle
  // that grows with the camera zoom stops reading as a cursor
  const z = CAM.zoom;
  ctx.strokeStyle = p.color;
  ctx.lineWidth = 1.5 / z;
  ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 9 / z, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath();
  for (const [dx, dy] of [[12, 0], [-12, 0], [0, 12], [0, -12]]) {
    ctx.moveTo(mouse.x + dx * 0.5 / z, mouse.y + dy * 0.5 / z);
    ctx.lineTo(mouse.x + dx / z, mouse.y + dy / z);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
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

// The backdrop is a SCREEN-space layer that parallaxes against the camera rather
// than a world-space one that zooms with it — distant hills that scale 1:1 with
// the foreground read as a painted flat, and the sky gradient has to cover the
// viewport whatever the camera is doing. Transform-safe: callers may invoke this
// from either space.
function drawBackdrop(now) {
  ctx.save();
  endWorld();
  drawStoryBackdrop(ctx, {
    bg: currentMap.def.bg || '#241d2e', W, H, now,
    stars: currentMap.data.starfield, voidTop: currentMap.data.voidTop,
    icy: currentMap.def.icy || currentMap.data.eventIcy,
    acid: currentMap.data.acid, lavaY: currentMap.data.lavaY,
    cam: cameraParallax(),
  });
  ctx.restore();
}

// spell recharge indicator under the spell name (all spells are infinite-use;
// this shows when the next cast is ready)
function drawCooldownBar(x, y, spell, frac, megaCasts) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x - 22, y, 44, 4);
  ctx.fillStyle = frac >= 1 ? spell.color : '#675a7d';
  ctx.fillRect(x - 22, y, 44 * Math.max(0, frac), 4);
  if (megaCasts > 0) {
    ctx.font = 'bold 11px Georgia';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`★${megaCasts}`, x + 36, y + 5);
  }
}

// world point -> screen point, for screen-space furniture attached to a world thing
function worldToScreen(wx, wy) {
  const r = cameraViewRect();
  return { x: ((wx - r.x0) / (r.x1 - r.x0)) * W, y: ((wy - r.y0) / (r.y1 - r.y0)) * H };
}

// two spell slots stacked under a player's name — shared by host HUD and LAN client.
// slots = [idA, idB], cdf = [fracA, fracB]; empty slots read as "· · ·".
function drawPlayerSpells(x, slots, cdf, megaCasts, charges) {
  ctx.textAlign = 'center';
  for (let i = 0; i < 2; i++) {
    const y = 74 + i * 22;
    const def = slots[i] && SPELLS[slots[i]]; // guards empty + any transient/unknown id
    ctx.font = '13px Georgia';
    ctx.fillStyle = def ? (tierColor(slots[i]) || '#9c8ab8') : '#4a415c';
    const n = charges?.[i];
    ctx.fillText(def ? def.name + (n != null ? ` ×${n}` : '') : '· · ·', x, y);
    if (def) drawCooldownBar(x, y + 6, def, cdf[i], i === 0 ? megaCasts : 0);
  }
}

function drawHUD(now) {
  if (game.state === 'LOBBY' || game.state === 'VICTORY') return;
  ctx.textAlign = 'center';
  ctx.font = '12px Georgia';
  ctx.fillStyle = '#675a7d';
  if (game.mode === 'wave') {
    ctx.font = 'bold 16px Georgia';
    ctx.fillStyle = '#ffd166';
    const left = enemies.size + (game.boss ? 1 : 0);
    ctx.fillText(game.waveState === 'intermission' ? `WAVE ${game.wave} CLEARED — NEXT INCOMING` : `WAVE ${game.wave} · ${left} LEFT`, W / 2, 18);
  } else {
    ctx.fillText(`${currentMap.def.name} · ${game.mapIndex + 1}/${MAPS.length}`, W / 2, 18);
  }
  if (game.envEvent?.announced) {
    ctx.font = 'bold 11px Georgia';
    ctx.fillStyle = game.envEvent.def.color;
    ctx.fillText(`⚠ ${game.envEvent.def.name}`, W / 2, H - 12);
  }
  if (game.boss?.announced) drawBossBar(game.boss.title || game.boss.def.name, game.boss.enraged ? '#ff4d4d' : game.boss.def.color, game.boss.hp, game.boss.maxHp);
  drawKillFeed(now);
  const spacing = Math.min(300, (W - 220) / Math.max(players.length - 1, 1));
  players.forEach((p, i) => {
    const x = players.length === 1 ? 150 : W / 2 + (i - (players.length - 1) / 2) * spacing;
    ctx.font = 'bold 20px Georgia';
    ctx.fillStyle = p.color;
    ctx.fillText(p.name, x, 38);
    ctx.strokeStyle = p.color;
    if (game.mode === 'wave') {
      // wave mode has no round wins — show a health bar (or DOWN when fallen)
      if (p.alive) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x - 30, 48, 60, 6);
        ctx.fillStyle = p.hp > MAX_HP * 0.3 ? '#7bd88f' : '#ff5e57';
        ctx.fillRect(x - 30, 48, 60 * Math.max(0, p.hp / MAX_HP), 6);
      } else {
        ctx.font = 'bold 13px Georgia'; ctx.fillStyle = '#675a7d';
        ctx.fillText('DOWN', x, 54);
      }
    } else if (game.winsNeeded <= 9) {
      const pipStart = x - (game.winsNeeded - 1) * 9;
      for (let w = 0; w < game.winsNeeded; w++) {
        ctx.beginPath();
        ctx.arc(pipStart + w * 18, 54, 5.5, 0, Math.PI * 2);
        if (w < p.roundWins) ctx.fill();
        else { ctx.lineWidth = 1.5; ctx.stroke(); }
      }
    } else {
      ctx.font = 'bold 15px Georgia';
      ctx.fillText(`${p.roundWins} / ${game.winsNeeded}`, x, 58);
    }
    const cdf = [0, 1].map(s => p.slots[s] ? Math.min(1, (now - p.casts[s]) / (SPELLS[p.slots[s]].cooldown || 1)) : 0);
    drawPlayerSpells(x, p.slots, cdf, p.megaCasts, p.slotCharges);
  });
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

function controllerHint(p) {
  if (p.controller instanceof BotController) return 'BOT';
  if (p.controller instanceof GamepadController) return `GAMEPAD ${p.controller.index + 1}`;
  if (p.controller instanceof KeyboardController) return p.controller.map === KEYMAPS[0] ? 'WASD + MOUSE' : '← → ↑ + ENTER';
  return 'ONLINE';
}

// 80s arcade wordmark: chrome-banded letters floating in a wave, pulsing neon
// glow, a glint sweeping through, and star sparkles. Zero assets, pure canvas.
function drawArcadeLogo(cx, cy, px, now, text = 'HYPERSPELL') {
  ctx.save();
  ctx.font = `italic 900 ${px}px Georgia, serif`;
  ctx.textAlign = 'left';
  const widths = [...text].map(ch => ctx.measureText(ch).width);
  const spacing = px * 0.05;
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
  const left = cx - total / 2;
  const sweep = left + ((now * 0.28) % (total * 2.2)) - total * 0.6; // glint position
  let x = left;
  for (let i = 0; i < text.length; i++) {
    const yy = cy + Math.sin(now * 0.0028 + i * 0.55) * px * 0.07;
    const g = ctx.createLinearGradient(0, yy - px * 0.8, 0, yy + px * 0.18);
    g.addColorStop(0, '#bfe8ff');   // sky chrome
    g.addColorStop(0.44, '#e8d5ff');
    g.addColorStop(0.5, '#5d3a8f'); // horizon band
    g.addColorStop(0.56, '#ff6b81'); // sunset
    g.addColorStop(1, '#ffd166');
    ctx.shadowColor = '#a55eea';
    ctx.shadowBlur = 16 + 9 * Math.sin(now * 0.0045);
    ctx.fillStyle = g;
    ctx.fillText(text[i], x, yy);
    ctx.shadowBlur = 0;
    const d = Math.abs(x + widths[i] / 2 - sweep);
    if (d < px * 1.1) { // the glint catches this letter
      ctx.globalAlpha = Math.max(0, 1 - d / (px * 1.1)) * 0.75;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text[i], x, yy);
      ctx.globalAlpha = 1;
    }
    x += widths[i] + spacing;
  }
  ctx.strokeStyle = '#fff'; // twinkling star crosses
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    const tw = Math.max(0, Math.sin(now * 0.004 + i * 2.1));
    if (tw < 0.05) continue;
    ctx.globalAlpha = tw * 0.9;
    const sx = left + envHash(i + 4) * total;
    const sy = cy - px * (0.15 + 0.6 * envHash(i + 11));
    const r = px * (0.06 + 0.05 * tw);
    ctx.beginPath();
    ctx.moveTo(sx - r, sy); ctx.lineTo(sx + r, sy);
    ctx.moveTo(sx, sy - r); ctx.lineTo(sx, sy + r);
    ctx.stroke();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
}

// the lobby panel proper, fed by a plain view object so the couch lobby (live
// players[]) and the online lobby (server snapshot, js/net.js) share pixels.
// view: { joinLine, slots: [{label, color, hint, hintBright}], readyLine,
//         readyColor, controlsLine }
function drawLobbyPanel(view) {
  ctx.fillStyle = 'rgba(12,8,18,0.72)';
  ctx.fillRect(W / 2 - 430, 55, 860, 265);
  ctx.textAlign = 'center';
  drawArcadeLogo(W / 2, 132, 60, performance.now());
  ctx.font = '16px Georgia';
  ctx.fillStyle = '#9c8ab8';
  ctx.fillText(view.joinLine, W / 2, 162);
  const slots = view.slots;
  const slotW = Math.min(200, 840 / slots.length);
  for (let i = 0; i < slots.length; i++) {
    const x = W / 2 + (i - (slots.length - 1) / 2) * slotW;
    const s = slots[i];
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - slotW / 2 + 6, 185, slotW - 12, 60);
    ctx.font = 'bold 20px Georgia';
    ctx.fillStyle = s.color;
    ctx.fillText(s.label, x, 218);
    ctx.font = '11px Georgia';
    ctx.fillStyle = s.hintBright ? '#e8d5ff' : '#675a7d';
    ctx.fillText(s.hint, x, 238);
  }
  ctx.font = 'bold 20px Georgia';
  ctx.fillStyle = view.readyColor;
  ctx.fillText(view.readyLine, W / 2, 288);
  ctx.font = '13px Georgia';
  ctx.fillStyle = '#675a7d';
  ctx.fillText(view.controlsLine, W / 2, 310);
}

function drawLobby() { // couch adapter: build the view from live local state
  const count = Math.max(4, Math.min(MAX_PLAYERS, players.length + 1));
  const slots = [];
  for (let i = 0; i < count; i++) {
    const p = players[i];
    const editing = nameEdit && p && nameEdit.p === p;
    const padEditing = editing && nameEdit.pad != null;
    let label;
    if (padEditing) {
      const blink = Math.floor(performance.now() / 350) % 2;
      label = `${nameEdit.buffer}${blink ? `[${PAD_ALPHABET[nameEdit.letter]}]` : '   '}`;
    } else if (editing) {
      label = (nameEdit.buffer || '') + (Math.floor(performance.now() / 400) % 2 ? '_' : ' ');
    } else {
      label = p ? p.name + ' ✦' : 'JOIN';
    }
    slots.push({
      label,
      color: p ? p.color : '#4a3f5e',
      hintBright: !!editing,
      hint: padEditing ? '◀▶ letter · A add · B del · START ✓'
        : editing ? 'TYPE NAME · ENTER ✓'
        : p ? controllerHint(p) : 'E · ENTER · PAD',
    });
  }
  const wave = game.mode === 'wave';
  const ready = players.length >= minPlayers();
  drawLobbyPanel({
    joinLine: 'press E · ENTER · or any gamepad button to join — B / BACK adds a bot',
    slots,
    readyColor: ready ? (wave ? '#ffd166' : '#7bd88f') : '#675a7d',
    readyLine: !ready ? (wave ? 'NEED AT LEAST 1 WIZARD' : 'NEED AT LEAST 2 WIZARDS')
      : wave ? `SPACE / START — WAVE SURVIVAL${game.bestWave ? `  (BEST: WAVE ${game.bestWave})` : ''}`
      : `SPACE / START TO FIGHT — FIRST TO ${game.winsNeeded} WINS`,
    controlsLine: wave
      ? 'M / pad-X switches back to VERSUS · co-op: everyone fights the waves together · Y names your wizard'
      : `M / pad-X = WAVE SURVIVAL · 1–9 or d-pad ↑↓ sets win target (${game.winsNeeded}) · Y names your wizard`,
  });
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
  ctx.fillText('press CAST for a rematch', W / 2, 550);
  drawAwards(game.awards, now);
  drawSpellReport(game.spellReport, now);
  if (Math.random() < 0.6) {
    particles.push({ kind: 'confetti', x: rand(0, W), y: -10, vx: rand(-1, 1), vy: rand(1, 3), life: 120, maxLife: 120, color: pick(['#4ecdc4', '#ff6b81', '#ffd166', '#a55eea', '#e8d5ff']), r: 4 });
  }
}

function draw(now) {
  if (game.replay) {
    // killcam: re-render the recorded tape; the live sim keeps running unseen.
    // The replay frames carry their own positions, so the camera follows those
    // rather than the live players it can't see.
    flashAlpha *= 0.86;
    updateCamera(now, replayCameraPoints());
    clearFrame();
    beginWorld();
    drawReplay(now);
    endWorld();
    applyBloom(now);
    ctx.fillStyle = getVignette();
    ctx.fillRect(0, 0, W, H);
    drawReplayLetterbox(now);
    drawHUD(now);
    return;
  }
  updateCamera(now);
  clearFrame();
  drawBackdrop(now); // screen space, parallaxed against the camera
  beginWorld();
  drawMapBodies(now);
  drawLava(now);
  drawGeysers(now);
  drawGasVents(now);
  drawTomes(now);
  drawSummons(now);
  drawGibs();
  drawProjectiles(now);
  for (const e of activeEffects) e.draw?.(now);
  drawParticles();
  for (const p of players) if (p.alive) drawWizard(p, now);
  drawOffscreenPointers(players.filter(p => p.alive).map(p => ({
    x: p.body.position.x, y: p.body.position.y,
    vx: p.body.velocity.x, vy: p.body.velocity.y, color: p.color,
  })), now);
  drawGhostWisps(now);

  drawEnvVisualsLive(now);
  drawReticle(now);
  endWorld();

  applyBloom(now); // one additive pass over the finished world (js/bloom.js)

  ctx.fillStyle = getVignette();
  ctx.fillRect(0, 0, W, H);

  if (flashAlpha > 0.01) {
    ctx.globalAlpha = flashAlpha;
    ctx.fillStyle = flashColor;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  flashAlpha *= 0.86;

  drawHUD(now);
  if (game.state === 'LOBBY') drawLobby();
  if (game.state === 'VICTORY') drawVictory(now);
  if (game.state === 'RUN_OVER') drawRunOver(now);
  globalThis.drawNetStats?.(now); // F8 overlay (net.js; absent in file:// couch mode)
}

function drawRunOver(now) {
  ctx.fillStyle = 'rgba(10,6,16,0.68)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.font = 'bold 54px Georgia';
  ctx.fillStyle = '#ff6b6b';
  ctx.fillText('OVERRUN', W / 2, 210);
  ctx.font = 'bold 40px Georgia';
  ctx.fillStyle = '#ffd166';
  ctx.fillText(`REACHED WAVE ${game.runScore || game.wave}`, W / 2, 290);
  ctx.font = '22px Georgia';
  ctx.fillStyle = '#e8d5ff';
  const best = game.bestWave || 0;
  const isBest = (game.runScore || game.wave) >= best && best > 0;
  ctx.fillText(isBest ? '★ NEW BEST ★' : `best: wave ${best}`, W / 2, 340);
  ctx.font = '20px Georgia';
  ctx.fillStyle = '#9c8ab8';
  ctx.fillText('press CAST for the lobby', W / 2, 430);
}

// ---------- main loop ----------
// stepSim is the entire update phase — everything that advances game state and
// nothing that draws. The browser loop below calls it every rAF; the dedicated
// server calls it from its own fixed 60Hz tick (server/sim-host.js) with the
// draw/rAF half never running.
function stepSim(now, rawDt) {
  updateTimeScale(now);
  const dt = rawDt * timeScale;

  for (const p of players) p.input = p.controller.poll();
  if (game.state === 'LOBBY' && players.length >= minPlayers() && !nameEdit && now > nameEditEndAt + 350 && players.some(p => p.input.startPressed)) beginFromLobby();
  if ((game.state === 'VICTORY' || game.state === 'RUN_OVER') && players.some(p => p.input.castPressed)) resetMatch();

  if (game.state === 'PLAY' && !game.fightShown && now > game.fightAt) {
    game.fightShown = true;
    setBanner('FIGHT!', '#7bd88f', 700);
    sfx.fight();
  }

  updatePlayers(now);
  updateGhosts(now);
  if (game.state === 'PLAY' || game.state === 'LOBBY') updateTomes(now);
  updateEffects(now, dt);
  currentMap.def.update?.(currentMap, now, dt);
  updateEnvEvent(now, dt);
  updateBoss(now, dt);
  updateEnemies(now, dt);
  updateWaveMode(now);

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
  replayRecord(now);
}

let last = performance.now();
function frame(now) {
  if (netMode === 'online') {
    netClientFrame(now);
    requestAnimationFrame(frame);
    return;
  }
  const rawDt = Math.min(now - last, 33);
  last = now;
  scanJoins();
  scanLobbyPads();
  stepSim(now, rawDt);
  draw(now);
  requestAnimationFrame(frame);
}

loadMap(0);
requestAnimationFrame(frame);
