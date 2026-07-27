# Velocity-write classification

Every velocity write in `src/sim/` — all 107 of them — classified, with the facade
operation each one became in task 8 and the reason.

**Why this document exists.** `addVelocity` is a first-class, documented,
mass-independent gameplay operation, distinct from `applyImpulse`. Most spell
sites add to velocity and ignore mass — a Gust shoves an anvil (density 0.02)
like a wizard (0.004) — and that is the design language of the content, not a
bug. Mechanically "correcting" these into mass-scaled impulses would silently
rebalance the whole spell book. This table is the record of which sites are
which, so a later phase can change one class without touching the other.

**Who this is for.** Phase 2 swaps matter-js for planck.js behind
`src/sim/phys/facade.js` and A/B-diffs the golden tape. When a site diverges,
this table says what that site was *meant* to do, which is the difference
between fixing a backend bug and re-tuning a spell by accident.

## The classification

| Class | Criterion | Count |
|---|---|---|
| **gameplay push** | the new velocity is a function of the body's *current* velocity — the body was already moving and the game is modifying that motion | 65 |
| **authoritative override** | the new velocity ignores the current velocity entirely — spawn, launch, teleport, reset, or a clamp that states what the velocity is allowed to be | 39 |
| **controller drive** | inside `src/sim/player/controller.js`'s movement blend | 3 |

Cross-cutting that, the **form** column says what the write's *arithmetic* is,
which is what decides the facade call:

| Form | Arithmetic | Facade call | Count |
|---|---|---|---|
| `additive` | every component is `current + delta` | `addVelocity(b, dv)` | 34 |
| `blended` | the current velocity is scaled or negated as well (`v * 0.9 + drive`) | `setVelocity(b, f(velocityOf(b)))` | 18 |
| `axis` | one axis preserved, the other stated outright | `setVelocity(b, { x: velocityOf(b).x, y: … })` | 19 |
| `absolute` | the current velocity is never read | `setVelocity(b, v)` | 36 |

Only `additive` sites can become `addVelocity` without changing a single
floating-point operation, and task 8 is a refactor: the golden tape has to
replay byte-identically. `blended` and `axis` sites are still mass-independent
gameplay pushes conceptually — they are just not expressible as a delta, so they
keep reading `velocityOf(b)` and writing the whole vector. A planck backend must
preserve that: **`setVelocity` is not a licence to add damping of its own.**

### Where these counts differ from the brief's prediction

The brief predicted ~70 push / ~25 override / ~12 controller. Actual:
**65 / 39 / 3**.

- **push is within 5 of the prediction** — the number that matters, since it is
  the count of sites a mass-scaling "fix" would rebalance. Within the brief's
  own tolerance ("if your counts differ by more than 10, re-read the outliers").
- **controller is 3, not 12.** `src/sim/player/controller.js` contains exactly
  three velocity writes: the walk blend, the ground jump and the air jump. The
  brief's estimate appears to have counted the movement path rather than the
  writes in it. The nine it over-counted land in override, which is the whole
  of the override overshoot bar the five from push: override + controller is
  39 + 3 = 42, against a predicted 25 + 12 = 37, and 42 − 37 = 5 is
  exactly the push shortfall. Every site is accounted for in one bucket or
  another; none of the 107 resisted the rules.

### Deliberate departures from the brief's five pattern rules

- **Conveyor belts** (`src/sim/maps/book.js`, three sites) are classified
  **override** even though they read `b.velocity.x`, exactly as the brief's
  rule 4 directs: the `Math.max(-9, Math.min(9, …))` clamp means the result is
  not "the old velocity plus something", it is "what the belt permits". They
  are marked `blended` in the form column because the arithmetic still reads the
  current velocity, so the facade call is `setVelocity`.
- **`src/sim/player/combat.js:50`** (the hat gib) reads
  `p.body.velocity.x` — the *caster's* velocity, not the hat's. The hat is a
  body created two lines earlier and has no motion of its own, so this is a
  spawn, not a push. "Reads a velocity" is not the test; "reads *its own*
  velocity" is.

## Every site

| Site | Class | Form | Facade call | Rationale |
|---|---|---|---|---|

| `src/sim/player/combat.js:50` | **override** | absolute | `setVelocity` | Gib spawn. The hat is new and has no velocity of its own; it inherits half the caster's x. Reading another body's velocity is not reading your own. |
| `src/sim/player/combat.js:72` | **override** | absolute | `setVelocity` | Gib spawn: a fresh body is thrown at a randomised velocity. |
| `src/sim/spells/starters.js:24` | **push** | additive | `addVelocity` | Blast recoil on the caster: velocity minus a facing-scaled kick. |
| `src/sim/spells/starters.js:43` | **override** | absolute | `setVelocity` | Projectile launch — the bolt is given its muzzle velocity outright. |
| `src/sim/spells/starters.js:46` | **push** | additive | `addVelocity` | Gust shoves whatever it catches. The mass-independent push, verbatim. |
| `src/sim/spells/starters.js:48` | **push** | additive | `addVelocity` | Gust self-recoil on the caster. |
| `src/sim/spells/starters.js:66` | **push** | additive | `addVelocity` | Melee knockback added to the victim's motion. |
| `src/sim/tick.js:59` | **override** | absolute | `setVelocity` | Critter hop: the AI states the whole velocity each hop. |
| `src/sim/tick.js:65` | **push** | axis | `setVelocity` | Saw drive: x is pinned to a constant travel speed, y is left to physics. Not expressible as a delta; stays setVelocity. |
| `src/sim/player/ghost.js:32` | **override** | absolute | `setVelocity` | Poltergeist release — "a toss, not a throw" states the whole velocity. |
| `src/sim/player/ghost.js:35` | **override** | absolute | `setVelocity` | Poltergeist carry: a position-derived spring velocity, clamped. Nothing of the prop's own motion survives. |
| `src/sim/player/ghost.js:125` | **push** | additive | `addVelocity` | Wisp gust on nearby bodies. |
| `src/sim/player/controller.js:126` | **controller** | blended | `setVelocity` → `setControlVelocity` (phase 3) | Movement blend: x eased toward the walk target, y untouched. Phase 3 gives this its own setControlVelocity so a character controller can own it. |
| `src/sim/player/controller.js:133` | **controller** | axis | `setVelocity` → `setControlVelocity` (phase 3) | Jump: y set outright, x preserved. Same owner as the blend above. |
| `src/sim/player/controller.js:138` | **controller** | axis | `setVelocity` → `setControlVelocity` (phase 3) | Air jump: y set outright, x preserved. |
| `src/sim/player/lifecycle.js:110` | **override** | absolute | `setVelocity` | spawnPlayer — brief rule 5. A respawn must not inherit the corpse's momentum. |
| `src/sim/collision.js:31` | **push** | blended | `setVelocity` | Reflect: the bolt's own velocity is negated and damped. Reads the current velocity, so it is a push, but the sign flip means it cannot be a delta. |
| `src/sim/collision.js:60` | **push** | blended | `setVelocity` | Banana slip: x amplified 1.5x, y kicked up. The x scaling keeps it out of addVelocity. |
| `src/sim/collision.js:73` | **push** | axis | `setVelocity` | Stomp — the victim is driven down at a fixed speed, x preserved. |
| `src/sim/collision.js:74` | **push** | axis | `setVelocity` | Stomp — the stomper bounces off the landing at a fixed speed. |
| `src/sim/collision.js:82` | **push** | axis | `setVelocity` | Trampoline fling: a fixed launch speed, horizontal motion preserved. |
| `src/sim/collision.js:100` | **push** | axis | `setVelocity` | Spikes: a fixed pop upward, horizontal motion preserved. |
| `src/sim/collision.js:105` | **push** | axis | `setVelocity` | Bosses shrug off lava with a fixed upward pop. |
| `src/sim/events.js:124` | **push** | additive | `addVelocity` | Windstorm event: a per-second push on every loose body. |
| `src/sim/events.js:148` | **override** | absolute | `setVelocity` | Critter spawn at the arena edge. |
| `src/sim/ai/boss.js:48` | **override** | absolute | `setVelocity` | Boss projectile launch. |
| `src/sim/ai/boss.js:68` | **override** | absolute | `setVelocity` | Boss slam shockwave throws the player at a stated velocity. |
| `src/sim/ai/boss.js:86` | **push** | blended | `setVelocity` | Flier chase: 0.92 damping plus a steering term. Damping is a scale, not a delta. |
| `src/sim/ai/boss.js:115` | **push** | blended | `setVelocity` | Hover bob: damping plus a sine drive. |
| `src/sim/ai/boss.js:151` | **override** | absolute | `setVelocity` | Boss reset to rest before a teleport. |
| `src/sim/ai/boss.js:157` | **push** | blended | `setVelocity` | Ground charge: 0.8 damping plus a directional drive, y untouched. |
| `src/sim/ai/boss.js:163` | **override** | absolute | `setVelocity` | Leap: the whole launch velocity is stated. |
| `src/sim/ai/boss.js:210` | **override** | absolute | `setVelocity` | Tentacle punt: the player is thrown at a stated velocity. |
| `src/sim/ai/boss.js:242` | **push** | blended | `setVelocity` | Chase steering with damping. |
| `src/sim/ai/boss.js:252` | **push** | axis | `setVelocity` | Vacuum pull: x added to, y stated outright. |
| `src/sim/ai/boss.js:272` | **push** | blended | `setVelocity` | Chase steering with damping. |
| `src/sim/ai/boss.js:312` | **push** | blended | `setVelocity` | Drift with damping plus sine drive. |
| `src/sim/ai/boss.js:313` | **push** | axis | `setVelocity` | Ceiling clamp: y stated, x preserved. |
| `src/sim/ai/boss.js:314` | **push** | axis | `setVelocity` | Floor clamp: y stated, x preserved. |
| `src/sim/ai/enemies.js:40` | **override** | absolute | `setVelocity` | Enemy projectile launch. |
| `src/sim/ai/enemies.js:57` | **override** | absolute | `setVelocity` | Contact shove throws the target at a stated velocity. |
| `src/sim/ai/enemies.js:68` | **push** | blended | `setVelocity` | Walk drive: 0.8 damping plus a directional term, y untouched. |
| `src/sim/ai/enemies.js:72` | **push** | axis | `setVelocity` | Enemy jump: y stated, x preserved. |
| `src/sim/ai/enemies.js:97` | **push** | blended | `setVelocity` | Walk drive with damping. |
| `src/sim/ai/enemies.js:115` | **override** | absolute | `setVelocity` | Hop: the whole launch velocity is stated. |
| `src/sim/ai/enemies.js:131` | **override** | absolute | `setVelocity` | Leap: the whole launch velocity is stated. |
| `src/sim/maps/builders.js:70` | **override** | absolute | `setVelocity` | Destructible debris spawn. |
| `src/sim/maps/builders.js:307` | **override** | absolute | `setVelocity` | Pendulum kick-off — the initial shove on a fresh ball. |
| `src/sim/maps/builders.js:315` | **push** | additive | `addVelocity` | Pendulum keep-swinging: a per-second nudge toward centre. |
| `src/sim/maps/builders.js:364` | **override** | absolute | `setVelocity` | Icicle drop: the whole velocity is stated at the moment it lets go. |
| `src/sim/maps/builders.js:380` | **push** | additive | `addVelocity` | applyWind — a per-second push on every loose body. The environmental force, mass-independent by design. |
| `src/sim/maps/builders.js:419` | **override** | absolute | `setVelocity` | Rolling boulder spawn at the arena edge. |
| `src/sim/spells/book.js:60` | **push** | additive | `addVelocity` | boomBolt blast knockback. |
| `src/sim/spells/book.js:119` | **push** | blended | `setVelocity` | Homing Wisp steering: 0.9 damping plus a seek term. |
| `src/sim/spells/book.js:132` | **push** | blended | `setVelocity` | Boomerang Orb turnaround: x negated. Reads its own velocity, cannot be a delta. |
| `src/sim/spells/book.js:141` | **push** | axis | `setVelocity` | Wobble Hex: y is a sine of time, x preserved. |
| `src/sim/spells/book.js:217` | **push** | additive | `addVelocity` | Cannon recoil on the caster. |
| `src/sim/spells/book.js:262` | **push** | additive | `addVelocity` | Chain lightning knockback. |
| `src/sim/spells/book.js:340` | **push** | additive | `addVelocity` | Recoil on the caster. |
| `src/sim/spells/book.js:347` | **push** | additive | `addVelocity` | Directional blast on everything in range. |
| `src/sim/spells/book.js:354` | **push** | additive | `addVelocity` | Shove — the canonical mass-independent push. An anvil goes as far as a wizard. |
| `src/sim/spells/book.js:367` | **push** | additive | `addVelocity` | Radial pull. |
| `src/sim/spells/book.js:382` | **push** | additive | `addVelocity` | Radial pull, weaker variant. |
| `src/sim/spells/book.js:395` | **push** | additive | `addVelocity` | Uppercut: pure upward delta, x untouched (dx = 0). |
| `src/sim/spells/book.js:404` | **push** | axis | `setVelocity` | Ground pound: y slammed to a fixed speed, x preserved. |
| `src/sim/spells/book.js:432` | **push** | additive | `addVelocity` | Sustained per-second attraction field. |
| `src/sim/spells/book.js:444` | **override** | absolute | `setVelocity` | Yank: the target is given a stated velocity toward the caster. |
| `src/sim/spells/book.js:474` | **push** | additive | `addVelocity` | Per-second storm push. |
| `src/sim/spells/book.js:557` | **override** | absolute | `setVelocity` | Icicle spawn drop. |
| `src/sim/spells/book.js:608` | **override** | absolute | `setVelocity` | Dash: the caster's velocity is replaced outright. |
| `src/sim/spells/book.js:642` | **push** | blended | `setVelocity` | Seeker steering with damping. |
| `src/sim/spells/book.js:667` | **push** | axis | `setVelocity` | Launch: y stated, x preserved. |
| `src/sim/spells/book.js:712` | **override** | absolute | `setVelocity` | Crate Drop spawn — crates fall fast from a stated velocity. |
| `src/sim/spells/book.js:746` | **override** | absolute | `setVelocity` | Bouncy ball spawn. |
| `src/sim/spells/book.js:777` | **override** | absolute | `setVelocity` | Decoy spawn. |
| `src/sim/spells/book.js:802` | **push** | blended | `setVelocity` | Bee steering with damping. |
| `src/sim/spells/book.js:827` | **override** | absolute | `setVelocity` | Saw spawn. |
| `src/sim/spells/book.js:876` | **push** | additive | `addVelocity` | Chaos scatter: a randomised push on everything loose. |
| `src/sim/spells/book.js:901` | **override** | absolute | `setVelocity` | Vacuum: the target is given a stated velocity toward the caster. |
| `src/sim/spells/book.js:924` | **override** | absolute | `setVelocity` | swaphex/teleport reset — brief rule 5. The arriving body starts at rest. |
| `src/sim/spells/book.js:956` | **push** | additive | `addVelocity` | Melee knockback. |
| `src/sim/spells/book.js:1006` | **override** | absolute | `setVelocity` | Grapple: a stated velocity toward the anchor. |
| `src/sim/spells/book.js:1014` | **override** | absolute | `setVelocity` | Hook: a stated velocity toward the caster. |
| `src/sim/spells/book.js:1029` | **push** | axis | `setVelocity` | Pop up: y stated, x preserved. |
| `src/sim/spells/book.js:1040` | **push** | axis | `setVelocity` | Slam down: y stated, x preserved. |
| `src/sim/spells/fusion.js:247` | **push** | additive | `addVelocity` | Per-second storm push. |
| `src/sim/spells/fusion.js:276` | **push** | additive | `addVelocity` | Freeze shove. |
| `src/sim/spells/fusion.js:349` | **push** | additive | `addVelocity` | Recoil on the caster. |
| `src/sim/spells/fusion.js:400` | **push** | axis | `setVelocity` | Blast: x added to, y stated outright. |
| `src/sim/spells/fusion.js:508` | **push** | additive | `addVelocity` | Reversal shove. |
| `src/sim/spells/fusion.js:518` | **override** | absolute | `setVelocity` | Repulse: a position-derived velocity, stated outright. |
| `src/sim/spells/fusion.js:531` | **push** | additive | `addVelocity` | Heavy shove. |
| `src/sim/spells/fusion.js:578` | **push** | axis | `setVelocity` | Floaty: y stated, x preserved. |
| `src/sim/spells/fusion.js:624` | **override** | absolute | `setVelocity` | Scatter: a stated velocity on a random heading. |
| `src/sim/spells/core.js:52` | **override** | absolute | `setVelocity` | Bolt launch — the muzzle velocity. |
| `src/sim/spells/core.js:65` | **override** | absolute | `setVelocity` | Bolt launch — the muzzle velocity, gravity-flip aware. |
| `src/sim/spells/core.js:125` | **push** | additive | `addVelocity` | explode() — the single most-used push in the game. Mass-independent so a blast reads the same whatever it catches. |
| `src/sim/spells/core.js:252` | **push** | additive | `addVelocity` | Singularity: a per-second radial pull plus a tangential term. |
| `src/sim/maps/book.js:94` | **push** | additive | `addVelocity` | Updraft Canyon: a per-second lift, x untouched (dx = 0). |
| `src/sim/maps/book.js:108` | **override** | blended | `setVelocity` | Conveyor — brief rule 4. It clamps to ±9, so the result is not the old velocity plus anything; the belt states what the velocity is allowed to be. |
| `src/sim/maps/book.js:110` | **override** | blended | `setVelocity` | Conveyor (Assembly Line) — brief rule 4, clamps. |
| `src/sim/maps/book.js:114` | **override** | blended | `setVelocity` | Conveyor (The Gauntlet) — brief rule 4, clamps. |
| `src/sim/maps/book.js:127` | **push** | additive | `addVelocity` | Gas Vents: a per-second lift, x untouched. |
| `src/sim/maps/book.js:139` | **push** | additive | `addVelocity` | The Core: a per-second pull toward the centre. |
| `src/sim/maps/book.js:167` | **push** | additive | `addVelocity` | Eye of the Storm: a per-second push back toward the middle. |
| `src/sim/maps/book.js:181` | **push** | additive | `addVelocity` | Event Horizon: a per-second pull. |
| `src/sim/maps/book.js:185` | **push** | additive | `addVelocity` | The Maw: a per-second pull downward. |
