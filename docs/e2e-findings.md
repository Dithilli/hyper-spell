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
