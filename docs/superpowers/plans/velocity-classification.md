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
| **gameplay push** | the new velocity is a function of the body's *current* velocity — the body was already moving and the game is modifying that motion | 66 |
| **authoritative override** | the new velocity ignores the current velocity entirely — spawn, launch, teleport, reset, or a clamp that states what the velocity is allowed to be | 38 |
| **controller drive** | inside `src/sim/player/controller.js`'s movement blend | 3 |

Cross-cutting that, the **form** column says what the write's *arithmetic* is,
which is what decides the facade call:

| Form | Arithmetic | Facade call | Count |
|---|---|---|---|
| `additive` | every component is `current + delta` | `addVelocity(b, dv)` | 34 |
| `blended` | the current velocity is scaled or negated as well (`v * 0.9 + drive`) | `setVelocity(b, f(velocityOf(b)))` | 19 |
| `axis` | one axis preserved, the other stated outright | `setVelocity(b, { x: velocityOf(b).x, y: … })` | 19 |
| `absolute` | the current velocity is never read | `setVelocity(b, v)` | 35 |

Only `additive` sites can become `addVelocity` without changing a single
floating-point operation, and task 8 is a refactor: the golden tape has to
replay byte-identically. `blended` and `axis` sites are still mass-independent
gameplay pushes conceptually — they are just not expressible as a delta, so they
keep reading `velocityOf(b)` and writing the whole vector. A planck backend must
preserve that: **`setVelocity` is not a licence to add damping of its own.**

### Where these counts differ from the brief's prediction, and why

The brief predicted ~70 push / ~25 override / ~12 controller. Actual:
**66 / 38 / 3**. Override is +13 and controller is −9, which trips the
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
the last two groups, and the substantial one is the 12 throws. They are
listed below by name because they are the borderline calls of this whole table.

### The 12 borderline sites

Each of these acts on a body that is already moving, and each replaces its
velocity outright rather than adding to it. A designer would call several of
them pushes; the classification calls them overrides on one criterion — **the
value written is not a function of the value that was there.** Yank the same
enemy twice and they end up at the same velocity both times, which is not true
of Shove.

- `src/sim/player/ghost.js:33` — Poltergeist release — "a toss, not a throw" states the whole velocity.
- `src/sim/player/ghost.js:36` — Poltergeist carry: a position-derived spring velocity, clamped. Nothing of the prop's own motion survives.
- `src/sim/ai/boss.js:76` — Boss slam shockwave throws the player at a stated velocity.
- `src/sim/ai/boss.js:218` — Tentacle punt: the player is thrown at a stated velocity.
- `src/sim/ai/enemies.js:65` — Contact shove throws the target at a stated velocity.
- `src/sim/spells/book.js:470` — Yank: the target is given a stated velocity toward the caster.
- `src/sim/spells/book.js:621` — Dash: the caster's velocity is replaced outright.
- `src/sim/spells/book.js:925` — Vacuum: the target is given a stated velocity toward the caster.
- `src/sim/spells/book.js:1028` — Grapple: a stated velocity toward the anchor.
- `src/sim/spells/book.js:1036` — Hook: a stated velocity toward the caster.
- `src/sim/spells/fusion.js:515` — Repulse: a position-derived velocity, stated outright.
- `src/sim/spells/fusion.js:621` — Scatter: a stated velocity on a random heading.

**This does not weaken the task's central finding.** Every one of the 12 is
*already* mass-independent — no expression in any of them divides by `b.mass` —
so converting them to `applyImpulse` would rebalance them exactly as it would
rebalance the 66 pushes. The push/override line is about *whether prior motion
survives*, not about whether mass matters. Mass matters at none of the 107.

The 4 AI-drive sites (`src/sim/tick.js:63`, `src/sim/ai/boss.js:171`, `src/sim/ai/enemies.js:123`, `src/sim/ai/enemies.js:139`) are the milder version of the same call:
they read `b.velocity.y` only to ask "am I on the ground?". A guard read is not
an input to the value, so they are overrides.

### Deliberate departures from the brief's five pattern rules

- **Conveyor belts** (`src/sim/maps/book.js`, three sites) are classified
  **override** even though they read `b.velocity.x`, exactly as the brief's
  rule 4 directs: the `Math.max(-9, Math.min(9, …))` clamp means the result is
  not "the old velocity plus something", it is "what the belt permits". They
  are marked `blended` in the form column because the arithmetic still reads the
  current velocity, so the facade call is `setVelocity`.
- **`src/sim/player/combat.js:51`** (the hat gib) reads
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
applies to **all 107 velocity writes rather than 12**. (It is exact for
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

### Second-order: ¹ the 12 additive pushes that could not become `addVelocity`

22 of the 34 additive sites are `addVelocity` today. The other 12 are marked
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

- `src/sim/spells/starters.js:47`
- `src/sim/spells/starters.js:49`
- `src/sim/spells/starters.js:67`
- `src/sim/player/ghost.js:126`
- `src/sim/spells/book.js:84`
- `src/sim/spells/book.js:374`
- `src/sim/spells/book.js:393`
- `src/sim/spells/book.js:407`
- `src/sim/spells/book.js:500`
- `src/sim/spells/fusion.js:251`
- `src/sim/spells/core.js:148`
- `src/sim/spells/core.js:263`

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

**The tape is also blind while the killcam is playing, and that is about a third
of the long tape.** `takeWireSnapshot` (`src/net/server-bridge.js`, line 110) returns
pre-recorded replay frames for the whole of a round-end killcam, so every tick
hash in that window is a hash of the *replay buffer*, not of the live sim. The
sim keeps stepping underneath it — `src/sim/player/controller.js` line 109 lets bots
go on casting — and any divergence it accumulates is invisible until the killcam
ends. Nothing new enters the buffer meanwhile: `src/sim/replay.js` line 22 returns
early unless `game.state === 'PLAY'`.

The window is `LEAD_MS 500 + TAIL_MS 2200 / SPEED 0.45 + HOLD_MS 400` ≈ 5.8s ≈
350 ticks per round end (`src/sim/replay.js`, lines 12-15 and 46). `three-rounds` crosses
four of them inside 4,200 ticks, so roughly 1,400 ticks — a third of the tape —
cannot see a sim difference at all.

This was measured in task 12, where a change to Roulette's pool altered a roll at
tick 2976 and the first differing hash did not appear until tick 3102: the first
live frame after the killcam, 126 ticks later. It does not weaken a divergence
the tape DOES report, and it does not weaken a whole-tape identity result (all
4,200 hashes equal means the live frames all matched). It does mean a change
whose only effect lands inside a killcam window will not move this tape, so
"the tape did not move" is never on its own a proof that behaviour did not
change. Pair it with a unit test.

## Every site

| Site | Class | Form | Facade call | Rationale |
|---|---|---|---|---|

| `src/sim/player/combat.js:51` | **override** | absolute | `setVelocity` | Gib spawn. The hat is new and has no velocity of its own; it inherits half the caster's x. Reading another body's velocity is not reading your own. |
| `src/sim/player/combat.js:73` | **override** | absolute | `setVelocity` | Gib spawn: a fresh body is thrown at a randomised velocity. |
| `src/sim/spells/starters.js:26` | **push** | additive | `addVelocity` | Blast recoil on the caster: velocity minus a facing-scaled kick. |
| `src/sim/spells/starters.js:44` | **push** | blended | `setVelocity` | Gust REDIRECTS an in-flight bolt: `spd = Math.hypot(b.velocity.x, b.velocity.y)` two lines up, then the same speed on a new heading. Reads its own velocity — a push, not a launch. Classified override on first pass; the read is off-line, which is exactly why the audit had to look past the write itself. |
| `src/sim/spells/starters.js:47` | **push** | additive | `setVelocity` ¹ | Gust shoves whatever it catches. The mass-independent push, verbatim. |
| `src/sim/spells/starters.js:49` | **push** | additive | `setVelocity` ¹ | Gust self-recoil on the caster. |
| `src/sim/spells/starters.js:67` | **push** | additive | `setVelocity` ¹ | Melee knockback added to the victim's motion. |
| `src/sim/tick.js:63` | **override** | absolute | `setVelocity` | Critter hop: the AI states the whole velocity each hop. |
| `src/sim/tick.js:69` | **push** | axis | `setVelocity` | Saw drive: x is pinned to a constant travel speed, y is left to physics. Not expressible as a delta; stays setVelocity. |
| `src/sim/player/ghost.js:33` | **override** | absolute | `setVelocity` | Poltergeist release — "a toss, not a throw" states the whole velocity. |
| `src/sim/player/ghost.js:36` | **override** | absolute | `setVelocity` | Poltergeist carry: a position-derived spring velocity, clamped. Nothing of the prop's own motion survives. |
| `src/sim/player/ghost.js:126` | **push** | additive | `setVelocity` ¹ | Wisp gust on nearby bodies. |
| `src/sim/player/controller.js:127` | **controller** | blended | `setVelocity` → `setControlVelocity` (phase 3) | Movement blend: x eased toward the walk target, y untouched. Phase 3 gives this its own setControlVelocity so a character controller can own it. |
| `src/sim/player/controller.js:134` | **controller** | axis | `setVelocity` → `setControlVelocity` (phase 3) | Jump: y set outright, x preserved. Same owner as the blend above. |
| `src/sim/player/controller.js:139` | **controller** | axis | `setVelocity` → `setControlVelocity` (phase 3) | Air jump: y set outright, x preserved. |
| `src/sim/player/lifecycle.js:113` | **override** | absolute | `setVelocity` | spawnPlayer — brief rule 5. A respawn must not inherit the corpse's momentum. |
| `src/sim/collision.js:116` | **push** | blended | `setVelocity` | Reflect: the bolt's own velocity is negated and damped. Reads the current velocity, so it is a push, but the sign flip means it cannot be a delta. |
| `src/sim/collision.js:155` | **push** | blended | `setVelocity` | Banana slip: x amplified 1.5x, y kicked up. The x scaling keeps it out of addVelocity. |
| `src/sim/collision.js:170` | **push** | axis | `setVelocity` | Stomp — the victim is driven down at a fixed speed, x preserved. |
| `src/sim/collision.js:171` | **push** | axis | `setVelocity` | Stomp — the stomper bounces off the landing at a fixed speed. |
| `src/sim/collision.js:180` | **push** | axis | `setVelocity` | Trampoline fling: a fixed launch speed, horizontal motion preserved. |
| `src/sim/collision.js:203` | **push** | axis | `setVelocity` | Spikes: a fixed pop upward, horizontal motion preserved. |
| `src/sim/collision.js:209` | **push** | axis | `setVelocity` | Bosses shrug off lava with a fixed upward pop. |
| `src/sim/events.js:148` | **push** | additive | `addVelocity` | Windstorm event: a per-second push on every loose body. |
| `src/sim/events.js:172` | **override** | absolute | `setVelocity` | Critter spawn at the arena edge. |
| `src/sim/ai/boss.js:54` | **override** | absolute | `setVelocity` | Boss projectile launch. |
| `src/sim/ai/boss.js:76` | **override** | absolute | `setVelocity` | Boss slam shockwave throws the player at a stated velocity. |
| `src/sim/ai/boss.js:94` | **push** | blended | `setVelocity` | Flier chase: 0.92 damping plus a steering term. Damping is a scale, not a delta. |
| `src/sim/ai/boss.js:123` | **push** | blended | `setVelocity` | Hover bob: damping plus a sine drive. |
| `src/sim/ai/boss.js:159` | **override** | absolute | `setVelocity` | Boss reset to rest before a teleport. |
| `src/sim/ai/boss.js:165` | **push** | blended | `setVelocity` | Ground charge: 0.8 damping plus a directional drive, y untouched. |
| `src/sim/ai/boss.js:171` | **override** | absolute | `setVelocity` | Leap: the whole launch velocity is stated. |
| `src/sim/ai/boss.js:218` | **override** | absolute | `setVelocity` | Tentacle punt: the player is thrown at a stated velocity. |
| `src/sim/ai/boss.js:250` | **push** | blended | `setVelocity` | Chase steering with damping. |
| `src/sim/ai/boss.js:260` | **push** | axis | `setVelocity` | Vacuum pull: x added to, y stated outright. |
| `src/sim/ai/boss.js:280` | **push** | blended | `setVelocity` | Chase steering with damping. |
| `src/sim/ai/boss.js:320` | **push** | blended | `setVelocity` | Drift with damping plus sine drive. |
| `src/sim/ai/boss.js:321` | **push** | axis | `setVelocity` | Ceiling clamp: y stated, x preserved. |
| `src/sim/ai/boss.js:322` | **push** | axis | `setVelocity` | Floor clamp: y stated, x preserved. |
| `src/sim/ai/enemies.js:44` | **override** | absolute | `setVelocity` | Enemy projectile launch. |
| `src/sim/ai/enemies.js:65` | **override** | absolute | `setVelocity` | Contact shove throws the target at a stated velocity. |
| `src/sim/ai/enemies.js:76` | **push** | blended | `setVelocity` | Walk drive: 0.8 damping plus a directional term, y untouched. |
| `src/sim/ai/enemies.js:80` | **push** | axis | `setVelocity` | Enemy jump: y stated, x preserved. |
| `src/sim/ai/enemies.js:105` | **push** | blended | `setVelocity` | Walk drive with damping. |
| `src/sim/ai/enemies.js:123` | **override** | absolute | `setVelocity` | Hop: the whole launch velocity is stated. |
| `src/sim/ai/enemies.js:139` | **override** | absolute | `setVelocity` | Leap: the whole launch velocity is stated. |
| `src/sim/maps/builders.js:76` | **override** | absolute | `setVelocity` | Destructible debris spawn. |
| `src/sim/maps/builders.js:314` | **override** | absolute | `setVelocity` | Pendulum kick-off — the initial shove on a fresh ball. |
| `src/sim/maps/builders.js:322` | **push** | additive | `addVelocity` | Pendulum keep-swinging: a per-second nudge toward centre. |
| `src/sim/maps/builders.js:371` | **override** | absolute | `setVelocity` | Icicle drop: the whole velocity is stated at the moment it lets go. |
| `src/sim/maps/builders.js:387` | **push** | additive | `addVelocity` | applyWind — a per-second push on every loose body. The environmental force, mass-independent by design. |
| `src/sim/maps/builders.js:426` | **override** | absolute | `setVelocity` | Rolling boulder spawn at the arena edge. |
| `src/sim/spells/book.js:84` | **push** | additive | `setVelocity` ¹ | boomBolt blast knockback. |
| `src/sim/spells/book.js:143` | **push** | blended | `setVelocity` | Homing Wisp steering: 0.9 damping plus a seek term. |
| `src/sim/spells/book.js:156` | **push** | blended | `setVelocity` | Boomerang Orb turnaround: x negated. Reads its own velocity, cannot be a delta. |
| `src/sim/spells/book.js:165` | **push** | axis | `setVelocity` | Wobble Hex: y is a sine of time, x preserved. |
| `src/sim/spells/book.js:245` | **push** | additive | `addVelocity` | Cannon recoil on the caster. |
| `src/sim/spells/book.js:290` | **push** | additive | `addVelocity` | Chain lightning knockback. |
| `src/sim/spells/book.js:366` | **push** | additive | `addVelocity` | Recoil on the caster. |
| `src/sim/spells/book.js:374` | **push** | additive | `setVelocity` ¹ | Directional blast on everything in range. |
| `src/sim/spells/book.js:381` | **push** | additive | `addVelocity` | Shove — the canonical mass-independent push. An anvil goes as far as a wizard. |
| `src/sim/spells/book.js:393` | **push** | additive | `setVelocity` ¹ | Radial pull. |
| `src/sim/spells/book.js:407` | **push** | additive | `setVelocity` ¹ | Radial pull, weaker variant. |
| `src/sim/spells/book.js:421` | **push** | additive | `addVelocity` | Uppercut: pure upward delta, x untouched (dx = 0). |
| `src/sim/spells/book.js:430` | **push** | axis | `setVelocity` | Ground pound: y slammed to a fixed speed, x preserved. |
| `src/sim/spells/book.js:458` | **push** | additive | `addVelocity` | Sustained per-second attraction field. |
| `src/sim/spells/book.js:470` | **override** | absolute | `setVelocity` | Yank: the target is given a stated velocity toward the caster. |
| `src/sim/spells/book.js:500` | **push** | additive | `setVelocity` ¹ | Per-second storm push. |
| `src/sim/spells/book.js:571` | **override** | absolute | `setVelocity` | Icicle spawn drop. |
| `src/sim/spells/book.js:621` | **override** | absolute | `setVelocity` | Dash: the caster's velocity is replaced outright. |
| `src/sim/spells/book.js:655` | **push** | blended | `setVelocity` | Seeker steering with damping. |
| `src/sim/spells/book.js:680` | **push** | axis | `setVelocity` | Launch: y stated, x preserved. |
| `src/sim/spells/book.js:725` | **override** | absolute | `setVelocity` | Crate Drop spawn — crates fall fast from a stated velocity. |
| `src/sim/spells/book.js:759` | **override** | absolute | `setVelocity` | Bouncy ball spawn. |
| `src/sim/spells/book.js:790` | **override** | absolute | `setVelocity` | Decoy spawn. |
| `src/sim/spells/book.js:815` | **push** | blended | `setVelocity` | Bee steering with damping. |
| `src/sim/spells/book.js:840` | **override** | absolute | `setVelocity` | Saw spawn. |
| `src/sim/spells/book.js:893` | **push** | additive | `addVelocity` | Chaos scatter: a randomised push on everything loose. |
| `src/sim/spells/book.js:925` | **override** | absolute | `setVelocity` | Vacuum: the target is given a stated velocity toward the caster. |
| `src/sim/spells/book.js:947` | **override** | absolute | `setVelocity` | swaphex/teleport reset — brief rule 5. The arriving body starts at rest. |
| `src/sim/spells/book.js:979` | **push** | additive | `addVelocity` | Melee knockback. |
| `src/sim/spells/book.js:1028` | **override** | absolute | `setVelocity` | Grapple: a stated velocity toward the anchor. |
| `src/sim/spells/book.js:1036` | **override** | absolute | `setVelocity` | Hook: a stated velocity toward the caster. |
| `src/sim/spells/book.js:1051` | **push** | axis | `setVelocity` | Pop up: y stated, x preserved. |
| `src/sim/spells/book.js:1062` | **push** | axis | `setVelocity` | Slam down: y stated, x preserved. |
| `src/sim/spells/fusion.js:251` | **push** | additive | `setVelocity` ¹ | Per-second storm push. |
| `src/sim/spells/fusion.js:273` | **push** | additive | `addVelocity` | Freeze shove. |
| `src/sim/spells/fusion.js:346` | **push** | additive | `addVelocity` | Recoil on the caster. |
| `src/sim/spells/fusion.js:397` | **push** | axis | `setVelocity` | Blast: x added to, y stated outright. |
| `src/sim/spells/fusion.js:505` | **push** | additive | `addVelocity` | Reversal shove. |
| `src/sim/spells/fusion.js:515` | **override** | absolute | `setVelocity` | Repulse: a position-derived velocity, stated outright. |
| `src/sim/spells/fusion.js:528` | **push** | additive | `addVelocity` | Heavy shove. |
| `src/sim/spells/fusion.js:575` | **push** | axis | `setVelocity` | Floaty: y stated, x preserved. |
| `src/sim/spells/fusion.js:621` | **override** | absolute | `setVelocity` | Scatter: a stated velocity on a random heading. |
| `src/sim/spells/core.js:75` | **override** | absolute | `setVelocity` | Bolt launch — the muzzle velocity. |
| `src/sim/spells/core.js:88` | **override** | absolute | `setVelocity` | Bolt launch — the muzzle velocity, gravity-flip aware. |
| `src/sim/spells/core.js:148` | **push** | additive | `setVelocity` ¹ | explode() — the single most-used push in the game. Mass-independent so a blast reads the same whatever it catches. |
| `src/sim/spells/core.js:263` | **push** | additive | `setVelocity` ¹ | Singularity: a per-second radial pull plus a tangential term. |
| `src/sim/maps/book.js:107` | **push** | additive | `addVelocity` | Updraft Canyon: a per-second lift, x untouched (dx = 0). |
| `src/sim/maps/book.js:121` | **override** | blended | `setVelocity` | Conveyor — brief rule 4. It clamps to ±9, so the result is not the old velocity plus anything; the belt states what the velocity is allowed to be. |
| `src/sim/maps/book.js:123` | **override** | blended | `setVelocity` | Conveyor (Assembly Line) — brief rule 4, clamps. |
| `src/sim/maps/book.js:127` | **override** | blended | `setVelocity` | Conveyor (The Gauntlet) — brief rule 4, clamps. |
| `src/sim/maps/book.js:140` | **push** | additive | `addVelocity` | Gas Vents: a per-second lift, x untouched. |
| `src/sim/maps/book.js:152` | **push** | additive | `addVelocity` | The Core: a per-second pull toward the centre. |
| `src/sim/maps/book.js:180` | **push** | additive | `addVelocity` | Eye of the Storm: a per-second push back toward the middle. |
| `src/sim/maps/book.js:194` | **push** | additive | `addVelocity` | Event Horizon: a per-second pull. |
| `src/sim/maps/book.js:198` | **push** | additive | `addVelocity` | The Maw: a per-second pull downward. |
