# E2E findings

Bugs the browser suite found. Nothing here has been fixed — the specs that catch
these are left failing on purpose, so the board stays red until someone decides
what to do. `npm run e2e:triage` skips anything tagged `@known-bug` if you want a
green run while triaging.

Each entry says how to reproduce it, what should happen, what does, and which
spec catches it.

---

## 1. Gale Force blows a wizard off the map before the fight starts

**Spec:** `e2e/specs/07-maps.spec.js` — *arenas 81-100 … all build, hold wizards, and draw*
**Map:** `STORM PEAKS · GALE FORCE` (index 81, `src/sim/maps/book.js`, theme 9)
**Severity:** a wizard loses a round having never had a turn

### What happens

The round starts. Both wizards fall from their spawn points at `y=120`. The map's
ambient wind — `applyWind(Math.sin(now / 1500) * 0.4)` — pushes them sideways as
they fall. Whichever wizard is upwind is carried past the end of the floor and
into the lava, dead about **one second** after the round began.

The FIGHT countdown is 1.1s (`startRound`, `match.js:140`), so this happens
*before the round is fightable*.

### Why the geometry does it

```
floor      addStatic(m, W/2, 620, W - 200, 36)   spans x = 100 … 1180
platforms  addStatic(m, 240,  450, 200, 24)      spans x = 140 …  340
           addStatic(m, W-240,450, 200, 24)      spans x = 940 … 1140
spawns     x = 140, 1140, 440, 840, 640, 290, 990, 540   (all y = 120)
```

The two outermost spawn points, `x=140` and `x=1140`, sit exactly on the outer
edge of each side platform. There is no room to be pushed outward. A wizard
blown off the right platform lands at `x≈1265`, which is 85px past the end of the
floor, and falls straight into the lava at `y≈689`.

### It depends on which way the wind is blowing

Sampling the whole ~9.4s wind cycle, ten round starts:

| wind | who dies within 1.25s |
|------|-----------------------|
| +0.40 | P2 (spawn x=1140) |
| +0.23 | P2 |
| −0.14 | P1 (spawn x=140) |
| −0.39 | P1 |
| −0.25 | P1 |
| +0.19 | P2 |
| +0.39 | P2 |
| +0.04 | nobody |
| −0.38 | P1 |
| −0.17 | nobody |

**8 of 10 round starts kill a wizard.** Blowing right kills the wizard on the
right; blowing left kills the wizard on the left. Only a near-still wind
(|wind| ≲ 0.2 at round start) is safe.

### Caveat, stated plainly

The wizards in this measurement are idle — the suite presses nothing. A player
holding *into* the wind may well save themselves, and air control is available
during the countdown. So this is not strictly unsurvivable. What it is: a spawn
point that reliably kills a passive player in under a second, on a map where the
mirrored spawn is safe, decided entirely by which way the wind happens to be
blowing when the round loads.

### Suggested direction (not applied)

Move the two outer spawns inboard of the platform edges — `x=200` and `x=1080`
would put a full wizard-width of platform on the outward side — or start the wind
at zero on round load and ramp it in after FIGHT.

### Reproduce

```
npm run e2e -- e2e/specs/07-maps.spec.js --grep "arenas 81-100"
```
