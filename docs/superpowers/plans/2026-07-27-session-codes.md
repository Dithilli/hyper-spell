# HYPERSPELL Session Codes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A host starts an online session, gets a short shareable code, and nobody reaches the match without it — plus the seven defects the multiplayer scan found.

**Architecture:** One match per server (the sim is process-global, so concurrent rooms would need a worker per room). `server/room.js` grows a session — `{ code }` — mints it on `{t:'host'}`, gates `{t:'join'}` and every snapshot on it, and drops it when the room has been empty for 60s. The client's mode menu grows a second screen (START SESSION / enter a code), and `?code=` links make the shared invite one click.

**Tech Stack:** Node 22 CommonJS on the server (`server/*.js`, no build), ES modules in `src/` bundled by esbuild into `dist/hyperspell.js`, `ws` for WebSockets, `node --test` for tests.

## Global Constraints

- Server files are CommonJS (`server/package.json` has no `"type"`); everything under `src/` is ESM (root `package.json` has `"type": "module"`). ESM tests may `import { Room } from '../server/room.js'` — verified working.
- `proto` goes 2 → 3. `GAME_VERSION` (currently 9, in `src/version.js`) is NOT touched: the sim did not change.
- Code alphabet is exactly `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, length 6, displayed `ABC-DEF`.
- Lobby controls stay shared — no host-only authority anywhere.
- `GAME_KEY` is untouched and unaware of session codes.
- No new dependencies. `ws` and `matter-js` are the only ones.
- Every task ends green: `npm test` from the repo root.
- Rebuild the bundle after any `src/` change: `npm run build`. `dist/hyperspell.js` is committed.

---

### Task 1: Restore `myName()` and guard against the next deletion

`src/net/client.js` calls `myName()` at lines 118, 139 and 284. Nothing defines it — the ESM refactor dropped it, so `hello` is never sent and no browser can join. `cleanName` and `ensureAudio` are imported into that file and otherwise unused; they are what it consumed.

**Files:**
- Modify: `src/net/client.js` (add the helper near the top of the CLIENT section, after `emit`)
- Create: `test/no-undefined-identifiers.test.js`

**Interfaces:**
- Produces: `myName(): string` — module-private in `client.js`, returns the cleaned `hs-name-0` value or `'WIZARD'`.

- [ ] **Step 1: Write the failing guard test**

Create `test/no-undefined-identifiers.test.js`. It reads every file under `src/`, collects every name the file declares or imports (flat scope — one bag per file, which trades false negatives for zero false positives), collects every bare call site, and asserts the difference is empty.

```js
// A call to a name the file never declares, imports, or inherits from the
// platform is a ReferenceError waiting for a player. myName() was exactly
// that for the whole life of the ESM refactor, and nothing caught it: the
// server e2e builds its own WebSocket frames and never loads the client.
//
// Scope is deliberately flat — every declaration anywhere in the file counts
// as visible everywhere in it. That admits a false negative (a name declared
// inside one function and called from another) and admits no false positives,
// which is the only trade that makes a guard test worth keeping.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const GLOBALS = new Set([
  // language
  'Array', 'Boolean', 'Error', 'Function', 'JSON', 'Map', 'Math', 'Number',
  'Object', 'Promise', 'Set', 'String', 'Symbol', 'Date', 'RegExp', 'WeakMap',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'structuredClone', 'BigInt',
  'Uint8Array', 'Float32Array', 'Int32Array', 'ArrayBuffer', 'TextEncoder',
  'TextDecoder', 'Proxy', 'Reflect',
  // platform
  'console', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'requestAnimationFrame', 'cancelAnimationFrame', 'addEventListener',
  'removeEventListener', 'fetch', 'atob', 'btoa', 'alert', 'URL',
  'URLSearchParams', 'WebSocket', 'Image', 'Audio', 'AudioContext',
  'webkitAudioContext', 'Path2D', 'DOMMatrix', 'CustomEvent', 'Event',
  'queueMicrotask', 'encodeURIComponent', 'decodeURIComponent', 'require',
  // super() and the like read as calls to the regex below
  'super', 'import', 'return', 'typeof', 'void', 'new', 'delete', 'await',
  'if', 'for', 'while', 'switch', 'catch', 'function', 'yield',
]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.js')) out.push(p);
  }
  return out;
}

// every name this file brings into scope: imports, declarations, parameters,
// destructuring targets, catch bindings, labels of class methods
function declaredNames(src) {
  const names = new Set();
  const add = (s) => { for (const n of String(s).split(/[^\w$]+/)) if (n) names.add(n); };
  for (const m of src.matchAll(/import\s+([\s\S]*?)\s+from\s*['"]/g)) add(m[1]);
  for (const m of src.matchAll(/\b(?:function|class)\s*\*?\s*([\w$]+)/g)) names.add(m[1]);
  for (const m of src.matchAll(/\b(?:const|let|var)\s+([\s\S]*?)=/g)) add(m[1]);
  for (const m of src.matchAll(/\bcatch\s*\(([^)]*)\)/g)) add(m[1]);
  // parameter lists: `(a, b) =>`, `function f(a, b)`, and method shorthand
  for (const m of src.matchAll(/\(([^()]*)\)\s*(?:=>|\{)/g)) add(m[1]);
  for (const m of src.matchAll(/([\w$]+)\s*=>/g)) names.add(m[1]);
  return names;
}

function calledNames(src) {
  const names = new Set();
  // a bare call: not preceded by `.` (method), not a keyword form
  for (const m of src.matchAll(/(^|[^.\w$])([a-zA-Z_$][\w$]*)\s*\(/g)) names.add(m[2]);
  return names;
}

test('every function src/ calls is declared, imported, or a platform global', () => {
  const offenders = [];
  for (const file of walk('src')) {
    const src = readFileSync(file, 'utf8');
    const declared = declaredNames(src);
    for (const name of calledNames(src)) {
      if (declared.has(name) || GLOBALS.has(name)) continue;
      offenders.push(`${file} → ${name}()`);
    }
  }
  assert.deepEqual(offenders, [], `undefined at runtime:\n${offenders.join('\n')}`);
});
```

- [ ] **Step 2: Run it and confirm it catches the live bug**

Run: `node --test test/no-undefined-identifiers.test.js`
Expected: FAIL, listing `src/net/client.js → myName()`.

If it also lists names that genuinely exist (false positives from the flat-scope heuristic), add each to `GLOBALS` **only** if it is a real platform global; otherwise widen `declaredNames`. If the allowlist would have to grow past ~40 entries to go green, narrow `walk('src')` to `src/net` and `src/platform` and say why in the file's header comment — those are the two layers with no other coverage.

- [ ] **Step 3: Restore the helper**

In `src/net/client.js`, directly above `export function connect(h)`:

```js
// the name the opening menu stored for player 1 (src/platform/menu.js writes
// this key). Sent with `hello` and with every join, and it is also the seat
// reservation key the room matches a reconnect against — so it has to be the
// same string every time this tab asks.
function myName() {
  return cleanName(localStorage.getItem('hs-name-0') || '') || 'WIZARD';
}
```

- [ ] **Step 4: Run the guard test and the suite**

Run: `node --test test/no-undefined-identifiers.test.js && npm test`
Expected: PASS, 140+ tests.

- [ ] **Step 5: Rebuild the bundle and commit**

```bash
npm run build
grep -c "function myName" dist/hyperspell.js   # expect 1
git add src/net/client.js test/no-undefined-identifiers.test.js dist/hyperspell.js
git commit -m "fix: myName was deleted in the ESM refactor, so nobody could join"
```

---

### Task 2: The session code

**Files:**
- Create: `server/session-code.js`
- Create: `test/session-code.test.js`

**Interfaces:**
- Produces: `mintCode(): string` (6 chars from the alphabet), `normalizeCode(s): string` (uppercase, strip everything else, cap 16), `formatCode(code): string` (`'ABCDEF'` → `'ABC-DEF'`). CommonJS `module.exports`.

- [ ] **Step 1: Write the failing test**

```js
// test/session-code.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mintCode, normalizeCode, formatCode } from '../server/session-code.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

test('a minted code is six characters from the unambiguous alphabet', () => {
  for (let i = 0; i < 200; i++) {
    const code = mintCode();
    assert.equal(code.length, 6);
    for (const ch of code) assert.ok(ALPHABET.includes(ch), `${ch} is not in the alphabet`);
  }
});

test('the alphabet excludes the four glyphs people misread', () => {
  const minted = Array.from({ length: 400 }, mintCode).join('');
  for (const ch of 'IO01') assert.ok(!minted.includes(ch), `${ch} must never be minted`);
});

test('two codes in a row differ', () => {
  const codes = new Set(Array.from({ length: 50 }, mintCode));
  assert.ok(codes.size > 45, `minting is not random enough: ${codes.size}/50 unique`);
});

test('normalize accepts however a player typed it', () => {
  for (const typed of ['ABC-DEF', 'abc-def', ' abc def ', 'AbC.dEf', 'ABCDEF']) {
    assert.equal(normalizeCode(typed), 'ABCDEF', `failed on ${JSON.stringify(typed)}`);
  }
});

test('normalize survives hostile input', () => {
  assert.equal(normalizeCode(null), '');
  assert.equal(normalizeCode(undefined), '');
  assert.equal(normalizeCode({}), 'OBJECTOBJECT');       // stringified, then capped
  assert.equal(normalizeCode('x'.repeat(5000)).length, 16);
});

test('format groups a code for reading aloud', () => {
  assert.equal(formatCode('ABCDEF'), 'ABC-DEF');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test test/session-code.test.js`
Expected: FAIL — `Cannot find module '../server/session-code.js'`.

- [ ] **Step 3: Write the module**

```js
// session-code.js — the shareable code that gates one match.
//
// Six characters from a 32-symbol alphabet with no I, O, 0 or 1, because these
// get read aloud across a desk more often than they get pasted: ~1.07e9
// combinations, which is beside the point (the room is GAME_KEY-gated when it
// is exposed at all) and readability, which is the whole point.
'use strict';
const crypto = require('crypto');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LEN = 6;
const MAX_TYPED = 16; // bound the work a hostile client can ask for on compare

function mintCode() {
  let out = '';
  for (let i = 0; i < CODE_LEN; i++) out += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return out;
}

// what a player typed → what we compare. Case, spaces and the dash we print
// are all noise; the four excluded glyphs are simply not valid, so a misread
// I or O fails the compare rather than silently opening someone else's match.
function normalizeCode(s) {
  return String(s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, MAX_TYPED);
}

function formatCode(code) {
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

module.exports = { mintCode, normalizeCode, formatCode, ALPHABET, CODE_LEN };
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test test/session-code.test.js`
Expected: PASS, 6 tests. (`normalizeCode(null)` → `String(null ?? '')` → `''`; `normalizeCode({})` → `'[object Object]'` → `'OBJECTOBJECT'`.)

- [ ] **Step 5: Commit**

```bash
git add server/session-code.js test/session-code.test.js
git commit -m "feat: the six-character code a session is shared by"
```

---

### Task 3: A test harness for the room, and the wiring cleanup

`Room` has no automated coverage at all. Before changing its behavior, give it a fake bridge and fake sockets so every later task can assert against it in milliseconds. Fold in the two wiring fixes: `Room` currently mutates `simHost.opts` from outside, and `Room.destroy()` is never called.

**Files:**
- Create: `test/helpers/fake-room.js`
- Create: `test/room.test.js`
- Modify: `server/room.js` (rename the per-socket `Session` → `Conn`; `this.sessions` → `this.conns`)
- Modify: `server/sim-host.js` (add `setHandlers`)
- Modify: `server/serve.js` (use `setHandlers`; shut down cleanly)

**Interfaces:**
- Produces: `makeRoom(overrides?) → { room, bridge, host, connect() }` where `connect()` returns a fake socket `{ sent, send(), close(), readyState, bufferedAmount, emit(msg), last(t), all(t) }`.
- Produces: `SimHost.setHandlers({ onSnapshot, onFx, onCrash, onPackUnlocked })`.

- [ ] **Step 1: Write the harness**

```js
// test/helpers/fake-room.js — a Room with no sockets and no simulation.
//
// The room's whole job is the seam between the two: sockets in, bridge
// commands out. Faking both sides is what makes its rules (codes, seats,
// reservations, sanitation, rate limits) testable in milliseconds instead of
// the minutes server/verify-e2e.js takes to spawn a real server and play a
// real match.
import { Room } from '../../server/room.js';

export function fakeBridge(overrides = {}) {
  const calls = [];
  const record = (name) => (...args) => { calls.push({ name, args }); return undefined; };
  const bridge = {
    calls,
    GAME_VERSION: 9,
    state: () => bridge._state,
    round: () => bridge._round,
    _state: 'LOBBY',
    _round: 0,
    _nextSlot: 0,
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
    // drive the snapshot path the way sim-host does
    snapshot(extra = {}) {
      host.opts.onSnapshot?.({ t: 'snap', v: 9, st: bridge._state, rn: bridge._round, ps: [], ...extra });
    },
  };
}
```

- [ ] **Step 2: Write the failing baseline test**

```js
// test/room.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRoom } from './helpers/fake-room.js';

test('a fresh connection is welcomed with the protocol version', () => {
  const { connect } = makeRoom();
  const ws = connect({ hello: false });
  const welcome = ws.last('welcome');
  assert.equal(welcome.v, 9);
  assert.equal(welcome.st, 'LOBBY');
});

test('the room takes its handlers from the host instead of reaching into it', () => {
  const { host } = makeRoom();
  assert.equal(typeof host.opts.onSnapshot, 'function');
  assert.equal(typeof host.opts.onFx, 'function');
  assert.equal(typeof host.opts.onCrash, 'function');
});

test('destroy stops the stats interval', () => {
  const { room } = makeRoom();
  room.destroy();
  assert.equal(room.statsTimer._destroyed, true);
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `node --test test/room.test.js`
Expected: FAIL — `room.addConn is not a function`.

- [ ] **Step 4: Rename in `server/room.js`**

Mechanical, in this order:
1. `class Session` → `class Conn`; update its header comment to say it is one socket.
2. `this.sessions = new Set()` → `this.conns = new Set()`; every `this.sessions` → `this.conns` (7 sites: `addSession`, `broadcast`, `dropSession`, the stats interval, `onPackUnlocked`, `reseatAll`, the two `size === 0` checks).
3. `addSession(ws)` → `addConn(ws)`; `dropSession(session)` → `dropConn(conn)`.
4. Every parameter named `session` → `conn` (`send`, `handle`, `join`, `sendPack`).
5. In the constructor, replace the three `simHost.opts.X = …` assignments with one call:

```js
    simHost.setHandlers({
      onSnapshot: (snap) => this.onSnapshot(snap),
      onFx: (fx) => this.broadcast(fx, true),
      onCrash: () => this.reseatAll(),
      // the moment a special name unlocks the pack, feed every waiting client
      onPackUnlocked: () => { for (const c of this.conns) if (c.wantsPack) this.sendPack(c); },
    });
```

6. Update the file header: the room owns "the session and its code" (it will, after Task 6) — leave that line for Task 6 and only fix the `Session`/`Conn` wording now.
7. Unref the stats interval, or every `makeRoom()` in a test arms a 10s repeating timer and `node --test` never exits:

```js
    }, 10000);
    // the HTTP server is what keeps this process alive; this timer should not
    // be able to hold it open by itself (and a test that builds a room must
    // not hang the runner for it)
    this.statsTimer.unref?.();
```

- [ ] **Step 5: Add `setHandlers` to `server/sim-host.js`**

Replace the constructor and add the method:

```js
  // opts: { onSnapshot(snapObj), onFx({f,a}), onCrash(), onPackUnlocked(src), telemetrySink(rec) }
  constructor(opts = {}) {
    this.opts = { ...opts };
    this.fxQueue = [];
  }

  // the transport registers its callbacks here rather than assigning into
  // `opts` from outside, so the host owns its own field and a second room
  // cannot silently steal the first one's snapshot stream
  setHandlers(handlers) {
    Object.assign(this.opts, handlers);
  }
```

- [ ] **Step 6: Update `server/serve.js`**

Change `room.addSession(ws)` → `room.addConn(ws)`, capture the ping interval in a variable, and add a shutdown path after the `wss.on('connection', …)` block:

```js
const pingTimer = setInterval(() => { /* …existing body… */ }, 30000);

// a stopped server should leave nothing behind: the room's stats interval, the
// ping interval and the sim loop are all long-lived timers
let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  clearInterval(pingTimer);
  room.destroy();
  simHost.stop();
  wss.close();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000).unref(); // a stuck socket must not hold the box
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
```

- [ ] **Step 7: Run everything**

Run: `npm test && node --test test/room.test.js`
Expected: PASS. Then smoke the real server:

```bash
node server/serve.js & sleep 3; curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8787/; kill %1
```
Expected: `200`, and the process exits on the kill without a stray timer keeping it alive.

- [ ] **Step 8: Commit**

```bash
git add server/room.js server/sim-host.js server/serve.js test/room.test.js test/helpers/fake-room.js
git commit -m "refactor: a socket is a Conn, and the host hands out its own handlers"
```

---

### Task 4: Sanitize input, and stop dropping it on high-refresh displays

Two bugs in one message path. `room.js:147` forwards `{m,j,c,c2,b,a}` verbatim into `bridge.setInput`, and `src/sim/player/controller.js:121-127` computes `move * 6` straight into `setVelocity` — so a non-finite `m` or `a` poisons body state, spreads NaN through collisions, and trips the crash watchdog that resets everyone's match. And `MSG_WINDOW_MAX` (600 per 5s) was sized for "input at 60Hz is 300/5s", but `sendInput` runs once per *rendered frame*: a 144Hz display sends 720 per 5s and the overflow — including lobby verbs — is dropped in silence.

**Files:**
- Modify: `server/room.js`
- Modify: `test/room.test.js`

**Interfaces:**
- Consumes: `makeRoom`, `connect` from Task 3.
- Produces: module-private `sanitizeInput(msg)` in `room.js`; constants `INPUT_WINDOW_MAX`, `CMD_WINDOW_MAX` replacing `MSG_WINDOW_MAX`.

- [ ] **Step 1: Write the failing tests**

Append to `test/room.test.js`:

```js
// a joined connection, ready to send input
function seated(kit, name = 'GANDALF') {
  const ws = kit.connect({ name });
  ws.emit({ t: 'join', name });
  return ws;
}

test('a non-finite move never reaches the physics', () => {
  const kit = makeRoom();
  const ws = seated(kit);
  for (const m of [NaN, Infinity, -Infinity, '3', null, undefined, {}]) {
    ws.emit({ t: 'input', m, j: 0, c: 0, c2: 0, b: 0, a: null });
    const sent = kit.bridge.last('setInput').args[1];
    assert.ok(Number.isFinite(sent.m), `m survived as ${String(m)}`);
  }
});

test('move is clamped to the range a controller can produce', () => {
  const kit = makeRoom();
  const ws = seated(kit);
  ws.emit({ t: 'input', m: 1e9, j: 0, c: 0, c2: 0, b: 0, a: null });
  assert.equal(kit.bridge.last('setInput').args[1].m, 1);
  ws.emit({ t: 'input', m: -1e9, j: 0, c: 0, c2: 0, b: 0, a: null });
  assert.equal(kit.bridge.last('setInput').args[1].m, -1);
  ws.emit({ t: 'input', m: 0.4, j: 0, c: 0, c2: 0, b: 0, a: null });
  assert.equal(kit.bridge.last('setInput').args[1].m, 0.4, 'analog sticks still work');
});

test('a non-finite aim becomes no aim, not a NaN angle', () => {
  const kit = makeRoom();
  const ws = seated(kit);
  ws.emit({ t: 'input', m: 0, j: 0, c: 0, c2: 0, b: 0, a: NaN });
  assert.equal(kit.bridge.last('setInput').args[1].a, null);
  ws.emit({ t: 'input', m: 0, j: 0, c: 0, c2: 0, b: 0, a: 1.25 });
  assert.equal(kit.bridge.last('setInput').args[1].a, 1.25);
});

test('the buttons arrive as 0 or 1 whatever was sent', () => {
  const kit = makeRoom();
  const ws = seated(kit);
  ws.emit({ t: 'input', m: 0, j: 'yes', c: 7, c2: null, b: {}, a: null });
  const sent = kit.bridge.last('setInput').args[1];
  assert.deepEqual([sent.j, sent.c, sent.c2, sent.b], [1, 1, 0, 1]);
});

test('a 144Hz display does not have its input throttled', () => {
  const kit = makeRoom();
  const ws = seated(kit);
  const before = kit.bridge.of('setInput').length;
  for (let i = 0; i < 720; i++) ws.emit({ t: 'input', m: 1, j: 0, c: 0, c2: 0, b: 0, a: null });
  assert.equal(kit.bridge.of('setInput').length - before, 720, '5s of 144Hz input was dropped');
});

test('a command flood is still throttled', () => {
  const kit = makeRoom();
  const ws = seated(kit);
  for (let i = 0; i < 500; i++) ws.emit({ t: 'start' });
  assert.ok(kit.bridge.of('start').length < 200, 'the command budget did not hold');
});

test('a command still lands after a burst of input', () => {
  const kit = makeRoom();
  const ws = seated(kit);
  for (let i = 0; i < 720; i++) ws.emit({ t: 'input', m: 1, j: 0, c: 0, c2: 0, b: 0, a: null });
  ws.emit({ t: 'start' });
  assert.equal(kit.bridge.of('start').length, 1, 'input spent the command budget');
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `node --test test/room.test.js`
Expected: FAIL on the sanitation tests (`m` arrives as `NaN`) and on the 144Hz test (720 sent, ~600 delivered).

- [ ] **Step 3: Implement**

In `server/room.js`, replace the rate-limit constants:

```js
const MSG_WINDOW_MS = 5000;      // inbound rate cap window…
// …input is one message per RENDERED frame, not per sim tick: a 144Hz display
// sends 720 per window and a 240Hz one 1200, so a cap sized for 60Hz silently
// ate a fifth of a fast player's input — and their lobby keys with it.
const INPUT_WINDOW_MAX = 1600;   // 300Hz of input, with headroom
// commands are lobby verbs, chat, joins and renames. Nothing legitimate sends
// them hot, and they cost far more than an input write, so they get their own
// budget that a flood of input cannot spend.
const CMD_WINDOW_MAX = 120;
```

Add the sanitizer next to `nameKey`:

```js
// THE INPUT BOUNDARY. Everything below is forwarded into the simulation, where
// `m` becomes `move * 6` into setVelocity and `a` becomes a firing angle — so a
// NaN here is a NaN body position two ticks later, and a NaN body position is
// the whole world for everyone. Cheating is a declared non-concern; a client
// that can reset the room is not.
const axis = (v) => (Number.isFinite(v) ? Math.max(-1, Math.min(1, v)) : 0);
const bit = (v) => (v ? 1 : 0);
const angle = (v) => (Number.isFinite(v) ? v : null);
function sanitizeInput(msg) {
  return { m: axis(msg.m), j: bit(msg.j), c: bit(msg.c), c2: bit(msg.c2), b: bit(msg.b), a: angle(msg.a) };
}
```

In `Conn`, replace `this.msgWindowAt = 0; this.msgCount = 0;` with:

```js
    this.windowAt = 0;
    this.inputCount = 0;
    this.cmdCount = 0;
```

In `handle`, replace the flood cap:

```js
    const now = performance.now();
    if (now - conn.windowAt > MSG_WINDOW_MS) { conn.windowAt = now; conn.inputCount = 0; conn.cmdCount = 0; }
    const overBudget = msg.t === 'input'
      ? ++conn.inputCount > INPUT_WINDOW_MAX
      : ++conn.cmdCount > CMD_WINDOW_MAX;
    if (overBudget) return;
```

And in the switch:

```js
      case 'input':
        this.bridge.setInput(conn.slot, sanitizeInput(msg));
        break;
```

- [ ] **Step 4: Run to verify they pass**

Run: `node --test test/room.test.js && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/room.js test/room.test.js
git commit -m "fix: the wire cannot hand the physics a NaN, and 144Hz input is not throttled"
```

---

### Task 5: Make the reconnect window real, and clean the names it keys on

README and `RESERVE_MS` promise two minutes to reclaim a seat and its round wins. `onSnapshot` deletes the shell *and* the reservation at the end of the current round — often ~30 seconds. Separately, `join` takes `msg.name` raw for the reservation key and for `bridge.reset(conn.name)`, which broadcasts it as an on-screen banner.

**Files:**
- Modify: `server/room.js`
- Modify: `src/net/server-bridge.js` (expose `cleanName`)
- Modify: `test/room.test.js`

**Interfaces:**
- Produces: `bridge.cleanName(s): string` on the command surface; `Room.reservedFor(slot): boolean`.

- [ ] **Step 1: Write the failing tests**

```js
test('a seat is held for the full reserve window, across a round boundary', () => {
  const kit = makeRoom();
  const ws = seated(kit, 'GANDALF');
  kit.bridge._state = 'PLAY';
  ws.close();                       // dropped mid-match
  kit.bridge._round = 1;            // …and a round ends while they are away
  kit.snapshot({ st: 'PLAY', rn: 1 });
  assert.equal(kit.bridge.of('removePlayer').length, 0, 'the seat was released early');

  const back = kit.connect({ name: 'GANDALF' });
  back.emit({ t: 'join', name: 'gandalf' });   // same name, any case
  assert.equal(back.last('you').slot, 0, 'the seat did not come back');
});

test('an expired reservation is swept at the next round boundary', () => {
  const kit = makeRoom();
  const ws = seated(kit, 'GANDALF');
  kit.bridge._state = 'PLAY';
  ws.close();
  for (const r of kit.room.reserved.values()) r.expiresAt = -1;  // two minutes later
  kit.bridge._round = 1;
  kit.snapshot({ st: 'PLAY', rn: 1 });
  assert.equal(kit.bridge.of('removePlayer').length, 1, 'the shell outlived its reservation');
  assert.equal(kit.room.reserved.size, 0, 'the expired reservation was not pruned');
});

test('a name is cleaned before it becomes a reservation key or a banner', () => {
  const kit = makeRoom();
  const ws = kit.connect({ name: 'x' });
  ws.emit({ t: 'join', name: '💀💀' + 'A'.repeat(40) });
  ws.emit({ t: 'reset' });
  const shouted = kit.bridge.last('reset').args[0];
  assert.ok(shouted.length <= 12, `an unbounded name reached the banner: ${shouted}`);
  assert.ok(!shouted.includes('💀'), 'the banner takes whatever bytes were sent');
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `node --test test/room.test.js`
Expected: FAIL — the first on `removePlayer` being called once, the third on a 42-character banner.

- [ ] **Step 3: Expose `cleanName` on the bridge**

In `src/net/server-bridge.js`, inside the object `installServerBridge` returns, next to `state`:

```js
    // the room sanitizes names with the sim's own definition rather than a
    // second copy that can drift from it
    cleanName: (s) => cleanName(s),
```

(`cleanName` is already imported at the top of that file.)

- [ ] **Step 4: Implement the reservation fix in `server/room.js`**

Add the helper to `Room`:

```js
  // is this slot still inside someone's reserve window? Prunes as it walks —
  // an expired reservation is the only thing standing between a shell and the
  // sweep below, so it must not outlive its deadline in the map either.
  reservedFor(slot) {
    const now = performance.now();
    let held = false;
    for (const [key, r] of this.reserved) {
      if (r.expiresAt <= now) { this.reserved.delete(key); continue; }
      if (r.slot === slot) held = true;
    }
    return held;
  }
```

In `onSnapshot`, gate the sweep on it:

```js
      for (const [slot, sinceRound] of this.shellSinceRound) {
        // RESERVE_MS is a promise the README makes to a player who dropped:
        // refresh within two minutes and your seat and your round wins are
        // still there. Releasing at the next round boundary broke it silently,
        // because a round is often thirty seconds.
        if (this.reservedFor(slot)) continue;
        if (snap.st === 'LOBBY' || snap.rn > sinceRound) {
          this.bridge.removePlayer(slot);
          this.shellSinceRound.delete(slot);
          for (const [key, r] of this.reserved) if (r.slot === slot) this.reserved.delete(key);
        }
      }
```

In `join`, clean the name once, at the top, and use it everywhere below:

```js
    const raw = typeof msg.name === 'string' ? msg.name : (typeof msg.n === 'string' ? msg.n : conn.name);
    // one cleaned string for the seat, the reservation key and the reset
    // banner — the sim cleans the PLAYER name, not this one
    const name = this.bridge.cleanName(raw) || null;
```

Then `conn.name = name;` in both the reconnect and the fresh-seat paths, and `this.bridge.addPlayer({ name, color: msg.color, hat: msg.hat })`.

Also clean it in the `hello` handler:

```js
      if (typeof msg.name === 'string') conn.name = this.bridge.cleanName(msg.name) || null;
```

- [ ] **Step 5: Run to verify they pass**

Run: `node --test test/room.test.js && npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/room.js src/net/server-bridge.js test/room.test.js
git commit -m "fix: the two-minute seat reservation the README promises, and clean names"
```

---

### Task 6: The session — mint it, gate on it, end it

**Files:**
- Modify: `server/room.js`
- Modify: `test/room.test.js`

**Interfaces:**
- Consumes: `mintCode`, `normalizeCode`, `formatCode` from Task 2.
- Produces: `Room.session` (`{ code } | null`), `Room.hostSession(conn)`, `Room.closeSession()`; wire messages `host`, `session{code, host?}`, `sessionDenied{reason}`, `sessionState{live}`, `joinDenied{reason:'code'}`, and `welcome{proto:3, session:bool}`.

- [ ] **Step 1: Write the failing tests**

```js
test('welcome says whether a session is live', () => {
  const kit = makeRoom();
  const first = kit.connect({ hello: false });
  assert.equal(first.last('welcome').proto, 3);
  assert.equal(first.last('welcome').session, false);
  first.emit({ t: 'host' });
  const second = kit.connect({ hello: false });
  assert.equal(second.last('welcome').session, true);
});

test('the first host mints a code and the second is refused', () => {
  const kit = makeRoom();
  const a = kit.connect();
  a.emit({ t: 'host' });
  const mine = a.last('session');
  assert.match(mine.code, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  assert.equal(mine.host, true);

  const b = kit.connect();
  b.emit({ t: 'host' });
  assert.equal(b.last('sessionDenied').reason, 'exists');
  assert.equal(b.last('session'), undefined);
});

test('joining needs the code, in whatever shape it was typed', () => {
  const kit = makeRoom();
  const a = kit.connect();
  a.emit({ t: 'host' });
  const { code } = a.last('session');

  const b = kit.connect({ name: 'B' });
  b.emit({ t: 'join', name: 'B' });
  assert.equal(b.last('joinDenied').reason, 'code');
  b.emit({ t: 'join', name: 'B', code: 'WRONG1' });
  assert.equal(b.last('joinDenied').reason, 'code');
  assert.equal(b.last('you'), undefined);

  b.emit({ t: 'join', name: 'B', code: `${code.slice(0, 3).toLowerCase()}-${code.slice(3).toLowerCase()}` });
  assert.equal(typeof b.last('you').slot, 'number');
  assert.equal(b.last('session').code, code);
});

test('nobody without the code sees the match', () => {
  const kit = makeRoom();
  const a = kit.connect();
  a.emit({ t: 'host' });
  const lurker = kit.connect();
  kit.snapshot();
  assert.equal(lurker.all('snap').length, 0, 'a codeless connection was streamed the match');
  assert.ok(a.all('snap').length > 0, 'the host stopped seeing their own match');
});

test('a stale-version client still gets snapshots, so its refresh screen works', () => {
  const kit = makeRoom();
  kit.connect().emit({ t: 'host' });
  const old = kit.connect({ v: 8 });
  kit.snapshot();
  assert.ok(old.all('snap').length > 0);
  assert.ok(old.last('badVersion'));
});

test('a correct code into a full match still lets you watch', () => {
  const kit = makeRoom();
  const a = kit.connect();
  a.emit({ t: 'host' });
  const { code } = a.last('session');
  kit.bridge._nextSlot = 8; // every seat taken
  const late = kit.connect({ name: 'LATE' });
  late.emit({ t: 'join', name: 'LATE', code });
  assert.equal(late.last('joinDenied').reason, 'full');
  assert.equal(late.last('session').code, code, 'a full match should still admit a spectator');
  kit.snapshot();
  assert.ok(late.all('snap').length > 0);
});

test('a denial is not repeated at frame rate', () => {
  const kit = makeRoom();
  kit.connect().emit({ t: 'host' });
  const b = kit.connect({ name: 'B' });
  for (let i = 0; i < 60; i++) b.emit({ t: 'join', name: 'B', code: 'NOPE22' });
  assert.equal(b.all('joinDenied').length, 1, 'the denial flooded back');
});

test('an empty room ends the session, and the next person can host', () => {
  const kit = makeRoom();
  const a = kit.connect();
  a.emit({ t: 'host' });
  const first = a.last('session').code;
  a.close();
  kit.room.endEmptySession();          // what the 60s timer calls
  assert.equal(kit.room.session, null);
  assert.equal(kit.bridge.of('reset').length, 1);

  const b = kit.connect();
  b.emit({ t: 'host' });
  assert.notEqual(b.last('session').code, first);
});

test('a menu waiting on the wrong screen is told when that changes', () => {
  const kit = makeRoom();
  const waiting = kit.connect();
  const host = kit.connect();
  host.emit({ t: 'host' });
  assert.equal(waiting.last('sessionState').live, true);
  host.close();
  kit.room.endEmptySession();
  assert.equal(waiting.last('sessionState').live, false);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `node --test test/room.test.js`
Expected: FAIL — `welcome.proto` is 2, `host` does nothing, joins succeed without a code.

- [ ] **Step 3: Implement in `server/room.js`**

Require the code module at the top:

```js
const { mintCode, normalizeCode, formatCode } = require('./session-code');
```

Update the file header comment: the room now also owns *the session* — the code that gates it and the rule that ends it.

In the constructor: `this.session = null;` and rename `emptyResetTimer` usage stays as is.

In `Conn`: `this.authed = false;` (presented the code) and `this.denied = { reason: null, until: 0 };`

Add the session methods:

```js
  // ---- the session: one code-gated occupancy of this server's one match ----
  // The sim is process-global (src/net/server-bridge.js keeps its controllers
  // and fx wrappers in module state), so a second concurrent match would need
  // a worker per room. One match, and the code decides who is in it.
  hostSession(conn) {
    if (!conn.hello) return;
    if (this.session) { this.send(conn, { t: 'sessionDenied', reason: 'exists' }); return; }
    this.session = { code: mintCode(), createdAt: performance.now() };
    conn.authed = true;
    console.log(`session ${formatCode(this.session.code)} started`);
    this.send(conn, { t: 'session', code: this.session.code, host: true });
    this.announceSession(true, conn);
  }

  // a menu sitting on the other screen (START SESSION vs enter-a-code) flips
  // itself when the answer changes under it
  announceSession(live, except) {
    for (const c of this.conns) {
      if (c === except || c.authed) continue;
      this.send(c, { t: 'sessionState', live });
    }
  }

  // the room has been empty for EMPTY_RESET_MS: the session is over, the match
  // goes back to a lobby, and the next person to press START SESSION hosts.
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

  denyJoin(conn, reason) {
    const now = performance.now();
    // a client retries a denied join on every cast; answering each one turns a
    // full match into a flood in both directions
    if (conn.denied.reason === reason && now < conn.denied.until) return;
    conn.denied = { reason, until: now + 1000 };
    this.send(conn, { t: 'joinDenied', reason });
  }
```

In `addConn`, the welcome gains two fields:

```js
    this.send(conn, {
      t: 'welcome', v: this.bridge.GAME_VERSION, proto: 3,
      st: this.bridge.state(), session: !!this.session,
    });
```

In `handle`, after the `hello` block and the `badVersion` guard:

```js
    if (msg.t === 'host') { this.hostSession(conn); return; }
```

In `join`, gate before anything else:

```js
  join(conn, msg) {
    if (!conn.hello || conn.slot != null) return;
    if (!this.session) { this.denyJoin(conn, 'nosession'); return; }
    if (normalizeCode(msg.code) !== this.session.code) { this.denyJoin(conn, 'code'); return; }
    // the code is what grants access. A full match still admits you as a
    // spectator, which is what a codeless connection used to get for free.
    conn.authed = true;
    this.send(conn, { t: 'session', code: this.session.code });
    …existing reconnect / addPlayer body…
  }
```

In `broadcast`, gate the stream:

```js
    for (const c of this.conns) {
      if (c.ws.readyState !== 1) continue;
      // no code, no match. The one exception is a client too old to speak the
      // protocol: it cannot join or act, and the snapshot's version mismatch is
      // what triggers its own "GAME UPDATED — REFRESH" screen.
      if (!c.authed && !c.badVersion) continue;
      if (droppable && c.ws.bufferedAmount > DROP_AT) { c.dropped++; continue; }
      c.ws.send(text);
    }
```

In `dropConn`, arm the timer whenever a session exists (not only mid-match), and route it through the new method:

```js
    if (this.conns.size === 0 && (this.session || this.bridge.state() !== 'LOBBY')) {
      this.emptyResetTimer = setTimeout(() => {
        if (this.conns.size === 0) this.endEmptySession();
      }, EMPTY_RESET_MS);
      this.emptyResetTimer.unref?.(); // a test that drops its last socket must not wait a minute
    }
```

- [ ] **Step 4: Bring the Task 4/5 tests through the gate**

Those tests seat players with a bare `join`, which the gate now refuses. Replace the shared `seated()` helper at the top of the test file with one that mints a session first — one edit, and every test that used it keeps meaning what it meant:

```js
// a joined connection: hosts the session if nobody has, then seats itself
function seated(kit, name = 'GANDALF') {
  if (!kit.room.session) {
    const opener = kit.connect({ name: 'OPENER' });
    opener.emit({ t: 'host' });
  }
  const ws = kit.connect({ name });
  ws.emit({ t: 'join', name, code: kit.room.session.code });
  return ws;
}
```

Then fix the two tests that write their own `join`: the reconnect test in Task 5 rejoins with `{ t: 'join', name: 'gandalf', code: kit.room.session.code }`, and its `you`-slot assertion becomes `1` — the opener above now holds slot 0.

- [ ] **Step 5: Run to verify they pass**

Run: `node --test test/room.test.js && npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/room.js test/room.test.js
git commit -m "feat: a session, its code, and the gate that makes the code mean something"
```

---

### Task 7: The client speaks sessions

**Files:**
- Modify: `src/net/client.js`

**Interfaces:**
- Consumes: the Task 6 wire messages.
- Produces: `hostSession()`, `joinSession(code)`, `sessionCode()` exported from `client.js`; `connect(hooks)` where hooks are `{ status(text), welcome({sessionLive}), session({code, host}), sessionState({live}), denied(reason) }`.

- [ ] **Step 1: Add the session state and the two senders**

Near the other module state at the top of `src/net/client.js`:

```js
let sessionCodeValue = null;     // the code this tab is in, once the server confirms it
export const sessionCode = () => sessionCodeValue;
```

After `connect`:

```js
// start a session on the server and take its code (the menu's START SESSION)
export function hostSession() { emit({ t: 'host' }); }

// try to enter an existing session. The server normalizes the code, so
// whatever the player typed goes as typed.
export function joinSession(code) {
  sessionCodeValue = code;
  emit({ t: 'join', name: myName(), code });
}
```

- [ ] **Step 2: Rework `handleMessage`**

`welcome` must stop auto-joining — the menu decides now — and `netMode` flips only once we are actually in, so a player still typing a code is not stranded in an online view with no snapshots:

```js
    case 'welcome':
      if (msg.v !== GAME_VERSION) {
        hooks.status('GAME UPDATED — hard-refresh this page (⌘⇧R) and try again');
        ws.close();
        return;
      }
      hooks.welcome({ sessionLive: !!msg.session });
      break;
    case 'session':
      sessionCodeValue = msg.code;
      try { sessionStorage.setItem('hs-code', msg.code); } catch {}
      // we are in: the server owns the match from here, and the menu can go
      setNetMode('online');
      if (msg.host) hostSession_confirmed(msg.code);
      hooks.session({ code: msg.code, host: !!msg.host });
      break;
    case 'sessionState':
      hooks.sessionState({ live: !!msg.live });
      break;
    case 'sessionDenied':
      hooks.denied(msg.reason);
      break;
```

where the host's own confirmation also claims a seat:

```js
// minting the code does not seat you — take a seat with it immediately, so the
// host is a wizard and not a spectator of their own session
function hostSession_confirmed(code) { emit({ t: 'join', name: myName(), code }); }
```

Extend `joinDenied` for the new reason:

```js
    case 'joinDenied':
      joinDeniedMsg = msg.reason === 'full' ? 'match is full (8 wizards) — spectating'
        : msg.reason === 'code' ? 'wrong code'
        : 'join refused — spectating';
      hooks.denied(msg.reason);
      break;
```

- [ ] **Step 3: Throttle the join retry**

Replace line 284's per-frame retry in `sendInput`:

```js
  // retry a denied join on a fresh cast EDGE, at most once a second: this used
  // to fire every rendered frame, so a full match answered 144 denials a second
  if (!joined && cast && !prevCast && performance.now() > nextJoinAt && sessionCodeValue) {
    nextJoinAt = performance.now() + 1000;
    emit({ t: 'join', name: myName(), code: sessionCodeValue });
  }
  prevCast = cast;
```

with `let prevCast = false, nextJoinAt = 0;` declared beside the other module state.

- [ ] **Step 4: Show the code in the online lobby**

In `drawOnlineLobby`, prefix the controls line so anyone in the room can read the code out:

```js
  const codeLine = sessionCodeValue ? `CODE ${sessionCodeValue.slice(0, 3)}-${sessionCodeValue.slice(3)} · ` : '';
```

and use `` controlsLine: codeLine + (wave ? '…' : `…`) `` — keep both existing strings exactly as they are, just concatenated after `codeLine`.

- [ ] **Step 5: Verify nothing is undefined and the suite is green**

Run: `npm test`
Expected: PASS, including `test/no-undefined-identifiers.test.js` (which now also covers the new functions).

- [ ] **Step 6: Commit**

```bash
npm run build
git add src/net/client.js dist/hyperspell.js
git commit -m "feat: the client hosts a session, joins with a code, and shows it"
```

---

### Task 8: The menu screens

**Files:**
- Modify: `src/platform/menu.js`

**Interfaces:**
- Consumes: `connect`, `hostSession`, `joinSession` from `src/net/client.js`.

- [ ] **Step 1: Replace the click handler with a two-screen flow**

Keep everything up to `document.body.appendChild(menu)` as it is (logo, name input, the two buttons). Then:

```js
  const statusEl = () => document.getElementById('netstatus');
  const setStatus = (text) => { const el = statusEl(); if (el) el.textContent = text; };
  // an invite link carries the code; a refresh mid-match remembers it
  const urlCode = new URLSearchParams(location.search).get('code') || '';
  let storedCode = '';
  try { storedCode = sessionStorage.getItem('hs-code') || ''; } catch {}

  const panel = document.createElement('div');
  panel.style.cssText = 'display:none;flex-direction:column;gap:12px;align-items:center;';
  menu.appendChild(panel);

  // screen 2: start a session, or enter the code of the one that is running
  function showSessionScreen(sessionLive) {
    for (const b of menu.querySelectorAll('button[data-mode]')) b.style.display = 'none';
    nameInput.style.display = 'none';
    panel.style.display = 'flex';
    panel.innerHTML = sessionLive
      ? `<div style="color:#9c8ab8;font-size:14px">a session is running on this server — enter its code</div>
         <input id="hscode" maxlength="9" placeholder="ABC-DEF" autocomplete="off"
           style="min-width:280px;padding:12px 20px;font-family:Menlo,monospace;font-size:24px;text-align:center;letter-spacing:.25em;background:transparent;border:2px solid #675a7d;color:#e8d5ff;border-radius:8px;text-transform:uppercase;outline:none;">
         <button data-act="join" style="${btnCss('#ffd166')}">JOIN THE SESSION</button>`
      : `<div style="color:#9c8ab8;font-size:14px">no session is running — start one and share the code</div>
         <button data-act="host" style="${btnCss('#7bd88f')}">START A SESSION</button>`;
    const codeInput = panel.querySelector('#hscode');
    if (codeInput) {
      codeInput.value = urlCode || storedCode;
      for (const ev of ['keydown', 'keyup']) codeInput.addEventListener(ev, (e) => e.stopPropagation());
      codeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') joinSession(codeInput.value); });
      codeInput.focus();
      // an invite link means they already have the code — use it
      if (urlCode) joinSession(urlCode);
    }
  }

  // screen 3: the host's code, big enough to read across a room
  function showCodeScreen(code) {
    const pretty = `${code.slice(0, 3)}-${code.slice(3)}`;
    const invite = `${location.origin}/?code=${code}`;
    panel.innerHTML = `
      <div style="color:#9c8ab8;font-size:14px">your session is live — share this</div>
      <div style="font:900 64px Menlo,monospace;letter-spacing:.15em;color:#ffd166;text-shadow:0 0 22px rgba(255,209,102,.5)">${pretty}</div>
      <button data-act="copy" style="${btnCss('#4ecdc4')}">COPY THE INVITE LINK</button>
      <button data-act="play" style="${btnCss('#ffd166')}">ENTER THE LOBBY</button>`;
    panel.querySelector('[data-act="copy"]').addEventListener('click', (e) => {
      navigator.clipboard?.writeText(invite)
        .then(() => { e.target.textContent = 'COPIED — PASTE IT IN SLACK'; })
        .catch(() => { e.target.textContent = invite; });
    });
    panel.querySelector('[data-act="play"]').addEventListener('click', () => menu.remove());
  }

  panel.addEventListener('click', (e) => {
    const act = e.target?.dataset?.act;
    if (act === 'host') { setStatus('starting a session…'); hostSession(); }
    if (act === 'join') { setStatus('joining…'); joinSession(panel.querySelector('#hscode').value); }
  });

  menu.addEventListener('click', (e) => {
    const mode = e.target?.dataset?.mode;
    if (!mode) return;
    const typed = cleanName(nameInput.value);
    if (typed) localStorage.setItem('hs-name-0', typed);
    globalThis.nameSetViaMenu = true; // the menu was player 1's name UI — lobby must not re-open an edit
    ensureAudio();
    if (mode === 'couch') { menu.remove(); return; }
    setStatus('connecting…');
    connect({
      status: setStatus,
      welcome: ({ sessionLive }) => showSessionScreen(sessionLive),
      // a session we did not mint means we are in and playing; one we did mint
      // shows its code first
      session: ({ code, host }) => { if (host) showCodeScreen(code); else menu.remove(); },
      sessionState: ({ live }) => showSessionScreen(live),
      denied: (reason) => setStatus(
        reason === 'exists' ? 'someone else just started one — enter their code'
        : reason === 'code' ? 'that code does not match — check it and try again'
        : reason === 'full' ? 'the match is full — you are watching'
        : 'no session is running yet'),
    });
  });
```

Add the imports at the top of the file: `import { connect, hostSession, joinSession } from '../net/client.js';`

- [ ] **Step 2: Check it by hand in a browser**

```bash
npm run build && node server/serve.js
```

Open `http://localhost:8787` in two windows.
Expected, window 1: name → PLAY ONLINE → "no session is running" → START A SESSION → a six-character code → ENTER THE LOBBY → you are a wizard in the lobby with `CODE ABC-DEF` on the controls line.
Expected, window 2: name → PLAY ONLINE → "a session is running" → wrong code → "that code does not match" → the right code (lowercase, with or without the dash) → seated.
Expected, window 3: paste the copied invite link → PLAY ONLINE → seated with no typing.

- [ ] **Step 3: Commit**

```bash
git add src/platform/menu.js dist/hyperspell.js
git commit -m "feat: start a session, share the code, join with a link"
```

---

### Task 9: The e2e suite, the docs, and the launchers

**Files:**
- Modify: `server/verify-e2e.js`
- Modify: `README.md`, `docs/MULTIPLAYER.md`
- Modify: `scripts/hyperspell-launcher.command`, `scripts/hyperspell-launcher.bat`

- [ ] **Step 1: Teach `verify-e2e.js` to host**

Every existing `{t:'join'}` in that file (lines 113, 120, 135, 183, 218, 229, 237, 318) now needs the code, and the first client must mint it. Add a helper next to `client()`:

```js
// the first client of a phase starts the session; every join after it carries
// the code. `verifyClient` gates the socket, the code gates the match.
async function hostSession(c) {
  c.send({ t: 'hello', v: 9, name: 'HOST' });
  c.send({ t: 'host' });
  const s = await until(() => c.find('session'));
  if (!s) throw new Error('no session was minted');
  return s.code;
}
```

In `phaseOpen`, mint the code right after client `A` connects and thread it into every join. Add these assertions after the existing welcome check:

```js
    ok(welcomeA && welcomeA.proto === 3 && welcomeA.session === false, 'welcome says no session is live yet');
    const CODE = await hostSession(A);
    ok(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(CODE), `a session code was minted (${CODE})`);

    const NOCODE = client(PORT); await NOCODE.open;
    NOCODE.send({ t: 'hello', v: 9, name: 'NOCODE' });
    NOCODE.send({ t: 'join', name: 'NOCODE' });
    const denied = await until(() => NOCODE.find('joinDenied'));
    ok(denied && denied.reason === 'code', 'a join without the code is refused');
    await sleep(300);
    ok(NOCODE.snaps === 0, 'a codeless client is never streamed the match');
    NOCODE.ws.close();

    const WRONG = client(PORT); await WRONG.open;
    WRONG.send({ t: 'hello', v: 9, name: 'WRONG' });
    WRONG.send({ t: 'join', name: 'WRONG', code: 'ZZZ999' });
    ok((await until(() => WRONG.find('joinDenied')))?.reason === 'code', 'a wrong code is refused');
    WRONG.ws.close();
```

Then rewrite `A.send({ t: 'join', name: 'GANDALF', color: '#4ecdc4' })` as `A.send({ t: 'join', name: 'GANDALF', color: '#4ecdc4', code: CODE.toLowerCase() })` — which also proves normalization end to end — and add `code: CODE` to every other join in the phase. Do the same in the key-gated phase with its own `hostSession` call.

- [ ] **Step 2: Run the full e2e**

Run: `node server/verify-e2e.js`
Expected: every check `ok`, and the summary reports 0 failures. It takes a few minutes — a bot plays a real match.

- [ ] **Step 3: Update the README**

In "Play over the network", replace the bullet that says everyone opens the URL and types a name with the session flow:

```markdown
- One person opens `http://<server-ip>:8787` → type a name → **PLAY ONLINE** → **START A SESSION**. You get a six-character code and a **COPY THE INVITE LINK** button.
- Everyone else opens the same URL (or the invite link, which carries the code) → type a name → **PLAY ONLINE** → enter the code. The code is case- and dash-insensitive, and it is shown in the lobby the whole time.
- The code is what gates the match: without it you cannot play *or* spectate. The session ends by itself once the room has been empty for a minute, and then anyone can start a new one.
```

In the Tailscale section, change "Everyone opens the URL and clicks **PLAY ONLINE**" to mention the code, and update the spectator claim ("spectators unlimited") to "spectators unlimited — with the code".

- [ ] **Step 4: Update `docs/MULTIPLAYER.md`**

In the status line at the top, move private codes out of the still-open list:

```markdown
*Status: **Option A (server-authoritative) SHIPPED as v9, July 23 2026**… Private lobbies with a shareable code shipped July 27 2026 (`server/session-code.js`, `docs/superpowers/specs/2026-07-27-session-codes-design.md`). Still open from the original ask: concurrent rooms (the sim is process-global — one worker per room), a lobby browser with auto-start, leaderboards, Hyperspell-account auth.*
```

- [ ] **Step 5: Update both launchers**

In `scripts/hyperspell-launcher.command`, the invite text is now wrong — it promises that PLAY ONLINE puts you straight in. Replace the `INVITE` heredoc body and the echoed instructions:

```sh
INVITE="🧙 HYPERSPELL time! Join the fight: $URL
(type it WITH the http:// — Chrome gets weird otherwise)
Type your wizard name, click PLAY ONLINE, then enter the session code I'll paste next."
```

and in the echoed block, change the "click PLAY ONLINE" line to "click PLAY ONLINE → START A SESSION, then share the code (the COPY THE INVITE LINK button puts a one-click link on your clipboard)". Mirror both edits in `scripts/hyperspell-launcher.bat`.

- [ ] **Step 6: Full verification and commit**

```bash
npm test && node server/verify-e2e.js
git add server/verify-e2e.js README.md docs/MULTIPLAYER.md scripts/hyperspell-launcher.command scripts/hyperspell-launcher.bat
git commit -m "test: the e2e suite hosts a session, and the docs describe one"
```

---

## Verification checklist

- [ ] `npm test` — every test file green, including the three new ones.
- [ ] `node server/verify-e2e.js` — 0 failures.
- [ ] Two browsers: host → code → join → a round is played.
- [ ] An invite link (`/?code=…`) seats a third browser with no typing.
- [ ] A wrong code is refused and streams no snapshots (check the Network tab: no `snap` frames).
- [ ] `dist/hyperspell.js` is rebuilt and committed.
