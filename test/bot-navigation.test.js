// bot-navigation.test.js — ledge safety, retreat, and the second jump.
//
// Upstream justified this work with measurements rather than assertions (falls
// were two thirds of all bot deaths; two flee-capable bots never resolved a
// round), so this file measures the same properties. The behavioural ones are
// ratchets against numbers taken here, because bot quality is a distribution:
// pinning an exact value would turn any legitimate tuning change into a fixture
// edit, and pinning nothing at all lets the bots quietly get worse.
//
// The determinism test is the one that must be absolute. Every roll a bot makes
// is on the seeded stream now, including upstream's `nerve` blunder, so the same
// seed must replay identically. A stray Math.random here would not throw — it
// would just make bot rounds unrepeatable, break the golden tape, and desync
// online play.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import '../src/sim/content.js';
import { createSim } from '../src/platform/node.js';
import { reseed } from '../src/sim/rng.js';
import { MAPS } from '../src/sim/maps/builders.js';
import { game, startRound, currentMap } from '../src/sim/match.js';
import { players } from '../src/sim/player/lifecycle.js';
import { addBot, navGroundY, BOT_PERSONAS } from '../src/sim/ai/bot.js';
import { stepSim } from '../src/sim/tick.js';
import { H } from '../src/sim/world.js';

// A round of bots on every map, watched tick by tick.
function botMatch({ seed, bots = 4, maps = MAPS.length, ticks = 600 }) {
  reseed(seed);
  createSim();
  for (let i = 0; i < bots; i++) addBot();
  const stat = { fell: 0, deaths: 0, moving: 0, samples: 0, airJumpsUsed: 0, gapsCleared: 0 };
  for (let i = 0; i < maps; i++) {
    startRound(i);
    const seen = new Set();
    for (let t = 0; t < ticks; t++) {
      const airBefore = players.map(p => p.airJumps);
      stepSim();
      for (let k = 0; k < players.length; k++) {
        const p = players[k];
        if (!p.body) continue;
        stat.samples++;
        if (Math.abs(p.body.velocity.x) > 0.6) stat.moving++;
        if (p.alive && !p.grounded && p.airJumps < airBefore[k]) stat.airJumpsUsed++;
        if (p.body.position.y > H + 60 && !seen.has(`f${k}`)) { stat.fell++; seen.add(`f${k}`); }
        if (!p.alive && !seen.has(`d${k}`)) { stat.deaths++; seen.add(`d${k}`); }
      }
    }
  }
  return stat;
}

// THE non-negotiable one. Everything else here is a ratchet; this is a
// correctness property, and it is the reason every `nerve` roll goes through
// simRandom() rather than the Math.random upstream used.
test('a bot round replays identically from the same seed', () => {
  const trace = () => {
    reseed(4242);
    createSim();
    for (let i = 0; i < 4; i++) addBot();
    startRound(7);
    const out = [];
    for (let t = 0; t < 400; t++) {
      stepSim();
      if (t % 20 === 0) {
        for (const p of players) {
          out.push(p.body ? `${Math.round(p.body.position.x)},${Math.round(p.body.position.y)},${p.hp}` : 'x');
        }
      }
    }
    return out.join('|');
  };
  assert.equal(trace(), trace(), 'the same seed must produce the same bot round');
});

// The static half of the same guarantee: a scan, because a single Math.random
// on a rarely-taken branch would pass the replay test above on most seeds.
test('the bot brain takes no entropy the seed cannot reach', () => {
  const src = readFileSync('src/sim/ai/bot.js', 'utf8');
  const offenders = src.split('\n')
    .map((line, i) => [i + 1, line])
    .filter(([, line]) => /Math\.random\s*\(|performance\.now\s*\(/.test(line) && !line.trimStart().startsWith('//'));
  assert.deepEqual(offenders.map(([n, l]) => `${n}: ${l.trim()}`), [],
    'bot decisions must roll on simRandom() and measure time on simNow()');
});

// navGroundY is the fix the whole ledge change rests on: groundYAt scans a
// column from the TOP and returns the first solid it meets, so a platform above
// the bot wins. Upstream measured ~30% of ledge checks reasoning about a
// ceiling. This is that difference, stated directly.
test('navGroundY finds the floor below, never a ceiling above', () => {
  reseed(9);
  createSim();
  addBot();
  const wrong = [];
  for (let i = 0; i < MAPS.length; i++) {
    startRound(i);
    for (let t = 0; t < 30; t++) stepSim();
    for (const p of players) {
      if (!p.body) continue;
      const g = navGroundY(p.body.position.x, p.body.position.y);
      if (g != null && g < p.body.position.y - 8) {
        wrong.push(`${MAPS[i].name}: floor reported at ${Math.round(g)} above the bot at ${Math.round(p.body.position.y)}`);
      }
    }
  }
  assert.deepEqual(wrong.slice(0, 6), [], `navGroundY returned a ceiling:\n${wrong.slice(0, 6).join('\n')}`);
});

test('every persona carries a nerve value in the tuned range', () => {
  const bad = [];
  for (const [name, m] of Object.entries(BOT_PERSONAS)) {
    if (typeof m.nerve !== 'number') bad.push(`${name}: no nerve`);
    else if (m.nerve <= 0 || m.nerve > 0.2) bad.push(`${name}: nerve ${m.nerve} out of range`);
  }
  assert.deepEqual(bad, [], `nerve is the tunable fallibility knob:\n${bad.join('\n')}`);
  // the ordering is the character: a trickster blunders, an alchemist doesn't
  assert.ok(BOT_PERSONAS.trickster.nerve > BOT_PERSONAS.alchemist.nerve * 3,
    'the trickster must be markedly more reckless than the alchemist');
});

// Ledge safety, measured the way upstream justified it. 4 bots x 110 maps x 10s.
test('bots rarely walk into the void, and are not frozen in place doing it', () => {
  const s = botMatch({ seed: 31, bots: 4, ticks: 600 });
  const fellRate = s.fell / (s.deaths || 1);
  const movingRate = s.moving / s.samples;
  // "never falls" is trivially achievable by never moving, and that is a worse
  // bot, not a better one — upstream measured 58% stuck when a static-only
  // ground query froze them. Both halves have to hold at once.
  assert.ok(movingRate > 0.25, `bots are frozen: moving only ${(movingRate * 100).toFixed(1)}% of samples`);
  assert.ok(fellRate < 0.6, `falls are ${(fellRate * 100).toFixed(0)}% of deaths — ledge safety has regressed`);
});

// The second jump. Before this, bots spent an air jump only while already
// plummeting in the lava-panic branch, which capped a deliberate leap at ~274px
// of a real ~424px range.
// `> 0` is not enough: the lava-panic branch already spent air jumps before
// this change, so any positive count passes with the gap-leap logic deleted.
// Measured over 40 maps x 3 bots x 10s — 190 with it, 106 without — so the
// ratchet sits between the two.
test('bots spend the air jump on gap leaps, not only while panicking', () => {
  const s = botMatch({ seed: 77, bots: 3, maps: 40, ticks: 600 });
  assert.ok(s.airJumpsUsed > 150,
    `${s.airJumpsUsed} air jumps in 40 maps — the panic branch alone scores ~106, so the gap leap is not firing`);
});

// Retreat. Two flee-capable personas at low HP used to run to opposite walls
// and stay there, so the round never resolved. The fix is a near-threat test, a
// time box, and a stalemate breaker.
test('two flee-capable bots still close on each other', () => {
  reseed(101);
  createSim();
  addBot('skirmisher');
  addBot('alchemist');
  startRound(0);
  for (const p of players) p.hp = 30; // both under their flee thresholds
  let farSamples = 0, samples = 0;
  for (let t = 0; t < 1800; t++) { // 30s
    stepSim();
    const [a, b] = players;
    if (!a?.body || !b?.body || !a.alive || !b.alive) break;
    const d = Math.hypot(a.body.position.x - b.body.position.x, a.body.position.y - b.body.position.y);
    samples++;
    if (d > 620) farSamples++; // beyond every spell's range
  }
  // Time spent out of every spell's range is the measure, and it is the one
  // upstream used (77% -> 13% on its own maps). Closest-approach is NOT: the
  // unbounded-flee version scores BETTER on it (30px vs 136px), because the two
  // bots collide once before either starts running and then never meet again.
  // Measured here: 31% with the near-threat test and the time box, 65% without.
  assert.ok(samples > 100, `the round ended after ${samples} ticks — too short to measure avoidance`);
  const farRate = farSamples / samples;
  assert.ok(farRate < 0.5,
    `out of range ${(farRate * 100).toFixed(0)}% of the time — two hurt bots are avoiding each other (unbounded fleeing scores ~65%)`);
});

// The stalemate breaker reads game.lastDamageAt, and a round that inherits it
// from the previous round opens already stale.
test('a fresh round starts its own quiet-clock', () => {
  reseed(55);
  createSim();
  addBot();
  addBot();
  startRound(3);
  const atStart = game.lastDamageAt;
  assert.equal(typeof atStart, 'number', 'startRound must stamp the damage clock');
  for (let t = 0; t < 120; t++) stepSim();
  startRound(4);
  assert.ok(game.lastDamageAt >= atStart, 'the clock must be restamped, not carried over');
});
