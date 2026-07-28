// content-intent.test.js — the seven places where the content did not behave
// the way the content says it behaves.
//
//   C1  Roulette and Mirror Cast rolled over EVERY registered spell, hybrids
//       included, so ~25% of Roulette casts handed out a fusion-only spell for
//       free — against the rule that hybrids exist only through fusion.
//   C3  Deferred spawners read p.mega when each bolt FIRED, not when the spell
//       was cast, so a HYPERSPELL proc landing mid-cast retroactively
//       supercharged the rest of Dragon's Breath.
//   C4  Three readers each computed "how far through the cooldown" from
//       SPELLS[id].cooldown, but the cast gate enforced max(cooldown, 480).
//       Four spells declare less than 480 and read "ready" while refusing to
//       fire.
//   C7  Wave mode's best score went through localStorage, which headless was
//       shimmed to null — an online run could never remember a best wave.
//   C8  Sixteen freeze sites wrote q.body.frictionAir directly and one
//       transition check in updatePlayers restored it. The status now owns both
//       halves — WITHOUT unifying the sixteen sites' composition rules, which
//       are not all the same (see the census below).
//   C9  Round teardown truncated activeEffects, silently skipping every pending
//       onEnd. That is the right behaviour and the wrong way to say it.
//   C11 Butterfingers annihilating a charged fusion is deliberate (spec §6).
//   C12 The boss is untouchable until its entrance banner lands (spec §6).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';

import '../src/sim/content.js'; // fills SPELLS/MAPS; nothing below works without it
import { SPELLS } from '../src/sim/spells/registry.js';
import { roulettePool, mirrorPool } from '../src/sim/spells/book.js';
import {
  CAST_FLOOR, effectiveCooldown, resolvePotency, castSpell, projectiles, activeEffects,
} from '../src/sim/spells/core.js';
import * as phys from '../src/sim/phys/facade.js';
import { createWorld, destroyWorld } from '../src/sim/world.js';
import { game, loadMap } from '../src/sim/match.js';
import { createPlayer, spawnPlayer, disarmPlayer } from '../src/sim/player/lifecycle.js';
import {
  applyFreeze, freezeUntil, tickStatuses, BASE_FRICTION_AIR, FROZEN_FRICTION_AIR,
} from '../src/sim/player/status.js';
import { serializeSnapshot } from '../src/sim/snapshot.js';
import { simNow, resetTick } from '../src/sim/time.js';
import { damageBoss, spawnBoss } from '../src/sim/ai/boss.js';
import { setStorage } from '../src/sim/storage.js';
import { startRun, endRun } from '../src/sim/waves.js';
import { createSim, fileStorage } from '../src/platform/node.js';

const read = (p) => readFileSync(p, 'utf8');

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.js')) out.push(p);
  }
  return out;
}

// The registration block for one spell, as source text: from its regSpell/
// regHybrid line to the next one. Used where the claim really is about how the
// content is WIRED rather than about a value it produces.
function spellSource(file, id) {
  const src = read(file);
  const start = [`regSpell('${id}'`, `regHybrid('${id}'`]
    .map((needle) => src.indexOf(needle)).find((i) => i > 0);
  assert.ok(start > 0, `${id} not registered in ${file}`);
  const next = src.indexOf('\nregSpell(', start);
  const nextH = src.indexOf('\nregHybrid(', start);
  const ends = [next, nextH].filter((n) => n > 0);
  return src.slice(start, ends.length ? Math.min(...ends) : src.length);
}

// A world with a map and one wizard on it. Every behavioural test below builds
// its own and tears it down: createWorld() fires every module's reset hook, so
// two tests sharing one would not be independent.
function withWorld(fn) {
  resetTick();
  createWorld();
  loadMap(0);
  try { return fn(); } finally { destroyWorld(); }
}

function aWizard(spellId) {
  const p = createPlayer(0, null);
  spawnPlayer(p, { x: 300, y: 200 });
  if (spellId) { p.slots[0] = spellId; p.casts[0] = -1e9; }
  return p;
}

// ---------------------------------------------------------------- C1

test('C1: Roulette can never roll a hybrid — hybrids exist only through fusion', () => {
  const pool = roulettePool();
  const hybrids = pool.filter((id) => SPELLS[id].hybrid);
  assert.deepEqual(hybrids, [], `hybrids must not be reachable from Roulette: ${hybrids}`);
  assert.ok(pool.length > 90, `the pool is still the whole non-hybrid book, got ${pool.length}`);
  // and it is a real subset — a pool that dropped everything would satisfy the
  // "no hybrids" claim just as well
  assert.equal(pool.length, Object.keys(SPELLS).filter((k) => !SPELLS[k].hybrid).length - 2,
    'the pool is every non-hybrid spell except Roulette and Mirror Cast themselves');
  assert.equal(pool.includes('roulette'), false);
  assert.equal(pool.includes('mirrorcast'), false);
});

test('C1: Mirror Cast cannot copy a hybrid either', () => {
  const pool = mirrorPool();
  assert.equal(pool.some((id) => SPELLS[id].hybrid), false);
  assert.ok(pool.length > 90);
});

test('C1: both spells actually draw from those pools', () => {
  const roul = spellSource('src/sim/spells/book.js', 'roulette');
  assert.match(roul, /roulettePool\(\)/, 'Roulette must pick from roulettePool()');
  assert.doesNotMatch(roul, /Object\.keys\(SPELLS\)/, 'and must not re-derive its own pool');
  const mirror = spellSource('src/sim/spells/book.js', 'mirrorcast');
  assert.match(mirror, /mirrorEligible\(/, 'Mirror Cast must gate the copied id on mirrorEligible()');
});

// ---------------------------------------------------------------- C3

test('C3: an explicitly threaded potency beats the caster live value', () => {
  const p = { mega: 2.2 }; // a HYPERSPELL proc landed after the cast began
  assert.equal(resolvePotency(p, { m: 1 }), 1, 'the bolt keeps the potency it was cast with');
  assert.equal(resolvePotency(p, {}), 2.2, 'an immediate cast still reads the caster');
  assert.equal(resolvePotency({}, {}), 1, 'no potency anywhere is 1');
  assert.equal(resolvePotency({ mega: 1.7 }, { m: 2.2 }), 2.2, 'and the thread wins when it is the bigger one too');
});

test("C3: Dragon's Breath threads its potency into every deferred bolt", () => {
  const breath = spellSource('src/sim/spells/book.js', 'dragonbreath');
  assert.match(breath, /const m = p\.mega \|\| 1/, 'potency is captured at cast');
  assert.match(breath, /boomBolt\(p, \{[^}]*\bm\b/, 'and passed into each deferred bolt');
});

test('C3: the bolt primitives resolve potency instead of reading the caster raw', () => {
  const src = read('src/sim/spells/book.js');
  // boomBolt and statusBolt take an options bag and so can be threaded;
  // zapRay is a beam with no bag and is never called deferred, so it resolves
  // against the caster alone — but it still goes through the one helper.
  for (const [fn, want] of [['boomBolt', /resolvePotency\(p, o\)/], ['statusBolt', /resolvePotency\(p, o\)/], ['zapRay', /resolvePotency\(p\)/]]) {
    const at = src.indexOf(`function ${fn}(`);
    assert.ok(at > 0, `${fn} not found`);
    const body = src.slice(at, at + 400);
    assert.match(body, want, `${fn} must resolve its potency`);
    assert.doesNotMatch(body, /const m = p\.mega \|\| 1/, `${fn} must not read p.mega directly`);
  }
});

// ---------------------------------------------------------------- C4

// The floor is what the cast gate enforces, so it is what every reader has to
// report. Derived from SPELLS rather than hard-coded: the claim is about the
// spells that ARE below the floor, whichever those turn out to be.
const SUB_FLOOR = Object.entries(SPELLS).filter(([, s]) => s.cooldown < CAST_FLOOR).map(([id]) => id);

test('C4: the cooldown shown is the cooldown enforced', () => {
  assert.deepEqual(SUB_FLOOR.sort(), ['ember', 'fireball', 'iceshard', 'zapspell'],
    'the sub-floor set changed — check the new members are meant to be there');
  for (const id of SUB_FLOOR) {
    assert.equal(effectiveCooldown(id), CAST_FLOOR, `${id} must report the floor, not ${SPELLS[id].cooldown}`);
  }
  // ...and a spell above the floor still reports its own number, so a helper
  // that simply returned CAST_FLOOR would not pass
  for (const id of ['permafrost', 'sunburst', 'flashfreeze']) {
    assert.equal(effectiveCooldown(id), SPELLS[id].cooldown, `${id} keeps its declared cooldown`);
  }
  assert.equal(effectiveCooldown('no-such-spell'), CAST_FLOOR, 'an unknown id floors rather than throwing');
});

test('C4: the gate a sub-floor spell is actually held to is the floor', () => withWorld(() => {
  const p = aWizard('fireball');
  const n0 = projectiles.size;
  castSpell(p, 0, 0);
  assert.ok(projectiles.size > n0, 'the first cast fires');
  const n1 = projectiles.size;
  castSpell(p, SPELLS.fireball.cooldown + 10, 0); // 460ms: past the declared cooldown
  assert.equal(projectiles.size, n1, 'a recast inside CAST_FLOOR is refused');
  castSpell(p, CAST_FLOOR + 1, 0);
  assert.ok(projectiles.size > n1, 'and allowed once the floor has passed');
}));

test('C4: the wire reports the cooldown that is enforced, not the one declared', () => withWorld(() => {
  const p = aWizard();
  p.slots[0] = 'fireball';       // 450ms declared, 480ms enforced
  p.slots[1] = 'permafrost';     // 2800ms, above the floor — a control
  // 460ms elapsed: past fireball's declared cooldown, short of the floor
  p.casts[0] = simNow() - (SPELLS.fireball.cooldown + 10);
  p.casts[1] = simNow() - (SPELLS.fireball.cooldown + 10);
  const snap = serializeSnapshot();
  const me = snap.ps.find((e) => e.s === p.slot);
  assert.ok(me.c0 < 1, `c0 must not read full at 460/480ms, got ${me.c0}`);
  assert.equal(me.c0, +Math.min(1, 460 / CAST_FLOOR).toFixed(2));
  assert.ok(!me.rd, 'and the ready flag must not be set');
  // the control still divides by its own, larger number
  assert.equal(me.c1, +(460 / SPELLS.permafrost.cooldown).toFixed(2));
}));

test('C4: every "is it ready" reader is drawn from the same number', () => {
  const hud = read('src/render/hud.js');
  assert.match(hud, /effectiveCooldown\(/, 'the HUD must fill its bar from effectiveCooldown');
  assert.doesNotMatch(hud, /SPELLS\[p\.slots\[s\]\]\.cooldown/, 'and not from the declared cooldown');
  const snap = read('src/sim/snapshot.js');
  assert.match(snap, /effectiveCooldown\(/);
  assert.doesNotMatch(snap, /SPELLS\[p\.(spellId|slots\[[01]\])\]\.cooldown/,
    'the wire must not divide by the declared cooldown either');
  // the wizard's hand glow is the third thing a player reads as "ready"
  const wiz = read('src/render/draw-wizard.js');
  assert.match(wiz, /const ready = spell && now - p\.lastCast > effectiveCooldown\(/);
  assert.doesNotMatch(wiz, /p\.lastCast > spell\.cooldown/);
});

// ---------------------------------------------------------------- C8

test('C8: a freeze slicks the body it freezes, and the status owns that', () => withWorld(() => {
  const p = aWizard();
  phys.setFrictionAir(p.body, BASE_FRICTION_AIR);
  applyFreeze(p, simNow() + 900);
  assert.equal(p.frozenUntil, simNow() + 900);
  assert.equal(p.body.frictionAir, FROZEN_FRICTION_AIR);
}));

test('C8: freezeUntil sets the deadline and leaves the body alone', () => withWorld(() => {
  // Ice Shard, Blizzard's chill and Pandemonium's roll never wrote frictionAir.
  // Whether they should is a balance question; that they currently do not is a
  // fact, and it is pinned here rather than quietly normalised away.
  const p = aWizard();
  phys.setFrictionAir(p.body, BASE_FRICTION_AIR);
  freezeUntil(p, simNow() + 450);
  assert.equal(p.frozenUntil, simNow() + 450, 'the wizard is frozen');
  assert.equal(p.body.frictionAir, BASE_FRICTION_AIR, 'but not slicked');
}));

test('C8: applyFreeze OVERWRITES the deadline — it does not silently extend it', () => withWorld(() => {
  // Sixteen call sites, and only three of them compose with Math.max. Burying a
  // max inside the helper would hand the other thirteen a rule they never had:
  // a late 450ms Ice Shard genuinely cuts a live 2600ms Permafrost short.
  const p = aWizard();
  applyFreeze(p, 5000);
  applyFreeze(p, 1000);
  assert.equal(p.frozenUntil, 1000, 'the second freeze replaced the first');
}));

test('C8: the thaw restores the body and leaves the wizard Wet', () => withWorld(() => {
  const p = aWizard();
  applyFreeze(p, simNow() + 100);
  tickStatuses(p, simNow());
  assert.equal(p.wasFrozen, true);
  assert.equal(p.body.frictionAir, FROZEN_FRICTION_AIR, 'still frozen: still slick');
  tickStatuses(p, simNow() + 200); // past the deadline
  assert.equal(p.wasFrozen, false);
  assert.equal(p.body.frictionAir, BASE_FRICTION_AIR, 'the thaw restores the body');
  assert.equal(p.wetUntil, simNow() + 200 + 4500, 'and leaves them Wet');
}));

test('C8: nothing outside the status module writes frozenUntil or the frozen friction', () => {
  // THE AGGREGATE GUARD. Task 10 unified five per-body cooldown stamps and lost
  // the identity the property names were carrying. The same shape is here: the
  // whole point of applyFreeze is that the freeze and its physical side effect
  // travel together, which is only true if no site can still do one without the
  // other.
  const OWNERS = new Set(['src/sim/player/status.js']);
  const CLEARS = /frozenUntil\s*=\s*0\b/;         // clearStatuses / SHATTER / createPlayer
  const offenders = [];
  for (const file of walk('src/sim')) {
    const rel = relative(process.cwd(), file);
    if (OWNERS.has(rel)) continue;
    read(file).split('\n').forEach((line, i) => {
      const t = line.trim();
      if (t.startsWith('//') || t.startsWith('*')) return;
      if (/\.frozenUntil\s*=/.test(line) && !CLEARS.test(line)) offenders.push(`${rel}:${i + 1} frozenUntil`);
      if (/setFrictionAir\([^)]*0\.001/.test(line)) offenders.push(`${rel}:${i + 1} frozen frictionAir`);
      if (/frictionAir\s*=\s*0\.001/.test(line)) offenders.push(`${rel}:${i + 1} frozen frictionAir`);
    });
  }
  assert.deepEqual(offenders, [], `freeze must go through status.js:\n${offenders.join('\n')}`);
});

test('C8: the census of freeze sites — each keeps the composition rule it had', () => {
  // Every call site, tagged with which helper it uses and whether it composes
  // with Math.max. This is the table that would have caught task 10's collapse,
  // recorded before the move and asserted after it: the counts are the
  // per-site semantics that a "tidy them all into one form" edit destroys.
  //
  //   applyFreeze  freeze + slick the body (the 16 sites that wrote both)
  //   freezeUntil  freeze ONLY (the 3 sites that never touched frictionAir:
  //                Ice Shard, Blizzard's per-tick chill, Pandemonium's roll)
  const EXPECTED = {
    'src/sim/ai/boss.js applyFreeze': 1,
    'src/sim/maps/builders.js applyFreeze+max': 1,
    'src/sim/spells/book.js applyFreeze': 5,
    'src/sim/spells/book.js freezeUntil': 1,
    'src/sim/spells/book.js freezeUntil+max': 1,
    'src/sim/spells/fusion.js applyFreeze': 7,
    'src/sim/spells/fusion.js applyFreeze+max': 1,
    'src/sim/spells/fusion.js freezeUntil': 1,
    'src/sim/spells/starters.js applyFreeze': 1,
  };
  const census = {};
  for (const file of walk('src/sim')) {
    const rel = relative(process.cwd(), file);
    if (rel === 'src/sim/player/status.js') continue;
    read(file).split('\n').forEach((line) => {
      const t = line.trim();
      if (t.startsWith('//') || t.startsWith('import') || t.includes('} from ')) return;
      for (const fn of ['applyFreeze', 'freezeUntil']) {
        for (const m of line.matchAll(new RegExp(`\\b${fn}\\(`, 'g'))) {
          // does THIS call's argument list compose with the live deadline?
          const arg = line.slice(m.index).slice(0, 160);
          const key = `${rel} ${fn}${/Math\.max/.test(arg) ? '+max' : ''}`;
          census[key] = (census[key] || 0) + 1;
        }
      }
    });
  }
  assert.deepEqual(census, EXPECTED);
  const total = Object.values(census).reduce((a, b) => a + b, 0);
  assert.equal(total, 19, 'all nineteen freeze sites are accounted for');
});

// ---------------------------------------------------------------- C9

test('C9: round teardown ABANDONS pending effects — it does not resolve them', () => withWorld(() => {
  let ended = 0, abandoned = 0;
  activeEffects.push({ until: simNow() + 1e9, onEnd() { ended++; }, onAbandon() { abandoned++; } });
  loadMap(1);
  assert.equal(ended, 0, 'a Sticky Bomb that never detonated must not explode into the next round');
  assert.equal(abandoned, 1, 'but the effect is told, so it can drop whatever it was holding');
  assert.equal(activeEffects.length, 0);
}));

// ---------------------------------------------------------------- C11

test('C11: Butterfingers annihilates a charged fusion, on purpose', () => {
  const q = { slots: ['moltenmeteor', 'ember'], slotCharges: [2, null], casts: [10, 20], slotFilledAt: [1, 2] };
  disarmPlayer(q);
  assert.deepEqual(q.slots, [null, null], 'both hands, including the charged fusion');
  assert.deepEqual(q.slotCharges, [null, null]);
  assert.deepEqual(q.casts, [0, 0]);
  assert.deepEqual(q.slotFilledAt, [0, 0]);
});

test('C11: and the spell says so, rather than leaning on the spellId setter', () => {
  const src = spellSource('src/sim/spells/book.js', 'disarm');
  assert.match(src, /disarmPlayer\(q\)/, 'Butterfingers must call the named rule');
  assert.doesNotMatch(src, /spellId = null/, 'not the accessor side effect');
});

// ---------------------------------------------------------------- C12

test('C12: the boss is untouchable until its entrance banner lands', () => withWorld(() => {
  aWizard();
  game.state = 'PLAY';
  const bs = spawnBoss(simNow(), { tier: 1 });
  assert.equal(bs.invulnerableUntilAnnounced, true, 'the window is a declared property, not an announce flag');
  const full = bs.hp;
  damageBoss(50, null, null);
  assert.equal(bs.hp, full, 'damage during the telegraph is refused');
  bs.announced = true;
  damageBoss(50, null, null);
  assert.equal(bs.hp, full - 50, 'and lands once the banner has');
}));

test('C12: the window is the property, not the announce flag', () => withWorld(() => {
  aWizard();
  game.state = 'PLAY';
  const bs = spawnBoss(simNow(), { tier: 1 });
  bs.invulnerableUntilAnnounced = false; // a future boss that enters swinging
  const full = bs.hp;
  damageBoss(50, null, null);
  assert.equal(bs.hp, full - 50, 'un-declaring the window makes the boss damageable pre-announce');
}));

// ---------------------------------------------------------------- C7

test('C7: the wave best score goes through the storage port', () => {
  const seen = new Map();
  const fake = { getItem: (k) => seen.get(k) ?? null, setItem: (k, v) => seen.set(k, v) };
  resetTick();
  createWorld();
  loadMap(0);
  setStorage(fake);
  try {
    startRun();
    assert.equal(game.bestWave, 0, 'a fresh port has no best wave');
    game.wave = 7;
    endRun();
    assert.equal(seen.get('hs-best-wave'), '7', 'the run is written through the port');
    startRun();
    assert.equal(game.bestWave, 7, 'and read back on the next run');
  } finally {
    setStorage(null);
    destroyWorld();
  }
});

test('C7: a headless sim gets a real, persistent store by default', () => {
  // The defect: server/shims.js faked localStorage as null, so an online wave
  // run could never remember a best wave. The node platform now supplies a
  // file-backed store, so headless is persistent rather than amnesiac.
  const dir = mkdtempSync(join(tmpdir(), 'hs-storage-'));
  try {
    const a = fileStorage(dir);
    assert.equal(a.getItem('hs-best-wave'), null, 'nothing stored yet');
    a.setItem('hs-best-wave', '12');
    assert.equal(a.getItem('hs-best-wave'), '12');
    assert.equal(fileStorage(dir).getItem('hs-best-wave'), '12', 'and it survives a new reader');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('C7: createSim wires that store in when the caller supplies none', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'hs-storage-'));
  const prev = process.env.HS_STATE_DIR;
  process.env.HS_STATE_DIR = dir;
  const { storage } = await import('../src/sim/storage.js');
  let sim = null;
  try {
    sim = createSim({});
    const live = (await import('../src/sim/storage.js')).storage;
    live.setItem('hs-best-wave', '4');
    assert.equal(fileStorage(dir).getItem('hs-best-wave'), '4', 'writes land on disk, not in a shim');
    assert.notEqual(live, storage, 'and the null stand-in was replaced');
  } finally {
    sim?.destroy();
    setStorage(null);
    if (prev === undefined) delete process.env.HS_STATE_DIR; else process.env.HS_STATE_DIR = prev;
    rmSync(dir, { recursive: true, force: true });
  }
});
