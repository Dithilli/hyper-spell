# HYPERSPELL browser E2E — design

Date: 2026-07-27
Status: approved

## Problem

HYPERSPELL is a web-only game and nothing tests it as a browser. The existing
coverage stops short of the player:

- `test/*.test.js` (15 files, `node --test`) tests the sim in Node — determinism,
  fixed timestep, gravity stack, collision dispatch, spatial queries, golden tapes.
  It never loads a page.
- `server/verify-e2e.js` drives the real server with real WebSocket clients. It
  covers the protocol, the lobby, and the server-side sim. It has no browser, so
  the entire client half of online play is unverified.
- `smoke-test.html`, `wave-test.html`, `controller-test.html`, `shot.html` and
  `wave-play.html` are hand-run harness pages. They are opened by a human, report
  to a human, and have drifted (their comments admit two are stale).

Nothing verifies that the menu mounts, that a key press seats a wizard, that a
spell casts, that a map draws, that the HUD paints, or that two browsers can play
each other through the real server. The game changes every day, so any suite that
hardcodes the game's content is stale the day it lands.

## Goals

1. Drive every user-facing surface of the game through a real browser.
2. Cover all content exhaustively — all 142 spells, all 110 maps — not a sample.
3. Survive daily churn: new content is covered without editing tests, and new
   surfaces cannot land untested.
4. Report bugs; do not fix them in this branch.

## Non-goals

- Rewriting or deleting the five harness HTML pages.
- Replacing `server/verify-e2e.js`. Spec 12 covers the client half it cannot reach.
- Visual regression baselines. Rejected: the game is animated and physics-driven,
  so PNG diffs would be noise. Render coverage is a pixel-variance probe instead
  (proves the canvas painted, not what it painted).
- Fixing anything in `src/`.

## Architecture

### Runner

`@playwright/test` as a devDependency. Chromium is the driver for the whole
suite. Firefox and WebKit run specs 01 and 11 only — a boot-and-paint smoke that
catches engine-specific canvas or WebSocket breakage without tripling runtime.

`globalSetup` runs `npm run build && npm run build:guide` before any test. `dist/`
is the artifact under test and the game changes daily; a stale bundle would make
the whole suite lie.

### Two page modes

The game is a canvas. Its only real DOM is the opening menu and the two auxiliary
pages, so assertions cannot come from the DOM alone.

`src/platform/browser.js:36` enables harness mode when the *page URL* carries
`?nomenu`, not just the bundle's own `src`. That gives two honest modes:

- **Real page** (`/index.html`). Menu mounted, no globals. Used for spec 02,
  which tests the menu — the one screen that is real DOM.
- **Instrumented page** (`/index.html?nomenu`). Same bundle, same
  `attachKeyboard`/`attachLobbyKeys` listeners, same rAF loop, same physics. The
  only difference is that `mountMenu()` is skipped and `installDebugGlobals()`
  publishes `window.HS`.

Input is always real (`page.keyboard.press('KeyB')`, real mouse events, a faked
`navigator.getGamepads`). `HS` is read-only, used to assert. The suite never
reaches in to mutate sim state as a substitute for playing the game, with one
declared exception: spec 06 grants a spell to a player before casting it, because
waiting for 142 specific tome drops is not a test, it is a lottery.

### Time

`src/sim/tick-loop.js` clamps each pump to 250ms and to `MAX_CATCHUP` steps, so a
single huge frame delta cannot fast-forward the sim. Playwright's virtual clock
(`page.clock.install()` / `runFor()`) fires rAF at its normal virtual cadence, so
the sim runs its real 60 ticks per virtual second while consuming near-zero wall
time. That is what makes exhaustive coverage finish in minutes.

Fallback if the virtual clock does not fully drive the loop: harness mode already
publishes `globalThis.frame`, so the page can be stepped by hand. The suite works
either way; the clock path is only faster.

### Servers

`server/serve.js` serves the static pages *and* runs the authoritative sim, so one
binary covers both halves. Couch specs use a single shared instance started by
Playwright's `webServer`. Online specs spawn their own isolated instance on a free
port per file (`e2e/support/server.js`), because one shared room across parallel
workers would have tests fighting over the same lobby.

### Layout

```
playwright.config.js
e2e/
  support/fixtures.js             console/pageerror guard on every test
  support/game.js                 page object: boot, seat, press, read, advance
  support/server.js               isolated server spawner
  manifest.json                   checked-in surface snapshot
  tools/generate-manifest.js      npm run e2e:update
  tools/audit-coverage.js         npm run e2e:audit
  tools/coverage-allowlist.json   deliberate exclusions + reasons
  specs/01..14-*.spec.js
docs/e2e-findings.md
```

### Error budget

A fixture attaches to `console` (error/warning), `pageerror`, and unhandled
rejections on every test in the suite and fails the test on any of them. This is
the highest-value assertion in the whole design: it makes all 252 content sweeps
double as crash detection.

## Coverage

| # | Spec | Surface |
|---|------|---------|
| 01 | boot | load, canvas present, version matches `src/version.js`, corner links resolve, resize/DPR |
| 02 | menu | logo/tagline/name/2 buttons; `hs-name-0` persistence; 12-char cap; `cleanName`; typing "B" in the name field must not add a bot (`stopPropagation` guard); COUCH dismisses; PLAY ONLINE failure status; `file://` suppresses the menu |
| 03 | lobby | E/Enter seat; second keymap seats P2; B to the 8 cap; 1–9 and `=`/`-` win target; M mode toggle; R reset from every state; SPACE gated on `minPlayers()`; name edit Enter/Esc/Backspace/persist |
| 04 | input | both keymaps move/jump/block/cast; mouse aim + click cast; blur clears keys; faked gamepad seats, names, and uses lobby shortcuts |
| 05 | match flow | round start → movement → damage → death → ghost → ROUND_END → banner → next map → wins tally → VICTORY → awards + kill feed → R to lobby; one full bot match to `winsNeeded` |
| 06 | spells | all 142, manifest-driven: cast in a live round, assert observable effect, cooldown gating, mega/charge variants |
| 07 | maps | all 110, manifest-driven: build + draw clean; traversability void scan ported from `smoke-test.html`; ≥2 destructibles; valid spawns; seeded-extras determinism |
| 08 | pickups | tome spawn → pickup grants a spell; catalyst; hat → mega → `unMega` |
| 09 | waves | M → wave mode; run start; wave 1 spawn; `WAVE_ENEMY_CAP`; clear → advance; `BOSS_EVERY`; RUN_OVER |
| 10 | bosses | every `BOSSES` entry: spawn, damage, phases, slay; secret bosses via the T and N demo keys |
| 11 | hud/render | HP bars, spell slots, cooldown rings, kill feed, awards, banner, arcade logo, spell report; pixel-variance probe proves the canvas painted in each state |
| 12 | online | 2+ real tabs vs a real spawned server: menu → PLAY ONLINE → welcome/you/world; shared lobby (tab A's `B` appears in tab B); SPACE starts both; snapshots render; `badVersion`; `joinDenied` at 8; spectators; refresh-and-rejoin restores seat and round wins; F8 net stats; telemetry POST lands |
| 13 | aux pages | `spell-guide.html` contains every manifest spell (it claims to be generated live — this proves it); `art-gallery.html` all five sections paint; zero errors on both |
| 14 | drift | live surface equals `manifest.json`, else fail with "run `npm run e2e:update`" |

## The updater

Two mechanisms, because daily churn creates two different problems.

**Content churn** — new spells, new maps, new bosses. Solved by
`npm run e2e:update`, which boots the real bundle in a browser and dumps the
game's surface to `e2e/manifest.json`: spell ids and metadata, map descriptors,
boss roster, pickup kinds, `game.state` values, lobby keybindings, keymaps, menu
buttons, net message types, storage keys. Specs 06, 07 and 10 iterate the
manifest, so new content is covered with no test edit. Spec 14 fails on any drift,
making the workflow: change the game → suite goes red on 14 → `e2e:update` →
review the diff → commit. The manifest doubles as a reviewable changelog of the
game's surface.

**Surface churn** — new keybindings, new game states, new net messages. The
manifest cannot enumerate these, so `npm run e2e:audit` scans `src/` for
`e.code === 'KeyX'` handlers, `game.state = 'X'` assignments, `case 'msg':` arms in
`src/net/client.js`, `data-mode` buttons in `src/platform/menu.js`, and new files
under `src/platform/` and `src/render/`, then fails if no spec references them.

The auditor is a regex heuristic and is documented as one. It cannot catch
semantic gaps — a spec that merely mentions a key satisfies it. Its job is
narrower: stop a new keybinding shipping with no test at all. Exclusions live in
`coverage-allowlist.json` and each needs a one-line reason.

Both run as part of `npm run e2e`.

## Failure policy

Tests fail honestly. No `test.fail()` masking, no skips — the exit code stays red
until a bug is fixed by someone else. Every finding is written to
`docs/e2e-findings.md` with repro, expected, actual, and the spec that catches it.
Nothing in `src/` is modified. `npm run e2e:triage` filters out `@known-bug`-tagged
specs for anyone who wants a green board while triaging.

## Risks

- **Physics is float-sensitive.** Assertions target invariants (hp decreased, a
  projectile exists, state advanced), never exact coordinates. Numeric determinism
  is already `test/golden-tape.test.js`'s job.
- **Instrumented mode is not the page a player loads.** Mitigated by testing the
  menu on the real page and by keeping `HS` read-only. The residual gap is
  `mountMenu()` itself, which spec 02 covers directly.
- **Online specs are timing-sensitive.** Real sockets, real server. They poll with
  deadlines rather than sleeping, and each file owns its server.
- **Overlap with `server/verify-e2e.js`** in lobby assertions is intentional: one
  asserts the server's view, the other the browser's.

## Scripts

| Script | Does |
|--------|------|
| `npm run e2e` | build, full suite, manifest drift check, coverage audit |
| `npm run e2e:update` | regenerate `e2e/manifest.json` |
| `npm run e2e:audit` | coverage auditor alone |
| `npm run e2e:triage` | full suite minus `@known-bug` |
| `npm run e2e:ui` | Playwright UI mode for debugging |
