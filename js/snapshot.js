// snapshot.js — serialize the live sim into a plain-object snapshot and render
// snapshots back to the canvas. Used by net.js (host broadcast / client render)
// and replay.js (killcam), so it must work in couch mode too.

function serializeSnapshot(now) {
  // status flags ride the wire only when SET — readers treat a missing field
  // as falsy, and most wizards most frames are not frozen/floaty/piggy/etc.
  const flag = (k, on) => (on ? { [k]: 1 } : {});
  const ps = players.map(p => ({
    s: p.slot, n: p.name, c: p.color, h: p.hat,
    x: Math.round(p.body.position.x), y: Math.round(p.body.position.y),
    vx: +p.body.velocity.x.toFixed(1), vy: +p.body.velocity.y.toFixed(1),
    an: +(p.body.angle * 0.35).toFixed(2),
    f: p.facing, wp: +p.walkPhase.toFixed(2),
    hp: Math.round(p.hp), al: p.alive ? 1 : 0, sc: +p.sizeScale.toFixed(2),
    ...flag('fz', now < p.frozenUntil), ...flag('fl', now < (p.floatyUntil || 0)),
    ...flag('iv', now < (p.invulnUntil || 0)), ...flag('rf', now < (p.reflectUntil || 0)),
    ...flag('pg', now < (p.pigUntil || 0)), ...flag('hu', now < (p.hurtUntil || 0)),
    ...(p.ghost && !p.alive ? { gx: Math.round(p.ghost.x), gy: Math.round(p.ghost.y) } : {}),
    sp: p.spellId, ...flag('rd', p.spellId && now - p.lastCast > SPELLS[p.spellId].cooldown),
    // both spell slots + per-slot cooldown fraction for the two-slot HUD
    s0: p.slots[0], s1: p.slots[1],
    h0: p.slotCharges?.[0] ?? undefined, h1: p.slotCharges?.[1] ?? undefined, // fusion charges left
    c0: p.slots[0] ? +Math.min(1, (now - p.casts[0]) / (SPELLS[p.slots[0]].cooldown || 1)).toFixed(2) : 0,
    c1: p.slots[1] ? +Math.min(1, (now - p.casts[1]) / (SPELLS[p.slots[1]].cooldown || 1)).toFixed(2) : 0,
    ...(p.megaCasts ? { mc: p.megaCasts } : {}),
    ...(p.roundWins ? { w: p.roundWins } : {}),
    ...flag('b', typeof BotController !== 'undefined' && p.controller instanceof BotController),
    ...flag('off', !!p.offline), // online: seat's connection dropped (server sets it)
  }));

  const bodies = [];
  // shape descriptor instead of a vertex dump: geometry never changes frame to
  // frame, so a crate is {w,h}, a rock is {n,r}, a ball is {r} — the client
  // rebuilds the outline from descriptor + angle. Bodies that don't classify
  // (none today) fall back to the old vertex list. Cuts the payload ~30%.
  const pushGhost = (b, label, color, extra) => {
    const e = { id: b.id, l: label, c: color, a: +b.angle.toFixed(3), ...extra };
    e.x = Math.round(b.position.x); e.y = Math.round(b.position.y);
    const v = b.vertices;
    if (b.circleRadius) {
      e.r = Math.round(b.circleRadius);
    } else if (v.length === 4) {
      e.w = Math.round(Math.hypot(v[1].x - v[0].x, v[1].y - v[0].y));
      e.h = Math.round(Math.hypot(v[2].x - v[1].x, v[2].y - v[1].y));
    } else if (v.length >= 3 && v.length <= 12) {
      e.n = v.length;
      e.r = Math.round(Math.hypot(v[0].x - b.position.x, v[0].y - b.position.y));
    } else {
      e.v = v.flatMap(pt => [Math.round(pt.x), Math.round(pt.y)]);
    }
    bodies.push(e);
  };
  for (const fb of projectiles) pushGhost(fb, 'projectile', fb.color);
  for (const s of summons) {
    const extra = {};
    if (s.critter) extra.cd = s.critter.dir;
    if (s.decoyOf) extra.dc = [s.decoyOf.color, s.decoyOf.hat];
    if (s.bossType) extra.bt = s.bossType;
    pushGhost(s, s.label, s.render.fillStyle, extra);
  }
  // gibs are confetti — during real mayhem nobody counts them. Cap what rides
  // the wire; the host keeps the full physics spectacle locally.
  let gibsSent = 0;
  for (const g of gibs) { if (++gibsSent > 14) break; pushGhost(g, 'gib', g.color); }
  for (const t of tomes) bodies.push({ id: t.id, l: 'tome', x: Math.round(t.position.x), y: Math.round(t.position.y), a: +t.angle.toFixed(3), sp: t.spell });
  for (const h of hats) bodies.push({ id: h.id, l: 'hat', x: Math.round(h.position.x), y: Math.round(h.position.y), a: +h.angle.toFixed(3) });
  for (const b of Composite.allBodies(currentMap.composite)) {
    if (b.label === 'lava') continue;
    if (!b.isStatic) pushGhost(b, b.label, b.render.fillStyle);
    else if (b.spin || b.phantom || b.kinematic) {
      pushGhost(b, b.label, b.render.fillStyle, {
        ...(b.phantom ? { ph: b.phantomSolid === false ? 0 : 1 } : {}),
        ...(b.spin ? { spn: 1 } : {}),
      });
    }
  }

  const segs = [];
  for (const c of Composite.allConstraints(currentMap.composite)) {
    if (c.label !== 'breakable' && c.label !== 'chain') continue;
    const [a, b] = constraintEnds(c);
    segs.push([c.label === 'chain' ? 1 : 0, Math.round(a.x), Math.round(a.y), Math.round(b.x), Math.round(b.y)]);
  }

  const fxLite = activeEffects.filter(e => e.net).map(e => e.net);

  return {
    v: GAME_VERSION,
    st: game.state, mi: game.mapIndex, wn: game.winsNeeded,
    ...(game.mode !== 'versus' ? { md: game.mode } : {}), // lobby needs the mode line
    ...(game.mode === 'wave' && game.bestWave ? { bw: game.bestWave } : {}),
    msd: game.mapSeed, // seed for deterministic map extras (client regenerates statics)
    rn: game.totalRounds || 0, // increments every round start — the "re-plan now" signal
    lv: currentMap.data.lavaY != null ? Math.round(currentMap.data.lavaY) : null,
    // winner only while a round/match is actually resolving — it must not linger
    // into the next round (headless clients use wr==null as their reset signal)
    wr: (game.state === 'ROUND_END' || game.state === 'VICTORY') && game.winner ? game.winner.slot : null,
    ev: game.envEvent?.announced ? game.envEvent.def.id : null,
    bd: currentMap.data.broken && currentMap.data.broken.length ? currentMap.data.broken : undefined, // broken destructibles for LAN mirroring

    bs: game.boss?.announced ? { n: game.boss.title || game.boss.def.name, c: game.boss.enraged ? '#ff4d4d' : game.boss.def.color, hp: Math.max(0, Math.round(game.boss.hp)), mhp: game.boss.maxHp } : null,
    aw: game.state === 'VICTORY' ? game.awards || null : null,
    sr: game.state === 'VICTORY' ? game.spellReport || null : null,
    ps, bodies, segs, fxLite,
  };
}

function ghostBody(e, ep, alpha) {
  // interpolate between prev entry ep and current e, then rebuild the outline
  // from the shape descriptor ({r} circle, {w,h} rect, {n,r} polygon) — or the
  // legacy vertex list if one arrived
  const lerp = (a, b) => a + (b - a) * alpha;
  const x = ep ? lerp(ep.x, e.x) : e.x;
  const y = ep ? lerp(ep.y, e.y) : e.y;
  const angle = ep ? lerp(ep.a, e.a) : e.a;
  let vertices;
  if (e.n && e.r) {
    vertices = [];
    for (let i = 0; i < e.n; i++) {
      const a = angle + (i / e.n) * Math.PI * 2;
      vertices.push({ x: x + Math.cos(a) * e.r, y: y + Math.sin(a) * e.r });
    }
  } else if (e.r) {
    vertices = [];
    for (let i = 0; i < 10; i++) {
      const a = angle + i * Math.PI / 5;
      vertices.push({ x: x + Math.cos(a) * e.r, y: y + Math.sin(a) * e.r });
    }
  } else if (e.w != null) {
    const c = Math.cos(angle), s = Math.sin(angle), hw = e.w / 2, hh = e.h / 2;
    vertices = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([px, py]) =>
      ({ x: x + px * c - py * s, y: y + px * s + py * c }));
  } else if (e.v) {
    vertices = [];
    for (let i = 0; i < e.v.length; i += 2) {
      vertices.push({
        x: ep && ep.v && ep.v.length === e.v.length ? lerp(ep.v[i], e.v[i]) : e.v[i],
        y: ep && ep.v && ep.v.length === e.v.length ? lerp(ep.v[i + 1], e.v[i + 1]) : e.v[i + 1],
      });
    }
  }
  const fake = {
    position: { x, y }, angle, vertices,
    circleRadius: e.n ? null : e.r, label: e.l, color: e.c,
    render: { fillStyle: e.c },
  };
  if (e.cd != null) fake.critter = { dir: e.cd };
  if (e.dc) fake.decoyOf = { color: e.dc[0], hat: e.dc[1] };
  if (e.bt) fake.bossType = e.bt;
  if (e.spn) fake.spin = 1;
  return fake;
}

// Camera targets straight off the wire. The online client has no local players
// to follow, and the ghosts don't exist until drawSnapshotWorld builds them —
// but the camera has to be positioned BEFORE anything draws, so this does the
// same interpolation a frame early and cheaply.
function snapshotCameraPoints(snap, snapPrev, alpha) {
  if (!snap?.ps) return null;
  const prevPs = {};
  if (snapPrev) for (const q of snapPrev.ps) prevPs[q.s] = q;
  const pts = [];
  for (const gp of snap.ps) {
    if (!gp.al) continue;
    const p = prevPs[gp.s];
    pts.push({
      x: p ? p.x + (gp.x - p.x) * alpha : gp.x,
      y: p ? p.y + (gp.y - p.y) * alpha : gp.y,
      r: 26 * (gp.sc || 1),
    });
  }
  // The boss is a summon on the wire, not a player, so walking snap.ps alone
  // meant the online camera never knew it existed — with one wizard left it
  // would happily zoom in on them and push the boss off screen entirely.
  for (const e of snap.bodies || []) {
    if (e.l !== 'boss') continue;
    const r = e.r || Math.max(e.w || 0, e.h || 0) / 2 || 42;
    pts.push({ x: e.x, y: e.y, r: r + 24 });
  }
  return pts;
}

function ghostPlayer(gp, gpPrev, alpha, now) {
  const lerp = (a, b) => a + (b - a) * alpha;
  const x = gpPrev ? lerp(gpPrev.x, gp.x) : gp.x;
  const y = gpPrev ? lerp(gpPrev.y, gp.y) : gp.y;
  return {
    name: gp.n, color: gp.c, hat: gp.h, slot: gp.s,
    facing: gp.f, walkPhase: gp.wp, spellId: gp.sp,
    lastCast: gp.rd ? -1e9 : now,
    pigUntil: gp.pg ? now + 1000 : 0,
    body: { position: { x, y }, velocity: { x: gp.vx, y: gp.vy ?? 0 } },
    _x: x, _y: y, _an: gp.an,
    hp: gp.hp, alive: gp.al, sizeScale: gp.sc,
    frozen: gp.fz, floaty: gp.fl, invuln: gp.iv, reflect: gp.rf, hurt: gp.hu,
    roundWins: gp.w,
  };
}

function drawGhostWizard(g, now) {
  const s = g.sizeScale || 1;
  drawNameTag(g.name, g.color, g._x, g._y - 48 * s);
  if (s > 1.6) { // matches drawWizard (player.js): additive aura, not a canvas shadow
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glowOrb(ctx, g._x, g._y - 6 * s, 34 * s, '#ffd700', 0.32);
    ctx.restore();
  }
  drawWizardFigure(g, g._x, g._y, s, now, g._an);
  const x = g._x, y = g._y;
  if (g.floaty) {
    ctx.strokeStyle = '#ff6b81'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y - 26 * s); ctx.lineTo(x + 3, y - 44 * s); ctx.stroke();
    ctx.fillStyle = '#ff6b81';
    ctx.beginPath(); ctx.arc(x + 3, y - 52 * s, 9, 0, Math.PI * 2); ctx.fill();
  }
  if (g.invuln || g.reflect) {
    ctx.strokeStyle = g.reflect ? '#4ecdff' : '#ffd700';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(now * 0.02);
    ctx.beginPath(); ctx.arc(x, y - 8 * s, 24 * s, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // matches the couch path (player.js): silhouette flash, real ice block.
  // The snapshot only carries a hurt BOOLEAN, not a remaining duration, so the
  // flash plays at a fixed strength here instead of fading out.
  if (g.hurt) drawStoryHitFlash(ctx, wizardArt(g, x, y, s, now, g._an), 0.8);
  if (g.frozen) drawStoryIceBlock(ctx, x, y - 7 * s, 34 * s, 50 * s, now);
  // no health bars — the hat tells the story (see drawWizardFigure)
}

function drawFxLite(fxLite, now) {
  for (const e of fxLite || []) {
    if (e.k === 'sing') {
      ctx.fillStyle = '#0a0510';
      ctx.beginPath(); ctx.arc(e.x, e.y, 26, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#a55eea';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(now * 0.02);
      ctx.beginPath(); ctx.arc(e.x, e.y, 36 + 5 * Math.sin(now * 0.011), 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (e.k === 'zone') {
      ctx.globalAlpha = 0.16 + 0.06 * Math.sin(now * 0.01);
      ctx.fillStyle = e.c;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    } else if (e.k === 'tor') {
      // e.c tints the funnel (Firestorm's fire tornado); default is the air one
      ctx.strokeStyle = e.c ? rgba(e.c, 0.6) : 'rgba(207,232,232,0.55)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 5; i++) {
        const yy = H - 80 - i * 90;
        const w = 26 + i * 22;
        ctx.beginPath();
        ctx.ellipse(e.x + Math.sin(now * 0.01 + i) * 8, yy, w, 12, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
}

// plain static scenery only — everything dynamic is drawn from the snapshot's
// ghost list, so live bodies never double-draw against their recorded ghosts
function drawSnapshotStatics(now) {
  for (const b of Composite.allBodies(currentMap.composite)) {
    if (b.label === 'lava') continue;
    if (!b.isStatic || b.spin || b.phantom || b.kinematic) continue;
    if (b.label === 'crate') drawCrate(b);
    else if (b.label === 'destructible') drawDestructible(b, now || performance.now());
    else if (b.label === 'spikes') drawSpikes(b);
    else drawTerrainBody(b, now || performance.now());
  }
}

// render one snapshot (interpolated against snapPrev) to the canvas.
// includeLocalFx also draws activeEffects + particles between the fxLite layer
// and the wizards — the net client feeds those from fx events; the replay
// player leaves them out. Returns the interpolated ghost players.
function drawSnapshotWorld(snap, snapPrev, alpha, now, includeLocalFx = false) {
  currentMap.data.lavaY = snap.lv;
  const prevById = {};
  if (snapPrev) for (const e of snapPrev.bodies) prevById[e.id] = e;
  const prevPs = {};
  if (snapPrev) for (const q of snapPrev.ps) prevPs[q.s] = q;

  drawBackdrop(now);
  drawSnapshotStatics(now);
  drawLava(now);
  drawGeysers(now); // geysers & gas vents come from the map def, present client-side too
  drawGasVents(now);

  for (const [type, x0, y0, x1, y1] of snap.segs || []) {
    if (type === 1) {
      ctx.strokeStyle = '#0d0a14';
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      const d = Math.hypot(x1 - x0, y1 - y0);
      ctx.fillStyle = '#2c2438';
      for (let t = 12; t < d; t += 26) {
        ctx.beginPath();
        ctx.arc(x0 + (x1 - x0) * t / d, y0 + (y1 - y0) * t / d, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.strokeStyle = '#5d4a33';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }
  }

  for (const e of snap.bodies) {
    if (e.l === 'tome') { drawTomeAt(e.x, e.y, e.a, SPELLS[e.sp]?.color || '#e8d5ff', now, undefined, e.sp); continue; }
    if (e.l === 'hat') { drawHatAt(e.x, e.y, e.a, now); continue; }
    const fake = ghostBody(e, prevById[e.id], alpha);
    if (e.ph === 0) ctx.globalAlpha = 0.18;
    drawDynamicBody(fake, now);
    ctx.globalAlpha = 1;
  }

  drawFxLite(snap.fxLite, now);
  if (includeLocalFx) {
    for (const eff of activeEffects) eff.draw?.(now); // boltVisuals arrive via fx events
    for (let i = activeEffects.length - 1; i >= 0; i--) if (now > activeEffects[i].until) activeEffects.splice(i, 1);
    drawParticles();
  }

  const ghosts = snap.ps.map(gp => ghostPlayer(gp, prevPs[gp.s], alpha, now));
  for (const g of ghosts) if (g.alive) drawGhostWizard(g, now);
  drawOffscreenPointers(ghosts.filter(g => g.alive).map(g => ({
    x: g._x, y: g._y, vx: g.body.velocity.x, vy: g.body.velocity.y, color: g.color,
  })), now);
  for (const gp of snap.ps) { // dead wizards linger as wisps
    if (gp.al || gp.gx == null) continue;
    const prev = prevPs[gp.s];
    const wx = prev && prev.gx != null ? prev.gx + (gp.gx - prev.gx) * alpha : gp.gx;
    const wy = prev && prev.gy != null ? prev.gy + (gp.gy - prev.gy) * alpha : gp.gy;
    drawWisp(gp.n, gp.c, wx, wy, now);
  }
  if (snap.ev) drawEnvVisuals(snap.ev, now, envLightsFromSnap(snap, ghosts));
  return ghosts;
}
