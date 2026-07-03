// snapshot.js — serialize the live sim into a plain-object snapshot and render
// snapshots back to the canvas. Used by net.js (host broadcast / client render)
// and replay.js (killcam), so it must work in couch mode too.

function serializeSnapshot(now) {
  const ps = players.map(p => ({
    s: p.slot, n: p.name, c: p.color, h: p.hat,
    x: Math.round(p.body.position.x), y: Math.round(p.body.position.y),
    vx: +p.body.velocity.x.toFixed(1), an: +(p.body.angle * 0.35).toFixed(2),
    f: p.facing, wp: +p.walkPhase.toFixed(2),
    hp: Math.round(p.hp), al: p.alive ? 1 : 0, sc: +p.sizeScale.toFixed(2),
    fz: now < p.frozenUntil ? 1 : 0, fl: now < (p.floatyUntil || 0) ? 1 : 0,
    iv: now < (p.invulnUntil || 0) ? 1 : 0, rf: now < (p.reflectUntil || 0) ? 1 : 0,
    pg: now < (p.pigUntil || 0) ? 1 : 0, hu: now < (p.hurtUntil || 0) ? 1 : 0,
    sp: p.spellId, rd: p.spellId && now - p.lastCast > SPELLS[p.spellId].cooldown ? 1 : 0,
    cdf: p.spellId ? +Math.min(1, (now - p.lastCast) / (SPELLS[p.spellId].cooldown || 1)).toFixed(2) : 0,
    mc: p.megaCasts || 0,
    w: p.roundWins,
  }));

  const bodies = [];
  const pushGhost = (b, label, color, extra) => {
    const e = { id: b.id, l: label, c: color, a: +b.angle.toFixed(3), ...extra };
    if (b.circleRadius) {
      e.x = Math.round(b.position.x); e.y = Math.round(b.position.y); e.r = Math.round(b.circleRadius);
    } else {
      e.x = Math.round(b.position.x); e.y = Math.round(b.position.y);
      e.v = b.vertices.flatMap(pt => [Math.round(pt.x), Math.round(pt.y)]);
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
  for (const g of gibs) pushGhost(g, 'gib', g.color);
  for (const t of tomes) bodies.push({ id: t.id, l: 'tome', x: Math.round(t.position.x), y: Math.round(t.position.y), a: +t.angle.toFixed(3), sp: t.spell });
  for (const h of hats) bodies.push({ id: h.id, l: 'hat', x: Math.round(h.position.x), y: Math.round(h.position.y), a: +h.angle.toFixed(3) });
  for (const b of Composite.allBodies(currentMap.composite)) {
    if (b.label === 'lava') continue;
    if (!b.isStatic) pushGhost(b, b.label, b.render.fillStyle);
    else if (b.spin || b.phantom || b.kinematic) pushGhost(b, b.label, b.render.fillStyle, b.phantom ? { ph: b.phantomSolid === false ? 0 : 1 } : {});
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
    lv: currentMap.data.lavaY != null ? Math.round(currentMap.data.lavaY) : null,
    wr: game.winner ? game.winner.slot : null,
    ev: game.envEvent?.announced ? game.envEvent.def.id : null,
    bs: game.boss?.announced ? { n: game.boss.def.name, c: game.boss.def.color, hp: Math.max(0, Math.round(game.boss.hp)), mhp: game.boss.maxHp } : null,
    ps, bodies, segs, fxLite,
  };
}

function ghostBody(e, ep, alpha) {
  // interpolate between prev entry ep and current e
  const lerp = (a, b) => a + (b - a) * alpha;
  const x = ep ? lerp(ep.x, e.x) : e.x;
  const y = ep ? lerp(ep.y, e.y) : e.y;
  const angle = ep ? lerp(ep.a, e.a) : e.a;
  let vertices;
  if (e.r) {
    vertices = [];
    for (let i = 0; i < 10; i++) {
      const a = angle + i * Math.PI / 5;
      vertices.push({ x: x + Math.cos(a) * e.r, y: y + Math.sin(a) * e.r });
    }
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
    circleRadius: e.r, label: e.l, color: e.c,
    render: { fillStyle: e.c },
  };
  if (e.cd != null) fake.critter = { dir: e.cd };
  if (e.dc) fake.decoyOf = { color: e.dc[0], hat: e.dc[1] };
  if (e.bt) fake.bossType = e.bt;
  return fake;
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
    body: { position: { x, y }, velocity: { x: gp.vx, y: 0 } },
    _x: x, _y: y, _an: gp.an,
    hp: gp.hp, alive: gp.al, sizeScale: gp.sc,
    frozen: gp.fz, floaty: gp.fl, invuln: gp.iv, reflect: gp.rf, hurt: gp.hu,
    roundWins: gp.w,
  };
}

function drawGhostWizard(g, now) {
  const s = g.sizeScale || 1;
  drawNameTag(g.name, g.color, g._x, g._y - 48 * s);
  if (s > 1.6) { ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 18; }
  drawWizardFigure(g, g._x, g._y, s, now, g._an);
  ctx.shadowBlur = 0;
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
  if (g.hurt) {
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x, y - 8 * s, 19 * s, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (g.frozen) {
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#9be7ff';
    ctx.fillRect(x - 17 * s, y - 32 * s, 34 * s, 50 * s);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#d8f4ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 17 * s, y - 32 * s, 34 * s, 50 * s);
  }
  if (g.hp < 100) {
    const pct = Math.max(0, g.hp / 100);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - 16, y - 42 * s, 32, 5);
    ctx.fillStyle = pct > 0.5 ? '#7bd88f' : pct > 0.25 ? '#ffd166' : '#ff6b81';
    ctx.fillRect(x - 16, y - 42 * s, 32 * pct, 5);
  }
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
      ctx.strokeStyle = 'rgba(207,232,232,0.55)';
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
function drawSnapshotStatics() {
  for (const b of Composite.allBodies(currentMap.composite)) {
    if (b.label === 'lava') continue;
    if (!b.isStatic || b.spin || b.phantom || b.kinematic) continue;
    if (b.label === 'crate') drawCrate(b);
    else if (b.label === 'spikes') drawSpikes(b);
    else drawBodyRounded(b, b.render.fillStyle || '#171221');
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
  drawSnapshotStatics();
  drawLava(now);

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
    if (e.l === 'tome') { drawTomeAt(e.x, e.y, e.a, SPELLS[e.sp]?.color || '#e8d5ff', now); continue; }
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
  if (snap.ev) drawEnvVisuals(snap.ev, now, envLightsFromSnap(snap, ghosts));
  return ghosts;
}
