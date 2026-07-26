// net.js — online client: the SERVER runs the match (headless sim in
// server/sim-host.js); this file connects, sends inputs, and renders snapshots.
// Loaded last; when opened via file:// this file does nothing (pure couch mode).

/* eslint-disable no-global-assign */
(() => {
  if (typeof location === 'undefined' || !location.protocol.startsWith('http')) return;
  if (typeof document.createElement !== 'function') return;

  let ws = null;
  let mySlot = null;
  let joined = false;
  let joinDeniedMsg = null;
  let serverWorld = null; // {t:'world', world, spells} — constants, stashed for curious tooling
  // Optional content pack (secret avatars): only a secure context (localhost or
  // https) exposes crypto.subtle, so players on http://<ip> can never decrypt
  // it themselves. The server — which always can — relays the plaintext module,
  // chunked to stay under the 128KB WS frame cap. See extra-content.js.
  let packChunks = null;            // chunk reassembly buffer
  let packInstalled = false;        // run-once guard

  // THE CLIENT INPUT CONTRACT — { t:'input', m, j, c, c2, b, a }, sent ~60/sec:
  //   m: move, WORLD-space: 1 = +x (screen right), -1 = left, 0 = idle. Not facing-relative.
  //   a: aim, ABSOLUTE world radians: 0 = +x, positive = clockwise on screen (screen y grows
  //      down, so a = Math.atan2(dy, dx) with dy downward-positive). null = no aim (falls back
  //      to facing + lob). The server uses the LAST-KNOWN aim at the moment a cast fires, so `a`
  //      does not need to arrive on the same frame as c:1 — but sending both together is safest.
  //   c: cast, HOLD semantics: keep c:1 and the wizard casts every time the cooldown is ready
  //      (auto-repeats). The castPressed edge is only used for lobby join / rematch.
  //   j: jump, hybrid: holding j:1 jumps whenever grounded (auto-hop); the AIR jump (double
  //      jump) needs a fresh 0→1 edge. Send j:1 then j:0 to meter your jumps.
  //   b: block/parry, EDGE semantics: a fresh 0→1 triggers one ~240ms parry (then ~1.4s
  //      cooldown). Holding b:1 does nothing extra — time it.
  //   c2: cast slot B, same HOLD semantics as c.
  // Inputs older than 2000ms zero out server-side (stale guard) — keep sending even when idle.
  // Snapshots broadcast at ~30Hz. In snapshot ps[]: you are the entry with s === your slot
  // (slots are stable for the whole session; they never reshuffle). Tomes are picked up by
  // touching them (bodies[].l === 'tome', body is 20×24px; players are r=15 circles).
  // A new round = the snapshot's `rn` counter increments (state also flips to 'PLAY').

  // ---- net stats (F8): live truth about what the wire is carrying ----
  const netStats = { on: false, lastBytes: 0, bytes: 0, snaps: 0, at: 0, rate: 0, kbs: 0, delay: 0 };
  addEventListener('keydown', e => { if (e.code === 'F8') netStats.on = !netStats.on; });
  function statTick(bytes, now) {
    netStats.lastBytes = bytes;
    netStats.bytes += bytes;
    netStats.snaps++;
    if (now - netStats.at > 1000) {
      netStats.rate = netStats.snaps; netStats.kbs = Math.round(netStats.bytes / 1024);
      netStats.snaps = 0; netStats.bytes = 0; netStats.at = now;
    }
  }
  globalThis.drawNetStats = function drawNetStats(now) {
    if (!netStats.on) return;
    const line = `NET · snap ${netStats.lastBytes}B · ${netStats.rate}/s · ${netStats.kbs}KB/s in · gap ${Math.round(snapGapMs)}ms · delay ${Math.round(netStats.delay)}ms`;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = '12px Menlo, monospace';
    ctx.textAlign = 'left';
    const w = ctx.measureText(line).width + 16;
    ctx.fillStyle = 'rgba(10,6,16,0.75)';
    ctx.fillRect(8, H - 34, w, 22);
    ctx.fillStyle = '#9ef0f0';
    ctx.fillText(line, 16, H - 19);
    ctx.restore();
  };

  function emit(msg) {
    if (!ws || ws.readyState !== 1) return;
    ws.send(JSON.stringify(msg));
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
    <button data-mode="online" style="${btnCss('#ffd166')}">PLAY ONLINE — join the match on this server</button>
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
    globalThis.nameSetViaMenu = true; // the menu was player 1's name UI — lobby must not re-open an edit
    ensureAudio();
    if (mode === 'couch') { menu.remove(); return; }
    connect();
  });

  function myName() { return cleanName(localStorage.getItem('hs-name-0') || ''); }

  function connect() {
    statusEl().textContent = 'connecting…';
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${proto}://${location.host}/ws`);
    // np:1 asks the server to relay the optional content pack — set only on
    // insecure origins (no crypto.subtle), where we can never decrypt it
    // ourselves. Secure clients (https/localhost) self-decrypt via the loader.
    ws.onopen = () => emit({ t: 'hello', v: GAME_VERSION, name: myName(), np: canDecryptLocally() ? 0 : 1 });
    ws.onerror = () => { const el = statusEl(); if (el) el.textContent = 'connection failed — is the server running?'; };
    ws.onclose = () => { if (netMode === 'online') setBanner('CONNECTION LOST — refresh', '#ff6b81', 60000); };
    ws.onmessage = ev => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.t === 'snap') statTick(ev.data.length, performance.now());
      handleMessage(msg);
    };
  }

  function handleMessage(msg) {
    switch (msg.t) {
      case 'welcome':
        if (msg.v !== GAME_VERSION) {
          statusEl().textContent = 'GAME UPDATED — hard-refresh this page (⌘⇧R) and try again';
          ws.close();
          return;
        }
        netMode = 'online';
        menu.remove();
        emit({ t: 'join', name: myName() }); // the menu already asked for the name — just go
        break;
      case 'badVersion':
        // server told us we're stale before we ever saw a snapshot
        setBanner('GAME UPDATED — REFRESH THE PAGE', '#ff6b81', 60000);
        break;
      case 'you':
        mySlot = msg.slot;
        joined = true;
        joinDeniedMsg = null;
        break;
      case 'world':
        serverWorld = msg;
        break;
      case 'joinDenied':
        joinDeniedMsg = msg.reason === 'full' ? 'match is full (8 wizards) — spectating' : 'join refused — spectating';
        break;
      case 'snap':
        pushSnapshot(msg);
        break;
      case 'fx':
        applyFx(msg);
        break;
      case 'pack':
        receivePackChunk(msg);
        break;
    }
  }

  // can this origin decrypt the pack itself? (crypto.subtle needs a secure
  // context — https or localhost; http://<ip> LAN pages don't have it)
  const canDecryptLocally = () => !!(globalThis.crypto && globalThis.crypto.subtle);

  // collect server-relayed pack chunks (any order), then install once complete
  function receivePackChunk(msg) {
    if (packInstalled) return;
    if (typeof msg.s !== 'string' || !(msg.n > 0) || !(msg.i >= 0 && msg.i < msg.n)) return;
    if (!packChunks || packChunks.length !== msg.n) packChunks = new Array(msg.n).fill(null);
    packChunks[msg.i] = msg.s;
    if (packChunks.every(c => c !== null)) {
      const src = packChunks.join('');
      packChunks = null;
      installPack(src);
    }
  }

  // run the server's decrypted optional-content module. Same trust model as
  // applyFx (we already render server-named state); guarded so the avatar
  // patch installs exactly once.
  function installPack(src) {
    if (packInstalled || typeof src !== 'string') return;
    packInstalled = true;
    try { new Function(src)(); }
    catch (e) { packInstalled = false; console.warn('Optional content could not be installed.', e); }
  }

  // ================= CLIENT =================
  let snapPrev = null, snapCur = null, tPrev = 0, tCur = 0;
  let snapGapMs = 40; // smoothed inter-snapshot gap → drives the interp delay
  let clientMap = null; // {def, composite, data}

  function pushSnapshot(snap) {
    const tNow = performance.now();
    if (tCur) snapGapMs += (Math.min(tNow - tCur, 200) - snapGapMs) * 0.12;
    snapPrev = snapCur; tPrev = tCur;
    snapCur = snap; tCur = tNow;
    if (!clientMap || clientMap.index !== snap.mi || (snap.msd != null && clientMap.data.seed !== snap.msd)) clientLoadMap(snap.mi, snap.msd);
    applyBrokenDestructibles(snap.bd);
  }

  // mirror the server's blown-apart cover by removing the matching local blocks
  function applyBrokenDestructibles(bd) {
    if (!bd || !clientMap) return;
    const applied = clientMap.data._bdApplied || 0;
    if (bd.length <= applied) return;
    const dests = Composite.allBodies(clientMap.composite).filter(b => b.label === 'destructible');
    for (let i = applied; i < bd.length; i++) {
      const [bx, by] = bd[i];
      let best = null, bdst = 3600; // within 60px
      for (const d of dests) { const dd = (d.position.x - bx) ** 2 + (d.position.y - by) ** 2; if (dd < bdst) { bdst = dd; best = d; } }
      if (best) { spawnParticles(best.position.x, best.position.y, best.dcolor || '#6b4a2a', 14, 6, 40); Composite.remove(clientMap.composite, best); }
    }
    clientMap.data._bdApplied = bd.length;
  }

  function clientLoadMap(index, seed) {
    const def = MAPS[index];
    const m = { def, composite: Composite.create(), data: {} };
    def.build(m);
    // regenerate the server's seeded extras so static cover/steppers match exactly
    // (statics never ride the snapshot; dynamics below get stripped and arrive as ghosts)
    if (seed != null) { m.data.seed = seed; buildMapExtras(m, seed); }
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

  // fx events call local cosmetic functions by name — allowlisted, so a bug (or
  // a hostile server) can't reach into arbitrary globals
  const FX_ALLOWED = new Set(['spawnParticles', 'spawnRing', 'spawnText', 'doFlash', 'addShake', 'slowMo', 'boltVisual', 'setBanner', 'addKillFeed', 'spawnBurst']);
  function applyFx(msg) {
    if (msg.f === 'sfx') { sfx[msg.a[0]]?.(); return; }
    if (!FX_ALLOWED.has(msg.f)) return;
    const fn = globalThis[msg.f];
    if (typeof fn === 'function') fn(...msg.a);
  }

  // once per rendered frame (~60Hz) — halving it was cheap on paper, but on a
  // struggling client it compounded: 40fps ⇒ 20Hz inputs ⇒ mushy casts/jumps
  function sendInput(now) {
    const jump = !!keys['KeyW'] || !!keys['Space'] || !!keys['ArrowUp'];
    const cast = !!keys['KeyE'] || !!keys['Enter'] || mouse.down;        // slot A
    const cast2 = !!keys['KeyQ'] || !!keys['ShiftRight'] || mouse.rdown;  // slot B
    const block = !!keys['KeyS'] || !!keys['ArrowDown'] || mouse.mdown;   // parry
    const move = (keys['KeyD'] || keys['ArrowRight'] ? 1 : 0) - (keys['KeyA'] || keys['ArrowLeft'] ? 1 : 0);
    let aim = null;
    if (mouse.present && snapCur && mySlot != null) {
      const me = snapCur.ps.find(q => q.s === mySlot);
      if (me) aim = Math.atan2(mouse.y - me.y, mouse.x - me.x);
    }
    if (!joined && (cast || mouse.down)) emit({ t: 'join', name: myName() }); // retry after a denial
    if (joined) emit({ t: 'input', m: move, j: jump ? 1 : 0, c: cast ? 1 : 0, c2: cast2 ? 1 : 0, b: block ? 1 : 0, a: aim });
    // lobby verbs become messages; the server's sim answers with banners/fx
    const edge = (code, fn) => {
      if (keys[code] && !this[`_${code}`]) fn();
      this[`_${code}`] = !!keys[code];
    };
    edge('Space', () => emit({ t: 'start' }));
    edge('KeyB', () => emit({ t: 'bot', op: 'add' }));
    edge('KeyM', () => emit({ t: 'mode' }));
    edge('KeyR', () => emit({ t: 'reset' }));
    for (let d = 1; d <= 9; d++) edge(`Digit${d}`, () => emit({ t: 'wins', n: d }));
    edge('Equal', () => emit({ t: 'wins', d: 1 }));
    edge('Minus', () => emit({ t: 'wins', d: -1 }));
  }

  function drawOnlineLobby(snap, now) {
    const mode = snap.md || 'versus';
    const wave = mode === 'wave';
    const count = Math.max(4, Math.min(MAX_PLAYERS, snap.ps.length + 1));
    const slots = [];
    for (let i = 0; i < count; i++) {
      const gp = snap.ps[i];
      slots.push({
        label: gp ? gp.n + (gp.s === mySlot ? ' ✦' : '') : 'JOIN',
        color: gp ? gp.c : '#4a3f5e',
        hint: !gp ? 'OPEN SEAT'
          : gp.b ? 'BOT'
          : gp.off ? '(connection lost)'
          : gp.s === mySlot ? 'YOU — WASD + MOUSE'
          : 'ONLINE',
      });
    }
    const min = wave ? 1 : 2;
    const ready = snap.ps.length >= min;
    drawLobbyPanel({
      joinLine: joinDeniedMsg || (joined
        ? `you are in as P${(mySlot ?? 0) + 1} — WASD move · SPACE/W jump · aim & fire with the mouse`
        : 'CLICK or press E to join'),
      slots,
      readyColor: ready ? (wave ? '#ffd166' : '#7bd88f') : '#675a7d',
      readyLine: !ready ? (wave ? 'NEED AT LEAST 1 WIZARD' : 'NEED AT LEAST 2 WIZARDS')
        : wave ? `SPACE — WAVE SURVIVAL${snap.bw ? `  (BEST: WAVE ${snap.bw})` : ''}`
        : `SPACE TO FIGHT — FIRST TO ${snap.wn} WINS`,
      controlsLine: wave
        ? 'M switches back to VERSUS · co-op: everyone fights the waves together · B adds a bot'
        : `M = WAVE SURVIVAL · 1–9 sets win target (${snap.wn}) · B adds a bot · R resets`,
    });
  }

  globalThis.netClientFrame = function netClientFrame(now) {
    sendInput.call(sendInput, now);
    updateParticles(1);

    if (!snapCur || !clientMap) {
      updateCamera(now, null);
      clearFrame('#16121c');
      ctx.fillStyle = '#9c8ab8';
      ctx.font = '22px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('connecting to the match…', W / 2, H / 2);
      return;
    }

    const snap = snapCur;
    if (snap.v !== GAME_VERSION) {
      updateCamera(now, null);
      clearFrame('#16121c');
      ctx.fillStyle = '#ff6b81';
      ctx.font = 'bold 34px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('GAME UPDATED — REFRESH THE PAGE', W / 2, H / 2);
      return;
    }
    // interpolate just behind the snapshot stream — the delay tracks the real
    // arrival gap (~42ms at 30Hz) instead of a fixed 60ms, and stretches
    // gracefully if the connection degrades
    const delay = Math.min(90, Math.max(36, snapGapMs * 1.25));
    netStats.delay = delay;
    const span = Math.max(tCur - tPrev, 1);
    const alpha = Math.max(0, Math.min(1, (now - delay - tPrev) / span));

    updateCamera(now, snapshotCameraPoints(snap, snapPrev, alpha));
    clearFrame();
    beginWorld();
    const ghosts = drawSnapshotWorld(snap, snapPrev, alpha, now, true);

    // reticle (world space — mouse.x/y are world coords, see input.js)
    if (mouse.present) {
      const mine = ghosts.find(g => g.slot === mySlot);
      ctx.strokeStyle = mine ? mine.color : '#9c8ab8';
      ctx.lineWidth = 1.5 / CAM.zoom;
      ctx.globalAlpha = 0.85;
      ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 9 / CAM.zoom, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    endWorld();

    applyBloom(now);

    ctx.fillStyle = getVignette();
    ctx.fillRect(0, 0, W, H);
    if (flashAlpha > 0.01) {
      ctx.globalAlpha = flashAlpha;
      ctx.fillStyle = flashColor;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    flashAlpha *= 0.86;

    if (snap.rp) drawReplayLetterbox(now); // the server is playing the killcam

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
      ctx.fillText(gp.n + (gp.s === mySlot ? ' ◂you' : '') + (gp.off ? ' ⌁' : ''), x, 38);
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
      drawPlayerSpells(x, [gp.s0 ?? null, gp.s1 ?? null], [gp.c0 || 0, gp.c1 || 0], gp.mc || 0, [gp.h0 ?? null, gp.h1 ?? null]);
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

    if (snap.st === 'LOBBY') drawOnlineLobby(snap, now);

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
        drawSpellReport(snap.sr, now);
        if (Math.random() < 0.6) {
          particles.push({ kind: 'confetti', x: rand(0, W), y: -10, vx: rand(-1, 1), vy: rand(1, 3), life: 120, maxLife: 120, color: pick(['#4ecdc4', '#ff6b81', '#ffd166', '#a55eea', '#e8d5ff']), r: 4 });
        }
      }
    }
    drawNetStats(now); // F8 overlay
  };
})();
