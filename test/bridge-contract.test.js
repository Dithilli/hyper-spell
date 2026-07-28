// server/room.js drives the simulation entirely through the bridge's command
// surface, and test/room.test.js hands it a FAKE bridge — which is what makes
// those tests fast, and also what makes them blind: a fake that answers
// cleanName() keeps passing long after the real bridge has stopped providing
// it, and the failure would surface as a TypeError in front of players.
//
// So: read the calls out of room.js and check them against a real bridge.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSim } from '../src/platform/node.js';

test('the real bridge provides every command the room calls on it', async () => {
  const src = readFileSync('server/room.js', 'utf8');
  const called = new Set(
    [...src.matchAll(/this\.bridge\.([\w$]+)\s*\(/g)].map((m) => m[1]),
  );
  // `get bridge()` is the accessor itself, not a command
  called.delete('bridge');
  assert.ok(called.size > 5, `expected to find the room's bridge calls, found ${called.size}`);

  const sim = createSim({});
  try {
    const missing = [...called].filter((name) => typeof sim.bridge[name] !== 'function');
    assert.deepEqual(missing, [], `room.js calls bridge methods that do not exist: ${missing.join(', ')}`);
    // read as well as called: GAME_VERSION rides the welcome frame
    assert.equal(typeof sim.bridge.GAME_VERSION, 'number');
  } finally {
    sim.destroy();
  }
});
