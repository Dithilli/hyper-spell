import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  setBase, baseGravity, push, pop, currentGravity, clearModifiers, activeModifiers,
} from '../src/sim/gravity.js';
import { gravityY } from '../src/sim/phys/facade.js';
import { createWorld, destroyWorld } from '../src/sim/world.js';
import { createSim } from '../src/platform/node.js';
import { game, loadMap, startRound } from '../src/sim/match.js';
import { MAPS } from '../src/sim/maps/builders.js';
import { players } from '../src/sim/player/lifecycle.js';
import { castSpell } from '../src/sim/spells/core.js';
import { simNow } from '../src/sim/time.js';

const mapIndex = (frag) => MAPS.findIndex((m) => m.name.includes(frag.toUpperCase()));

// Put a wizard on the named map with `spellId` in slot 0 and cast it.
function castOn(bridge, frag, spellId) {
  const index = mapIndex(frag);
  if (!players.length) bridge.addPlayer({ name: 'probe' });
  startRound(index);
  assert.equal(game.mapIndex, index, 'the round must land on the requested map');
  const p = players[0];
  p.slots[0] = spellId;
  p.casts[0] = -1e9;
  castSpell(p, simNow(), 0);
}

// Every one of these needs an engine behind the facade: the stack writes the
// composed value through on every change, so there has to be something to
// write to. createWorld() is also what resets the stack between tests.
function fresh() {
  createWorld();
  clearModifiers();
}

test('overlapping modifiers compose and expire independently', () => {
  fresh(); setBase(2);
  const low = push({ kind: 'scale', value: 0.3 });
  const flip = push({ kind: 'flip' });
  assert.equal(currentGravity(), -0.6, 'low gravity AND flipped');
  pop(flip);
  assert.equal(currentGravity(), 0.6, 'popping the flip leaves the low gravity intact');
  pop(low);
  assert.equal(currentGravity(), 2);
  destroyWorld();
});

test('a map cycling gravity cannot cancel a spell', () => {
  fresh(); setBase(2);
  // Flip Zone rewrites gravity every tick. Under the old global it erased
  // Gravity Flip within one tick; as a base change it composes instead.
  const spell = push({ kind: 'flip' });
  setBase(-2); // the map's cycle
  assert.equal(currentGravity(), 2, 'map flip + spell flip = upright, spell still live');
  pop(spell);
  assert.equal(currentGravity(), -2, 'the map cycle survives the spell expiring');
  destroyWorld();
});

// ---------------------------------------------------------------------------
// THE AGGREGATE AUDIT.
//
// Task 10 unified five per-body cooldown stamps into one facility, audited
// every site individually, and still collapsed three independent gates onto one
// key — because a per-site audit cannot see an aggregation bug. Six gravity
// writers are being unified here, and the same shape is available: two
// modifiers that were independent because they were different variables
// becoming one entry, or two pushes that should stack sharing one slot.
//
// These tests assert on the aggregate: how many live modifiers there are, that
// same-kind ones do not merge, and that pop() removes the one it was handed
// rather than the newest or the first of its kind.
// ---------------------------------------------------------------------------

test('two modifiers of the SAME kind each get their own slot', () => {
  fresh(); setBase(2);
  const a = push({ kind: 'scale', value: 0.3 });
  const b = push({ kind: 'scale', value: 0.5 });
  assert.equal(activeModifiers().length, 2, 'same-kind pushes must not share a slot');
  assert.notEqual(a, b, 'each push gets its own identity');
  assert.equal(currentGravity(), 2 * 0.3 * 0.5, 'both apply');
  pop(a);
  assert.equal(currentGravity(), 2 * 0.5, 'the survivor is still live and still 0.5');
  pop(b);
  assert.equal(currentGravity(), 2);
  destroyWorld();
});

test('two IDENTICAL modifiers stack rather than dedupe', () => {
  // Two Moon Gravity casts overlapping. Deduping on (kind, value) would look
  // right at every call site and be wrong in the aggregate: the second cast
  // would be a no-op, and the first one's expiry would cancel both.
  fresh(); setBase(2);
  const first = push({ kind: 'scale', value: 0.3 });
  const second = push({ kind: 'scale', value: 0.3 });
  assert.equal(activeModifiers().length, 2);
  assert.equal(currentGravity(), 2 * 0.3 * 0.3);
  pop(first);
  assert.equal(currentGravity(), 2 * 0.3, 'the second cast outlives the first');
  pop(second);
  assert.equal(currentGravity(), 2);
  destroyWorld();
});

test('two flips stack — they do not collapse to one', () => {
  fresh(); setBase(2);
  const a = push({ kind: 'flip' });
  const b = push({ kind: 'flip' });
  assert.equal(activeModifiers().length, 2);
  assert.equal(currentGravity(), 2, 'flip of a flip is upright');
  pop(b);
  assert.equal(currentGravity(), -2, 'one flip still live');
  pop(a);
  assert.equal(currentGravity(), 2);
  destroyWorld();
});

test('pop removes the modifier it was handed, not the most recent one', () => {
  fresh(); setBase(2);
  const oldest = push({ kind: 'scale', value: 0.5 });
  push({ kind: 'scale', value: 0.25 });
  push({ kind: 'flip' });
  pop(oldest);
  assert.equal(currentGravity(), -(2 * 0.25), 'only the 0.5 left; the flip and the 0.25 stay');
  assert.deepEqual(
    activeModifiers().map((m) => m.kind),
    ['scale', 'flip'],
    'the newest two survive in order',
  );
  destroyWorld();
});

test('popping the same id twice removes only one modifier', () => {
  fresh(); setBase(2);
  const a = push({ kind: 'scale', value: 0.5 });
  push({ kind: 'scale', value: 0.5 });
  pop(a);
  pop(a); // an effect whose onEnd fires after loadMap already cleared it
  assert.equal(activeModifiers().length, 1, 'a stale pop must not eat a live modifier');
  assert.equal(currentGravity(), 1);
  destroyWorld();
});

test('ids are never reused, so a stale pop across a world reset is inert', () => {
  fresh(); setBase(2);
  const stale = push({ kind: 'flip' });
  clearModifiers();          // what loadMap does
  const live = push({ kind: 'scale', value: 0.3 });
  assert.notEqual(stale, live, 'the id counter must not restart');
  pop(stale);
  assert.equal(currentGravity(), 0.6, 'last round\'s expiry cannot cancel this round\'s spell');
  destroyWorld();
});

test('setBase changes the base and leaves every live modifier alone', () => {
  fresh(); setBase(2);
  push({ kind: 'scale', value: 0.3 });
  push({ kind: 'flip' });
  setBase(1.5);
  assert.equal(activeModifiers().length, 2, 'a base write must not clear the stack');
  assert.equal(baseGravity(), 1.5);
  assert.equal(currentGravity(), -(1.5 * 0.3));
  destroyWorld();
});

test('baseGravity() reports the base, never the composed value', () => {
  // Flip Zone and Blink compare gravity against the value they want to decide
  // whether to announce a banner. Comparing the COMPOSED value would retrigger
  // the banner every tick while a Gravity Flip is live.
  fresh(); setBase(1.5);
  push({ kind: 'flip' });
  assert.equal(baseGravity(), 1.5, 'the base is what the map owns');
  assert.equal(currentGravity(), -1.5);
  destroyWorld();
});

test('a set modifier overrides what is under it, in insertion order', () => {
  fresh(); setBase(2);
  push({ kind: 'scale', value: 0.3 });
  const s = push({ kind: 'set', value: 5 });
  assert.equal(currentGravity(), 5, 'set discards everything below it');
  push({ kind: 'flip' });
  assert.equal(currentGravity(), -5, 'and composes with what is above it');
  pop(s);
  assert.equal(currentGravity(), -(2 * 0.3));
  destroyWorld();
});

test('an unknown modifier kind is rejected at the push', () => {
  fresh(); setBase(2);
  assert.throws(() => push({ kind: 'nudge', value: 1 }), /nudge/);
  assert.equal(activeModifiers().length, 0, 'a rejected push leaves no residue');
  destroyWorld();
});

test('the composed value is what the physics engine actually gets', () => {
  fresh(); setBase(2);
  assert.equal(gravityY(), 2);
  const low = push({ kind: 'scale', value: 0.3 });
  assert.equal(gravityY(), 0.6, 'push writes through');
  setBase(-2);
  assert.equal(gravityY(), -0.6, 'setBase writes through');
  pop(low);
  assert.equal(gravityY(), -2, 'pop writes through');
  clearModifiers();
  assert.equal(gravityY(), -2, 'clearModifiers writes through');
  destroyWorld();
});

test('createWorld returns the stack to base 2 with nothing on it', () => {
  createWorld();
  setBase(9);
  push({ kind: 'flip' });
  createWorld();
  assert.equal(baseGravity(), 2);
  assert.equal(activeModifiers().length, 0);
  assert.equal(currentGravity(), 2);
  destroyWorld();
});

// The whole bug was six writers on one mutable global. Six became one, and this
// is what keeps it one: a seventh writer reaching past the stack straight at
// the engine would reintroduce exactly the failure this task closed, and would
// do it silently — the stack would still hold the right modifiers while the
// world had the wrong gravity.
//
// THE GATE COVERS BOTH DOORS, NOT JUST TODAY'S. The facade exports two gravity
// writers: setGravityY(y) and the vector-form setGravity({x, y, scale}). The
// second has no callers at all right now, which is exactly what makes it
// dangerous — a gate pinned to the name that happens to be in use today would
// stay green while `setGravity({ x: 0, y: v })` reintroduced C2. This is the
// same class of hole as a tag registry that lists today's tags: a guard that
// cannot see tomorrow's writer protects nothing when the writer arrives, and it
// cannot be added retroactively.
//
// server/ is walked as well as src/: the sim runs in the server process, and a
// host-side write would clobber the stack exactly as an in-sim one would.
//
// …but OUR server/, not its dependencies. server/node_modules is 51 of the 125
// files this used to scan, and one of them is matter-js — a physics library
// that could perfectly reasonably ship a `setGravity(` line of its own and turn
// a phase gate red for something no one in this repo wrote. A gate that cries
// wolf on `npm install` gets deleted, so the walk stops at the boundary of code
// we own.
test('nothing but src/sim/gravity.js writes gravity', () => {
  const walk = (dir, out = []) => {
    for (const name of readdirSync(dir)) {
      if (name === 'node_modules') continue;
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p, out);
      else if (p.endsWith('.js')) out.push(p);
    }
    return out;
  };
  const WRITER = /\bsetGravity(Y)?\s*\(/;
  const offenders = [];
  const scanned = [...walk('src'), ...walk('server')];
  // A skip is how a walk goes quiet. `continue` on a name is one typo away from
  // `continue` on everything, and an empty scan satisfies deepEqual([], []) as
  // happily as a clean tree does — so the walk states its own floor. Both
  // trees, both entry points: `src` alone is ~60 files, `server` ~9.
  assert.ok(scanned.length >= 60, `the walk went quiet: only ${scanned.length} files scanned`);
  assert.ok(scanned.some((f) => f.startsWith('server')), 'the walk stopped reaching server/');
  for (const file of scanned) {
    if (file === join('src', 'sim', 'gravity.js') || file.includes(join('sim', 'phys'))) continue;
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (WRITER.test(line) && !line.trimStart().startsWith('//')) {
        offenders.push(`${file}:${i + 1}  ${line.trim()}`);
      }
    });
  }
  assert.deepEqual(offenders, [], `gravity is composed, not assigned — use setBase/push:\n${offenders.join('\n')}`);
  // and the gate has to be looking at something: if the facade ever stops
  // exporting a second, vector-form writer, this carve-out is stale rather than
  // load-bearing and the regex should be simplified back.
  assert.match(readFileSync(join('src', 'sim', 'phys', 'facade.js'), 'utf8'), /^\s*setGravity,$/m,
    'facade no longer exports the vector-form writer — narrow WRITER back to setGravityY');
});

// ---------------------------------------------------------------------------
// The bug this task closes, end to end.
// ---------------------------------------------------------------------------

test('Gravity Flip survives a full second on a gravity-cycling map', () => {
  const { bridge, destroy } = createSim({});
  // load Glitch (writes gravity every tick), cast gravflip, and assert the
  // flip is still in effect 60 ticks later
  const flipped = bridge.debugCastOnMap('glitch', 'gravflip', 60);
  assert.equal(flipped, true, 'a legendary must not be erased by the map');
  destroy();
});

test('Gravity Flip survives a full second on Flip Zone, which cycles its base', () => {
  const { bridge, destroy } = createSim({});
  const flipped = bridge.debugCastOnMap('flip zone', 'gravflip', 60);
  assert.equal(flipped, true);
  destroy();
});

test('Moon Gravity survives a full second on a gravity-cycling map', () => {
  const { bridge, destroy } = createSim({});
  const live = bridge.debugCastOnMap('glitch', 'moongrav', 60);
  assert.equal(live, true, 'the map must not erase a scale modifier either');
  destroy();
});

// Glitch modulates gravity with a sine every tick. It has to modulate the map
// def's OWN declared gravity: reading the stack base back — which is what it
// just wrote — feeds its output into its next input and runs away
// exponentially. The composed value would compound the same way.
test('Glitch modulates the map base instead of compounding on its own output', () => {
  const { bridge, destroy } = createSim({});
  const index = mapIndex('glitch');
  bridge.addPlayer({ name: 'probe' });
  startRound(index);
  const declared = MAPS[index].gravity ?? 2;
  for (let i = 0; i < 300; i++) {
    bridge.stepSim();
    // the stated envelope: base * (1 ± 0.5)
    const g = Math.abs(currentGravity());
    assert.ok(
      g >= declared * 0.5 - 1e-9 && g <= declared * 1.5 + 1e-9,
      `tick ${i}: gravity ${currentGravity()} left the map's stated ±50% band around ${declared}`,
    );
  }
  destroy();
});

// Flip Zone and Blink announce only when the gravity they want CHANGES. That
// comparison has to be against the base: against the composed value, a live
// Gravity Flip makes it mismatch on every single tick, and the map re-announces
// (and re-flashes) sixty times a second for as long as the spell lasts.
test('a live Gravity Flip does not make a cycling map re-announce every tick', () => {
  const seen = [];
  const { bridge, destroy } = createSim({
    onFx: (name, args) => { if (name === 'setBanner') seen.push(String(args[0])); },
  });
  castOn(bridge, 'flip zone', 'gravflip');
  seen.length = 0; // ignore the cast's own 'GRAVITY!' banner
  for (let i = 0; i < 60; i++) bridge.stepSim();
  assert.deepEqual(
    seen.filter((t) => /GRAVITY (UP|DOWN)/.test(t)),
    [],
    'the map must not re-announce while a flip is live',
  );
  destroy();
});

test('loading a map takes every modifier off the stack', () => {
  const { bridge, destroy } = createSim({});
  castOn(bridge, 'flip zone', 'gravflip');
  assert.ok(activeModifiers().some((m) => m.kind === 'flip'), 'the flip is live before the load');
  loadMap(mapIndex('crate mountain'));
  assert.deepEqual(activeModifiers(), [], 'a round boundary drops every modifier');
  assert.equal(currentGravity(), baseGravity(), 'and gravity is exactly the new map\'s base');
  destroy();
});

// A control: the probe has to be able to report false, or the three tests above
// pass for the wrong reason. Gravity Flip lasts 2500ms; 180 ticks is 3000ms, by
// which point the effect has ended and popped its own modifier.
test('the survival probe reports false once the spell has actually expired', () => {
  const { bridge, destroy } = createSim({});
  const flipped = bridge.debugCastOnMap('glitch', 'gravflip', 180);
  assert.equal(flipped, false, 'the probe must be capable of saying no');
  destroy();
});
