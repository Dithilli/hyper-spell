// room.js — the single game room: sessions, the v9 protocol, and the seam
// between websockets and the headless sim (sim-host.js). The room owns identity
// (who is in which slot), sanitation, rate limits, reconnect reservations, and
// broadcast backpressure. It never reaches into the sim's globals — everything
// goes through the bridge's command surface.
'use strict';
const { performance } = require('perf_hooks');

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

  // snap/fx go to EVERY socket — joined players, spectators, even old-version
  // clients (that's how a stale tab learns to refresh: snap.v mismatch screen)
  broadcast(msg, droppable) {
    const text = JSON.stringify(msg);
    for (const s of this.conns) {
      if (s.ws.readyState !== 1) continue;
      if (droppable && s.ws.bufferedAmount > DROP_AT) { s.dropped++; continue; }
      s.ws.send(text);
    }
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
    this.send(conn, { t: 'welcome', v: this.bridge.GAME_VERSION, proto: 2, st: this.bridge.state() });
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
    if (slot == null) { this.send(conn, { t: 'joinDenied', reason: 'full' }); return; }
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
    if (this.conns.size === 0 && this.bridge.state() !== 'LOBBY') {
      this.emptyResetTimer = setTimeout(() => {
        if (this.conns.size === 0) {
          console.log('room empty mid-match — resetting to lobby');
          this.reserved.clear();
          this.shellSinceRound.clear();
          this.bridge.reset();
        }
      }, EMPTY_RESET_MS);
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
