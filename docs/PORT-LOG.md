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
| 7 | 83ad928 | bots: ledge avoidance | `src/sim/ai/bot.js` | pending |
| 7 | 5292ab8 | bots: retreat | `src/sim/ai/bot.js`, `src/sim/player/controller.js` | pending |
| 7 | 832ef00 | bots: double jump | `src/sim/ai/bot.js` | pending |
| 8 | 3c2b225 b798196 898d796 | spawn safety / escape analysis | `src/sim/maps/reach.js` (new), `src/sim/player/lifecycle.js`, `src/sim/maps/builders.js`, `src/sim/phys/{facade,matter-backend}.js`, `server/verify-spawns.js` | **done** |
| 9 | c11b4b2 3c2b225 | snapshot playout + server-clock interpolation | `src/net/client.js`, `src/sim/snapshot.js`, `src/net/server-bridge.js` | pending |
| 10 | c1ee936 3c2b225 | opening loadouts | `src/sim/pickups.js`, `src/sim/events.js`, `src/sim/match.js` | pending |
| 11 | 4302ace | camera frames the boss, online too | `src/render/camera.js`, `src/render/draw-snapshot.js` | pending |

## Measurements this port rests on

Kept here because the numbers, not the assurances, are the load-bearing part.

**Spawn safety (task 8).** Wizards that fall out of the world within two
seconds of spawning, over 110 maps x 2 seeds:

| | lone wizard | four wizards |
|---|---|---|
| before the port (`groundInColumn`) | 1 | 7 |
| escape analysis, nudge blind to `busy` | — | 10 |
| escape analysis, busy-aware | **0** | **6** |

The middle row is why `safeSpawnPoint` now checks `busy` on the nudge path and
not only when relocating: upstream applied it only in `arenaSpawnNear`, so two
slots could be nudged onto the same cell and shove each other off. Upstream's
own sweep drops one probe at a time, which is exactly the case that cannot see
it.

`server/verify-spawns.js` at its default six seeds: 5,280 spawns, **0** that the
model calls walled in, 14 (0.27%) rejected by the physics probe — all on
`SKY ISLES · THE SPIRAL` and `THE VOID · EVENT HORIZON`, maps built from moving
and vanishing pieces. That number is a ratchet at 0.5%, not a hard zero, so the
sweep stays readable without going silent.

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
