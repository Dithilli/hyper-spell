// room.js — the single game room: sessions, the v9 protocol, and the seam
// between websockets and the headless sim (sim-host.js). The room owns identity
// (who is in which slot), sanitation, rate limits, reconnect reservations, and
// broadcast backpressure. It never reaches into the sim's globals — everything
// goes through the bridge's command surface.
'use strict';
const { performance } = require('perf_hooks');

const DROP_AT = 64 * 1024;       // per-socket buffered bytes before shedding droppable frames
const MSG_WINDOW_MS = 5000;      // inbound rate cap window…
const MSG_WINDOW_MAX = 600;      // …input at 60Hz is 300/5s; 600 leaves honest headroom
const RESERVE_MS = 120 * 1000;   // how long a dropped player's seat waits for them by name
const EMPTY_RESET_MS = 60 * 1000; // empty room mid-match → back to lobby after this grace

const nameKey = s => String(s || '').trim().toLowerCase();

class Session {
  constructor(ws, id) {
    this.ws = ws;
    this.id = id;
    this.hello = false;
    this.badVersion = false;
    this.name = null;
    this.slot = null; // joined ⇔ slot != null
    this.nextChatAt = 0;
    this.nextNameAt = 0;
    this.msgWindowAt = 0;
    this.msgCount = 0;
    this.dropped = 0; // droppable frames shed since last stats report
  }
}

class Room {
  // simHost: SimHost instance (bridge is re-read every use — it changes on crash rebuild)
  constructor(simHost) {
    this.host = simHost;
    this.sessions = new Set();
    this.nextId = 1;
    this.reserved = new Map();      // nameKey -> { slot, expiresAt }
    this.shellSinceRound = new Map(); // slot -> round it went offline (removed next round)
    this.emptyResetTimer = null;
    this.lastRound = 0;

    simHost.opts.onSnapshot = snap => this.onSnapshot(snap);
    simHost.opts.onFx = fx => this.broadcast(fx, true);
    simHost.opts.onCrash = () => this.reseatAll();

    // shed-stats visibility, same spirit as the old relay's report
    this.statsTimer = setInterval(() => {
      const lines = [];
      for (const s of this.sessions) {
        if (s.dropped || s.ws.bufferedAmount > 4096) {
          lines.push(`${s.name || `conn${s.id}`}: dropped ${s.dropped}, ${Math.round(s.ws.bufferedAmount / 1024)}KB queued`);
        }
        s.dropped = 0;
      }
      if (lines.length) console.log(`[net ${new Date().toISOString().slice(11, 19)}] ${lines.join(' | ')}`);
    }, 10000);
  }

  get bridge() { return this.host.bridge; }

  send(session, msg) {
    if (session.ws.readyState === 1) session.ws.send(JSON.stringify(msg));
  }

  // snap/fx go to EVERY socket — joined players, spectators, even old-version
  // clients (that's how a stale tab learns to refresh: snap.v mismatch screen)
  broadcast(msg, droppable) {
    const text = JSON.stringify(msg);
    for (const s of this.sessions) {
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
        if (snap.st === 'LOBBY' || snap.rn > sinceRound) {
          this.bridge.removePlayer(slot);
          this.shellSinceRound.delete(slot);
          for (const [key, r] of this.reserved) if (r.slot === slot) this.reserved.delete(key);
        }
      }
    }
    this.broadcast(snap, true);
  }

  addSession(ws) {
    const session = new Session(ws, this.nextId++);
    this.sessions.add(session);
    this.cancelEmptyReset();
    this.send(session, { t: 'welcome', v: this.bridge.GAME_VERSION, proto: 2, st: this.bridge.state() });
    ws.on('message', raw => {
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }
      this.handle(session, msg);
    });
    ws.on('close', () => this.dropSession(session));
    return session;
  }

  handle(session, msg) {
    // inbound flood cap — the server parses and acts on every message now, so a
    // hot-loop client is costlier than it was to the old relay
    const now = performance.now();
    if (now - session.msgWindowAt > MSG_WINDOW_MS) { session.msgWindowAt = now; session.msgCount = 0; }
    if (++session.msgCount > MSG_WINDOW_MAX) return;

    if (msg.t === 'hello') {
      session.hello = true;
      if (typeof msg.name === 'string') session.name = msg.name;
      if (msg.v !== this.bridge.GAME_VERSION) {
        session.badVersion = true;
        // don't close: keep streaming snaps so the old client renders its own
        // "GAME UPDATED — REFRESH" screen (snap.v mismatch), the existing UX
        this.send(session, { t: 'badVersion', server: this.bridge.GAME_VERSION });
      }
      return;
    }
    if (session.badVersion) return;

    if (msg.t === 'join') { this.join(session, msg); return; }
    if (session.slot == null) return; // everything below needs a seat

    switch (msg.t) {
      case 'input':
        this.bridge.setInput(session.slot, { m: msg.m, j: msg.j, c: msg.c, c2: msg.c2, b: msg.b, a: msg.a });
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
        if (now < session.nextNameAt || this.bridge.state() !== 'LOBBY') break;
        session.nextNameAt = now + 1000;
        const clean = String(msg.name || '').slice(0, 12);
        if (clean) { session.name = clean; this.bridge.renamePlayer(session.slot, clean); }
        break;
      }
      case 'chat': {
        if (now < session.nextChatAt) break;
        session.nextChatAt = now + 1500;
        const text = String(msg.text || '').replace(/[^\w !?.,'"-]/g, '').slice(0, 60);
        if (text) this.bridge.chat(session.slot, text);
        break;
      }
      case 'reset':
        this.bridge.reset(session.name || 'SOMEONE');
        break;
    }
  }

  join(session, msg) {
    if (!session.hello || session.slot != null) return;
    const name = typeof msg.name === 'string' ? msg.name : (typeof msg.n === 'string' ? msg.n : session.name);

    // reconnect: a join whose name matches a waiting seat gets that seat back,
    // round wins intact. Among ≤8 key-gated friends, name matching is enough.
    const key = nameKey(name);
    const r = key && this.reserved.get(key);
    if (r && performance.now() < r.expiresAt) {
      this.reserved.delete(key);
      this.shellSinceRound.delete(r.slot);
      this.bridge.setOffline(r.slot, false);
      session.slot = r.slot;
      session.name = name;
      this.send(session, { t: 'you', slot: r.slot });
      this.send(session, this.bridge.worldInfo());
      return;
    }

    const slot = this.bridge.addPlayer({ name, color: msg.color, hat: msg.hat });
    if (slot == null) { this.send(session, { t: 'joinDenied', reason: 'full' }); return; }
    session.slot = slot;
    session.name = name || null;
    this.send(session, { t: 'you', slot });
    this.send(session, this.bridge.worldInfo());
  }

  dropSession(session) {
    this.sessions.delete(session);
    if (session.slot != null) {
      if (this.bridge.state() === 'LOBBY') {
        this.bridge.removePlayer(session.slot);
      } else {
        // mid-match: leave an idle shell (stale-input guard parks it), reserve
        // the seat by name, clean up at the next round boundary if unclaimed
        this.bridge.setOffline(session.slot, true);
        this.shellSinceRound.set(session.slot, this.bridge.round());
        const key = nameKey(session.name);
        if (key) this.reserved.set(key, { slot: session.slot, expiresAt: performance.now() + RESERVE_MS });
      }
    }
    if (this.sessions.size === 0 && this.bridge.state() !== 'LOBBY') {
      this.emptyResetTimer = setTimeout(() => {
        if (this.sessions.size === 0) {
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

  // sim context was rebuilt after a crash: the world is a fresh lobby, but the
  // sockets are still alive. Give every joined session a fresh seat.
  reseatAll() {
    this.reserved.clear();
    this.shellSinceRound.clear();
    this.lastRound = 0;
    for (const s of this.sessions) {
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
