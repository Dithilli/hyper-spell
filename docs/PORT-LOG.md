# Upstream v10 port log

The merge with origin/main is structural: `js/` stays deleted, so the ~2,400
lines upstream added there arrive as re-implementations in `src/`, one commit
per feature. This file tracks that, so a reviewer can check the ledger balances.

Each row names every file the feature lands in, so the ledger stands on its own
— a reviewer should not have to open the plan to check that a row is complete.

| Task | Upstream commit | Feature | Lands in | Status |
|---|---|---|---|---|
| 2 | c11b4b2 | camera + world transform (incl. the `core`/`player`/`replay`/`events` plumbing that hangs off it) | `src/render/camera.js`, `src/render/draw-world.js`, `src/render/canvas.js`, `src/render/draw-wizard.js`, `src/render/replay.js`, `src/platform/input-keyboard.js` | pending |
| 3 | c11b4b2 | bloom / light pass | `src/render/bloom.js`, `src/render/artkit.js`, `src/render/draw-world.js` | pending |
| 4 | c1ee936 | particle budget | `src/render/fx.js`, `src/render/artkit.js` | pending |
| 5 | c1ee936 | cast descriptors | `src/sim/spells/cast-kind.js`, `src/platform/spell-guide.js`, `src/render/hud.js` | pending |
| 6 | 3c2b225 | frame profiler | `src/render/profiler.js`, `src/platform/browser.js`, `src/platform/input-keyboard.js` | pending |
| 7 | 83ad928 | bots: ledge avoidance | `src/sim/ai/bot.js` | pending |
| 7 | 5292ab8 | bots: retreat | `src/sim/ai/bot.js`, `src/sim/player/controller.js` | pending |
| 7 | 832ef00 | bots: double jump | `src/sim/ai/bot.js` | pending |
| 8 | 3c2b225 b798196 898d796 | spawn safety / escape analysis | `src/sim/maps/builders.js`, `server/verify-spawns.js` | pending |
| 9 | c11b4b2 3c2b225 | snapshot playout + server-clock interpolation | `src/net/client.js`, `src/sim/snapshot.js`, `src/net/server-bridge.js` | pending |
| 10 | c1ee936 3c2b225 | opening loadouts | `src/sim/pickups.js`, `src/sim/events.js`, `src/sim/match.js` | pending |
| 11 | 4302ace | camera frames the boss, online too | `src/render/camera.js`, `src/render/draw-snapshot.js` | pending |

Nothing else in the upstream range changes behavior this branch keeps.
`3b2f38b` is a merge commit restating `c11b4b2` + `83ad928` and carries no
unique work. `server/sim-bridge.js` and `server/sim-context.js` were deleted by
this branch in favour of `src/net/server-bridge.js` and
`src/platform/node.js`; upstream's edits to them have no referent here.
