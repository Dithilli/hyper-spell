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

### Where these counts differ from the brief's prediction, and why

The brief predicted ~70 push / ~25 override / ~12 controller. Actual:
**%%PUSH%% / %%OVERRIDE%% / %%CONTROLLER%%**. Override is +13 and controller is −9, which trips the
brief's own re-read rule ("if your counts differ by more than 10, re-read the
outliers — a misclassification here is a silent content rebalance"). So they
were re-read, twice: once by hand and once by a self-check inside
`scripts/classify-velocity.mjs`, which asserts for every one of the 107 sites
that "classified push" and "the write derives from this body's own velocity"
agree. It reads the whole write statement plus any local assigned from the
target's velocity in the three lines above, and it throws rather than warns.
Flipping any single row's class makes it fail. Here is the account.

**The re-read found one real misclassification**, and it is recorded rather than
quietly corrected because it shows what the audit was for:
`src/sim/spells/starters.js:44`, Gust hitting an in-flight bolt. The write is
`{ x: dir.x * spd, y: dir.y * spd }`, which reads as a launch — but `spd` is
`Math.hypot(b.velocity.x, b.velocity.y)`, computed two lines above. Gust
*redirects* a bolt at its existing speed; that is a push. First pass called it
an override because the velocity read was off-line. It is a push here, and it is
the reason the audit script looks past the write statement.

**Controller is 3, not 12, and that is a fact about the file, not a judgement.**
`src/sim/player/controller.js` contains exactly three velocity writes — the walk
blend, the ground jump and the air jump. `grep -c 'setVelocity(' src/sim/player/controller.js`
returns 3. The brief's estimate appears to have counted the movement path
rather than the writes in it. There is no set of nine sites that "moved" out of
controller into override; the bucket was simply never that big.

**Override is +13 because the brief's five rules have no bucket for the
authoritative gameplay throw.** The 38 overrides break down as:

| Sub-kind | Count | What it is |
|---|---|---|
| fresh-body spawn / launch | 16 | the body was created a few lines above and has no prior motion to preserve |
| reset / teleport | 3 | brief rule 5 — `spawnPlayer`, the boss pit reset, `chaostheory` |
| conveyor clamp | 3 | brief rule 4 |
| AI drive, guard-read only | 4 | a stated hop or leap, gated on `Math.abs(b.velocity.y) < 1` |
| **authoritative gameplay throw** | **12** | an effect that deliberately *discards* the target's momentum and states a new one |

The first three groups are 22 sites, which is the brief's ~25. The overshoot is
the last two groups, and the substantial one is the twelve throws. They are
listed below by name because they are the borderline calls of this whole table.

### The twelve borderline sites

Each of these acts on a body that is already moving, and each replaces its
velocity outright rather than adding to it. A designer would call several of
them pushes; the classification calls them overrides on one criterion — **the
value written is not a function of the value that was there.** Yank the same
enemy twice and they end up at the same velocity both times, which is not true
of Shove.

- `src/sim/ai/boss.js:72` — boss slam knockback on the player
- `src/sim/ai/boss.js:214` — tentacle punt
- `src/sim/ai/enemies.js:60` — enemy contact shove
- `src/sim/player/ghost.js:33` — poltergeist release ("a toss, not a throw")
- `src/sim/player/ghost.js:36` — poltergeist carry, a position-derived spring
- `src/sim/spells/book.js:448` — Magnet Palm yank
- `src/sim/spells/book.js:612` — Phoenix Dash (`selfMove: true`; discarding the
  caster's momentum is the spell)
- `src/sim/spells/book.js:905` — telekinesis fling
- `src/sim/spells/book.js:1010` — Yoink
- `src/sim/spells/book.js:1018` — the hook
- `src/sim/spells/fusion.js:519` — Zephyr repulse
- `src/sim/spells/fusion.js:625` — Whirligig

**This does not weaken the task's central finding.** Every one of the twelve is
*already* mass-independent — no expression in any of them divides by `b.mass` —
so converting them to `applyImpulse` would rebalance them exactly as it would
rebalance the 66 pushes. The push/override line is about *whether prior motion
survives*, not about whether mass matters. Mass matters at none of the 107.

The four AI-drive sites (`src/sim/tick.js:63`, `src/sim/ai/boss.js:167`,
`src/sim/ai/enemies.js:118`, `src/sim/ai/enemies.js:134`) are the milder version
of the same call: they read `b.velocity.y` only to ask "am I on the ground?".
A guard read is not an input to the value, so they are overrides.

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

### ¹ The twelve additive pushes that could not become `addVelocity` yet

%%ADDVELOCITY%% of the %%ADDITIVE%% additive sites are `addVelocity` today. The other %%REASSOC%% are marked
`setVelocity ¹` in the table below. They are additive in intent and additive in
arithmetic, but hoisting the delta out would re-associate the floating point:

```
    v.y + A - B      is  (v.y + A) - B
    addVelocity(dv)  is   v.y + (A - B)
```

Those are different doubles about 31% of the time (measured, 200k samples of
plausible in-game magnitudes), and this simulation is bit-exact by contract —
the golden tape would move, which task 8 is not allowed to do. Converting them
belongs to a task whose contract permits re-recording the tape.

**This is a live hazard for phase 2, not a footnote.** A planck backend that
implements the push as `body.setLinearVelocity(v.add(dv))` is doing the
right physics and will still diverge from the tape, because the association
differs. When the A/B diff shows a body drifting by ~1e-16 per push, this is why.

%%REASSOCLIST%%

## Every site

| Site | Class | Form | Facade call | Rationale |
|---|---|---|---|---|
