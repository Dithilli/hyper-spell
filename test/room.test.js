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
