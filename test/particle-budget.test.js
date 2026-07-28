// particle-budget.test.js — the readability pass on the particle field.
//
// Upstream measured the problem rather than asserting it: over 3000 frames on
// five maps, median 186 live particles, p95 740, peak 932, and a peak of 27
// simultaneous floating labels overprinting into a grey smear. Three wizards
// casting filled the frame with interchangeable marks and the characters
// vanished behind their own VFX.
//
// So these tests measure the same shapes: a ceiling that actually holds, a cull
// order that spends motes before cores, and text that is never culled by it —
// text carries meaning rather than texture, and is capped separately.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  particles, spawnParticles, spawnBurst, spawnText, spawnRing, updateParticles,
  clearParticles, trimParticles, particleCount, PARTICLE_CAP, TEXT_CAP,
} from '../src/render/fx.js';

test('the cap holds however hard the field is spammed', () => {
  clearParticles();
  for (let i = 0; i < 400; i++) spawnParticles(i, 100, '#fff', 12, 4);
  updateParticles(1);
  assert.ok(particleCount() <= PARTICLE_CAP, `budget blown: ${particleCount()}`);
  assert.ok(particleCount() > 0, 'the cull must not empty the field');
});

// A burst is split in two: a few cores carry the event, a thinner tail of motes
// lingers. If everything comes out one size and one brightness, the pass has
// done nothing.
test('a burst emits cores and motes, not one uniform spray', () => {
  clearParticles();
  spawnParticles(100, 100, '#fff', 40, 5);
  const cores = particles.filter(p => (p.dim ?? 1) >= 1);
  const motes = particles.filter(p => (p.dim ?? 1) < 1);
  assert.ok(cores.length > 0, 'a burst with no cores has no hot flash to read');
  assert.ok(motes.length > 0, 'a burst with no motes has no ash to linger');
  assert.ok(motes.length > cores.length, `motes should outnumber cores: ${motes.length} vs ${cores.length}`);
  const avgCore = cores.reduce((a, p) => a + p.r, 0) / cores.length;
  const avgMote = motes.reduce((a, p) => a + p.r, 0) / motes.length;
  assert.ok(avgCore > avgMote * 1.5, `cores must read bigger: ${avgCore.toFixed(1)} vs ${avgMote.toFixed(1)}`);
});

test('a generic burst is thinned against the count it was asked for', () => {
  clearParticles();
  spawnParticles(0, 0, '#fff', 100, 5);
  assert.ok(particleCount() < 100, `no thinning applied: ${particleCount()}`);
  assert.ok(particleCount() > 30, `thinned into nothing: ${particleCount()}`);
});

// Bespoke per-hybrid emitters already read as distinct marks. Thinning them
// would quietly redesign every signature VFX in the game.
test('shaped emitters keep the count their author chose', () => {
  clearParticles();
  spawnBurst(0, 0, '#fff', 20, { kind: 'confetti' });
  assert.equal(particleCount(), 20, 'confetti must not be thinned');
  clearParticles();
  spawnBurst(0, 0, '#fff', 20, { kind: 'square' });
  assert.ok(particleCount() < 20, 'a generic square burst SHOULD be thinned');
});

// The cull order is the whole point: spend what the player is not reading.
test('the cull spends motes before cores', () => {
  clearParticles();
  for (let i = 0; i < 200; i++) spawnParticles(i, 0, '#fff', 6, 3);
  const beforeCores = particles.filter(p => (p.dim ?? 1) >= 1).length;
  trimParticles();
  const afterCores = particles.filter(p => (p.dim ?? 1) >= 1).length;
  const afterMotes = particles.filter(p => (p.dim ?? 1) < 1).length;
  assert.ok(particleCount() <= PARTICLE_CAP);
  assert.ok(afterCores >= Math.min(beforeCores, PARTICLE_CAP) * 0.9,
    `cores were culled while motes survived: ${beforeCores} -> ${afterCores}, motes left ${afterMotes}`);
});

test('text and rings survive a cull that everything else loses', () => {
  clearParticles();
  spawnText(10, 10, 'ABSOLUTE ZERO!', '#fff');
  spawnRing(20, 20, '#fff');
  for (let i = 0; i < 400; i++) spawnParticles(i, 0, '#fff', 8, 3);
  trimParticles();
  assert.ok(particles.some(p => p.kind === 'text'), 'text carries meaning and must never be culled');
  assert.ok(particles.some(p => p.kind === 'ring'), 'rings are deliberate and must never be culled');
});

// Newest wins: whatever just happened is the thing worth reading.
test('floating labels are capped, newest kept', () => {
  clearParticles();
  for (let i = 0; i < 30; i++) spawnText(i * 10, 100, `HIT ${i}`, '#fff');
  const texts = particles.filter(p => p.kind === 'text');
  assert.ok(texts.length <= TEXT_CAP, `${texts.length} labels live, cap is ${TEXT_CAP}`);
  assert.ok(texts.some(p => p.str === 'HIT 29'), 'the newest label must survive');
  assert.ok(!texts.some(p => p.str === 'HIT 0'), 'the oldest label should be long gone');
});

test('the field drains to empty when nothing is spawning', () => {
  clearParticles();
  spawnParticles(0, 0, '#fff', 20, 4);
  for (let i = 0; i < 400; i++) updateParticles(1);
  assert.equal(particleCount(), 0, 'particles must expire, not accumulate');
});
