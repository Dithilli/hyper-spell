# Upstream v10 port log

The merge with origin/main is structural: `js/` stays deleted, so the ~2,400
lines upstream added there arrive as re-implementations in `src/`, one commit
per feature. This file tracks that, so a reviewer can check the ledger balances.

Each row names every file the feature lands in, so the ledger stands on its own
— a reviewer should not have to open the plan to check that a row is complete.

| Task | Upstream commit | Feature | Lands in | Status |
|---|---|---|---|---|
| 2 | c11b4b2 | camera + world transform (incl. the `core`/`player`/`replay` plumbing that hangs off it: device-pixel backing store, world-space mouse aim, nametag slots, view-rect offscreen pointers, trauma shake) | `src/render/camera.js`, `src/render/name-tags.js`, `src/render/draw-world.js`, `src/render/canvas.js`, `src/render/draw-wizard.js`, `src/render/replay.js`, `src/platform/input-keyboard.js`, `src/net/client.js` | **done** |
| 3 | c11b4b2 | bloom / light pass | `src/render/bloom.js`, `src/render/artkit.js`, `src/render/draw-world.js` | pending |
| 4 | c1ee936 | particle budget | `src/render/fx.js`, `src/render/artkit.js` | pending |
| 5 | c1ee936 | cast descriptors | `src/sim/spells/cast-kind.js`, `src/platform/spell-guide.js`, `src/render/hud.js` | **done** — the drawn glyph vocabulary (tome cover, pickup stamp, cursor mark) rides with the artkit pass in task 4 |
| 6 | 3c2b225 | frame profiler | `src/render/profiler.js`, `src/platform/browser.js`, `src/platform/input-keyboard.js` | pending |
| 7 | 83ad928 | bots: ledge avoidance | `src/sim/ai/bot.js` (new `navGroundY`) | **done** |
| 7 | 5292ab8 | bots: retreat + stalemate breaker | `src/sim/ai/bot.js`, `src/sim/player/combat.js`, `src/sim/match.js` | **done** |
| 7 | 832ef00 | bots: double jump | `src/sim/ai/bot.js` | **done** |
| 8 | 3c2b225 b798196 898d796 | spawn safety / escape analysis | `src/sim/maps/reach.js` (new), `src/sim/player/lifecycle.js`, `src/sim/maps/builders.js`, `src/sim/phys/{facade,matter-backend}.js`, `server/verify-spawns.js` | **done** |
| 9 | c11b4b2 3c2b225 | snapshot playout + server-clock interpolation | `src/net/client.js`, `src/sim/snapshot.js`, `src/net/server-bridge.js` | pending |
| 10 | c1ee936 3c2b225 | opening loadouts | `src/sim/pickups.js`, `src/sim/events.js`, `src/sim/match.js` | pending |
| 11 | 4302ace | camera frames the boss, online too | `src/render/camera.js`, `src/render/draw-snapshot.js` | pending |

## Measurements this port rests on

Kept here because the numbers, not the assurances, are the load-bearing part.

**Spawn safety (task 8).** Wizards that fall out of the world within two
seconds of spawning, over 110 maps x 2 seeds, deterministic across repeats:

| | lone wizard | four wizards |
|---|---|---|
| before the port (`groundInColumn`) | 1 | 7 |
| escape analysis, `busy` on neither path (upstream) | 0 | 10 |
| escape analysis, `busy`-aware at 44px | 0 | 8 |
| escape analysis, `busy`-aware at 70px | **0** | **7** |

Read honestly: the escape analysis **on its own makes the four-wizard case
worse**, because it packs wizards onto the ledges it has judged sound, and the
`busy` check only pays that back to level. What the task actually improves is
the case that isolates spawn quality from wizards colliding — a lone wizard,
1 -> 0. Upstream applies `busy` only in `arenaSpawnNear` (under a tenth of
spawns); it applies on all three paths here, at the 70px separation
`arenaSpawnNear` already used.

Those numbers only mean anything because `startRound` now clears the board
before respawning anyone. In the previous despawn-and-respawn-in-one-loop, the
wizards a new spawn kept clear of were the ones the loop had not reached yet —
still alive at **last round's positions on the previous map**. Half the entries
were stale, and a first cut of this table quoted a 6 that was partly that
accident.

`server/verify-spawns.js` at its default six seeds: 5,280 spawns, **0** that the
model calls walled in, 14 (0.27%) rejected by the physics probe — all on
`SKY ISLES · THE SPIRAL` and `THE VOID · EVENT HORIZON`, maps built from moving
and vanishing pieces. Ratcheted at 0.9% rather than zero, so the sweep stays
readable without going silent; the rate rises to 0.45% on shallow sweeps, which
keep re-drawing the same unlucky map seeds, so the ceiling clears the worst case
and not the best.

**`def.wrap` never reaches the flood fill, and that is correct.** `loadMap` puts
a static wall at x = -30 and x = W + 30 on every map including the five wrap
ones, so grid columns 0 and 79 are solid on all 110 and the wrap arms in
`reachFrom` cannot fire. The game agrees: `controller.js` wraps a wizard only
below x = -20 and the wall stops it at x = 15 — measured by holding left for ten
seconds on `DEEP SPACE · WRAPAROUND`, where it parks at x = 14.7 and never
crosses. `wrap` reaches projectiles and a wizard blasted through the wall,
neither of which is walking, so a model of walking is right to treat the edges
as walls.

**Golden tape reseed, 12353 -> 12372.** Required: 12353 fell from five rounds to
two, under the `rounds >= 3` floor, because nearly every round now opens from a
different place. `scripts/record-tape.js` carries the seed scan. The separate
lethality claim, over seeds 1..400: mean rounds 2.170 before, 2.083 after, range
1..6 both. Rounds got slightly longer, which is this fix working — wizards that
used to open a round already falling now land somewhere they can fight from.

Nothing else in the upstream range changes behavior this branch keeps.
`3b2f38b` is a merge commit restating `c11b4b2` + `83ad928` and carries no
unique work. `server/sim-bridge.js` and `server/sim-context.js` were deleted by
this branch in favour of `src/net/server-bridge.js` and
`src/platform/node.js`; upstream's edits to them have no referent here.
