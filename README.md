# HYPERSPELL

wizards · physics · violence — a couch/LAN party brawler. Last wizard standing wins the round, first to N rounds wins the match. 2–8 players, ~104 spells, ~104 maps.

## Play locally (couch)

Open `index.html` in a browser. Press **E**, **Enter**, or any gamepad button to join; **B** adds an AI bot (great for playing solo); **Space** to fight; **1–9** sets the win target.

Debug keys: **F7** frame profiler (Shift+F7 dumps its ring buffer as CSV; `?perf=1` starts it on), **F8** live net stats, **F9** toggles the fit-to-action camera back to the old fixed framing.

## Play over the network (v2: the server runs the match)

The server is no longer a dumb relay — **the simulation runs on the server** (headless
Node, same game code) and every browser is a client. Nobody's tab is "the host": no
laptop lid closing can kill a match, and joining is just opening a URL.

macOS quick start: double-click `scripts/hyperspell-launcher.command` (or a copy on
your Desktop) — it starts the server and opens the game. `scripts/hyperspell-stop.command`
shuts it down. Manually:

```
cd server && npm install && node serve.js
```

- Everyone (including you): open `http://<server-ip>:8787` (printed at startup) → type a name → **PLAY ONLINE**
- The lobby lives on the server: **SPACE** starts, **1–9** sets the win target, **B** adds a bot, **M** toggles wave survival, **R** resets. Anyone in the room can press them.
- Drop mid-match? Refresh and rejoin with the same name within 2 minutes — you get your seat and your round wins back.

## Play over Tailscale (remote players)

No config needed — the server listens on all interfaces and the client picks `ws://`/`wss://` automatically. On the machine running `node serve.js`:

1. Make sure it's on the tailnet, then either:
   - **Simplest:** share `http://<machine-name>.<tailnet>.ts.net:8787` (or its Tailscale IP from `tailscale ip -4`) with the team, or
   - **Cleaner URL + TLS:** run `tailscale serve --bg 8787` and share `https://<machine-name>.<tailnet>.ts.net`.
2. Everyone joining must be on the tailnet (invite them first). To open it to people outside the tailnet, use `tailscale funnel 8787` instead — that exposes it to the public internet.
3. Everyone opens the URL and clicks **PLAY ONLINE**. LAN and tailnet players mix — same server, same match, 8 wizards max, spectators unlimited (connect without joining).

Latency note: the sim is server-authoritative with no client prediction, so **every** player feels their wizard react one round-trip late — put the server close to the players (LAN or direct tailnet paths of 5–30ms feel fine). If `tailscale ping <server>` says "via DERP", that player's traffic is being relayed and will feel mushy — fixing their NAT/firewall usually restores a direct path. F8 shows live net stats.

## Host on a company server

`deploy/` has a full, reviewed-but-not-yet-run kit for a small always-on game server in the
company AWS account (tailnet-only or public-HTTPS + game key) — see `deploy/README.md`.

For hosting beyond a trusted LAN, the server supports a shared key: start it with
`GAME_KEY=somesecret node serve.js` and every page load and WebSocket needs the key —
share `http://<host>:8787/?key=somesecret` and the first click sets a cookie. Unset
(the default), nothing changes. The server also caps WS payloads (128KB), connection
count (`MAX_CONNS`, default 40), telemetry disk usage (50MB), and pings sockets every
30s so dead connections get reaped instead of hanging the room.

## Tests

Three layers, each testing something the others cannot see:

```
npm test                # the sim, in Node — determinism, timestep, physics rules
node server/verify-e2e.js   # the server, driven by real WebSocket clients
npm run e2e             # the GAME, in a real browser
```

`npm run e2e` builds the bundles, then drives a browser through everything a
player touches: the opening menu, seating wizards on two keyboards and a gamepad,
a whole match to the victory screen, **all 142 spells**, **all 110 maps**, every
boss, wave survival, the HUD, both auxiliary pages, and two tabs playing each
other through a real server. It takes about 90 seconds.

### It keeps up with the game on its own

The suite reads what to test out of the game rather than hardcoding it, so
content added today is swept today with no test edits. Two commands maintain it:

| Command | Does |
|---------|------|
| `npm run e2e` | build, full suite, then the coverage audit |
| `npm run e2e:update` | re-read the game into `e2e/manifest.json` |
| `npm run e2e:audit` | the coverage ratchet on its own |
| `npm run e2e:ui` | Playwright's UI mode, for debugging a failure |

When you add a spell, a map or a boss, `14-manifest-drift` goes red on purpose.
The fix is one command, and the diff is the point:

```
npm run e2e:update
git diff e2e/manifest.json     # a changelog of what today did to the game's surface
```

**The coverage audit** handles what a manifest cannot enumerate. A new spell is a
table entry; a new keybinding is not. It scans `src/` for keybindings, game
states, server messages the client handles, menu buttons and new
`platform/`/`render/` modules, and fails when no spec so much as mentions one —
so a new control cannot ship with no test at all. It is a regex heuristic and
says so; deliberate exclusions live in `e2e/tools/coverage-allowlist.json`, each
with a reason.

### Useful flags

```
npx playwright test e2e/specs/06-spells.spec.js      # one spec
npx playwright test --grep "arenas 81-100"           # one batch
HS_E2E_SKIP_BUILD=1 npx playwright test              # don't rebuild dist/ first
HS_E2E_GAME_DIR=/path/to/checkout npm run e2e        # test a DIFFERENT checkout
HS_E2E_ENGINES=1 npm run e2e                         # add Firefox + WebKit smoke
```

`HS_E2E_GAME_DIR` is the one worth knowing: it runs today's suite against any
other checkout — a release tag, a branch, or a known-good commit while the
working tree is mid-refactor and does not build. The cross-engine projects are
opt-in because Firefox and WebKit need system libraries
(`npx playwright install --with-deps firefox webkit`).

## Docs

- `docs/MULTIPLAYER.md` — online multiplayer planning notes
- `docs/e2e-findings.md` — bugs the browser suite found, reported not fixed
- `docs/superpowers/specs/2026-07-27-hyperspell-e2e-design.md` — why the suite is shaped the way it is
