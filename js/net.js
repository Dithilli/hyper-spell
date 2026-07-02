// net.js — LAN multiplayer: host broadcasts the sim, clients render ghosts.
// Loaded last; when opened via file:// this file does nothing (pure couch mode).

/* eslint-disable no-global-assign */
(() => {
  if (typeof location === 'undefined' || !location.protocol.startsWith('http')) return;
  if (typeof document.createElement !== 'function') return;

  let ws = null;
  let myCid = null;
  let mySlot = null;
  let joined = false;
  let hostPresent = false;
  let frameCount = 0;
  const netControllers = new Map(); // cid -> NetworkController

  // ---------- controller for remote players (host side) ----------
  class NetworkController {
    constructor(cid) {
      this.cid = cid;
      this.state = { m: 0, j: 0, c: 0, a: null };
      this.prev = { jump: false, cast: false, start: false };
      this.lastSeen = performance.now();
    }
    poll() {
      const stale = performance.now() - this.lastSeen > 2000;
      const st = stale ? { m: 0, j: 0, c: 0, a: null } : this.state;
      const jump = !!st.j, cast = !!st.c;
      const s = {
        move: st.m || 0, jump, cast,
        jumpPressed: jump && !this.prev.jump,
        castPressed: cast && !this.prev.cast,
        startPressed: false,
        aimPoint: null, aimVec: null,
        aimAngle: st.a,
      };
      this.prev = { jump, cast, start: false };
      return s;
    }
  }

  function emit(msg) {
    if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg));
  }

  // ---------- mode menu ----------
  const menu = document.createElement('div');
  menu.id = 'netmenu';
  menu.style.cssText = 'position:fixed;inset:0;display:flex;flex-direction:column;gap:14px;align-items:center;justify-content:center;background:rgba(13,10,20,0.92);z-index:10;font-family:Georgia,serif;';
  menu.innerHTML = `
    <div style="color:#e8d5ff;font-size:56px;letter-spacing:.08em;text-shadow:0 0 40px #a55eea">HYPERSPELL</div>
    <div style="color:#9c8ab8;font-size:15px;margin-bottom:12px">wizards · physics · violence</div>
    <button data-mode="couch" style="${btnCss('#4ecdc4')}">COUCH — everyone on this computer</button>
    <button data-mode="host" style="${btnCss('#ffd166')}">HOST ONLINE — this computer runs the match</button>
    <button data-mode="client" style="${btnCss('#ff6b81')}">JOIN GAME — play from this computer</button>
    <div id="netstatus" style="color:#675a7d;font-size:13px;margin-top:10px"></div>`;
  function btnCss(color) {
    return `min-width:420px;padding:14px 26px;font-family:Georgia,serif;font-size:18px;cursor:pointer;background:transparent;border:2px solid ${color};color:${color};border-radius:8px;`;
  }
  document.body.appendChild(menu);
  const statusEl = () => document.getElementById('netstatus');

  menu.addEventListener('click', e => {
    const mode = e.target?.dataset?.mode;
    if (!mode) return;
    ensureAudio();
    if (mode === 'couch') { menu.remove(); return; }
    connect(mode);
  });

  function connect(wantMode) {
    statusEl().textContent = 'connecting…';
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${proto}://${location.host}/ws`);
    ws.onopen = () => { if (wantMode === 'host') emit({ t: 'claimHost' }); else clientHello(); };
    ws.onerror = () => { statusEl().textContent = 'connection failed — is the server running?'; };
    ws.onclose = () => { if (netMode === 'client') setBanner('CONNECTION LOST — refresh', '#ff6b81', 60000); };
    ws.onmessage = ev => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      handleMessage(msg, wantMode);
    };
  }

  function handleMessage(msg, wantMode) {
    switch (msg.t) {
      case 'welcome':
        myCid = msg.cid;
        hostPresent = msg.hostPresent;
        break;
      case 'youAreHost':
        startHosting();
        break;
      case 'hostTaken':
        statusEl().textContent = 'someone is already hosting — join instead';
        break;
      case 'hostUp':
        hostPresent = true;
        break;
      case 'hostLeft':
        if (netMode === 'client') setBanner('HOST LEFT — refresh to rejoin', '#ff6b81', 60000);
        break;
      // ---- host receives ----
      case 'input': {
        const nc = netControllers.get(msg.cid);
        if (nc) { nc.state = msg; nc.lastSeen = performance.now(); }
        break;
      }
      case 'join': {
        if (netMode !== 'host' || netControllers.has(msg.cid)) break;
        if (players.length >= MAX_PLAYERS) break;
        const nc = new NetworkController(msg.cid);
        netControllers.set(msg.cid, nc);
        joinPlayer(nc);
        const p = players.find(q => q.controller === nc);
        if (p) emit({ t: 'to', cid: msg.cid, msg: { t: 'you', slot: p.slot } });
        break;
      }
      case 'start':
        if (netMode === 'host' && game.state === 'LOBBY' && players.length >= 2) startRound(game.mapIndex);
        break;
      case 'wins':
        if (netMode === 'host' && game.state === 'LOBBY' && msg.n >= 1 && msg.n <= 9) {
          game.winsNeeded = msg.n;
          setBanner(`FIRST TO ${game.winsNeeded}`, '#e8d5ff', 900);
        }
        break;
      case 'clientLeft':
        netControllers.delete(msg.cid);
        break;
      // ---- client receives ----
      case 'you':
        mySlot = msg.slot;
        joined = true;
        break;
      case 'snap':
        if (netMode !== 'client' && wantMode === 'client') startClient();
        pushSnapshot(msg);
        break;
      case 'fx':
        if (netMode === 'client') applyFx(msg);
        break;
    }
  }

  // ================= HOST =================
  function startHosting() {
    netMode = 'host';
    menu.remove();
    setBanner('HOSTING ONLINE', '#ffd166', 1400);
    wrapFx();
  }

  // wrap the cosmetic globals so every visual/sound also broadcasts
  function wrapFx() {
    const names = ['spawnParticles', 'spawnRing', 'spawnText', 'doFlash', 'addShake', 'slowMo', 'boltVisual', 'setBanner'];
    for (const name of names) {
      const orig = globalThis[name];
      globalThis[name] = (...args) => { emit({ t: 'fx', f: name, a: args }); return orig(...args); };
    }
    for (const key of Object.keys(sfx)) {
      const orig = sfx[key];
      sfx[key] = (...args) => { emit({ t: 'fx', f: 'sfx', a: [key] }); return orig(...args); };
    }
  }

  globalThis.netHostTick = function netHostTick(now) {
    frameCount++;
    if (frameCount % 3 !== 0) return; // ~20Hz
    emit({ t: 'snap', ...serializeSnapshot(now) });
  };

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
      st: game.state, mi: game.mapIndex, wn: game.winsNeeded,
      lv: currentMap.data.lavaY != null ? Math.round(currentMap.data.lavaY) : null,
      wr: game.winner ? game.winner.slot : null,
      ps, bodies, segs, fxLite,
    };
  }

  // ================= CLIENT =================
  let snapPrev = null, snapCur = null, tPrev = 0, tCur = 0;
  let clientMap = null; // {def, composite, data}
  let inputTick = 0;

  function clientHello() {
    statusEl().textContent = hostPresent ? 'connected — waiting for game state…' : 'connected — waiting for a host…';
  }

  function startClient() {
    netMode = 'client';
    menu.remove();
  }

  function pushSnapshot(snap) {
    snapPrev = snapCur; tPrev = tCur;
    snapCur = snap; tCur = performance.now();
    if (!clientMap || clientMap.index !== snap.mi) clientLoadMap(snap.mi);
  }

  function clientLoadMap(index) {
    const def = MAPS[index];
    const m = { def, composite: Composite.create(), data: {} };
    def.build(m);
    // keep only plain static scenery; everything else arrives as ghosts
    for (const b of [...Composite.allBodies(m.composite)]) {
      if (!b.isStatic || b.spin || b.phantom || b.kinematic || b.label === 'lava') Composite.remove(m.composite, b);
    }
    for (const c of [...Composite.allConstraints(m.composite)]) Composite.remove(m.composite, c);
    if (def.stars) {
      m.data.starfield = Array.from({ length: 70 }, () => ({ x: rand(0, W), y: rand(0, H - 160), r: rand(0.5, 1.8), tw: rand(0, 6.28) }));
    }
    m.index = index;
    clientMap = m;
    currentMap = m; // shared draw helpers read currentMap
    particles.length = 0;
    activeEffects.length = 0;
  }

  function applyFx(msg) {
    if (msg.f === 'sfx') { sfx[msg.a[0]]?.(); return; }
    const fn = globalThis[msg.f];
    if (typeof fn === 'function') fn(...msg.a);
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

  function sendInput(now) {
    inputTick++;
    if (inputTick % 2 !== 0) return; // ~30Hz
    const jump = !!keys['KeyW'] || !!keys['Space'] || !!keys['ArrowUp'];
    const cast = !!keys['KeyE'] || !!keys['Enter'] || mouse.down;
    const move = (keys['KeyD'] || keys['ArrowRight'] ? 1 : 0) - (keys['KeyA'] || keys['ArrowLeft'] ? 1 : 0);
    let aim = null;
    if (mouse.present && snapCur && mySlot != null) {
      const me = snapCur.ps.find(q => q.s === mySlot);
      if (me) aim = Math.atan2(mouse.y - me.y, mouse.x - me.x);
    }
    if (!joined && (cast || mouse.down)) emit({ t: 'join' });
    if (joined) emit({ t: 'input', m: move, j: jump ? 1 : 0, c: cast ? 1 : 0, a: aim });
    // lobby controls forwarded to host
    if (keys['Space'] && !this._sp) emit({ t: 'start' });
    this._sp = !!keys['Space'];
    for (let d = 1; d <= 9; d++) {
      if (keys[`Digit${d}`] && !this[`_d${d}`]) emit({ t: 'wins', n: d });
      this[`_d${d}`] = !!keys[`Digit${d}`];
    }
  }

  globalThis.netClientFrame = function netClientFrame(now) {
    sendInput.call(sendInput, now);
    updateParticles(1);

    const sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake;
    shake *= 0.88;
    ctx.setTransform(1, 0, 0, 1, sx, sy);
    ctx.clearRect(-30, -30, W + 60, H + 60);

    if (!snapCur || !clientMap) {
      ctx.fillStyle = '#16121c';
      ctx.fillRect(-30, -30, W + 60, H + 60);
      ctx.fillStyle = '#9c8ab8';
      ctx.font = '22px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('waiting for the host…', W / 2, H / 2);
      return;
    }

    const snap = snapCur;
    clientMap.data.lavaY = snap.lv;
    // interpolate 60ms behind current snapshot
    const span = Math.max(tCur - tPrev, 1);
    const alpha = Math.max(0, Math.min(1, (now - 60 - tPrev) / span));
    const prevById = {};
    if (snapPrev) for (const e of snapPrev.bodies) prevById[e.id] = e;
    const prevPs = {};
    if (snapPrev) for (const q of snapPrev.ps) prevPs[q.s] = q;

    drawBackdrop(now);
    drawMapBodies(now);
    drawLava(now);

    // constraint segments
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
    for (const eff of activeEffects) eff.draw?.(now); // boltVisuals arrive via fx events
    for (let i = activeEffects.length - 1; i >= 0; i--) if (now > activeEffects[i].until) activeEffects.splice(i, 1);
    drawParticles();

    const ghosts = snap.ps.map(gp => ghostPlayer(gp, prevPs[gp.s], alpha, now));
    for (const g of ghosts) if (g.alive) drawGhostWizard(g, now);

    // reticle
    if (mouse.present) {
      const mine = ghosts.find(g => g.slot === mySlot);
      ctx.strokeStyle = mine ? mine.color : '#9c8ab8';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.85;
      ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 9, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = getVignette();
    ctx.fillRect(0, 0, W, H);
    if (flashAlpha > 0.01) {
      ctx.globalAlpha = flashAlpha;
      ctx.fillStyle = flashColor;
      ctx.fillRect(-30, -30, W + 60, H + 60);
      ctx.globalAlpha = 1;
    }
    flashAlpha *= 0.86;

    // HUD
    ctx.textAlign = 'center';
    ctx.font = '12px Georgia';
    ctx.fillStyle = '#675a7d';
    ctx.fillText(`${clientMap.def.name} · ${snap.mi + 1}/${MAPS.length}`, W / 2, 18);
    const spacing = Math.min(300, (W - 220) / Math.max(snap.ps.length - 1, 1));
    snap.ps.forEach((gp, i) => {
      const x = snap.ps.length === 1 ? 150 : W / 2 + (i - (snap.ps.length - 1) / 2) * spacing;
      ctx.font = 'bold 20px Georgia';
      ctx.fillStyle = gp.c;
      ctx.fillText(gp.n + (gp.s === mySlot ? ' ◂you' : ''), x, 38);
      ctx.strokeStyle = gp.c;
      const pipStart = x - (snap.wn - 1) * 9;
      for (let w = 0; w < snap.wn; w++) {
        ctx.beginPath();
        ctx.arc(pipStart + w * 18, 54, 5.5, 0, Math.PI * 2);
        if (w < gp.w) ctx.fill();
        else { ctx.lineWidth = 1.5; ctx.stroke(); }
      }
      ctx.font = '13px Georgia';
      ctx.fillStyle = '#9c8ab8';
      ctx.fillText(gp.sp ? SPELLS[gp.sp].name : '· · ·', x, 74);
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

    if (snap.st === 'LOBBY') {
      ctx.fillStyle = 'rgba(12,8,18,0.72)';
      ctx.fillRect(W / 2 - 430, 55, 860, 210);
      ctx.font = 'bold 54px Georgia';
      ctx.fillStyle = '#e8d5ff';
      ctx.fillText('HYPERSPELL ONLINE', W / 2, 125);
      ctx.font = '17px Georgia';
      ctx.fillStyle = joined ? '#7bd88f' : '#9c8ab8';
      ctx.fillText(joined ? `you are in as P${(mySlot ?? 0) + 1} — WASD move · SPACE/W jump · aim & fire with the mouse` : 'CLICK or press E to join', W / 2, 165);
      ctx.font = '15px Georgia';
      snap.ps.forEach((gp, i) => {
        ctx.fillStyle = gp.c;
        ctx.fillText(gp.n + (gp.s === mySlot ? ' (you)' : ''), W / 2 - 300 + (i % 4) * 200, 205 + Math.floor(i / 4) * 26);
      });
      ctx.fillStyle = '#675a7d';
      ctx.font = '13px Georgia';
      ctx.fillText(`SPACE to start · 1-9 sets win target (${snap.wn})`, W / 2, 252);
    }

    if (snap.st === 'VICTORY' && snap.wr != null) {
      const gw = snap.ps.find(q => q.s === snap.wr);
      if (gw) {
        ctx.fillStyle = 'rgba(10,6,16,0.6)';
        ctx.fillRect(0, 0, W, H);
        const g = ghostPlayer(gw, null, 1, now);
        g._x = W / 2; g._y = 400;
        g.body.position = { x: W / 2, y: 400 };
        drawWizardFigure(g, W / 2, 400, 4.5, now);
        ctx.font = 'bold 58px Georgia';
        ctx.fillStyle = gw.c;
        ctx.textAlign = 'center';
        ctx.fillText(`${gw.n} WINS THE MATCH`, W / 2, 180);
        if (Math.random() < 0.6) {
          particles.push({ kind: 'confetti', x: rand(0, W), y: -10, vx: rand(-1, 1), vy: rand(1, 3), life: 120, maxLife: 120, color: pick(['#4ecdc4', '#ff6b81', '#ffd166', '#a55eea', '#e8d5ff']), r: 4 });
        }
      }
    }
  };
})();
