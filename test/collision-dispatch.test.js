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

// rulesFor hands back the live dispatch list rather than a copy — a defensive
// copy per contact would allocate on the hottest path in the sim — so the list
// is frozen. Without that, one exported accessor plus one careless `.push` is a
// permanently wrong game with no error anywhere near the cause.
test('the resolved rule list cannot be mutated by a caller', () => {
  const list = rulesFor('tome', 'player');
  assert.throws(() => list.push(() => {}), TypeError);
  assert.deepEqual(rulesFor('tome', 'player').map((fn) => fn.name), ['contactDamage', 'contactExplode', 'tomePickup']);
});

test('a pair cooldown gates repeat hits per body pair, not globally', () => {
  resetTick(1);
  pairCooldown.clear();
  const a = { id: 1 }, b = { id: 2 }, c = { id: 3 };
  assert.equal(pairCooldown.ready(a, b, 400, 't'), true);
  assert.equal(pairCooldown.ready(a, b, 400, 't'), false, 'same pair is gated');
  assert.equal(pairCooldown.ready(a, c, 400, 't'), true, 'a different pair is not');
});

test('the key is unordered — (a, b) and (b, a) are the same gate', () => {
  resetTick(1);
  pairCooldown.clear();
  const a = { id: 7 }, b = { id: 4 };
  assert.equal(pairCooldown.ready(a, b, 400, 't'), true);
  assert.equal(pairCooldown.ready(b, a, 400, 't'), false);
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
  assert.equal(pairCooldown.readySelf(anvil, 400, 't'), true);
  assert.equal(pairCooldown.readySelf(anvil, 400, 't'), false);
  // and it is the same gate the pair form computes for (x, x)
  assert.equal(pairCooldown.ready(anvil, anvil, 400, 't'), false);
});

// THE ONE THIS SUITE ORIGINALLY MISSED, and it was a live gameplay bug rather
// than a theoretical one.
//
// `_stompAt`, `lastSpikeAt` and `_bossHurtAt` were three separate properties on
// the same player object. The first version of this module keyed a gate on the
// entity alone, so all three landed on one key: a wizard the boss had touched
// could not be spiked or stomped for 700ms, and stepping on spikes made you
// un-stompable. Both golden tapes stayed byte-identical through it and all
// fourteen tests passed, because every other test drives one gate at a time.
// Two gates on ONE entity is the axis, and this is the test that walks it.
test('the gates a single wizard can be under are independent of each other', () => {
  resetTick(100);
  pairCooldown.clear();
  const wiz = { id: 42 };
  assert.equal(pairCooldown.readySelf(wiz, 700, 'boss-touch'), true);
  assert.equal(pairCooldown.readySelf(wiz, 600, 'spikes'), true, 'a boss touch must not grant spike immunity');
  assert.equal(pairCooldown.readySelf(wiz, 600, 'stomp'), true, 'nor stomp immunity');
  assert.equal(pairCooldown.size, 3, 'three gates, three keys');
  // …and each still gates itself
  assert.equal(pairCooldown.readySelf(wiz, 700, 'boss-touch'), false);
  assert.equal(pairCooldown.readySelf(wiz, 600, 'spikes'), false);
  assert.equal(pairCooldown.readySelf(wiz, 600, 'stomp'), false);
  // the boss's 42-tick window is the longest; at tick 136 the two 36-tick ones
  // have reopened and it has not. Under one shared key, none of them would have.
  resetTick(136);
  assert.equal(pairCooldown.readySelf(wiz, 600, 'spikes'), true);
  assert.equal(pairCooldown.readySelf(wiz, 600, 'stomp'), true);
  assert.equal(pairCooldown.readySelf(wiz, 700, 'boss-touch'), false);
});

// A tag is not optional, because the failure mode of forgetting one is silent:
// two unrelated gates quietly share a window, which is exactly the bug above.
test('a gate without a tag is refused, not silently aliased', () => {
  resetTick(1);
  const a = { id: 1 }, b = { id: 2 };
  assert.throws(() => pairCooldown.ready(a, b, 400), /tag/);
  assert.throws(() => pairCooldown.readySelf(a, 400), /tag/);
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
    assert.equal(pairCooldown.ready(a, b, ms, 't'), true, `${ms}: opens`);
    for (let t = 1; t < ticks(ms); t++) {
      resetTick(100 + t);
      assert.equal(pairCooldown.ready(a, b, ms, 't'), false, `${ms}: still gated ${t} tick(s) later`);
    }
    resetTick(100 + ticks(ms));
    assert.equal(pairCooldown.ready(a, b, ms, 't'), true, `${ms}: ready after ${ticks(ms)} ticks`);
  }
});

test('clear() opens every gate — a new round starts clean', () => {
  resetTick(1);
  pairCooldown.clear();
  const a = { id: 1 }, b = { id: 2 };
  assert.equal(pairCooldown.ready(a, b, 400, 't'), true);
  assert.equal(pairCooldown.ready(a, b, 400, 't'), false);
  pairCooldown.clear();
  assert.equal(pairCooldown.size, 0);
  assert.equal(pairCooldown.ready(a, b, 400, 't'), true);
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
// short-circuits it before it damages anybody. What comes back is the entity the
// site scoped its gate to, the interval it asked for, and the tag it named it
// with — which is all three of the things this task had to preserve.
function spyGate(run) {
  const real = { ready: pairCooldown.ready, readySelf: pairCooldown.readySelf };
  const asked = [];
  pairCooldown.ready = (a, b, ms, tag) => { asked.push({ a, b, ms, tag }); return false; };
  pairCooldown.readySelf = (x, ms, tag) => { asked.push({ a: x, b: x, ms, tag }); return false; };
  try { run(); } finally { Object.assign(pairCooldown, real); }
  return asked;
}

// The five sites, each driven with the least fixture that reaches its gate.
const SITES = {
  'contact damage': () => {
    const [contactDamage] = rulesFor('anvil', 'player');
    const anvil = { id: 41, label: 'anvil', contactDamage: 55, owner: null, velocity: { x: 12, y: 0 }, position: { x: 0, y: 0 } };
    const wiz = { id: 42, label: 'player', velocity: { x: 0, y: 0 }, player: { body: { id: 42 } } };
    return { asked: spyGate(() => contactDamage(anvil, wiz)), scope: anvil };
  },
  stomp: () => {
    const [, , stomp] = rulesFor('player', 'player');
    const mk = (id, scale, y, vy) => ({
      id, label: 'player',
      player: { sizeScale: scale, alive: true, body: { id, position: { x: 0, y }, velocity: { x: 0, y: vy } } },
    });
    const big = mk(51, 2, 0, 5), small = mk(52, 1, 40, 0);
    return { asked: spyGate(() => stomp(big, small)), scope: small.player.body };
  },
  spikes: () => {
    const [, , spikes] = rulesFor('spikes', 'player');
    const strip = { id: 61, label: 'spikes' };
    const wiz = { id: 62, label: 'player', player: { body: { id: 62, velocity: { x: 0, y: 0 } } } };
    return { asked: spyGate(() => spikes(strip, wiz)), scope: wiz.player.body };
  },
  'boss touch': () => {
    const wiz = { alive: true, body: { id: 71, position: { x: 5, y: 5 } } };
    players.push(wiz);
    try {
      const bs = { dmgMult: 1, body: { bounds: { min: { x: 0, y: 0 }, max: { x: 10, y: 10 } }, position: { x: 5, y: 5 } } };
      return { asked: spyGate(() => bossTouchAll(bs, 10)), scope: wiz.body };
    } finally { players.length = 0; }
  },
  'enemy swing': () => {
    const wiz = { alive: true, body: { id: 81, position: { x: 0, y: 0 } } };
    players.push(wiz);
    try {
      const goon = { id: 82, position: { x: 0, y: 0 } };
      return { asked: spyGate(() => enemyStrike(goon, { dmg: 12, color: '#fff' }, 34)), scope: goon };
    } finally { players.length = 0; }
  },
};

test('contact damage asks for 400ms, scoped to the body doing the damage', () => {
  const { asked, scope } = SITES['contact damage']();
  assert.deepEqual(asked.map((q) => [q.ms, q.tag]), [[400, 'contact-damage']]);
  assert.equal(asked[0].a, scope, 'the gate is on the anvil, not on the pair');
  assert.equal(asked[0].b, scope);
});

test('the stomp asks for 600ms, scoped to the wizard being stomped', () => {
  const { asked, scope } = SITES.stomp();
  assert.deepEqual(asked.map((q) => [q.ms, q.tag]), [[600, 'stomp']]);
  assert.equal(asked[0].a, scope, 'the gate is on the victim, as `small._stompAt` was');
});

test('spikes ask for 600ms, scoped to the wizard — not to the spike body', () => {
  const { asked, scope } = SITES.spikes();
  assert.deepEqual(asked.map((q) => [q.ms, q.tag]), [[600, 'spikes']]);
  assert.equal(asked[0].a, scope, 'a strip built from several spike bodies still costs 20 once');
});

test('the boss body asks for 700ms, scoped to the wizard it is crushing', () => {
  const { asked, scope } = SITES['boss touch']();
  assert.deepEqual(asked.map((q) => [q.ms, q.tag]), [[700, 'boss-touch']]);
  assert.equal(asked[0].a, scope, 'the gate is on the wizard, as `p._bossHurtAt` was');
});

test('an enemy swing asks for 700ms, scoped to the enemy swinging', () => {
  const { asked, scope } = SITES['enemy swing']();
  assert.deepEqual(asked.map((q) => [q.ms, q.tag]), [[700, 'enemy-swing']]);
  assert.equal(asked[0].a, scope, 'one swing per enemy per window, as `b._touchAt` was — not per target');
});

// The tag is what makes `_stompAt` and `lastSpikeAt` two gates rather than one,
// so two sites sharing one is the same bug as no tags at all — and the five
// tests above cannot see it, because each looks at one site in isolation.
test('no two gate sites share a tag', () => {
  const tags = Object.values(SITES).flatMap((drive) => drive().asked.map((q) => q.tag));
  assert.equal(tags.length, 5, 'five sites, five gates');
  assert.equal(new Set(tags).size, 5, `two sites share a window: ${tags.join(', ')}`);
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
    pairCooldown.readySelf({ id: 987654 }, 700, 't');
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
  pairCooldown.readySelf({ id: 987655 }, 700, 't');
  assert.ok(pairCooldown.size > 0, 'the gate was taken');
  createWorld();
  try { assert.equal(pairCooldown.size, 0); } finally { destroyWorld(); }
});
