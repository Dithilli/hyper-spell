// vfx-descriptors.test.js — the other half of the sim/render split.
//
// Cosmetics that are one-shot leave the sim as events (test/emit-apply.test.js).
// Cosmetics that belong to a LIVING effect cannot: a tornado's funnel has to
// follow the tornado, and a sticky bomb's charge has to blink on the body it
// stuck to. Those effects stay in src/sim/spells/core.js's activeEffects, and
// what they carry for the screen is a `vfx` descriptor — plain data naming a
// look — which src/render/effects.js interprets.
//
// That mapping is exactly the shape of thing this plan keeps finding untested:
// a name on one side, a switch case on the other, and nothing that notices when
// they stop matching. A descriptor whose kind has no case draws NOTHING, throws
// NOTHING, and fails no other test in the suite — the spell simply becomes
// invisible. So the kinds are scanned out of src/sim and every one of them is
// put through the real drawer against a recording context.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { drawVfx, boltVisual, fxEffects, drawFxEffects, clearFxEffects } from '../src/render/effects.js';
import { particles } from '../src/render/fx.js';

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.js')) out.push(p);
  }
  return out;
}

function kindsInSim() {
  const kinds = new Set();
  for (const file of walk('src/sim')) {
    for (const [, k] of readFileSync(file, 'utf8').matchAll(/vfx:[^\n]*?\bk:\s*'([^']+)'/g)) kinds.add(k);
  }
  return [...kinds].sort();
}

// A recording 2d context. Every canvas method is counted; every property set is
// remembered. That is enough to tell "this kind drew something" from "this kind
// fell through the switch", which is the whole question.
function recorder() {
  const calls = [];
  const props = {};
  return new Proxy({}, {
    get(_, name) {
      if (name === '__calls') return calls;
      if (name === '__props') return props;
      return (...args) => { calls.push(name); return args.length === 1 && name === 'createLinearGradient' ? { addColorStop() {} } : undefined; };
    },
    set(_, name, value) { props[name] = value; calls.push(`set:${String(name)}`); return true; },
  });
}

// One representative descriptor per kind. Hand-written on purpose: a generated
// one would be shaped by whatever the drawer happens to read, which is the very
// thing under test. The assertion below forces this table to be updated when a
// new kind appears in src/sim.
const SAMPLES = {
  sing: { vfx: { k: 'sing', x: 100, y: 200 } },
  zone: { vfx: { k: 'zone', x: 100, y: 200, r: 90, c: '#d8f4ff' } },
  blizzard: { vfx: { k: 'blizzard', x: 100, y: 200, r: 240, c: '#d8f4ff' } },
  tor: { x: 300, vfx: { k: 'tor' } },
  firetor: { x: 300, vfx: { k: 'firetor' } },
  blink: { vfx: { k: 'blink', x: 10, y: 20, r: 7, a: '#d8b26a', b: '#ff5e57', rate: 0.025 } },
  pulsering: { vfx: { k: 'pulsering', x: 50, y: 60, r: 26, c: '#fff89e', lw: 2 } },
  rune: { vfx: { k: 'rune', x: 50, y: 60, r: 24, c: '#e8d5ff' } },
};

test('the scan finds the vfx kinds the sim really uses', () => {
  const kinds = kindsInSim();
  assert.ok(kinds.length >= 7, `expected the effect vocabulary, found ${kinds.join(', ')}`);
  assert.ok(kinds.includes('tor'), 'the tornado descriptor vanished — the scan is probably broken');
});

test('every vfx kind the sim writes has a drawer', () => {
  const untabled = kindsInSim().filter((k) => !SAMPLES[k]);
  assert.deepEqual(untabled, [], `no sample descriptor for: ${untabled.join(', ')} — add one and check it draws`);
});

test('every vfx kind actually draws something', () => {
  for (const [kind, effect] of Object.entries(SAMPLES)) {
    const ctx = recorder();
    drawVfx(effect, 1234, ctx);
    assert.ok(ctx.__calls.length > 0, `vfx kind '${kind}' fell through the switch and drew nothing`);
  }
});

// The scanner's own negative case: a kind that is not in the switch must come
// back silent, or "it drew something" proves nothing.
test('an unknown vfx kind draws nothing, and that is distinguishable', () => {
  const ctx = recorder();
  drawVfx({ vfx: { k: 'notakind' } }, 1234, ctx);
  assert.deepEqual(ctx.__calls, []);
  const none = recorder();
  drawVfx({}, 1234, none);
  assert.deepEqual(none.__calls, [], 'an effect with no vfx at all must be silent');
});

// Blizzard is the one descriptor whose drawer has a side effect: the snowfall
// inside the zone. It used to be `particles.push` inside a draw() closure in
// the spell book, rolling the ROUND's seeded stream at monitor rate — defect D1
// in one line. It is render-side randomness now, and it still snows.
test('the blizzard drawer still snows, on render randomness', () => {
  particles.length = 0;
  drawVfx(SAMPLES.blizzard, 1234, recorder());
  assert.equal(particles.length, 3, 'the blizzard stopped snowing');
  const a = particles.map((p) => p.x);
  particles.length = 0;
  drawVfx(SAMPLES.blizzard, 1234, recorder());
  assert.notDeepEqual(particles.map((p) => p.x), a, 'the snow is not random any more');
  particles.length = 0;
});

test('a bolt draws its polyline and then expires', () => {
  clearFxEffects();
  boltVisual(0, 0, 200, 100, '#fff89e', 3, 1);
  const ctx = recorder();
  drawFxEffects(0, ctx);
  assert.ok(ctx.__calls.filter((c) => c === 'lineTo').length === 9, 'the bolt lost its segments');
  drawFxEffects(1e9, recorder());
  assert.equal(fxEffects.length, 0, 'expired bolts are piling up');
});
