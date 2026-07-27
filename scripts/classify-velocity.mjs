// Generates docs/superpowers/plans/velocity-classification.md.
// Sites are keyed by (file, ordinal) — the Nth velocity write in that file —
// so the table can be regenerated with correct line numbers after the sweep
// moves lines around. Re-run with `mise exec -- node <this>` from the repo root.
import { readFileSync, writeFileSync } from 'node:fs';

// classification: push | override | controller
// form:  additive  — every component is `current + delta`; becomes addVelocity
//        blended   — scales the current velocity as well; stays setVelocity
//        axis      — one axis preserved, the other overridden; stays setVelocity
//        absolute  — the current velocity is not read at all
const C = {
  'src/sim/player/combat.js': [
    ['override', 'absolute', 'Gib spawn. The hat is new and has no velocity of its own; it inherits half the caster\'s x. Reading another body\'s velocity is not reading your own.'],
    ['override', 'absolute', 'Gib spawn: a fresh body is thrown at a randomised velocity.'],
  ],
  'src/sim/spells/starters.js': [
    ['push', 'additive', 'Blast recoil on the caster: velocity minus a facing-scaled kick.'],
    ['override', 'absolute', 'Projectile launch — the bolt is given its muzzle velocity outright.'],
    ['push', 'additive', 'Gust shoves whatever it catches. The mass-independent push, verbatim.'],
    ['push', 'additive', 'Gust self-recoil on the caster.'],
    ['push', 'additive', 'Melee knockback added to the victim\'s motion.'],
  ],
  'src/sim/tick.js': [
    ['override', 'absolute', 'Critter hop: the AI states the whole velocity each hop.'],
    ['push', 'axis', 'Saw drive: x is pinned to a constant travel speed, y is left to physics. Not expressible as a delta; stays setVelocity.'],
  ],
  'src/sim/player/ghost.js': [
    ['override', 'absolute', 'Poltergeist release — "a toss, not a throw" states the whole velocity.'],
    ['override', 'absolute', 'Poltergeist carry: a position-derived spring velocity, clamped. Nothing of the prop\'s own motion survives.'],
    ['push', 'additive', 'Wisp gust on nearby bodies.'],
  ],
  'src/sim/player/controller.js': [
    ['controller', 'blended', 'Movement blend: x eased toward the walk target, y untouched. Phase 3 gives this its own setControlVelocity so a character controller can own it.'],
    ['controller', 'axis', 'Jump: y set outright, x preserved. Same owner as the blend above.'],
    ['controller', 'axis', 'Air jump: y set outright, x preserved.'],
  ],
  'src/sim/player/lifecycle.js': [
    ['override', 'absolute', 'spawnPlayer — brief rule 5. A respawn must not inherit the corpse\'s momentum.'],
  ],
  'src/sim/collision.js': [
    ['push', 'blended', 'Reflect: the bolt\'s own velocity is negated and damped. Reads the current velocity, so it is a push, but the sign flip means it cannot be a delta.'],
    ['push', 'blended', 'Banana slip: x amplified 1.5x, y kicked up. The x scaling keeps it out of addVelocity.'],
    ['push', 'axis', 'Stomp — the victim is driven down at a fixed speed, x preserved.'],
    ['push', 'axis', 'Stomp — the stomper bounces off the landing at a fixed speed.'],
    ['push', 'axis', 'Trampoline fling: a fixed launch speed, horizontal motion preserved.'],
    ['push', 'axis', 'Spikes: a fixed pop upward, horizontal motion preserved.'],
    ['push', 'axis', 'Bosses shrug off lava with a fixed upward pop.'],
  ],
  'src/sim/events.js': [
    ['push', 'additive', 'Windstorm event: a per-second push on every loose body.'],
    ['override', 'absolute', 'Critter spawn at the arena edge.'],
  ],
  'src/sim/ai/boss.js': [
    ['override', 'absolute', 'Boss projectile launch.'],
    ['override', 'absolute', 'Boss slam shockwave throws the player at a stated velocity.'],
    ['push', 'blended', 'Flier chase: 0.92 damping plus a steering term. Damping is a scale, not a delta.'],
    ['push', 'blended', 'Hover bob: damping plus a sine drive.'],
    ['override', 'absolute', 'Boss reset to rest before a teleport.'],
    ['push', 'blended', 'Ground charge: 0.8 damping plus a directional drive, y untouched.'],
    ['override', 'absolute', 'Leap: the whole launch velocity is stated.'],
    ['override', 'absolute', 'Tentacle punt: the player is thrown at a stated velocity.'],
    ['push', 'blended', 'Chase steering with damping.'],
    ['push', 'axis', 'Vacuum pull: x added to, y stated outright.'],
    ['push', 'blended', 'Chase steering with damping.'],
    ['push', 'blended', 'Drift with damping plus sine drive.'],
    ['push', 'axis', 'Ceiling clamp: y stated, x preserved.'],
    ['push', 'axis', 'Floor clamp: y stated, x preserved.'],
  ],
  'src/sim/ai/enemies.js': [
    ['override', 'absolute', 'Enemy projectile launch.'],
    ['override', 'absolute', 'Contact shove throws the target at a stated velocity.'],
    ['push', 'blended', 'Walk drive: 0.8 damping plus a directional term, y untouched.'],
    ['push', 'axis', 'Enemy jump: y stated, x preserved.'],
    ['push', 'blended', 'Walk drive with damping.'],
    ['override', 'absolute', 'Hop: the whole launch velocity is stated.'],
    ['override', 'absolute', 'Leap: the whole launch velocity is stated.'],
  ],
  'src/sim/maps/builders.js': [
    ['override', 'absolute', 'Destructible debris spawn.'],
    ['override', 'absolute', 'Pendulum kick-off — the initial shove on a fresh ball.'],
    ['push', 'additive', 'Pendulum keep-swinging: a per-second nudge toward centre.'],
    ['override', 'absolute', 'Icicle drop: the whole velocity is stated at the moment it lets go.'],
    ['push', 'additive', 'applyWind — a per-second push on every loose body. The environmental force, mass-independent by design.'],
    ['override', 'absolute', 'Rolling boulder spawn at the arena edge.'],
  ],
  'src/sim/spells/book.js': [
    ['push', 'additive', 'boomBolt blast knockback.'],
    ['push', 'blended', 'Homing Wisp steering: 0.9 damping plus a seek term.'],
    ['push', 'blended', 'Boomerang Orb turnaround: x negated. Reads its own velocity, cannot be a delta.'],
    ['push', 'axis', 'Wobble Hex: y is a sine of time, x preserved.'],
    ['push', 'additive', 'Cannon recoil on the caster.'],
    ['push', 'additive', 'Chain lightning knockback.'],
    ['push', 'additive', 'Recoil on the caster.'],
    ['push', 'additive', 'Directional blast on everything in range.'],
    ['push', 'additive', 'Shove — the canonical mass-independent push. An anvil goes as far as a wizard.'],
    ['push', 'additive', 'Radial pull.'],
    ['push', 'additive', 'Radial pull, weaker variant.'],
    ['push', 'additive', 'Uppercut: pure upward delta, x untouched (dx = 0).'],
    ['push', 'axis', 'Ground pound: y slammed to a fixed speed, x preserved.'],
    ['push', 'additive', 'Sustained per-second attraction field.'],
    ['override', 'absolute', 'Yank: the target is given a stated velocity toward the caster.'],
    ['push', 'additive', 'Per-second storm push.'],
    ['override', 'absolute', 'Icicle spawn drop.'],
    ['override', 'absolute', 'Dash: the caster\'s velocity is replaced outright.'],
    ['push', 'blended', 'Seeker steering with damping.'],
    ['push', 'axis', 'Launch: y stated, x preserved.'],
    ['override', 'absolute', 'Crate Drop spawn — crates fall fast from a stated velocity.'],
    ['override', 'absolute', 'Bouncy ball spawn.'],
    ['override', 'absolute', 'Decoy spawn.'],
    ['push', 'blended', 'Bee steering with damping.'],
    ['override', 'absolute', 'Saw spawn.'],
    ['push', 'additive', 'Chaos scatter: a randomised push on everything loose.'],
    ['override', 'absolute', 'Vacuum: the target is given a stated velocity toward the caster.'],
    ['override', 'absolute', 'swaphex/teleport reset — brief rule 5. The arriving body starts at rest.'],
    ['push', 'additive', 'Melee knockback.'],
    ['override', 'absolute', 'Grapple: a stated velocity toward the anchor.'],
    ['override', 'absolute', 'Hook: a stated velocity toward the caster.'],
    ['push', 'axis', 'Pop up: y stated, x preserved.'],
    ['push', 'axis', 'Slam down: y stated, x preserved.'],
  ],
  'src/sim/spells/fusion.js': [
    ['push', 'additive', 'Per-second storm push.'],
    ['push', 'additive', 'Freeze shove.'],
    ['push', 'additive', 'Recoil on the caster.'],
    ['push', 'axis', 'Blast: x added to, y stated outright.'],
    ['push', 'additive', 'Reversal shove.'],
    ['override', 'absolute', 'Repulse: a position-derived velocity, stated outright.'],
    ['push', 'additive', 'Heavy shove.'],
    ['push', 'axis', 'Floaty: y stated, x preserved.'],
    ['override', 'absolute', 'Scatter: a stated velocity on a random heading.'],
  ],
  'src/sim/spells/core.js': [
    ['override', 'absolute', 'Bolt launch — the muzzle velocity.'],
    ['override', 'absolute', 'Bolt launch — the muzzle velocity, gravity-flip aware.'],
    ['push', 'additive', 'explode() — the single most-used push in the game. Mass-independent so a blast reads the same whatever it catches.'],
    ['push', 'additive', 'Singularity: a per-second radial pull plus a tangential term.'],
  ],
  'src/sim/maps/book.js': [
    ['push', 'additive', 'Updraft Canyon: a per-second lift, x untouched (dx = 0).'],
    ['override', 'blended', 'Conveyor — brief rule 4. It clamps to ±9, so the result is not the old velocity plus anything; the belt states what the velocity is allowed to be.'],
    ['override', 'blended', 'Conveyor (Assembly Line) — brief rule 4, clamps.'],
    ['override', 'blended', 'Conveyor (The Gauntlet) — brief rule 4, clamps.'],
    ['push', 'additive', 'Gas Vents: a per-second lift, x untouched.'],
    ['push', 'additive', 'The Core: a per-second pull toward the centre.'],
    ['push', 'additive', 'Eye of the Storm: a per-second push back toward the middle.'],
    ['push', 'additive', 'Event Horizon: a per-second pull.'],
    ['push', 'additive', 'The Maw: a per-second pull downward.'],
  ],
};

// After the sweep the sites read addVelocity(/setVelocity(; before it they read
// Body.setVelocity(. Match either so this script works at both ends.
const RE = /(?:Body\.setVelocity|\baddVelocity|(?<!Body\.)\bsetVelocity)\s*\(/;

const rows = [];
const tally = { push: 0, override: 0, controller: 0 };
const forms = {};
for (const [file, sites] of Object.entries(C)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  const found = [];
  lines.forEach((line, i) => {
    if (line.trimStart().startsWith('//')) return;
    let n = 0, rest = line;
    while (RE.test(rest)) { n++; rest = rest.replace(RE, ''); }
    for (let k = 0; k < n; k++) found.push({ line: i + 1, text: lines[i].trim() });
  });
  if (found.length !== sites.length) {
    throw new Error(`${file}: expected ${sites.length} sites, found ${found.length}`);
  }
  sites.forEach(([cls, form, why], i) => {
    tally[cls]++;
    forms[form] = (forms[form] || 0) + 1;
    const call = cls === 'controller' ? '`setVelocity` → `setControlVelocity` (phase 3)'
      : form === 'additive' ? '`addVelocity`' : '`setVelocity`';
    let snippet = found[i].text;
    if (snippet.length > 150) snippet = snippet.slice(0, 147) + '…';
    rows.push(`| \`${file}:${found[i].line}\` | **${cls}** | ${form} | ${call} | ${why} |`);
  });
}

const header = readFileSync('scripts/classify-velocity-header.md', 'utf8')
  .replaceAll('%%PUSH%%', tally.push)
  .replaceAll('%%OVERRIDE%%', tally.override)
  .replaceAll('%%CONTROLLER%%', tally.controller)
  .replaceAll('%%TOTAL%%', tally.push + tally.override + tally.controller)
  .replaceAll('%%ADDITIVE%%', forms.additive)
  .replaceAll('%%BLENDED%%', forms.blended)
  .replaceAll('%%AXIS%%', forms.axis)
  .replaceAll('%%ABSOLUTE%%', forms.absolute);

writeFileSync('docs/superpowers/plans/velocity-classification.md',
  header + '\n' + rows.join('\n') + '\n');
console.log(tally, forms, 'rows', rows.length);
