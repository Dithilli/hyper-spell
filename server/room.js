// room.js — the one game room: the session that gates it, the v9 protocol, and
// the seam between websockets and the headless sim (sim-host.js). The room owns
// identity (who is in which slot), sanitation, rate limits, reconnect
// reservations, and broadcast backpressure. It never reaches into the sim's
// globals — everything goes through the bridge's command surface.
//
// ONE room, deliberately. The simulation is process-global — src/net/server-
// bridge.js keeps its wire controllers and its fx wrappers in module state, and
// says so — so a second concurrent match in this process would need a worker
// thread per room. What a server hosts instead is one match at a time, and a
// session code decides who is in it.
'use strict';
const { performance } = require('perf_hooks');
const { mintCode, normalizeCode, formatCode } = require('./session-code');

const DROP_AT = 64 * 1024;       // per-socket buffered bytes before shedding droppable frames
const MSG_WINDOW_MS = 5000;      // inbound rate cap window…
// …and input is one message per RENDERED frame, not per sim tick. The old cap
// was sized for "60Hz is 300/5s", so a 144Hz display (720/5s) had a fifth of
// its input silently dropped — and, because the cap dropped whatever arrived
// next, its lobby keys with it. 300Hz with headroom.
const INPUT_WINDOW_MAX = 1600;
// Commands are lobby verbs, chat, joins and renames. Nothing legitimate sends
// them hot and each costs far more than an input write, so they get a budget
// of their own that a flood of input cannot spend.
const CMD_WINDOW_MAX = 120;
const RESERVE_MS = 120 * 1000;   // how long a dropped player's seat waits for them by name
const EMPTY_RESET_MS = 60 * 1000; // empty room mid-match → back to lobby after this grace

const nameKey = s => String(s || '').trim().toLowerCase();

// THE INPUT BOUNDARY. Everything below this line is forwarded into the
// simulation, where `m` becomes `move * 6` into setVelocity
// (src/sim/player/controller.js) and `a` becomes a firing angle. A garbage
// value here is a garbage body position two ticks later, and one garbage body
// position is the whole world for everyone in the room: NaN spreads through
// every collision it touches and the crash watchdog resets the match.
//
// JSON has no NaN, so that one cannot cross the wire — but `1e999` parses to
// Infinity, `"3"` arrives as a string that multiplies just fine, and an array
// coerces too. Cheating is a declared non-concern for this game; a client that
// can reset everyone's match is not.
const axis = v => (Number.isFinite(v) ? Math.max(-1, Math.min(1, v)) : 0);
const bit = v => (v ? 1 : 0);
const angle = v => (Number.isFinite(v) ? v : null);
function sanitizeInput(msg) {
  return { m: axis(msg.m), j: bit(msg.j), c: bit(msg.c), c2: bit(msg.c2), b: bit(msg.b), a: angle(msg.a) };
}
// content-pack relay: chunk size for streaming the decrypted module to clients
// whose origin can't decrypt it (http://<ip> has no crypto.subtle). 48KB stays
// well under the 128KB WS frame cap. Design from Andrew's v8 host relay.
const PACK_CHUNK = 48 * 1024;

class Conn {
  constructor(ws, id) {
    this.ws = ws;
    this.id = id;
    this.hello = false;
    this.badVersion = false;
    this.wantsPack = false; // np:1 on hello — origin can't decrypt the content pack
    this.packSent = false;
    this.name = null;
    this.slot = null; // joined ⇔ slot != null
    this.authed = false; // presented the session code — sees the match at all
    this.denied = { reason: null, until: 0 }; // last refusal, for the repeat guard
    this.nextChatAt = 0;
    this.nextNameAt = 0;
    this.windowAt = 0;
    this.inputCount = 0;
    this.cmdCount = 0;
    this.dropped = 0; // droppable frames shed since last stats report
  }
}

class Room {
  // simHost: SimHost instance (bridge is re-read every use — it changes on crash rebuild)
  constructor(simHost) {
    this.host = simHost;
    this.conns = new Set();
    this.session = null; // { code, createdAt } — null means nobody has hosted
    this.nextId = 1;
    this.reserved = new Map();      // nameKey -> { slot, expiresAt }
    this.shellSinceRound = new Map(); // slot -> round it went offline (removed next round)
    this.emptyResetTimer = null;
    this.lastRound = 0;

    simHost.setHandlers({
      onSnapshot: snap => this.onSnapshot(snap),
      onFx: fx => this.broadcast(fx, true),
      onCrash: () => this.reseatAll(),
      // the moment a special name unlocks the pack, feed every waiting client
      onPackUnlocked: () => {
        for (const c of this.conns) if (c.wantsPack) this.sendPack(c);
      },
    });

    // shed-stats visibility, same spirit as the old relay's report
    this.statsTimer = setInterval(() => {
      const lines = [];
      for (const s of this.conns) {
        if (s.dropped || s.ws.bufferedAmount > 4096) {
          lines.push(`${s.name || `conn${s.id}`}: dropped ${s.dropped}, ${Math.round(s.ws.bufferedAmount / 1024)}KB queued`);
        }
        s.dropped = 0;
      }
      if (lines.length) console.log(`[net ${new Date().toISOString().slice(11, 19)}] ${lines.join(' | ')}`);
    }, 10000);
    // the HTTP server is what keeps this process alive; a reporting interval
    // should not be able to hold it open on its own (and a test that builds a
    // room must not hang its runner for ten seconds waiting on one)
    this.statsTimer.unref?.();
  }

  get bridge() { return this.host.bridge; }

  send(conn, msg) {
    if (conn.ws.readyState === 1) conn.ws.send(JSON.stringify(msg));
  }

  // snap/fx go to every socket that presented the code — players and
  // spectators alike. Watching used to be free, which would make the code
  // decorative: you would not be able to play without one, but you could see
  // the whole match. The one exception is a client too old to speak this
  // protocol. It cannot join and cannot act, and a snapshot whose `v` does not
  // match is exactly what triggers its own "GAME UPDATED — REFRESH" screen.
  broadcast(msg, droppable) {
    const text = JSON.stringify(msg);
    for (const s of this.conns) {
      if (s.ws.readyState !== 1) continue;
      if (!s.authed && !s.badVersion) continue;
      if (droppable && s.ws.bufferedAmount > DROP_AT) { s.dropped++; continue; }
      s.ws.send(text);
    }
  }

  // ---- the session: one code-gated occupancy of this server's one match ----

  hostSession(conn) {
    if (!conn.hello) return;
    if (this.session) { this.send(conn, { t: 'sessionDenied', reason: 'exists' }); return; }
    this.session = { code: mintCode(), createdAt: performance.now() };
    conn.authed = true;
    console.log(`session ${formatCode(this.session.code)} started`);
    this.send(conn, { t: 'session', code: this.session.code, host: true });
    this.announceSession(true, conn);
  }

  // a menu sitting on the other screen — START A SESSION when one has just
  // begun, or the code box when the last one ended — flips itself instead of
  // lying until the player reloads
  announceSession(live, except) {
    for (const c of this.conns) {
      if (c === except || c.authed) continue;
      this.send(c, { t: 'sessionState', live });
    }
  }

  // the room has been empty for EMPTY_RESET_MS: the session is over, the match
  // goes back to a lobby, and the next person to press START A SESSION hosts.
  endEmptySession() {
    const had = !!this.session;
    this.session = null;
    this.reserved.clear();
    this.shellSinceRound.clear();
    for (const c of this.conns) c.authed = false;
    this.bridge.reset();
    if (had) console.log('session over — the room emptied');
    this.announceSession(false);
  }

  // The code, checked. Presenting it is what lets a connection see the match at
  // all; whether it also gets a seat is the caller's business. Told once per
  // connection: the host is already in the session it minted, and a second
  // `session` to that socket reads as "somebody let you in" — which is the
  // menu's cue to close, over the code screen it is in the middle of showing.
  authorize(conn, code, denyReason) {
    if (!this.session) { this.denyJoin(conn, 'nosession'); return false; }
    if (normalizeCode(code) !== this.session.code) { this.denyJoin(conn, denyReason); return false; }
    const wasIn = conn.authed;
    conn.authed = true;
    if (!wasIn) this.send(conn, { t: 'session', code: this.session.code });
    return true;
  }

  // watch without playing: the code, no seat. The browser client always joins,
  // so this is for the spectators the README promises and for headless tooling
  // that wants the snapshot stream without occupying one of the eight slots.
  watchSession(conn, msg) {
    if (!conn.hello) return;
    this.authorize(conn, msg.code, 'code');
  }

  denyJoin(conn, reason) {
    const now = performance.now();
    // the client retries a denied join whenever cast is held; answering every
    // one of those turns a full match into a flood in both directions
    if (conn.denied.reason === reason && now < conn.denied.until) return;
    conn.denied = { reason, until: now + 1000 };
    this.send(conn, { t: 'joinDenied', reason });
  }

  onSnapshot(snap) {
    // round boundary (or back in the lobby): unclaimed offline shells leave the
    // match here, so a live round never loses a body mid-physics and a quick
    // refresh keeps your wins
    if (snap.rn !== this.lastRound || (snap.st === 'LOBBY' && this.shellSinceRound.size)) {
      this.lastRound = snap.rn;
      for (const [slot, sinceRound] of this.shellSinceRound) {
        // RESERVE_MS is a promise the README makes to a player who dropped:
        // refresh within two minutes and your seat and your round wins are
        // still there. Releasing at the next round boundary broke it quietly,
        // because a round is often thirty seconds.
        if (this.reservedFor(slot)) continue;
        if (snap.st === 'LOBBY' || snap.rn > sinceRound) {
          this.bridge.removePlayer(slot);
          this.shellSinceRound.delete(slot);
          for (const [key, r] of this.reserved) if (r.slot === slot) this.reserved.delete(key);
        }
      }
    }
    this.broadcast(snap, true);
  }

  // is this slot still inside somebody's reserve window? Prunes as it walks —
  // an expired reservation is the only thing standing between a shell and the
  // sweep above, so it must not outlive its own deadline in the map either.
  reservedFor(slot) {
    const now = performance.now();
    let held = false;
    for (const [key, r] of this.reserved) {
      if (r.expiresAt <= now) { this.reserved.delete(key); continue; }
      if (r.slot === slot) held = true;
    }
    return held;
  }

  addConn(ws) {
    const conn = new Conn(ws, this.nextId++);
    this.conns.add(conn);
    this.cancelEmptyReset();
    this.send(conn, {
      t: 'welcome', v: this.bridge.GAME_VERSION, proto: 3,
      st: this.bridge.state(),
      session: !!this.session, // the menu picks its screen from this, no round trip
    });
    ws.on('message', raw => {
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }
      this.handle(conn, msg);
    });
    ws.on('close', () => this.dropConn(conn));
    return conn;
  }

  handle(conn, msg) {
    // inbound flood cap — the server parses and acts on every message now, so a
    // hot-loop client is costlier than it was to the old relay. Two budgets,
    // because a fast display legitimately sends far more input than any client
    // legitimately sends commands.
    const now = performance.now();
    if (now - conn.windowAt > MSG_WINDOW_MS) { conn.windowAt = now; conn.inputCount = 0; conn.cmdCount = 0; }
    const overBudget = msg.t === 'input'
      ? ++conn.inputCount > INPUT_WINDOW_MAX
      : ++conn.cmdCount > CMD_WINDOW_MAX;
    if (overBudget) return;

    if (msg.t === 'hello') {
      conn.hello = true;
      if (typeof msg.name === 'string') conn.name = this.bridge.cleanName(msg.name) || null;
      // np:1 = insecure origin, can't self-decrypt the content pack — relay it
      // if it's already unlocked (no-op otherwise; onPackUnlocked covers later)
      if (msg.np) { conn.wantsPack = true; this.sendPack(conn); }
      if (msg.v !== this.bridge.GAME_VERSION) {
        conn.badVersion = true;
        // don't close: keep streaming snaps so the old client renders its own
        // "GAME UPDATED — REFRESH" screen (snap.v mismatch), the existing UX
        this.send(conn, { t: 'badVersion', server: this.bridge.GAME_VERSION });
      }
      return;
    }
    if (conn.badVersion) return;

    if (msg.t === 'host') { this.hostSession(conn); return; }
    if (msg.t === 'watch') { this.watchSession(conn, msg); return; }
    if (msg.t === 'join') { this.join(conn, msg); return; }
    if (conn.slot == null) return; // everything below needs a seat

    switch (msg.t) {
      case 'input':
        this.bridge.setInput(conn.slot, sanitizeInput(msg));
        break;
      case 'start':
        this.bridge.start();
        break;
      case 'wins':
        this.bridge.setWins({ n: msg.n, d: msg.d });
        break;
      case 'mode':
        this.bridge.toggleMode();
        break;
      case 'bot':
        if (msg.op === 'remove') this.bridge.removeBot();
        else this.bridge.addBot();
        break;
      case 'name': {
        if (now < conn.nextNameAt || this.bridge.state() !== 'LOBBY') break;
        conn.nextNameAt = now + 1000;
        const clean = this.bridge.cleanName(msg.name);
        if (clean) { conn.name = clean; this.bridge.renamePlayer(conn.slot, clean); }
        break;
      }
      case 'chat': {
        if (now < conn.nextChatAt) break;
        conn.nextChatAt = now + 1500;
        const text = String(msg.text || '').replace(/[^\w !?.,'"-]/g, '').slice(0, 60);
        if (text) this.bridge.chat(conn.slot, text);
        break;
      }
      case 'reset':
        this.bridge.reset(conn.name || 'SOMEONE');
        break;
    }
  }

  join(conn, msg) {
    if (!conn.hello || conn.slot != null) return;
    // the code grants access; a seat is the separate question below. A correct
    // code into a full match still leaves you watching, which is what any
    // connection at all used to get for free.
    if (!this.authorize(conn, msg.code, 'code')) return;
    // One cleaned string for the seat, the reservation key and the reset
    // banner. The sim cleans the PLAYER's name inside addPlayer; this one is
    // the room's own copy, and it used to be whatever bytes arrived — which
    // then went out to every screen as `NAME RESET THE MATCH`.
    const raw = typeof msg.name === 'string' ? msg.name : (typeof msg.n === 'string' ? msg.n : conn.name);
    const name = this.bridge.cleanName(raw) || null;

    // reconnect: a join whose name matches a waiting seat gets that seat back,
    // round wins intact. Among ≤8 key-gated friends, name matching is enough.
    const key = nameKey(name);
    const r = key && this.reserved.get(key);
    if (r && performance.now() < r.expiresAt) {
      this.reserved.delete(key);
      this.shellSinceRound.delete(r.slot);
      this.bridge.setOffline(r.slot, false);
      conn.slot = r.slot;
      conn.name = name;
      this.send(conn, { t: 'you', slot: r.slot });
      this.send(conn, this.bridge.worldInfo());
      return;
    }

    const slot = this.bridge.addPlayer({ name, color: msg.color, hat: msg.hat });
    if (slot == null) { this.denyJoin(conn, 'full'); return; }
    conn.slot = slot;
    conn.name = name || null;
    this.send(conn, { t: 'you', slot });
    this.send(conn, this.bridge.worldInfo());
  }

  dropConn(conn) {
    this.conns.delete(conn);
    if (conn.slot != null) {
      if (this.bridge.state() === 'LOBBY') {
        this.bridge.removePlayer(conn.slot);
      } else {
        // mid-match: leave an idle shell (stale-input guard parks it), reserve
        // the seat by name, clean up at the next round boundary if unclaimed
        this.bridge.setOffline(conn.slot, true);
        this.shellSinceRound.set(conn.slot, this.bridge.round());
        const key = nameKey(conn.name);
        if (key) this.reserved.set(key, { slot: conn.slot, expiresAt: performance.now() + RESERVE_MS });
      }
    }
    // an empty room ends the session, not just the match: the code that was
    // shared for it stops working, and the next person to arrive can host
    if (this.conns.size === 0 && (this.session || this.bridge.state() !== 'LOBBY')) {
      this.emptyResetTimer = setTimeout(() => {
        if (this.conns.size === 0) this.endEmptySession();
      }, EMPTY_RESET_MS);
      this.emptyResetTimer.unref?.(); // a test that drops its last socket must not wait a minute
    }
  }

  cancelEmptyReset() {
    if (this.emptyResetTimer) { clearTimeout(this.emptyResetTimer); this.emptyResetTimer = null; }
  }

  // stream the decrypted content-pack module to one client as <128KB chunks.
  // Chunks are direct sends (never droppable) so reassembly can't starve.
  sendPack(conn) {
    if (conn.packSent) return;
    const src = this.bridge.packSource();
    if (!src) return;
    conn.packSent = true;
    const n = Math.ceil(src.length / PACK_CHUNK);
    for (let i = 0; i < n; i++) {
      this.send(conn, { t: 'pack', i, n, s: src.slice(i * PACK_CHUNK, (i + 1) * PACK_CHUNK) });
    }
  }

  // sim context was rebuilt after a crash: the world is a fresh lobby, but the
  // sockets are still alive. Give every seated connection a fresh seat.
  reseatAll() {
    this.reserved.clear();
    this.shellSinceRound.clear();
    this.lastRound = 0;
    for (const s of this.conns) {
      if (s.slot == null) continue;
      s.slot = this.bridge.addPlayer({ name: s.name });
      if (s.slot != null) {
        this.send(s, { t: 'you', slot: s.slot });
        this.send(s, this.bridge.worldInfo());
      }
    }
  }

  destroy() {
    clearInterval(this.statsTimer);
    this.cancelEmptyReset();
  }
}

module.exports = { Room };
