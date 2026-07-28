// server/room.js is the seam between the sockets and the simulation, and until
// now nothing tested it: the only coverage was server/verify-e2e.js, which
// spawns a real server and plays a real match over several minutes. These run
// against a fake bridge and fake sockets (test/harness/fake-room.js), so the
// room's rules can be asserted one at a time.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRoom } from './harness/fake-room.js';

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
  assert.equal(typeof host.opts.onPackUnlocked, 'function');
});

test('destroy stops the stats interval', () => {
  const { room } = makeRoom();
  room.destroy();
  assert.equal(room.statsTimer._destroyed, true);
});

// A joined connection, ready to send input. Somebody has to have started the
// session before anyone can be in one, so this opens one if none is running.
// Hosting mints the code and nothing else — the opener takes no seat, so the
// connection returned here is still slot 0.
function seated(kit, name = 'GANDALF') {
  if (!kit.room.session) kit.connect({ name: 'OPENER' }).emit({ t: 'host' });
  const ws = kit.connect({ name });
  ws.emit({ t: 'join', name, code: kit.room.session.code });
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

test('a seat is held for the full reserve window, across a round boundary', () => {
  const kit = makeRoom();
  const ws = seated(kit, 'GANDALF');
  kit.bridge._state = 'PLAY';
  ws.close();                     // dropped mid-match
  kit.bridge._round = 1;          // …and a round ends while they are away
  kit.snapshot({ st: 'PLAY', rn: 1 });
  assert.equal(kit.bridge.of('removePlayer').length, 0, 'the seat was released early');

  const back = kit.connect({ name: 'GANDALF' });
  back.emit({ t: 'join', name: 'gandalf', code: kit.room.session.code }); // same name, any case
  assert.equal(back.last('you').slot, 0, 'the seat did not come back');
});

test('an expired reservation is swept at the next round boundary', () => {
  const kit = makeRoom();
  const ws = seated(kit, 'GANDALF');
  kit.bridge._state = 'PLAY';
  ws.close();
  for (const r of kit.room.reserved.values()) r.expiresAt = -1; // two minutes later
  kit.bridge._round = 1;
  kit.snapshot({ st: 'PLAY', rn: 1 });
  assert.equal(kit.bridge.of('removePlayer').length, 1, 'the shell outlived its reservation');
  assert.equal(kit.room.reserved.size, 0, 'the expired reservation was not pruned');
});

test('a name is cleaned before it becomes a reservation key or a banner', () => {
  const kit = makeRoom();
  kit.connect({ name: 'OPENER' }).emit({ t: 'host' });
  const ws = kit.connect({ name: 'x' });
  ws.emit({ t: 'join', name: '\u{1F480}\u{1F480}' + 'A'.repeat(40), code: kit.room.session.code });
  ws.emit({ t: 'reset' });
  const shouted = kit.bridge.last('reset').args[0];
  assert.ok(shouted.length <= 12, `an unbounded name reached the banner: ${shouted}`);
  assert.ok(!/[\u{1F300}-\u{1FAFF}]/u.test(shouted), 'the banner takes whatever bytes were sent');
});

test('welcome says whether a session is live', () => {
  const kit = makeRoom();
  const first = kit.connect({ hello: false });
  assert.equal(first.last('welcome').proto, 3);
  assert.equal(first.last('welcome').session, false);
  first.emit({ t: 'hello', v: 9 });
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
  b.emit({ t: 'join', name: 'B', code: 'WRONG2' });
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
  for (let i = 0; i < 60; i++) b.emit({ t: 'join', name: 'B', code: 'NOPE23' });
  assert.equal(b.all('joinDenied').length, 1, 'the denial flooded back');
});

test('an empty room ends the session, and the next person can host', () => {
  const kit = makeRoom();
  const a = kit.connect();
  a.emit({ t: 'host' });
  const first = a.last('session').code;
  a.close();
  kit.room.endEmptySession();       // what the 60s timer calls
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
