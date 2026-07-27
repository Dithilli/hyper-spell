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
`src/sim/spells/starters.js:43`, Gust hitting an in-flight bolt. The write is
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
authoritative gameplay throw.** The %%OVERRIDE%% overrides break down as:

| Sub-kind | Count | What it is |
|---|---|---|
| fresh-body spawn / launch | %%SPAWN%% | the body was created a few lines above and has no prior motion to preserve |
| reset / teleport | %%RESET%% | brief rule 5 — `spawnPlayer`, the boss pit reset, `chaostheory` |
| conveyor clamp | %%CLAMP%% | brief rule 4 |
| AI drive, guard-read only | %%DRIVE%% | a stated hop or leap, gated on `Math.abs(b.velocity.y) < 1` |
| **authoritative gameplay throw** | **%%THROW%%** | an effect that deliberately *discards* the target's momentum and states a new one |

The first three groups are %%FIRSTTHREE%% sites, which is the brief's ~25. The overshoot is
the last two groups, and the substantial one is the %%THROW%% throws. They are
listed below by name because they are the borderline calls of this whole table.

### The %%THROW%% borderline sites

Each of these acts on a body that is already moving, and each replaces its
velocity outright rather than adding to it. A designer would call several of
them pushes; the classification calls them overrides on one criterion — **the
value written is not a function of the value that was there.** Yank the same
enemy twice and they end up at the same velocity both times, which is not true
of Shove.

%%THROWLIST%%

**This does not weaken the task's central finding.** Every one of the %%THROW%% is
*already* mass-independent — no expression in any of them divides by `b.mass` —
so converting them to `applyImpulse` would rebalance them exactly as it would
rebalance the %%PUSH%% pushes. The push/override line is about *whether prior motion
survives*, not about whether mass matters. Mass matters at none of the %%TOTAL%%.

The %%DRIVE%% AI-drive sites (%%DRIVELIST%%) are the milder version of the same call:
they read `b.velocity.y` only to ask "am I on the ground?". A guard read is not
an input to the value, so they are overrides.

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

## Two floating-point hazards for phase 2, in order of size

Phase 2 swaps matter-js for planck.js behind this facade and A/B-diffs the
golden tape. Both hazards below make a *correct* planck implementation disagree
with the tape. The first is much the larger, and it was found second — the
document previously led with the smaller one, which would have sent a reader
chasing the wrong mechanism.

### First-order: matter does not store the velocity you give it

`Body.setVelocity` is Verlet. It does not keep a velocity vector; it writes a
previous position and derives velocity from the gap:

```js
positionPrev.x = position.x - v.x * timeScale;
velocity.x     = (position.x - positionPrev.x) / timeScale;
```

Subtracting a ~1e1 velocity from a ~1e3 arena coordinate and adding it back
loses low bits. Measured over 100k writes at realistic arena positions:

| | differs | mean error | max error |
|---|---|---|---|
| **`setVelocity` position round-trip** | **99.7% of writes** | 3.2e-14 | 1.1e-13 |
| delta re-association (below) | 31% of writes | 5.3e-16 | 7.1e-15 |

The round-trip is roughly 60× the mean error of the re-association one, and it
applies to **all %%TOTAL%% velocity writes rather than %%REASSOC%%**. (It is exact for
low-entropy values — a velocity of `2.5` survives it — so a probe built on
round numbers will report 0% and hide it. Real velocities are the end of long
arithmetic chains and carry all 53 mantissa bits.
`test/facade.test.js` pins this, generator and all.)

**What this means for A/B parity.** The golden tape encodes matter's position
round-trip, not the velocities this simulation asks for. A planck backend
implementing `setVelocity` as `setLinearVelocity(v)` — **the correct
implementation** — stores the exact vector and therefore diverges from the tape
at the first velocity write, and at every one after it. There is no bug to fix
in that backend; the tape is simply a recording of a different arithmetic.

So **bit-exact A/B parity through this facade is probably not attainable**, and
planning for it may be planning for something that cannot happen. Phase 2 should
expect to need one of:

- a **tolerance-based** comparison (per-tick position/velocity within an epsilon
  that grows with the run) instead of a hash match, accepting that a chaotic
  brawler will eventually diverge macroscopically from a 1e-14 seed and that the
  useful question is *how many ticks until it does*;
- or a deliberate **bug-for-bug** planck `setVelocity` that reproduces the
  position round-trip, which buys tape equality at the cost of writing matter's
  accident into the new backend permanently;
- or **re-recording the tape** against planck and keeping the matter tape as a
  historical artefact, which abandons the parity check that motivated the swap.

That is a decision phase 2 has to make deliberately, and it is better made now
than discovered on the first diff.

### Second-order: ¹ the %%REASSOC%% additive pushes that could not become `addVelocity`

%%ADDVELOCITY%% of the %%ADDITIVE%% additive sites are `addVelocity` today. The other %%REASSOC%% are marked
`setVelocity ¹` in the table below. They are additive in intent and additive in
arithmetic, but hoisting the delta out would re-associate the floating point:

```
    v.y + A - B      is  (v.y + A) - B
    addVelocity(dv)  is   v.y + (A - B)
```

Different doubles 31% of the time, which is enough to move the tape within a few
hundred ticks — and task 8 is not allowed to do that. Converting them belongs to
a task whose contract permits re-recording.

The obvious workaround does not work either: two sequential `addVelocity` calls
*look* like they preserve the association, and do not, because each one goes
through the position round-trip above.

%%REASSOCLIST%%

## Two traps in task 9's direct path

Task 9 replaces the 10px stepping loops in `raycastHit` and `groundYAt`
(`src/sim/spells/core.js`) with `queryRay`. Both of these are things the golden
tape cannot warn it about.

**`queryRay`'s `point` and `normal` are approximations, not intersections.**
Matter's own documentation for `Query.ray` says *"Intersection points are not
provided"* — it does SAT against a thin rectangle and returns collision data.
The facade synthesises `point` from `collision.supports`, picking the support
nearest the ray origin, and falls back to `body.position` when there are none.
A planck raycast returns an exact fraction, point and normal. `raycastHit`
currently returns its *sample* point, so switching it to `hit.point` will change
those numbers — and nothing pins them today: `test/facade.test.js` asserts only
`hit.body`. Decide what `point` means before depending on it, and pin it.

**Every ray consumes a body id.** `Query.ray` builds a throwaway
`Bodies.rectangle`, which advances `Common._nextId` as well as `Common._seed`.
The facade guards the seed (see `resetPhysRandom`), but not the id counter —
matter has no way to rewind it. Body ids ride the wire, and the tape hash
**deliberately ignores `id`** (see `IGNORED_BODY_KEYS` in `test/harness/hash.js`,
which excludes it so bodies constructed in a different order still hash equal).
The tape is therefore structurally blind to id drift. Task 9 adds a ray per
stepping loop per tick, so ids will drift hard, and the only oracle that would
notice is one nobody has written.

## Every site

| Site | Class | Form | Facade call | Rationale |
|---|---|---|---|---|
