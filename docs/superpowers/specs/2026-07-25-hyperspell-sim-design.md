# HYPERSPELL — Simulation, Logic & System Design

*Design spec · July 25, 2026 · status: awaiting review*

## 1. What this is

A design for making HYPERSPELL's physics, game logic and system architecture
industry-standard and airtight, without changing a single piece of content.

The 142 spell definitions, 114 maps, 6 bosses, 4 enemy types, 11 environmental
events, the fusion matrix and the rarity economy are **frozen**. Every number they
declare — `cooldown: 450`, `radius: 150`, `frozenUntil = now + 1500` — keeps its
meaning. What changes is the machinery underneath, which today prevents that
content from behaving as designed.

**Scope, in one line:** a deterministic fixed-tick simulation core, a physics
facade backed by planck.js, a rebuilt character controller, client-side
prediction, and a real module structure — delivered in five gated phases, with
the game playable at every step.

## 2. Decisions taken

| Decision | Choice | Why |
|---|---|---|
| Depth | Deterministic core **+** engine swap **+** prediction netcode | User directive. Each is a prerequisite of the next. |
| Module strategy | ES modules, esbuild → IIFE bundle | Keeps `file://` double-click couch play working (ESM cannot load over `file://`); lets Node import source directly and deletes the `vm` sandbox. |
| Controller | Full modern rebuild | User directive. Structure is new; the *arc it produces* remains a published contract (§5.1). |
| Sequencing | Facade-first strangler, 5 gated phases | Makes the engine swap a config flip, enables A/B parity diffing, gives prediction the same seam. |
| Physics engine | **planck.js** (Box2D port) | CCD against statics by default, bullet bodies for dynamic-vs-dynamic, proper iterative solver, deterministic under fixed timestep in one JS runtime, pure JS (no WASM init inside a sandbox). Rapier's speed is irrelevant at ~200 bodies; its cross-platform determinism only pays for lockstep, which we are not doing. |
| Content | **Frozen** | Systems serve the content, never the reverse. |

## 3. Root causes

Six causes generate most of the defect surface. Everything in §6 traces to one of
them.

**R1 — Variable timestep.** `rawDt = min(now - last, 33)` feeds
`Engine.update(engine, dt)` (`js/game.js:1519,1532`; `server/sim-host.js:35`).
Matter's own documentation asks for a fixed delta of ≤1/60s and warns that
changing it during running degrades quality. Slow-mo multiplies `dt` further, so
the solver runs 5 ms steps during spectacle.

**R2 — Per-frame constants.** Movement blend `0.25`/frame (`js/player.js:538`),
singularity pull, tornado, firestorm, wind, conveyors, updrafts, gravity wells,
earthquake — all applied once per *frame*, not per second. A 144 Hz client
accelerates ~2.4× faster than the 60 Hz server.

**R3 — Two clocks.** 128 `performance.now()` reads in sim files drive every
cooldown and status, while physics advances on `dt × timeScale`. `slowMo()`
(`js/fx.js:12`) slows the world but not the clock, so a 1500 ms freeze expires in
~450 ms of hitstop.

**R4 — No spatial queries.** 42 `Composite.allBodies()` full-world scans per
frame; raycasts hand-rolled as 10–12 px stepping loops
(`js/spells.js:124,164`) that miss thin geometry and cost O(steps×N) per cast.

**R5 — No continuous collision.** Matter has none. Projectiles travel 20–26 px
per step at platform thicknesses of 18–30 px, so tunnelling is structural.

**R6 — Render mutates sim; flow runs on wall clock.** Draw functions push into
`particles` and call `Math.random()` (`js/game.js:762,871`); round flow rides 5
bare `setTimeout`s (`js/game.js:86,92,115,134`, `js/boss.js:385`) — the reason
`server/shims.js:66` must track and flush timer handles.

## 4. The content doctrine (what the systems must serve)

Extracted from the content itself, including its revision history.

**4.1 Telegraph → dodge → counterplay.** The spell book's own comments record a
deliberate migration away from homing guarantees:

> *"the smite has to be dodged, not auto-landed"* · *"an actual trap now (it's in
> the name)… move, or eat it. No more instant any-range nuke"* · *"was
> auto-freezing the nearest wizard at ANY range — now a bolt that must land"* ·
> *"the shot has to actually land, so you can dodge it or parry it right back"*

This is the spine of the design. It is also precisely what R3 and R5 break: a
telegraph you cannot reliably dodge (eaten jump inputs), a parry that whiffs
because the bolt tunnelled, a freeze that ends early in hitstop. Players read
those as unfair *content*. They are unfair *machinery*.

**4.2 Schools and fusion.** 7 elemental schools (FIRE, ICE, ZAP, AIR, EARTH,
VOID, LIFE) plus TRICK. A complete 8×8 recipe matrix yields 36 hand-authored
hybrids — 8 same-school "amplified" fusions and 28 cross-school. Hybrids exist
**only** through fusion (`js/hybrids.js:6`, `js/pickups.js:6`), carry 1–3 charges
scaled inversely to cooldown, and receive a potency multiplier in compensation.

**4.3 Rarity economy.** `common 100 / uncommon 45 / rare 12 / legendary 4 /
hybrid 0`. Hitscan spells are priced up a tier for having no travel time.
Legendary pickups get a banner and a sound because a jackpot should land.

**4.4 Readability over information.** No health bars — the hat *is* the health
indicator. Offscreen wizards get colour-coded edge chevrons. A killcam replays
the final blow. `BASE_PACE = 0.85` deliberately runs the whole game below 1.0 so
the spectacle registers.

**4.5 Map themes are physical identities.** Frost Fields is friction `0.01`;
Goo Swamp is `muddy` plus acid; Deep Space runs gravity `0.15`–`1.5` with wrap;
The Void cycles gravity and phases floors in and out; The Machine is moving mass
— movers, spinners, pendulums, conveyors. A theme is a physics configuration,
which is exactly why R2 damages them: six themes' identities currently vary with
the player's refresh rate.

## 5. Content ↔ engine contracts

Three dependencies are currently encoded as comments and magic numbers. They
become explicit, published, and test-enforced.

**5.1 The jump arc is consumed by map generation.** `js/maps.js:424`:

```js
const GAP_MAX  = 190;  // widest void we leave alone
const GAP_STEP = 165;  // max span between inserted steppers
```

`ensureTraversable` walks every arena's walkable profile and inserts stepping
platforms into any void wider than `GAP_MAX`, "too wide to clear with a running
double jump." Those numbers encode the current controller. After the rebuild,
the controller **publishes** `maxRunJumpDistance`, and map repair consumes it.
A test walks all 114 maps and asserts reachability (§9).

**5.2 Fall damage is derived from the double-jump apex.** `js/player.js:3` —
`FALL_SAFE_DROP = 440; // a double jump drops ~350 from its apex`. Becomes a
function of the published `doubleJumpApex`.

**5.3 Mass-independent knockback is the design language, not a bug.** All ~107
`Body.setVelocity` sites *add* to existing velocity and therefore ignore mass.
Gust shoves an anvil (density `0.02`), a grand piano (`0.018`) and a wizard
(`0.004`) with equal authority. Converting these to physically-correct impulses
would silently rebalance ~80 spells. The facade therefore exposes
**`addVelocity` as a documented first-class gameplay operation**, distinct from
`applyImpulse`. The 107 sites are *classified*, never mechanically converted:

| Class | Meaning | Count (approx.) |
|---|---|---|
| `addVelocity` | gameplay push, mass-independent by design | ~70 |
| `setVelocity` | authoritative override (spawn, reset, teleport, conveyor clamp) | ~25 |
| controller drive | the character controller's own velocity authority | ~12 |

Classification is a reviewed, per-site decision recorded in the phase-1 plan.

## 6. Defect register

The contract for "remove all existing bugs". Every entry is either fixed or
explicitly deferred with a reason.

### Class A — time and determinism

| ID | Defect | Evidence |
|---|---|---|
| A1 | Variable timestep into the solver | `game.js:1519,1532`; `sim-host.js:35` |
| A2 | Movement accel/decel is per-frame, not per-second | `player.js:538` |
| A3 | Environmental forces per-frame: wind, conveyors, updrafts, Core/Maw/Event Horizon pulls, gas vents, quake, singularity, tornado, firestorm | `maps.js:361`; `mapbook.js:73,87,89,93,106,118,146,160,164`; `events.js:111`; `spells.js:227`; `spellbook.js:432`; `hybrids.js:209` |
| A4 | Two clocks: 128 wall-clock reads vs scaled physics; statuses expire early in hitstop | `fx.js:12` + 128 sites |
| A5 | Round/boss flow on bare `setTimeout` | `game.js:86,92,115,134`; `boss.js:385` |
| A6 | 49 `Math.random()` calls in sim ⇒ unreplayable; mover phase unseeded | `maps.js:318` and 48 others |
| A7 | Server silently drops sim time under load (no accumulator, no report) | `sim-host.js:58-59` |
| A8 | Client particle update is per-frame | `net.js:339` |
| A9 | `activeEffects[].until` on wall clock (~12 sites) | `spells.js`, `spellbook.js`, `hybrids.js` |
| A10 | `updateEffects` passes `dt`; **zero** of 14 `update()` handlers use it | `spells.js:447` |

### Class B — physics correctness

| ID | Defect | Evidence |
|---|---|---|
| B1 | No CCD ⇒ fast projectiles tunnel through thin platforms | engine-level; `shoot()` speeds 20–26 |
| B2 | Hand-rolled raycasts step 10–12 px and miss thin geometry | `spells.js:124` `raycastHit`, `spells.js:164` `groundYAt` |
| B3 | `grounded()` ignores contact normals; counts tomes, side walls and other players as floor; allocates the full body list per player per frame | `player.js:434` |
| B4 | Free-rotating circle body requires per-frame self-righting hacks | `player.js:563-564`; `boss.js:127` |
| B5 | `Body.scale` applied cumulatively ⇒ float drift in vertices and mass | `player.js:89`; `pickups.js:151,165` |
| B6 | Knockback erased: control velocity overwrites `v` every frame | `player.js:539` |
| B7 | Moving platforms are teleported **statics** — infinite mass, zero reported velocity | `maps.js:324`; `boss.js:161,183` |
| B8 | `setStatic` toggling on icicles leaves mass/inertia state ambiguous | `maps.js:352` |
| B9 | 42 full-world `Composite.allBodies()` scans per frame | 42 sites |
| B10 | Gravity is a mutable global with a per-player counter-force hack | `core.js:12`; `player.js:490` |
| B11 | Projectiles spawn at a fixed 28 px offset with no overlap check | `spells.js:19` |
| B12 | Explosions, singularities and zones each scan every body | `spells.js:87,211,269` |

### Class C — content-intent violations (highest priority: content is frozen)

| ID | Defect | Evidence | Designed behaviour |
|---|---|---|---|
| C1 | **Roulette and Mirror Cast can fire hybrids** — uniform pick over `Object.keys(SPELLS)` excluding only themselves | `spellbook.js:876,1018` | Hybrids exist only through fusion (`hybrids.js:6`) and cost charges |
| C2 | **Gravity restore is unstacked, and map gravity writers cancel spells** — Flip Zone / Blink / Glitch rewrite `engine.gravity.y` every frame, killing Gravity Flip within one tick | `spellbook.js:815,827`; `events.js:91`; `mapbook.js:122,162,165` | A legendary should work on every map; overlapping modifiers should compose |
| C3 | **Deferred spawns read live potency** — Dragon's Breath (720 ms) and Beehive (2200 ms) call `boomBolt`/`shoot`, which read `p.mega` at spawn time | `spellbook.js:174,747` | Potency is fixed at cast |
| C4 | **Cooldown UI lies** — `CAST_FLOOR = 480` gates casting, HUD and wire use `spell.cooldown` (4 spells incl. Fireball) | `spells.js:389,405`; `game.js:1220`; `snapshot.js:20,24` | The bar means "castable" |
| C5 | Statuses expire early in hitstop (~40 `frozenUntil` sites) | see A4 | A 1500 ms freeze lasts 1500 ms of game time |
| C6 | Parry/reflect unreliable against fast projectiles | see B1 | Counterplay is dependable |
| C7 | Wave-mode best score is dead online (`localStorage` shimmed to `null`) | `enemies.js:279,287`; `shims.js:55` | "BEST: WAVE n" persists |
| C8 | ~12 freeze spells mutate `body.frictionAir` directly; one transition check restores it | `spellbook.js:503,512,534,540` etc.; `player.js:478` | Statuses own their physical side-effects |
| C9 | `activeEffects.length = 0` on map load silently skips pending `onEnd()` | `game.js:33` | Effect teardown is explicit |
| C10 | Client never applies env-event static modifications (`winter` friction, `rubber` restitution) — blocks correct prediction | `events.js:64,119`; `net.js:242` | Client world matches server world |

Flagged as design questions rather than defects (resolve during implementation):

- **C11** — `disarm` ("Butterfingers") clears both slots via the `spellId` setter, destroying charged fusions that `addSpell` otherwise protects. Intentional for a legendary, or should fusions survive?
- **C12** — `damageBoss` discards all damage before `bs.announced`, giving bosses ~1.9 s of invulnerability at spawn. Intentional telegraph, or an accident?

### Class D — architecture

| ID | Defect | Evidence |
|---|---|---|
| D1 | Render mutates sim state; `Math.random()` in draw paths | `game.js:762,871,1393`; `maps.js:355` |
| D2 | One global scope shared by sim, render and net; server needs a `vm` sandbox and a fake canvas | `sim-context.js:4`; `shims.js` |
| D3 | Cosmetics reach clients by monkeypatching globals | `sim-bridge.js:47` |
| D4 | No unit tests; only a smoke harness and an e2e suite | `server/sim-smoke.js`, `server/verify-e2e.js` |
| D5 | matter-js pinned at 0.19.0 in two places; 0.20.0 is current | `server/package.json`; 6 HTML files |
| D6 | Six HTML pages each duplicate the script list | `index.html` and 5 others |
| D7 | Killcam records position tapes instead of input tapes | `replay.js:18` |

## 7. Target architecture

```
src/
  sim/                     ← deterministic. no DOM, no wall clock, no Math.random
    tick.js                accumulator, fixed step, integer tick counter
    time.js                simNow() — the only clock (§8)
    world.js               world container, body registry, lifecycle
    rng.js                 seeded mulberry32 streams
    schedule.js            tick-scheduled callbacks (replaces every setTimeout)
    emit.js                sim → outside event queue (fx, sfx, banners, killfeed)
    phys/
      facade.js            the contract (§9)
      matter-backend.js    phase 1
      planck-backend.js    phase 2
    player/
      controller.js        movement state machine
      jump.js              coyote / buffer / variable height / apex / air control
      combat.js            damage, knockback, hitstun, DI, death
      status.js            timed statuses and their physical side-effects
    collision.js           contact dispatch table
    match.js               LOBBY / PLAY / ROUND_END / VICTORY / RUN_OVER
    gravity.js             modifier stack (fixes C2)
    spells/ maps/ ai/      ported content — talks only to the facade
  render/                  ← canvas only. reads sim state, never writes it
    interpolate.js         draws between tick N-1 and N
    fx.js                  particles, shake, flash — render-owned
    draw-*.js              existing art, split by subject
  net/
    protocol.js  server-host.js  client.js  predict.js
  platform/
    browser.js  node.js    the only two entry points
```

Three invariants, each mechanically enforced:

1. `sim/` imports nothing from `render/`, `net/` or `platform/`. An import-graph
   test fails the build otherwise.
2. `sim/` never reads the wall clock, never calls `Math.random`, never touches
   the DOM. A test stubs all three and asserts zero calls across a full simulated
   match — a generalisation of the existing `ctxCounter` tripwire
   (`server/shims.js:9`), which already proves one direction of this today.
3. Cosmetics leave the sim as **events**, not function calls. The existing
   `wrapServerFx` monkeypatch (`server/sim-bridge.js:47`) becomes the actual
   architecture: one queue, drained by the renderer locally and by the wire
   remotely. Couch and online stop being two code paths.

`server/sim-context.js` and `server/shims.js` are deleted; `platform/node.js`
imports the sim directly and injects a clock. `spell-guide.html` gets a
content-only bundle; the other five pages repoint to the main bundle.

## 8. Time model

One clock: an **integer tick at 60 Hz**.

```
platform loop (rAF, or the server's timer)
  ├ accumulator += realDt × paceScale        ← slow-mo / hitstop lives HERE
  ├ while accumulator >= TICK_MS and steps < MAX_CATCHUP (5)
  │    drainSchedule(tick)
  │    readInputs(tick)
  │    stepSim(tick)          ← always exactly TICK_MS. never varies.
  │    tick++
  ├ if steps hit MAX_CATCHUP → report dropped time (never silently slow)
  └ render(alpha = accumulator / TICK_MS)    ← interpolate N-1 → N
```

**Content keeps its millisecond vocabulary.** `sim/time.js` exposes
`simNow() = tick × TICK_MS`. The refactor replaces `performance.now()` with
`simNow()` mechanically across the 128 sim call sites; every
`frozenUntil = now + 1500` keeps reading exactly as written, but is now
deterministic, tick-quantised, and correctly slowed by hitstop. This is the
minimal-diff path that fixes A4/A9/C5 without touching a single content number.

| Today | After |
|---|---|
| `dt = rawDt × timeScale` | `dt` is constant; slow-mo scales *tick consumption* |
| Statuses drift from physics in hitstop | Statuses are sim-time; they slow automatically |
| 144 Hz ≠ 60 Hz ≠ server | Identical everywhere |
| Server drops time silently | Catch-up capped and reported |
| 5 `setTimeout`s drive round flow | `schedule.at(tick + n, fn)` — deterministic, pausable, serialisable |
| 49 `Math.random()` ⇒ unreplayable | Seeded streams in sim; `Math.random` stays legal in render |
| Killcam records position tapes | Replay re-runs the input stream (fixes D7) |

## 9. Physics facade

~12 operations cover all 353 current Matter call sites.

| Operation | Notes |
|---|---|
| `createBody(desc)` / `removeBody(b)` | circle, box, polygon, capsule |
| `setType(b, static\|kinematic\|dynamic)` | **movers, Kraken and tentacles become kinematic** (fixes B7) |
| `setPosition` / `setAngle` / `setFixedRotation` | fixed rotation replaces self-righting hacks (B4) |
| `setVelocity(b, v)` | authoritative override |
| **`addVelocity(b, dv)`** | **gameplay push, mass-independent by design (§5.3)** |
| `applyImpulse(b, j)` / `applyForce(b, f)` | true, mass-scaled |
| `setGravityScale(b, s)` | replaces per-body counter-force hacks (B10) |
| `setFilter(b, {group, category, mask})` | Box2D's negative `groupIndex` matches `Body.nextGroup(true)` 1:1 |
| `setFixtureEnabled(b, on)` | phantom platforms, without `mask = 0` toggling |
| `queryRay` / `queryRegion` / `queryRadius` / `queryCapsule` | replaces 42 full-world scans and both stepping loops (B2, B9, B12) |
| `createJoint` / `removeJoint` | distance and revolute; bridges, chandeliers, pendulums, seesaws |
| `rescaleBody(b, targetScale)` | rebuilds the fixture from the canonical definition — never cumulative (B5) |
| `step(dtFixed)` | one fixed step |

Projectiles are flagged as **bullet** bodies: CCD against everything except other
bullets. That is the structural fix for B1 and therefore for C6.

Known planck caveats to design around, from its own documentation: symplectic
Euler with first-order accuracy; ~0.5 cm collision slop; accuracy scales with
iteration count; and **CCD does not handle joints**, so chain-hung wrecking balls
(`addPendulumBall`) and breakable bridges can stretch under fast impacts — joint
configuration and iteration counts get an explicit tuning pass in phase 2.
Determinism is guaranteed only within one JS runtime, which is sufficient for
server authority plus prediction, and is why lockstep is a non-goal.

## 10. Character controller and combat

The reference model is [Maddy Thorson's *Celeste & TowerFall
Physics*](https://maddythorson.medium.com/celeste-and-towerfall-physics-d24bd2ae0fc5):
**Solids** move freely and *carry* or *push* **Actors**; Actors resolve their own
movement against Solids. HYPERSPELL cannot adopt it wholesale — it is a
rigid-body game — so it takes the hybrid that modern physics platformers use:

- **The wizard is an Actor**: capsule, fixed rotation, controller-owned movement
  resolution — *and still a rigid body for external forces*, so explosions,
  pendulums and falling pianos shove it. That duality is the brawler identity.
- **Props stay rigid bodies**, untouched: crates, barrels, balls, planks, gibs,
  summons, bosses, enemies.
- **Moving hazards become kinematic Solids that carry riders.** This fixes B7 and
  makes The Machine theme work *better* than today: you ride the piston instead
  of being scraped off it.

**Velocity decomposes** — the fix for B6:

```
v_total = v_control + v_external

v_control    controller-owned; accelerates toward target per second
v_external   impulse-owned; decays across the hitstun window so knockback READS
```

**States**, each with explicit control authority:

| State | Authority | Notes |
|---|---|---|
| `GROUNDED` | 1.0 | surface-dependent accel (ice `0.01`, mud, normal) |
| `AIRBORNE` | ~0.65 | separate accel/decel curves, apex hang |
| `HITSTUN` | 0.0 → 1.0 | ramps back as knockback decays; **DI** rotates the vector a few degrees |
| `FROZEN` / `SLIPPING` / `PIGGY` | 0.0 / 0.15 / 0.5 | existing statuses become real states |
| `GHOST` / `DEAD` | n/a | ghost drift formalised |

**Jump**, all windows in ticks: coyote ~5 (today an accidental
`now - lastGround < 120`), jump buffer ~7 (genuinely new — today only *holding*
works), variable height via release-gravity (replacing three hardcoded impulses
`-15/-17/-22`), apex hang, corner correction. Auto-hop is kept — it suits a
party game — as a named option rather than an emergent property of hold
semantics.

**Grounding** uses contact normals within ~45° of gravity-relative "up",
replacing the box query of B3. This also gives phantom/one-way platforms a
correct implementation and makes gravity flip work without the per-player
counter-force of B10.

**Combat.** Knockback becomes a formula over damage dealt, victim mass and
accumulated damage — the Smash-family model, which suits last-wizard-standing
because late-round hits launch. Hitstun derives from knockback magnitude.
**True hitstop** (a few frozen frames on heavy impact), per Vlambeer's [*Art of
Screenshake*](https://www.youtube.com/watch?v=AJdEqssNZ-U), replaces the
`slowMo()` currently standing in for it. Screenshake, flash, gibs and permanence
already follow that doctrine and are kept as-is.

**Published contract constants:** `maxRunJumpDistance` and `doubleJumpApex` are
computed from the tuned controller and consumed by `ensureTraversable`
(`GAP_MAX`, `GAP_STEP`) and `FALL_SAFE_DROP`. §5.1 and §5.2 become code.

## 11. Collision, gravity, and match flow

**Collision** moves from one 98-line `collisionStart` handler
(`js/game.js:358`) to a dispatch table keyed on label pairs, with begin/end/active
phases. Per-body ad-hoc cooldown stamps (`_cdAt`, `_stompAt`, `lastSpikeAt`,
`_bossHurtAt`, `_touchAt`) become a uniform per-pair cooldown facility.

**Gravity** becomes a modifier stack (`sim/gravity.js`): base from the map def,
push/pop entries for `gravflip`, `moongrav`, `moonshot`, and the cycling maps.
Overlaps compose; nothing cancels early; a map's per-frame write can no longer
erase a spell. Fixes C2.

**Match flow** becomes a state machine advanced by `schedule.at`, replacing five
`setTimeout`s and their state-guard checks. Round transitions become
deterministic and replayable, and the server no longer needs to track and flush
timer handles.

## 12. Netcode

Server owns the tick; every input and snapshot carries a tick number.

| Channel | Design |
|---|---|
| Client → server | Tick-stamped inputs at a fixed 60 Hz (today: rAF rate, so 144/s from a fast display). Each packet repeats the last 3 inputs so one lost packet leaves no gap. |
| Server → client | Keep the existing snapshot format — shape descriptors, flags-when-set, deflate, ~0.9 KB under mayhem. Add tick and baseline id for delta encoding. Stay at 30 Hz. |
| Remote wizards, world | Snapshot interpolation with the existing adaptive 36–90 ms delay (`js/net.js:369`). Unchanged; it works. |
| **Local wizard** | **Predicted.** The client runs the same `sim/player/controller.js` against a read-only world view, keeps a ring buffer of (tick, input, predicted state) and reconciles against authoritative state for that tick. |

**Never predicted:** damage, deaths, spell spawns, pickups, status application.
Those stay server truth and arrive as events. Prediction covers movement and
jumping only — where essentially all felt latency lives — and it means **the
planck world never needs serialising**, the one thing planck does not support
and the reason third-party forks like `clonable-planck.js` exist.

Reconciliation: <2 px ignore, 2–20 px exponential blend over ~100 ms, >20 px hard
snap.

Two prerequisites:

- The client must replay env-event static modifications (`winter` friction,
  `rubber` restitution, `eventIcy`) when predicting; `snap.ev` already carries
  the id. Without this, every Winter and Rubber World round mispredicts (C10).
- `docs/ALINEA-CLIENT.md` documents the wire contract for an external headless
  client. Adding a tick field is a protocol version bump plus a doc update, not
  a silent change.

## 13. Verification

| Gate | Mechanism |
|---|---|
| Determinism | `(seed, input tape) → per-tick state hash`; replays must match exactly |
| Engine parity | Both backends run the same input tape; per-tick divergence diffed across all 114 maps against a threshold |
| **Traversability** | A walker tests all 114 maps with the *measured* jump arc and asserts every platform is reachable — the §5.1 guard |
| Feel | Measured targets (top speed, apex, knockback distance, hitstun frames) asserted numerically, then playtested |
| Content fidelity | All 142 spells cast headless on every map: no NaN, no orphaned bodies, no leaked effects, charge accounting correct, hybrids unreachable except by fusion |
| Sim purity | Generalised tripwire: zero DOM, zero `Math.random`, zero wall-clock reads inside `sim/` |
| Netcode | Input-to-screen latency at 80 ms simulated RTT; correction-magnitude distribution |
| Regression base | `server/sim-smoke.js` and `server/verify-e2e.js` keep passing at every phase |

## 14. Phases and gates

Each phase ships to `main` with the game playable.

| Phase | Content | Exit gate |
|---|---|---|
| 1 | ES modules + esbuild; fixed tick + `simNow()`; seeded RNG; `schedule`; sim/render/net split; facade over **Matter**; spatial queries; collision dispatch; gravity stack | Golden replay reproduces bit-identically; sim-purity tripwire at zero; smoke + e2e green |
| 2 | planck backend; bullet projectiles; kinematic movers with rider carry; fixed rotation; joint and iteration tuning; A/B parity pass | Parity diff within threshold on all 114 maps; traversability walker green |
| 3 | Character controller rebuild; hitstun, DI, hitstop; published arc constants feeding `GAP_MAX` / `FALL_SAFE_DROP` | Feel targets asserted; traversability re-derived and green; playtest sign-off |
| 4 | Tick-stamped inputs; prediction + reconciliation; client-side env-event replay; protocol bump + `ALINEA-CLIENT.md` update | Input-to-screen latency at 80 ms RTT; correction distribution within budget |
| 5 | Delete Matter, `vm` sandbox, `shims.js`, dead paths; repoint all 6 HTML pages; docs and patch notes | Zero references to removed modules; every suite green |

Defect-to-phase mapping, so nothing is assigned to a phase that cannot deliver it:

| Phase | Defects closed |
|---|---|
| 1 | A1–A10 · B2, B9, B11, B12 · C1, C2, C3, C4, C5, C7, C8, C9 · D1, D2, D3, D4, D6, D7 |
| 2 | B1, B5, B7, B8 · C6 *(depends on CCD from B1)* |
| 3 | B3, B4, B6, B10 · §5.1 and §5.2 contracts become code |
| 4 | C10 *(prerequisite of prediction, not a follow-up)* |
| 5 | D5 |

C11 and C12 are design questions to answer before phase 1 closes; A2/A3 in
phase 1 means converting per-frame constants to per-second, which changes tuning
values but not content declarations.

## 15. Risks

| Risk | Mitigation |
|---|---|
| Engine swap shifts feel despite frozen content | Facade + A/B parity harness; per-map divergence diffing; tuning pass is an explicit phase-2 deliverable |
| planck CCD ignores joints ⇒ pendulum/bridge stretch | Explicit joint and iteration tuning in phase 2; pendulums and bridges are named test fixtures |
| Controller rebuild breaks 114 maps via §5.1 | Traversability walker is a hard gate in phases 2 and 3 |
| Prediction diverges on env-event maps | C10 fixed as a phase-4 prerequisite, not a follow-up |
| Committed `dist/` for `file://` play drifts from source | Build check in CI; the bundle is a build artefact with a freshness assertion |
| Five phases is a long runway | Every phase ships independently and is individually valuable |

## 16. Non-goals

- Changing any content: no spell, map, boss, enemy, event, tier or recipe changes.
- Deterministic lockstep or full-world rollback (planck's determinism is
  same-runtime only, and full rollback would need world serialisation it does
  not provide).
- Lobby browser, accounts, leaderboards, matchmaking (see `docs/MULTIPLAYER.md`).
- Rendering rework beyond relocating draw code and removing its sim side-effects.
- Mobile or touch input.
