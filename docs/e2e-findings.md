# E2E findings

Bugs the browser suite found. Nothing here has been fixed — the specs that catch
them are left failing on purpose, so the board stays red until someone decides
what to do about them.

Each entry gives the reproduction, what should happen, what does, and the spec
that catches it.

---

## 1. Windy maps blow a wizard off the arena before the fight starts

**Spec:** `e2e/specs/07-maps.spec.js` — *arenas 21-40* and *arenas 81-100*
**Maps:** `FROST FIELDS · CROSSWIND` (index 24) and `STORM PEAKS · GALE FORCE` (index 81)
**Severity:** a wizard loses the round having never had a turn

### What happens

The round loads. Both wizards fall from their spawn points at `y=120`. The map's
ambient wind pushes them sideways as they fall, and whichever one is upwind is
carried past the end of the floor into the lava — dead roughly **one second**
after the round began.

`startRound` sets the FIGHT countdown to 1.1s (`src/sim/match.js:140`), so this
happens *before the round is even fightable*.

### Root cause: the default spawn points sit on the arena's outer edge

Both maps declare no `s:` of their own, so both fall back to the same default
spawn list:

```
x = 140, 1140, 440, 840, 640, 290, 990, 540      (all y = 120)
```

And both build a floor `W - 200` wide, centred — spanning `x = 100 … 1180`.

That puts the two outermost spawns **40px from the end of the world**. On a still
map that is fine. With a wind pushing sideways for the 0.7s it takes to fall from
`y=120`, 40px is nothing:

| map | wind | right platform | wizard ends at | floor ends at | outcome |
|-----|------|----------------|----------------|---------------|---------|
| GALE FORCE | `sin(now/1500) × 0.40` | x 940…1140 | x ≈ 1265 | x = 1180 | lava at y≈689 |
| CROSSWIND  | `sin(now/1800) × 0.25` | x 980…1180 | x ≈ 1248 | x = 1180 | lava at y≈698 |

Crosswind is `icy: true` with `friction: 0.01` platforms, which is why a weaker
wind gets the same result.

### It depends on which way the wind is blowing

Sampling a full wind cycle at round load — the spec now does this automatically,
eight starts spread across the cycle:

| map | fatal starts |
|-----|--------------|
| `STORM PEAKS · GALE FORCE` | 5–7 of 8 |
| `FROST FIELDS · CROSSWIND` | 5 of 8 |

Blowing right kills the wizard on the right; blowing left kills the wizard on the
left; only a near-still wind at load is safe. Measured across the cycle on Gale
Force, the wind direction at round start decides which wizard dies:

```
wind +0.40 → P2 dies    wind −0.14 → P1 dies    wind +0.04 → nobody
wind +0.23 → P2 dies    wind −0.39 → P1 dies    wind −0.17 → nobody
```

### Why the other five wind maps are fine

`Windy Ridge`, `Crosswinds Canyon`, `Cliffhanger`, `Tempest Bridge` and
`Everything` all use `applyWind` too, and all pass. Every one of them declares
its own `s:` with spawns placed inboard. The bug is not the wind — it is the
default spawn set being used on a map that has one.

### Caveat, stated plainly

The wizards in this measurement are idle: the suite presses nothing. A player
holding *into* the wind may well save themselves, and air control is available
during the countdown. So this is not strictly unsurvivable. What it is: a spawn
point that reliably kills a passive player in under a second, on maps where the
inboard spawns are perfectly safe, decided by which way the wind happens to be
blowing when the round loads.

### Suggested direction (not applied)

Give both maps an explicit `s:` with the outer spawns moved inboard — around
`x=200` and `x=1080` puts a full wizard's width of floor on the outward side —
or hold `applyWind` at zero until the FIGHT countdown has elapsed.

### Reproduce

```
npx playwright test e2e/specs/07-maps.spec.js --grep "arenas 81-100"
npx playwright test e2e/specs/07-maps.spec.js --grep "arenas 21-40"
```

---

## 2. `src/sim/fx.js` no longer exports what two modules import (build is broken)

**Caught by:** `e2e/support/global-setup.js`, which builds before any test runs
**Status at time of writing:** present in the working tree; the emit refactor is
mid-flight, so this may already be resolved.

`npm run build` fails:

```
✘ No matching export in "src/sim/fx.js" for import "particles"
    src/render/draw-snapshot.js:14
✘ No matching export in "src/sim/fx.js" for import "particles"
    src/net/client.js:14
    … also shake, setShake, flashColor, flashAlpha, setFlashAlpha, updateParticles
```

The refactor moved the fx surface onto `emit()`, and most call sites were
migrated. `src/net/client.js` and `src/render/draw-snapshot.js` were not — they
still import the seven removed bindings. Until they are, `dist/` cannot be
rebuilt and the game cannot load.

This is why `globalSetup` passes esbuild's stderr through verbatim rather than
reporting "the suite could not start": the difference between those two messages
is the difference between a minute and an hour.

---

## 3. (historical) Nobody could join an online match — `myName is not defined`

**Spec:** `e2e/specs/12-online.spec.js`
**Already fixed by** commit `0f06425`, *"myName was deleted in the ESM refactor,
so nobody could join"*.

Recorded because it is the clearest evidence the online spec works. Run against
`850434c`, every test in the file fails the same way: the client opens the
socket, receives `welcome`, then throws `myName is not defined` before it can
send `hello`. No `hello` means no `join`, which means no seat — online
multiplayer was completely dead, and the page showed nothing but a dismissed
menu.

Against `d000632`, which contains the fix, all 13 tests pass.

The lesson worth keeping: this is a *client-side* fault, so `server/verify-e2e.js`
could not have caught it. Its WebSocket clients speak the protocol perfectly and
would have reported a healthy server the whole time.

---

## 4. `statusBolt` spells stopped landing — a bolt that dealt 20 damage now deals none

**Spec:** `e2e/specs/06-spells.spec.js` — the batch containing `permafrost`;
`lightning` shows the same shape
**Severity:** a spell does nothing. Which batch reports it moves between runs,
which is why it reads as flake at first glance.

### What happens

`expect(inert, 'these spells cast without changing anything in the world')`
names `permafrost` (and sometimes `lightning`). Both are `statusBolt` spells.

### It is not the probe being blind — the same cast used to land

Two wizards huddled on arena 0, the caster facing the target, `permafrost`
granted to slot 0 and cast. The bolt is created (`projectiles` 0 → 1) and is
gone one tick later in both trees. What differs is what it did on the way:

| tree | wizards | hp after one tick |
|---|---|---|
| `d000632` (before the cosmetics refactor) | 140 and 195 | `150,130` — **20 damage landed** |
| after the refactor | 140 and 195, forced to match | `150,150` — nothing |

The second row forces the target to the first row's exact position, so spacing
is not the variable. Same spell, same places, different outcome.

### What is ruled out

- **The spell itself.** Called directly — `HS.SPELLS.permafrost.cast(players[0])`
  — it creates its projectile on both trees, and throws nothing.
- **Facing.** The caster's `facing` is `+1` with the target to its right.
- **The launcher.** `aimDir` and `shoot` (`src/sim/spells/core.js`) are
  deterministic: no RNG, no clock. Identical positions must give an identical
  launch.
- **Distance.** Forced equal, above.

So the divergence is downstream of the launch — in what the projectile collides
with, or in how its `onHit` is dispatched. `statusBolt.onHit` only damages and
applies its status when `other.label === 'player'`; against anything else its
sole effect is `spawnParticles`, which is why a bolt that stops hitting players
leaves no trace at all.

### Why it looks like flake

When such a bolt leaves no sim-visible trace, the only thing standing between
the spell and an `inert` report is noise in the fingerprint — I watched
`lightning` "pass" on a `vel` field flipping `"0.00"` to `"-0.00"`. Whether that
artifact appears depends on where the wizard happened to settle, so the failing
batch moves between runs while the underlying bug does not.

### A second, independent effect worth knowing about

Cosmetics are now queued events (`src/sim/emit.js`) that only a rendered frame
drains, and the harness advances with `stepSim()` under a frozen clock. Measured
during the probe above: `emittedCount()` climbs to 15 while `particles` stays
at 26. So even the particle burst a floor-hit produces is invisible to
`fingerprint()`. This does not cause finding #4 — the damage is missing, not
just the sparks — but it removes the evidence that would otherwise have made a
missed bolt obvious, and it is worth fixing in its own right by counting the
queue in `fingerprint()`.

### Reproduction

Grant `permafrost` to slot 0 in a huddled arena 0, cast, and read `players[1].hp`
one tick later. Compare against the same steps under
`HS_E2E_GAME_DIR=<a d000632 checkout>`.

---

## 5. The eight-seat test is load-sensitive on every tree

**Spec:** `e2e/specs/12-online.spec.js` — *the room fills up*
**Symptom:** `pressed KeyB 20 times waiting for wizard 2 of 8`
**Severity:** false red; it says nothing about the game.

The test fills the room by pressing `B` in a browser tab twenty times and
waiting for the roster to grow. The server side is fine — a raw WebSocket
sending `{t:'bot', op:'add'}` seats a bot every time — so what fails is key
delivery to the tab, which `pressUntilWire` already documents as unreliable
when a tab is not frontmost.

It fails the same way against a pre-refactor checkout
(`HS_E2E_GAME_DIR=<d000632>`), so it is not a regression from any branch in
this stack. Filling the seats through the wire instead of through the keyboard
would make it deterministic, at the cost of not testing the key path — which
`03-lobby` already covers.
