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
import {
  CAST_KINDS, CAST_RULES, castKind, classifyCast, classifyAllCasts,
} from '../src/sim/spells/cast-kind.js';

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
    repulsor: 'nova',    // a zone centred on YOU, not a spot you picked
    earthquake: 'nova',  // moves every body in the world
    // changes you, not them
    blink: 'self', ghostwalk: 'self', featherfall: 'self',
    secondwind: 'self',  // healPlayer(p, …) — nothing leaves your hands
    moongrav: 'self',    // pushGravity — changes the world you both stand in
    // the ordinary thrown arc
    fireball: 'bolt', mortar: 'bolt', homing: 'bolt',
    napalm: 'bolt',      // leaves a fire behind, but you still throw it
    updraft: 'bolt',     // shoves bodies UP; must never read as "falls from above"
    // a zone put at a chosen spot
    blizzard: 'place', flamewall: 'place',
    // the hand-written overrides
    chain: 'ray', boomerang: 'bolt', gust: 'nova', shove: 'nova',
    teslacoil: 'place', beehive: 'place', midas: 'ray',
    soulharvest: 'nova', voodoo: 'nova', boobytrap: 'place',
  };
  const wrong = [];
  for (const [id, want] of Object.entries(expected)) {
    assert.ok(SPELLS[id], `test is stale: no spell "${id}"`);
    const got = castKind(id);
    if (got !== want) wrong.push(`${id}: expected ${want}, got ${got}`);
  }
  assert.deepEqual(wrong, [], `misclassified:\n${wrong.join('\n')}`);
});

// THE test for a source-scanning classifier. Every rule must be DECISIVE:
// disabling it has to change at least one spell's verdict. A rule nobody's
// verdict depends on is indistinguishable from one whose helper was renamed out
// from under it — both match nothing, neither throws, and the label just
// quietly starts lying.
//
// This replaces an "every archetype is populated" check that could not do the
// job: four of the six archetypes are held non-empty by things that bypass the
// rules entirely (the beam/selfMove flags, the overrides, the bolt default), so
// that assertion stayed green with the whole ray rule disabled.
test('every rule is decisive — disabling it changes a verdict', () => {
  const full = Object.fromEntries(Object.keys(SPELLS).map(id => [id, classifyCast(id, SPELLS[id])]));
  const inert = [];
  for (let i = 0; i < CAST_RULES.length; i++) {
    const without = CAST_RULES.filter((_, j) => j !== i);
    const changed = Object.keys(SPELLS)
      .filter(id => classifyCast(id, SPELLS[id], without) !== full[id]);
    if (!changed.length) inert.push(CAST_RULES[i][0]);
  }
  assert.deepEqual(inert, [], `these rules decide nothing — dead, or made redundant by an earlier rule: ${inert.join(', ')}`);
});

// Same argument one level down: a rule is a set of alternatives, and an
// individual alternative can rot while its siblings keep the rule alive.
test('every alternative within every rule matches something', () => {
  const dead = [];
  for (const [kind, re] of CAST_RULES) {
    for (const alt of re.source.split('|')) {
      // only split on top-level alternation; skip fragments left by splitting
      // inside a group, which are not valid patterns on their own
      let probe;
      try { probe = new RegExp(alt); } catch { continue; }
      const hits = Object.values(SPELLS).filter((def) => {
        const src = (typeof def.cast === 'function' ? String(def.cast) : '')
          .replace(/(?:set|add)Velocity\s*\([^)]*\)/g, '');
        return probe.test(src);
      });
      if (!hits.length) dead.push(`${kind}: /${alt}/`);
    }
  }
  assert.deepEqual(dead, [], `these clauses match no spell in the book:\n${dead.join('\n')}`);
});

test('classification covers every spell', () => {
  const all = classifyAllCasts();
  assert.deepEqual(
    Object.keys(all).sort(), Object.keys(SPELLS).sort(),
    'classifyAllCasts must return a verdict per registered spell',
  );
});

// Determinism that can actually fail: classify from scratch, bypassing the
// `_cast` cache that made the old version of this test compare a value with
// itself.
test('classification is deterministic from scratch', () => {
  const fresh = () => Object.fromEntries(Object.keys(SPELLS).map(id => [id, classifyCast(id, SPELLS[id])]));
  assert.deepEqual(fresh(), fresh(), 'the same book must classify the same way twice');
  const cached = classifyAllCasts();
  assert.deepEqual(cached, fresh(), 'the cached verdicts must agree with a fresh classification');
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
