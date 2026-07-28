// name-tags.test.js — the per-frame slot reservation, and the reset it depends on.
//
// This exists because the reset is the easy half to forget. The slots are
// cleared in beginWorld(), which the couch and killcam paths call — and the
// online path does not, because it sets its own transform. It still draws
// nametags (drawSnapshotWorld -> drawNameTag -> claimTagSlot), so for one
// commit every online tag climbed to the ceiling within about five frames and
// stayed there, with the "pushed up" stem drawn to it, while the slot array
// grew unboundedly.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resetNameTagSlots, claimTagSlot } from '../src/render/name-tags.js';

const STEP = 13, LIMIT = 5;

test('two tags at the same spot do not overlap', () => {
  resetNameTagSlots();
  const a = claimTagSlot(100, 500, 20);
  const b = claimTagSlot(100, 500, 20);
  assert.equal(a, 500, 'the first tag sits where it was asked to');
  assert.ok(Math.abs(a - b) >= STEP - 1, `tags overlap: ${a} vs ${b}`);
});

test('tags far apart on x do not push each other', () => {
  resetNameTagSlots();
  const a = claimTagSlot(100, 500, 20);
  const b = claimTagSlot(400, 500, 20);
  assert.equal(a, 500);
  assert.equal(b, 500, 'a tag 300px away is not a clash');
});

// The loop is `for (i = 0; i <= LIMIT; i++)`, so it takes LIMIT + 1 = 6 steps
// before giving up and stacking at the ceiling: 78px above the wizard, not 65.
const CEILING = STEP * (LIMIT + 1);

test('the climb is bounded', () => {
  resetNameTagSlots();
  let lowest = 500;
  for (let i = 0; i < 20; i++) lowest = Math.min(lowest, claimTagSlot(100, 500, 20));
  assert.equal(lowest, 500 - CEILING, `tag climbed past the ceiling: ${lowest}`);
});

// The regression. Without a reset, a single stationary wizard's tag clashes
// with its own slots from previous frames and climbs to the ceiling; with one,
// it is stable forever.
test('a stationary wizard keeps the same slot frame after frame, given the reset', () => {
  const ys = [];
  for (let f = 0; f < 180; f++) {
    resetNameTagSlots();
    ys.push(claimTagSlot(640, 500, 22));
  }
  assert.deepEqual([...new Set(ys)], [500], 'the tag must not drift while the wizard stands still');
});

test('without the reset the same wizard climbs — this is what the reset prevents', () => {
  resetNameTagSlots();
  const ys = [];
  for (let f = 0; f < 180; f++) ys.push(claimTagSlot(640, 500, 22));
  assert.ok(ys.at(-1) < 500 - STEP * 2, 'sanity: unreset slots really do climb');
});

// A static guard, because the failure mode is "a draw path forgot to call it"
// and that is invisible to any unit test of this module. Every render entry
// point that sets up its own frame transform must clear the slots.
test('every frame entry point resets the slots', () => {
  const paths = {
    // the couch + killcam frame, via beginWorld()
    'src/render/camera.js': /resetNameTagSlots\s*\(/,
    // the online frame, which sets its own transform and never calls beginWorld
    'src/net/client.js': /resetNameTagSlots\s*\(/,
  };
  const missing = [];
  for (const [file, re] of Object.entries(paths)) {
    if (!re.test(readFileSync(file, 'utf8'))) missing.push(file);
  }
  assert.deepEqual(missing, [], `these frame paths draw nametags but never reset the slots:\n${missing.join('\n')}`);
});
