// bloom-budget.test.js — the light pass, headless.
//
// The whole of applyBloom is canvas compositing, so there is nothing here to
// assert about pixels without a real 2D context. What CAN be asserted, and what
// actually matters for this branch, is that the module is inert headless: the
// server imports the render tree through the bundle graph and never draws, and a
// stray document.createElement at import or call time would take the sim host
// down. Upstream's copy read `canvas` as a script-scope global and could not be
// imported at all outside a browser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyBloom, setBloomEnabled, bloomEnabled } from '../src/render/bloom.js';

test('importing bloom outside a browser costs nothing', () => {
  assert.equal(typeof applyBloom, 'function');
});

test('applyBloom is a no-op without a canvas', () => {
  assert.doesNotThrow(() => applyBloom(0), 'applyBloom must no-op headless');
  assert.doesNotThrow(() => { for (let i = 0; i < 5; i++) applyBloom(i * 16); });
});

test('the toggle round-trips and is respected', () => {
  const before = bloomEnabled();
  setBloomEnabled(!before);
  assert.equal(bloomEnabled(), !before);
  assert.doesNotThrow(() => applyBloom(0));
  setBloomEnabled(before);
  assert.equal(bloomEnabled(), before);
});
