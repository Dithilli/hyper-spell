# Deploying HyperSpell to a company server

Goal: an always-on, **company-trusted** game server so team sessions don't depend
on someone's laptop staying awake — without exposing the game to the public
internet more than we choose to.

Nothing in this directory has been run. `provision.sh` / `push.sh` are written for
the Hyperspell AWS account (`503505393860`, profile `hyperspell`, region
`us-west-2`) and are meant to be reviewed, then run by a human.

## What actually moves to the server (v2: everything)

As of v9 the Node process **runs the match itself** — the simulation (physics,
spells, bots, bosses) executes headless on the server (`server/sim-host.js`);
every browser is a client. So this deployment buys:

- a stable URL the whole team can keep bookmarked — open it, click PLAY ONLINE
- the match survives anyone leaving; no player's machine matters
- free spectating (connect without joining)
- one shared, persistent `telemetry/rounds.jsonl` for balance reports

Latency = player ↔ server, for **everyone** (server-authoritative, no client
prediction). With the server in `us-west-2` and the team mostly in SF that's
~10–30ms — fine. Don't put it cross-country from the players. Press **F8**
in-game for the live net-stats overlay if a session feels off.

## It's a container (the company-shaped way to run it)

Company infrastructure is Docker-in-k8s, so the repo root has a `Dockerfile`
that packages the whole game server (verified: builds, boots, serves the page,
and the in-container sim answers joins and moves wizards):

```
docker build -t hyperspell-game .
docker run -p 8787:8787 -e GAME_KEY=somesecret \
  -v hyperspell-telemetry:/app/server/telemetry hyperspell-game
```

Notes for a k8s deploy, if it ever graduates to one:
- **One replica, ever.** The room is a single in-process match — no horizontal
  scaling, no rolling surge (`strategy: Recreate`); a deploy restarts the match.
- Sizing: one busy Node process — requests of ~0.5 CPU / 256Mi with a 1-CPU
  limit are comfortable (the sim ticks at 60Hz regardless of player count).
- WebSockets on `/ws`, plain HTTP on the rest; any ingress that speaks
  websockets works. `GAME_KEY` via a Secret. Telemetry wants a small PVC.
- Non-customer-facing: it has no business near the prod cluster's ingress —
  a cheap internal namespace (or just a container on any box) is the right home.

The EC2 kit below still works as the zero-cluster alternative — for a toy we
run ourselves, either is fine. The kit's cloud-init installs Node directly;
if you'd rather run the container on the instance, swap the systemd unit's
ExecStart for a `docker run`.

## Two access models (pick one, or run both on the same box)

### Option A — Tailnet-only (recommended: truly "inside the company")

The instance joins the company Tailscale tailnet and listens **only** there. No
public ports, no TLS chores (`tailscale serve` provides HTTPS), no game key
needed — reachability *is* the auth.

- Needs: a Tailscale auth key from the admin console (interactive; can't be
  scripted from here — David's local `tailscale` is currently logged out).
- Setup on the box: `tailscale up --authkey=...` then
  `tailscale serve --bg 8787`; share `https://hyperspell-game.<tailnet>.ts.net`.
- Security group: **no inbound rules at all** (Tailscale only needs outbound).

### Option B — Public HTTPS + game key (works for teammates without Tailscale)

Caddy terminates TLS on 443 and reverse-proxies to the Node server; the server
runs with `GAME_KEY` set, so every page load and WebSocket upgrade needs the key.
Invite links look like `https://<ip-with-dashes>.sslip.io/?key=XXXX` — the first
click sets a cookie and redirects to a clean URL.

- TLS without touching company DNS: [sslip.io](https://sslip.io) maps
  `203-0-113-7.sslip.io` → `203.0.113.7`, and Caddy gets a real Let's Encrypt
  cert for it. (The `DeveloperFullStack` role has no Route53 access, so a
  `game.hyperspell.com` record would need someone with DNS rights — easy
  upgrade later, just point a record at the IP and change one Caddyfile line.)
- Security group: 443 + 80 (ACME) open to the world, 22 from your IP only.
- The key gate, payload caps, connection cap, heartbeat reaping, and telemetry
  disk cap added in `server/serve.js` are what make this posture acceptable.

## The kit

| file | what it is |
|---|---|
| `provision.sh` | creates SG + key pair + t4g.micro Ubuntu 24.04 (arm) instance, tagged `Project=hyperspell-game`. Prints the IP. **Review, then run.** |
| `cloud-init.sh` | user-data run by the instance on first boot: installs Node + Caddy, creates the `hyperspell` user, installs the systemd unit, generates a `GAME_KEY`, writes the Caddyfile for `<ip>.sslip.io` |
| `hyperspell-game.service` | systemd unit — restarts on crash, env from `/etc/hyperspell-game.env` |
| `Caddyfile` | reference copy of what cloud-init writes (Option B) |
| `push.sh` | rsyncs the repo to the instance, `npm install`, restarts the service, prints the invite URL. Also how you ship updates. |

## Runbook (Option B, ~15 minutes)

```bash
aws sso login --profile hyperspell        # if the session is stale
./deploy/provision.sh                     # creates the instance, prints IP
./deploy/push.sh <ip>                     # ships the code, starts the game
# → prints https://<ip-dashes>.sslip.io/?key=...  — paste it in Slack
```

Redeploy after any game change: `./deploy/push.sh <ip>` (clients see
"GAME UPDATED — REFRESH" via the existing `GAME_VERSION` check).

For Option A, run `provision.sh` with `OPEN_WEB=no`, then on the box:
`sudo tailscale up` (needs the auth key) and `tailscale serve --bg 8787`, and
remove `GAME_KEY` from `/etc/hyperspell-game.env`.

## Costs & teardown

t4g.micro on-demand ≈ **$6/mo** + a few cents of EBS. Everything is tagged
`Project=hyperspell-game`; teardown is `aws ec2 terminate-instances` on the
tagged instance plus deleting the `hyperspell-game` SG and key pair.

## Later, if the team wants more

- `game.hyperspell.com` instead of sslip.io (one Route53 record + one Caddyfile line)
- rooms/multiple matches (the server runs one match today — v9 made the sim a
  per-context object, so rooms are "spawn another sim context" away)
- client-side movement prediction to hide the round trip
- ~~headless server-side host~~ ✅ shipped in v9 — the server IS the host now
