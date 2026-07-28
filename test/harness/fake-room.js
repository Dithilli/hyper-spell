// fake-room.js — a Room with no sockets and no simulation.
//
// The room's whole job is the seam between those two: sockets in, bridge
// commands out. Faking both sides is what makes its rules — codes, seats,
// reservations, sanitation, rate limits — testable in milliseconds, instead of
// the minutes server/verify-e2e.js needs to spawn a real server and play a real
// match. That suite still exists and still matters; it proves the wire. This
// one proves the rules.
import { Room } from '../../server/room.js';

export function fakeBridge(overrides = {}) {
  const calls = [];
  const record = (name) => (...args) => { calls.push({ name, args }); return undefined; };
  const bridge = {
    calls,
    GAME_VERSION: 9,
    _state: 'LOBBY',
    _round: 0,
    _nextSlot: 0,
    state: () => bridge._state,
    round: () => bridge._round,
    // the same rule src/sim/lobby.js applies, so a test that asserts on a
    // cleaned name is asserting the real shape
    cleanName: (s) => String(s || '').replace(/[^\w \-'!.]/g, '').slice(0, 12),
    addPlayer: (...args) => {
      calls.push({ name: 'addPlayer', args });
      return bridge._nextSlot >= 8 ? null : bridge._nextSlot++;
    },
    removePlayer: record('removePlayer'),
    setInput: record('setInput'),
    renamePlayer: record('renamePlayer'),
    setOffline: record('setOffline'),
    start: record('start'),
    setWins: record('setWins'),
    toggleMode: record('toggleMode'),
    addBot: record('addBot'),
    removeBot: record('removeBot'),
    reset: record('reset'),
    chat: record('chat'),
    worldInfo: () => ({ t: 'world', world: {}, spells: {} }),
    packSource: () => null,
    ...overrides,
  };
  bridge.of = (name) => calls.filter((c) => c.name === name);
  bridge.last = (name) => bridge.of(name).at(-1);
  return bridge;
}

export function fakeSocket() {
  const ws = {
    readyState: 1,
    bufferedAmount: 0,
    sent: [],
    handlers: {},
    on(event, fn) { (ws.handlers[event] ||= []).push(fn); return ws; },
    send(text) { ws.sent.push(JSON.parse(text)); },
    close() { ws.readyState = 3; for (const fn of ws.handlers.close || []) fn(); },
    emit(msg) { for (const fn of ws.handlers.message || []) fn(JSON.stringify(msg)); },
    all: (t) => ws.sent.filter((m) => m.t === t),
    last: (t) => ws.sent.filter((m) => m.t === t).at(-1),
  };
  return ws;
}

export function makeRoom(overrides = {}) {
  const bridge = fakeBridge(overrides);
  const host = { bridge, opts: {}, setHandlers(h) { Object.assign(host.opts, h); } };
  const room = new Room(host);
  return {
    room,
    bridge,
    host,
    // a fresh connection that has already said hello at the current version
    connect({ hello = true, name = null, v = 9 } = {}) {
      const ws = fakeSocket();
      room.addConn(ws);
      if (hello) ws.emit({ t: 'hello', v, name });
      return ws;
    },
    // drive the snapshot path the way server/sim-host.js does
    snapshot(extra = {}) {
      host.opts.onSnapshot?.({ t: 'snap', v: 9, st: bridge._state, rn: bridge._round, ps: [], ...extra });
    },
  };
}
