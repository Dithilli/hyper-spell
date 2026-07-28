// cast-kind.test.js — the spell archetype classifier.
//
// The classifier infers delivery by running regexes over each cast function's
// SOURCE. That makes it a rename away from silent failure: a rule whose helper
// got renamed matches nothing, the spell falls through to the 'bolt' default,
// and the mark on the tome quietly starts lying. Nothing throws, nothing logs.
//
// So "every spell got a verdict" is deliberately NOT the main assertion here —
// it passes just as happily when the answer is "everything is a bolt". The
// tests that matter are the ones that pin named spells to archetypes and assert
// the distribution stays non-degenerate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../src/sim/content.js';
import { SPELLS } from '../src/sim/spells/registry.js';
import { CAST_KINDS, castKind, classifyCast, classifyAllCasts } from '../src/sim/spells/cast-kind.js';

test('every spell classifies to a known kind', () => {
  const kinds = new Set(Object.keys(CAST_KINDS));
  const bad = [];
  for (const id of Object.keys(SPELLS)) {
    const k = castKind(id);
    if (!kinds.has(k)) bad.push(`${id} → ${k}`);
  }
  assert.deepEqual(bad, [], `unclassifiable spells:\n${bad.join('\n')}`);
});

// The load-bearing test. Each of these is a spell whose delivery a player can
// verify by casting it once, and between them they exercise every rule and both
// escape hatches. A rule that stops matching shows up here as a specific wrong
// answer rather than as a distribution that still looks plausible.
test('named spells classify to the archetype they actually play as', () => {
  const expected = {
    // falls out of the sky onto the spot you aimed at
    anvil: 'drop', piano: 'drop', cratedrop: 'drop', boulder: 'drop',
    frograin: 'drop', meteor: 'drop', starfall: 'drop',
    // hitscan: fires down a line the instant you press
    lightning: 'ray', railgun: 'ray', disintegrate: 'ray',
    // leaves a thing standing where you put it
    landmine: 'place', blackcat: 'place', rubberduck: 'place', trampoline: 'place',
    // radiates off you; aim is irrelevant
    frostnova: 'nova', bigbang: 'nova',
    // changes you, not them
    blink: 'self', ghostwalk: 'self', featherfall: 'self',
    // the ordinary thrown arc
    fireball: 'bolt', mortar: 'bolt', homing: 'bolt',
    // the four hand-written overrides
    chain: 'ray', boomerang: 'bolt', gust: 'nova', shove: 'nova',
  };
  const wrong = [];
  for (const [id, want] of Object.entries(expected)) {
    assert.ok(SPELLS[id], `test is stale: no spell "${id}"`);
    const got = castKind(id);
    if (got !== want) wrong.push(`${id}: expected ${want}, got ${got}`);
  }
  assert.deepEqual(wrong, [], `misclassified:\n${wrong.join('\n')}`);
});

// A dead rule does not throw — it just stops contributing. If any archetype
// empties out, a regex stopped matching the codebase it is reading.
test('every archetype is populated — no rule has gone dead', () => {
  const all = classifyAllCasts();
  const counts = {};
  for (const k of Object.keys(CAST_KINDS)) counts[k] = 0;
  for (const k of Object.values(all)) counts[k]++;
  const empty = Object.entries(counts).filter(([, n]) => n === 0).map(([k]) => k);
  assert.deepEqual(empty, [], `these rules matched nothing: ${empty.join(', ')}`);
  // and no single archetype may swallow the book: the 'bolt' fallback claiming
  // most of the game is exactly what a batch of dead rules looks like
  const total = Object.keys(all).length;
  for (const [k, n] of Object.entries(counts)) {
    assert.ok(n < total * 0.6, `${k} claims ${n}/${total} spells — a rule above it has probably gone dead`);
  }
});

test('classification is total and deterministic', () => {
  const a = classifyAllCasts();
  const b = classifyAllCasts();
  assert.equal(Object.keys(a).length, Object.keys(SPELLS).length, 'every spell must get a verdict');
  assert.deepEqual(a, b, 'classification must be deterministic');
});

test('an explicit flag beats inference, and an unknown id is null', () => {
  assert.equal(classifyCast('madeup', { beam: true, cast() { return 'dropProjectile'; } }), 'ray');
  assert.equal(classifyCast('madeup', { selfMove: true, cast() { return 'zapRay'; } }), 'self');
  assert.equal(castKind('no-such-spell'), null);
  assert.equal(castKind(null), null);
});

// The strip pass exists because `setVelocity(b, { x: 3, y: -5 })` is a launch
// impulse, not a body built above the ceiling. Without it, every ordinary
// upward-flung projectile reads as rain.
test('a launch impulse is not mistaken for a sky drop', () => {
  const launched = { cast(p) { const b = 1; setVelocity(b, { x: 4, y: -9 }); shoot(p, b); } };
  assert.equal(classifyCast('launched', launched), 'bolt', 'an upward impulse must not read as a drop');
  const dropped = { cast(p) { createBox(p.x, -40, 20, 20, {}); } };
  assert.equal(classifyCast('dropped', dropped), 'drop', 'a body built above the ceiling is a drop');
});
