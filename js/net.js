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
  // THE CLIENT INPUT CONTRACT — { t:'input', m, j, c, a }, sent ~30/sec:
  //   m: move, WORLD-space: 1 = +x (screen right), -1 = left, 0 = idle. Not facing-relative.
  //   a: aim, ABSOLUTE world radians: 0 = +x, positive = clockwise on screen (screen y grows
  //      down, so a = Math.atan2(dy, dx) with dy downward-positive). null = no aim (falls back
  //      to facing + lob). The host uses the LAST-KNOWN aim at the moment a cast fires, so `a`
  //      does not need to arrive on the same frame as c:1 — but sending both together is safest.
  //   c: cast, HOLD semantics: keep c:1 and the wizard casts every time the cooldown is ready
  //      (auto-repeats). The castPressed edge below is only used for lobby join / rematch.
  //   j: jump, hybrid: holding j:1 jumps whenever grounded (auto-hop); the AIR jump (double
  //      jump) needs a fresh 0→1 edge. Send j:1 then j:0 to meter your jumps.
  // Inputs older than 2000ms zero out (stale guard) — keep sending even when idle.
  // Snapshots broadcast at ~20Hz. In snapshot ps[]: you are the entry with s === your slot
  // (slots are stable for the whole session; they never reshuffle). Tomes are picked up by
  // touching them (bodies[].l === 'tome', body is 20×24px; players are r=15 circles).
  // A new round = the snapshot's `rn` counter increments (state also flips to 'PLAY').
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
  const logoLetters = [...'HYPERSPELL']
    .map((ch, i) => `<span style="animation-delay:${(i * 0.13).toFixed(2)}s">${ch}</span>`).join('');
  menu.innerHTML = `
    <style>
      #hslogo { display:flex; font: italic 900 64px Georgia, serif; letter-spacing:.05em;
        filter: drop-shadow(0 0 18px rgba(165,94,234,.8)); animation: hsglow 2.4s ease-in-out infinite; }
      #hslogo span {
        background: linear-gradient(180deg, #bfe8ff 0%, #e8d5ff 44%, #5d3a8f 50%, #ff6b81 56%, #ffd166 100%);
        -webkit-background-clip: text; background-clip: text; color: transparent;
        animation: hsfloat 2.6s ease-in-out infinite;
      }
      @keyframes hsfloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-7px) } }
      @keyframes hsglow {
        0%,100% { filter: drop-shadow(0 0 12px rgba(165,94,234,.55)) }
        50% { filter: drop-shadow(0 0 26px rgba(165,94,234,.95)) }
      }
      #hstag { color:#9ef0f0; font-size:15px; letter-spacing:.3em; margin-bottom:12px;
        text-shadow: 0 0 10px rgba(158,240,240,.8); animation: hsflicker 3.7s linear infinite; }
      @keyframes hsflicker {
        0%,7%,9%,53%,56%,100% { opacity: 1 } 8%, 54.5% { opacity: .35 }
      }
    </style>
    <div id="hslogo">${logoLetters}</div>
    <div id="hstag">WIZARDS · PHYSICS · VIOLENCE</div>
    <input id="netname" maxlength="12" placeholder="YOUR WIZARD NAME" autocomplete="off"
      style="min-width:380px;padding:12px 20px;font-family:Georgia,serif;font-size:17px;text-align:center;background:transparent;border:2px solid #675a7d;color:#e8d5ff;border-radius:8px;text-transform:uppercase;outline:none;">
    <button data-mode="couch" style="${btnCss('#4ecdc4')}">COUCH — everyone on this computer</button>
    <button data-mode="host" style="${btnCss('#ffd166')}">HOST ONLINE — this computer runs the match</button>
    <button data-mode="client" style="${btnCss('#ff6b81')}">JOIN GAME — play from this computer</button>
    <div id="netstatus" style="color:#675a7d;font-size:13px;margin-top:10px"></div>`;
  function btnCss(color) {
    return `min-width:420px;padding:14px 26px;font-family:Georgia,serif;font-size:18px;cursor:pointer;background:transparent;border:2px solid ${color};color:${color};border-radius:8px;`;
  }
  document.body.appendChild(menu);
  const statusEl = () => document.getElementById('netstatus');

  const nameInput = menu.querySelector('#netname');
  nameInput.value = localStorage.getItem('hs-name-0') || '';
  // typing here must not reach the game's shortcuts (B adds bots, digits set wins…)
  for (const ev of ['keydown', 'keyup']) nameInput.addEventListener(ev, e => e.stopPropagation());
  menu.addEventListener('click', e => {
    const mode = e.target?.dataset?.mode;
    if (!mode) return;
    const typed = cleanName(nameInput.value);
    if (typed) localStorage.setItem('hs-name-0', typed);
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
        joinPlayer(nc, cleanName(msg.name || msg.n) || undefined);
        const p = players.find(q => q.controller === nc);
        if (p) {
          if (/^#[0-9a-f]{6}$/i.test(msg.color || '')) p.color = readableColor(msg.color);
          if (/^#[0-9a-f]{6}$/i.test(msg.hat || '')) p.hat = readableColor(msg.hat);
          emit({ t: 'to', cid: msg.cid, msg: { t: 'you', slot: p.slot } });
          emit({ t: 'to', cid: msg.cid, msg: worldInfo() });
        }
        break;
      }
      case 'chat': {
        // trash talk: floats above the sender's wizard; spawnText is fx-wrapped,
        // so every client sees it too. Rate-limited per sender.
        if (netMode !== 'host') break;
        const nc = netControllers.get(msg.cid);
        const p = nc && players.find(q => q.controller === nc);
        if (!p || !p.alive) break;
        if (performance.now() < (nc.nextChatAt || 0)) break;
        nc.nextChatAt = performance.now() + 1500;
        const text = String(msg.text || '').replace(/[^\w !?.,'"-]/g, '').slice(0, 60);
        if (text) spawnText(p.body.position.x, p.body.position.y - 64, text, p.color);
        break;
      }
      case 'start':
        if (netMode === 'host' && game.state === 'LOBBY' && players.length >= 2) startRound(game.mapIndex);
        break;
      case 'wins':
        if (netMode === 'host' && game.state === 'LOBBY') {
          if (msg.n >= 1 && msg.n <= 20) game.winsNeeded = msg.n;
          else if (msg.d) game.winsNeeded = Math.max(1, Math.min(20, game.winsNeeded + Math.sign(msg.d)));
          else break;
          setBanner(`FIRST TO ${game.winsNeeded}`, '#e8d5ff', 900);
        }
        break;
      case 'hello':
        if (netMode === 'host' && msg.v !== GAME_VERSION) {
          setBanner('A PLAYER IS ON AN OLD VERSION — HAVE THEM REFRESH', '#ff6b81', 4000);
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
    const names = ['spawnParticles', 'spawnRing', 'spawnText', 'doFlash', 'addShake', 'slowMo', 'boltVisual', 'setBanner', 'addKillFeed'];
    for (const name of names) {
      const orig = globalThis[name];
      globalThis[name] = (...args) => { emit({ t: 'fx', f: name, a: args }); return orig(...args); };
    }
    for (const key of Object.keys(sfx)) {
      const orig = sfx[key];
      sfx[key] = (...args) => { emit({ t: 'fx', f: 'sfx', a: [key] }); return orig(...args); };
    }
  }

  // sent once to each client on join: the physics constants a headless client
  // needs to compute firing solutions, plus per-spell cooldowns. Most bolt spells
  // launch near defaultBolt's profile (speed ~16-23, gravityScale ~0.45-0.9).
  function worldInfo() {
    const spells = {};
    for (const [id, s] of Object.entries(SPELLS)) spells[id] = { name: s.name, cooldown: s.cooldown };
    return {
      t: 'world',
      world: {
        W, H, gravity: game.baseGravity, gravityScale: engine.gravity.scale, tickMs: 16.7,
        snapshotHz: 20, inputHz: 30, staleMs: 2000,
        playerRadius: 15, playerFrictionAir: 0.02,
        moveSpeed: 7, jumpVy: -15, airJumpVy: -13,
        defaultBolt: { speed: 20, vy: -6, gravityScale: 0.45 },
        fallSafeDropPx: FALL_SAFE_DROP,
      },
      spells,
    };
  }

  globalThis.netHostTick = function netHostTick(now) {
    frameCount++;
    if (frameCount % 3 !== 0) return; // ~20Hz
    if (game.replay) {
      // killcam: re-broadcast the buffered tape; clients replay it through
      // their normal interpolation with no extra logic
      const f = replayFrameAt(now);
      if (f) emit({ t: 'snap', ...f.snap, st: 'ROUND_END', rp: 1 });
      return;
    }
    emit({ t: 'snap', ...serializeSnapshot(now) });
  };

  // ================= CLIENT =================
  let snapPrev = null, snapCur = null, tPrev = 0, tCur = 0;
  let clientMap = null; // {def, composite, data}
  let inputTick = 0;

  function clientHello() {
    emit({ t: 'hello', v: GAME_VERSION }); // registers us for broadcasts + version check
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
    if (!joined && (cast || mouse.down)) emit({ t: 'join', n: localStorage.getItem('hs-name-0') || '' });
    if (joined) emit({ t: 'input', m: move, j: jump ? 1 : 0, c: cast ? 1 : 0, a: aim });
    // lobby controls forwarded to host
    if (keys['Space'] && !this._sp) emit({ t: 'start' });
    this._sp = !!keys['Space'];
    for (let d = 1; d <= 9; d++) {
      if (keys[`Digit${d}`] && !this[`_d${d}`]) emit({ t: 'wins', n: d });
      this[`_d${d}`] = !!keys[`Digit${d}`];
    }
    for (const [code, d] of [['Equal', 1], ['Minus', -1]]) {
      if (keys[code] && !this[`_${code}`]) emit({ t: 'wins', d });
      this[`_${code}`] = !!keys[code];
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
    if (snap.v !== GAME_VERSION) {
      ctx.fillStyle = '#16121c';
      ctx.fillRect(-30, -30, W + 60, H + 60);
      ctx.fillStyle = '#ff6b81';
      ctx.font = 'bold 34px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('GAME UPDATED — REFRESH THE PAGE', W / 2, H / 2);
      return;
    }
    // interpolate 60ms behind current snapshot
    const span = Math.max(tCur - tPrev, 1);
    const alpha = Math.max(0, Math.min(1, (now - 60 - tPrev) / span));
    const ghosts = drawSnapshotWorld(snap, snapPrev, alpha, now, true);

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

    if (snap.rp) drawReplayOverlay(now); // host is playing the killcam

    // HUD
    ctx.textAlign = 'center';
    ctx.font = '12px Georgia';
    ctx.fillStyle = '#675a7d';
    ctx.fillText(`${clientMap.def.name} · ${snap.mi + 1}/${MAPS.length}`, W / 2, 18);
    if (snap.ev) {
      const evDef = envEventById(snap.ev);
      if (evDef) {
        ctx.font = 'bold 11px Georgia';
        ctx.fillStyle = evDef.color;
        ctx.fillText(`⚠ ${evDef.name}`, W / 2, H - 12);
        ctx.font = '12px Georgia';
      }
    }
    if (snap.bs) drawBossBar(snap.bs.n, snap.bs.c, snap.bs.hp, snap.bs.mhp);
    drawKillFeed(now);
    const spacing = Math.min(300, (W - 220) / Math.max(snap.ps.length - 1, 1));
    snap.ps.forEach((gp, i) => {
      const x = snap.ps.length === 1 ? 150 : W / 2 + (i - (snap.ps.length - 1) / 2) * spacing;
      ctx.font = 'bold 20px Georgia';
      ctx.fillStyle = gp.c;
      ctx.fillText(gp.n + (gp.s === mySlot ? ' ◂you' : ''), x, 38);
      ctx.strokeStyle = gp.c;
      if (snap.wn <= 9) {
        const pipStart = x - (snap.wn - 1) * 9;
        for (let w = 0; w < snap.wn; w++) {
          ctx.beginPath();
          ctx.arc(pipStart + w * 18, 54, 5.5, 0, Math.PI * 2);
          if (w < gp.w) ctx.fill();
          else { ctx.lineWidth = 1.5; ctx.stroke(); }
        }
      } else {
        ctx.font = 'bold 15px Georgia';
        ctx.fillText(`${gp.w} / ${snap.wn}`, x, 58);
      }
      ctx.font = '13px Georgia';
      ctx.fillStyle = '#9c8ab8';
      ctx.fillText(gp.sp ? SPELLS[gp.sp].name : '· · ·', x, 74);
      if (gp.sp) drawCooldownBar(x, 80, SPELLS[gp.sp], gp.cdf ?? (gp.rd ? 1 : 0), gp.mc || 0);
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
      drawArcadeLogo(W / 2, 120, 46, now);
      ctx.font = 'bold 14px Georgia';
      ctx.fillStyle = '#9c8ab8';
      ctx.fillText('— O N L I N E —', W / 2, 142);
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
        drawAwards(snap.aw, now);
        if (Math.random() < 0.6) {
          particles.push({ kind: 'confetti', x: rand(0, W), y: -10, vx: rand(-1, 1), vy: rand(1, 3), life: 120, maxLife: 120, color: pick(['#4ecdc4', '#ff6b81', '#ffd166', '#a55eea', '#e8d5ff']), r: 4 });
        }
      }
    }
  };
})();
