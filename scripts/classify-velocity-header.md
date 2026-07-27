# Velocity-write classification

Every velocity write in `src/sim/` — all %%TOTAL%% of them — classified, with the facade
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
| **gameplay push** | the new velocity is a function of the body's *current* velocity — the body was already moving and the game is modifying that motion | %%PUSH%% |
| **authoritative override** | the new velocity ignores the current velocity entirely — spawn, launch, teleport, reset, or a clamp that states what the velocity is allowed to be | %%OVERRIDE%% |
| **controller drive** | inside `src/sim/player/controller.js`'s movement blend | %%CONTROLLER%% |

Cross-cutting that, the **form** column says what the write's *arithmetic* is,
which is what decides the facade call:

| Form | Arithmetic | Facade call | Count |
|---|---|---|---|
| `additive` | every component is `current + delta` | `addVelocity(b, dv)` | %%ADDITIVE%% |
| `blended` | the current velocity is scaled or negated as well (`v * 0.9 + drive`) | `setVelocity(b, f(velocityOf(b)))` | %%BLENDED%% |
| `axis` | one axis preserved, the other stated outright | `setVelocity(b, { x: velocityOf(b).x, y: … })` | %%AXIS%% |
| `absolute` | the current velocity is never read | `setVelocity(b, v)` | %%ABSOLUTE%% |

Only `additive` sites can become `addVelocity` without changing a single
floating-point operation, and task 8 is a refactor: the golden tape has to
replay byte-identically. `blended` and `axis` sites are still mass-independent
gameplay pushes conceptually — they are just not expressible as a delta, so they
keep reading `velocityOf(b)` and writing the whole vector. A planck backend must
preserve that: **`setVelocity` is not a licence to add damping of its own.**

### Where these counts differ from the brief's prediction

The brief predicted ~70 push / ~25 override / ~12 controller. Actual:
**%%PUSH%% / %%OVERRIDE%% / %%CONTROLLER%%**.

- **push is within 5 of the prediction** — the number that matters, since it is
  the count of sites a mass-scaling "fix" would rebalance. Within the brief's
  own tolerance ("if your counts differ by more than 10, re-read the outliers").
- **controller is 3, not 12.** `src/sim/player/controller.js` contains exactly
  three velocity writes: the walk blend, the ground jump and the air jump. The
  brief's estimate appears to have counted the movement path rather than the
  writes in it. The nine it over-counted land in override, which is the whole
  of the override overshoot bar the five from push: override + controller is
  %%OVERRIDE%% + %%CONTROLLER%% = 42, against a predicted 25 + 12 = 37, and 42 − 37 = 5 is
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
