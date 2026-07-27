import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rulesFor, pairCooldown } from '../src/sim/collision.js';
import { bossTouchAll } from '../src/sim/ai/boss.js';
import { enemyStrike } from '../src/sim/ai/enemies.js';
import { players } from '../src/sim/player/lifecycle.js';
import { loadMap } from '../src/sim/match.js';
import { createWorld, destroyWorld } from '../src/sim/world.js';
import { resetTick, ticks } from '../src/sim/time.js';
import { createSim } from '../src/platform/node.js';
import { makeClock } from './harness/clock.js';

// The rules are registered at module load and never change, so `rulesFor` is a
// pure function of two labels and these assertions need no world.

test('every rule is registered against an ordered label pair', () => {
  assert.ok(rulesFor('projectile', 'player').length > 0);
  assert.ok(rulesFor('tome', 'player').length > 0);
  assert.ok(rulesFor('banana', 'player').length > 0);
  assert.ok(rulesFor('lava', 'player').length > 0);
});

// THE ORDER IS THE CONTRACT, not an implementation detail. The handler this
// table replaced ran eleven `if` blocks top to bottom for every contact, in one
// fixed order, and several of them touch the same body: the projectile rule
// deletes the projectile the contactDamage rule would otherwise read, and the
// lava rule removes the body every other rule is about. A table that matched
// the same rules in a different order would be a different game.
//
// Two of the eleven are registered against a wildcard `a` (contactDamage and
// contactExplode fire against a wizard whatever hit them), so their place in a
// given pair's list is not the place they were registered at — for
// `banana|player` they run BEFORE the banana rule, for `projectile|player`
// AFTER the projectile rule. Asserting the resolved list per pair is what pins
// that, and it is what fails if two registrations are swapped.
test('the table resolves each pair to the old handler’s block order', () => {
  const names = (a, b) => rulesFor(a, b).map((fn) => fn.name);
  assert.deepEqual(names('projectile', 'player'), ['projectileHit', 'contactDamage', 'contactExplode']);
  assert.deepEqual(names('banana', 'player'), ['contactDamage', 'contactExplode', 'bananaSlip']);
  assert.deepEqual(names('player', 'player'), ['contactDamage', 'contactExplode', 'stomp']);
  assert.deepEqual(names('tramp', 'player'), ['contactDamage', 'contactExplode', 'trampoline']);
  assert.deepEqual(names('tome', 'player'), ['contactDamage', 'contactExplode', 'tomePickup']);
  assert.deepEqual(names('hat', 'player'), ['contactDamage', 'contactExplode', 'hatPickup']);
  assert.deepEqual(names('icicle', 'player'), ['contactDamage', 'contactExplode', 'icicleFall']);
  assert.deepEqual(names('spikes', 'player'), ['contactDamage', 'contactExplode', 'spikes']);
  // the projectile rule still runs first against lava and bows out inside, the
  // way the old `b.label !== 'lava'` guard did
  assert.deepEqual(names('projectile', 'lava'), ['projectileHit', 'lava']);
  assert.deepEqual(names('player', 'lava'), ['lava']);
  assert.deepEqual(names('projectile', 'boss'), ['projectileHit']);
  assert.deepEqual(names('crate', 'crate'), []);
});

test('a pair cooldown gates repeat hits per body pair, not globally', () => {
  resetTick(1);
  pairCooldown.clear();
  const a = { id: 1 }, b = { id: 2 }, c = { id: 3 };
  assert.equal(pairCooldown.ready(a, b, 400), true);
  assert.equal(pairCooldown.ready(a, b, 400), false, 'same pair is gated');
  assert.equal(pairCooldown.ready(a, c, 400), true, 'a different pair is not');
});

test('the key is unordered — (a, b) and (b, a) are the same gate', () => {
  resetTick(1);
  pairCooldown.clear();
  const a = { id: 7 }, b = { id: 4 };
  assert.equal(pairCooldown.ready(a, b, 400), true);
  assert.equal(pairCooldown.ready(b, a, 400), false);
});

// readySelf is the shape four of the five stamps this replaced actually had:
// `a._cdAt` gated the damaging body against EVERY wizard, not against one of
// them, and widening it to (attacker, victim) would let one anvil hit two
// wizards inside one 400ms window. That is a behaviour change, and this task is
// not allowed to make one.
test('readySelf gates one entity against all comers', () => {
  resetTick(1);
  pairCooldown.clear();
  const anvil = { id: 11 };
  assert.equal(pairCooldown.readySelf(anvil, 400), true);
  assert.equal(pairCooldown.readySelf(anvil, 400), false);
  // and it is the same gate the pair form computes for (x, x)
  assert.equal(pairCooldown.ready(anvil, anvil, 400), false);
});

// Each of the three intervals, at its own length: the gate opens ticks(ms)
// later, which is the duration as authored. See THE BOUNDARY in cooldown.js —
// this is the assertion that pins which of the two comparisons the five
// pre-refactor sites disagreed about was adopted.
test('a gate lasts exactly ticks(ms) and reopens on that tick', () => {
  for (const ms of [400, 600, 700]) {
    pairCooldown.clear();
    const a = { id: 1 }, b = { id: 2 };
    resetTick(100);
    assert.equal(pairCooldown.ready(a, b, ms), true, `${ms}: opens`);
    for (let t = 1; t < ticks(ms); t++) {
      resetTick(100 + t);
      assert.equal(pairCooldown.ready(a, b, ms), false, `${ms}: still gated ${t} tick(s) later`);
    }
    resetTick(100 + ticks(ms));
    assert.equal(pairCooldown.ready(a, b, ms), true, `${ms}: ready after ${ticks(ms)} ticks`);
  }
});

test('clear() opens every gate — a new round starts clean', () => {
  resetTick(1);
  pairCooldown.clear();
  const a = { id: 1 }, b = { id: 2 };
  assert.equal(pairCooldown.ready(a, b, 400), true);
  assert.equal(pairCooldown.ready(a, b, 400), false);
  pairCooldown.clear();
  assert.equal(pairCooldown.size, 0);
  assert.equal(pairCooldown.ready(a, b, 400), true);
});

// ---------------------------------------------------------------------------
// The five intervals, at the five sites that ask for them.
//
// NEITHER GOLDEN TAPE COVERS THIS. Instrumenting both tapes, the 4,200-tick
// three-round run asks for a gate twelve times and every one of them is the
// 400ms contact-damage gate; the 600-tick run asks zero times. So "the tape did
// not move" is evidence about contact damage and about nothing else — a stomp,
// spike, boss-touch or enemy-swing interval could be retyped to any number at
// all and both tapes would stay green.
//
// A spy that answers "gated" lets each site be asked what it wanted without
// needing a world: every one of the five calls the gate LAST, so a false answer
// short-circuits it before it damages anybody. What comes back is the pair the
// site asked about and the interval it asked for — which is both halves of what
// this task had to preserve.
function spyGate(run) {
  const real = { ready: pairCooldown.ready, readySelf: pairCooldown.readySelf };
  const asked = [];
  pairCooldown.ready = (a, b, ms) => { asked.push({ a, b, ms }); return false; };
  pairCooldown.readySelf = (x, ms) => { asked.push({ a: x, b: x, ms }); return false; };
  try { run(); } finally { Object.assign(pairCooldown, real); }
  return asked;
}

test('contact damage asks for 400ms, scoped to the body doing the damage', () => {
  const [contactDamage] = rulesFor('anvil', 'player');
  const anvil = { id: 41, label: 'anvil', contactDamage: 55, owner: null, velocity: { x: 12, y: 0 }, position: { x: 0, y: 0 } };
  const wiz = { id: 42, label: 'player', velocity: { x: 0, y: 0 }, player: { body: { id: 42 } } };
  const asked = spyGate(() => contactDamage(anvil, wiz));
  assert.deepEqual(asked.map((q) => q.ms), [400]);
  assert.equal(asked[0].a, anvil, 'the gate is on the anvil, not on the pair');
  assert.equal(asked[0].b, anvil);
});

test('the stomp asks for 600ms, scoped to the wizard being stomped', () => {
  const [, , stomp] = rulesFor('player', 'player');
  const mk = (id, scale, y, vy) => ({
    id, label: 'player',
    player: { sizeScale: scale, alive: true, body: { id, position: { x: 0, y }, velocity: { x: 0, y: vy } } },
  });
  const big = mk(51, 2, 0, 5), small = mk(52, 1, 40, 0);
  const asked = spyGate(() => stomp(big, small));
  assert.deepEqual(asked.map((q) => q.ms), [600]);
  assert.equal(asked[0].a, small.player.body, 'the gate is on the victim, as `small._stompAt` was');
});

test('spikes ask for 600ms, scoped to the wizard — not to the spike body', () => {
  const [, , spikes] = rulesFor('spikes', 'player');
  const strip = { id: 61, label: 'spikes' };
  const wiz = { id: 62, label: 'player', player: { body: { id: 62, velocity: { x: 0, y: 0 } } } };
  const asked = spyGate(() => spikes(strip, wiz));
  assert.deepEqual(asked.map((q) => q.ms), [600]);
  assert.equal(asked[0].a, wiz.player.body, 'a strip built from several spike bodies still costs 20 once');
});

test('the boss body asks for 700ms, scoped to the wizard it is crushing', () => {
  const wiz = { alive: true, body: { id: 71, position: { x: 5, y: 5 } } };
  players.push(wiz);
  try {
    const bs = { dmgMult: 1, body: { bounds: { min: { x: 0, y: 0 }, max: { x: 10, y: 10 } }, position: { x: 5, y: 5 } } };
    const asked = spyGate(() => bossTouchAll(bs, 10));
    assert.deepEqual(asked.map((q) => q.ms), [700]);
    assert.equal(asked[0].a, wiz.body, 'the gate is on the wizard, as `p._bossHurtAt` was');
  } finally { players.length = 0; }
});

test('an enemy swing asks for 700ms, scoped to the enemy swinging', () => {
  const wiz = { alive: true, body: { id: 81, position: { x: 0, y: 0 } } };
  players.push(wiz);
  try {
    const goon = { id: 82, position: { x: 0, y: 0 } };
    const asked = spyGate(() => enemyStrike(goon, { dmg: 12, color: '#fff' }, 34));
    assert.deepEqual(asked.map((q) => q.ms), [700]);
    assert.equal(asked[0].a, goon, 'one swing per enemy per window, as `b._touchAt` was — not per target');
  } finally { players.length = 0; }
});

// The stamps this replaced were self-cleaning: `a._cdAt` lived on the anvil and
// died with it. A pair-keyed map is not — an entry outlives the bodies it names —
// so the round boundary is where it is emptied, and this is the only thing that
// says so. Left to the golden tapes it would go unnoticed: dropping the clear
// from loadMap moves neither of them, because a gate taken at the end of a round
// has always expired long before the next round's first contact.
test('loadMap opens every gate — a round does not inherit the last one’s', () => {
  const sim = createSim({ clock: makeClock(0) });
  try {
    pairCooldown.readySelf({ id: 987654 }, 700);
    assert.ok(pairCooldown.size > 0, 'the gate was taken');
    loadMap(0);
    assert.equal(pairCooldown.size, 0);
  } finally { sim.destroy(); }
});

// …and the world-reset hook underneath it. Today every createWorld() in the
// platforms is followed by loadMap(0), so the hook is belt to loadMap's braces
// and nothing else would notice it going. src/sim/world.js's contract is that a
// module owning mutable state registers one, and a contract nothing checks is
// the one that quietly stops being true.
test('createWorld opens every gate — a rebuilt world inherits nothing', () => {
  pairCooldown.readySelf({ id: 987655 }, 700);
  assert.ok(pairCooldown.size > 0, 'the gate was taken');
  createWorld();
  try { assert.equal(pairCooldown.size, 0); } finally { destroyWorld(); }
});
