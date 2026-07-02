# HyperSpell Online — Multiplayer Planning Doc

*Status: planning only, nothing implemented. Written July 1, 2026.*

## The ask

Take the couch-multiplayer wizard brawler and make it a genuinely online game that:

- lives alongside the Hyperspell product on Hyperspell infrastructure
- is playable by anyone with a Hyperspell account
- has **joinable lobbies** that auto-start when enough players are in
- has **leaderboards**

## TL;DR difficulty verdict

**Moderate — 3-6 weeks to a solid MVP, not a rewrite.** Two facts make this much easier than it would normally be:

1. **The simulation already runs headless.** Our smoke-test harness runs the complete game (Matter.js physics, all 106 spells, all 104 maps) in Node with no browser, no canvas, no real clock. That harness is ~80% of a game server's core loop. This is the hard part of most "make it online" projects, and we accidentally already built it.
2. **Hyperspell's stack fits.** Clerk JWTs for auth, K8s for stateful game-server pods, Postgres for leaderboards, Vercel/Next.js for the client shell. No new vendor needed.

The genuinely hard part is not infrastructure — it's **netcode feel**: a chaotic physics brawler is the worst-case genre for latency. That's where the risk and the polish time live.

---

## What we have today

- Client-only, zero-build: plain JS modules + Matter.js, one shared world simulation
- Input is already abstracted (`Controller.poll()` → `{move, jump, cast, ...}`) — a "NetworkController" is a natural drop-in
- Sim and rendering are in separate files but share globals; they need a formal split (see Phase 1)
- Nondeterminism everywhere (`Math.random()` in spells/maps) — fine for server-authoritative, rules out lockstep without work

## Architecture options

### Option A — Server-authoritative (recommended)

Server runs the real simulation in Node (headless Matter.js, 60 Hz). Clients send inputs (~30 Hz), server broadcasts world snapshots (~20-30 Hz), clients interpolate between snapshots and render.

- ✅ Cheat-proof by construction (server owns truth — matters if there's a leaderboard)
- ✅ No determinism requirement — keep `Math.random()`, keep all 106 spells as-is
- ✅ Our headless harness proves the server sim works today
- ⚠️ Snapshot bandwidth: a busy round is ~100-200 bodies; naive JSON is ~50-100 KB/s/client. Needs delta compression + quantization (well-trodden problem)
- ⚠️ Input latency: your own wizard reacts one RTT late. At <60 ms ping this is barely felt in a party game; client-side prediction for *your own movement only* can come later if it feels mushy

### Option B — Deterministic lockstep / rollback (GGPO-style)

All clients simulate; only inputs cross the wire.

- ✅ Minimal bandwidth, best feel at low ping
- ❌ Requires perfect determinism: seeded RNG everywhere, fixed timestep, no `performance.now()` in sim — a real refactor of 106 spells
- ❌ Rollback + full physics resim of 200 bodies × 7 frames is CPU-heavy
- ❌ Cheating is trivial (every client knows everything) — bad with leaderboards
- **Verdict: wrong fit.**

### Option C — Host-peer (one client is the server, WebRTC)

- ✅ Nearly free to run
- ❌ Host advantage + host migration pain + trivial cheating + NAT/TURN complexity
- **Verdict: fine for a friends-only toy, wrong for accounts + leaderboards.**

---

## Recommended design (Option A, concretely)

```
┌────────────┐  WSS (inputs @30Hz)   ┌─────────────────────────┐
│ Browser    │ ────────────────────► │ Game server pod (Node)  │
│ client     │ ◄──────────────────── │ · rooms: N sims @60Hz   │
│ (render +  │  snapshots @20-30Hz   │ · Matter.js headless    │
│ interp)    │                       │ · validates Clerk JWT   │
└────────────┘                       └───────────┬─────────────┘
      │ auth (Clerk JWT)                         │ results
      ▼                                          ▼
┌────────────┐                       ┌─────────────────────────┐
│ Clerk      │                       │ Lobby/API service       │
│ (existing) │                       │ (or FastAPI extension)  │
└────────────┘                       │ + Postgres leaderboard  │
                                     └─────────────────────────┘
```

**Game server.** Node process, one instance hosts many rooms (a 4-player room is one Matter world — a vCPU should carry 20-40 rooms; needs a load test). Deployed as a K8s Deployment alongside the core (ArgoCD like everything else). Rooms are ephemeral; a Redis or in-Postgres room registry maps `roomId → pod` for routing (or start simpler: one pod, vertical scale, shard later).

**Protocol.** WebSockets (WSS). Client→server: `{tick, move, jump, cast}` only — never positions (that's the anti-cheat). Server→client: delta-compressed snapshots (body positions/velocities quantized to int16, spell/effect events as one-shot messages so lightning bolts, banners, and sounds don't need to be in every frame).

**Client.** Same rendering code we have; the sim files are replaced by "apply snapshots + interpolate 100 ms behind." The game becomes a Next.js page or static site at e.g. `play.hyperspell.com`, Vercel-deployed like the other web apps. Login = existing Clerk session; the WS handshake carries the JWT; server validates it (same JWKS as core).

**Lobbies (the flow Conor described).**
- Lobby browser: list of open rooms with player count, map-theme vote, win target
- Click to join → you're a wizard in a pre-game arena (our current LOBBY state, but online — people can run around and grab lobby tomes while waiting, which is already how the local lobby works)
- Room auto-starts when full (4) or when ≥2 players are ready and a 30 s countdown expires
- Private lobbies: 4-letter room code to share with friends
- Later: quick-match button that just puts you in the emptiest open room

**Leaderboards.** Postgres tables keyed on Hyperspell account id:
- `matches(id, room, started_at, winner_account, win_target)` and `match_players(match, account, round_wins, kills, deaths)`
- Rankings: start with wins + a simple Elo; weekly season views are just a `WHERE started_at > season_start`
- Fun stats basically free since the server sees everything: kills by spell ("most Rubber Duck kills"), HYPERSPELL procs, bananas slipped on — these make the leaderboard page *feel* like the game

---

## Work plan & estimates

| Phase | What | Est. |
|---|---|---|
| 1 | **Sim/render split.** Extract deterministic-ish sim core (physics, spells, maps, rules) from render/audio/input into a module that runs in browser *and* Node. The smoke harness is the proof rig. | 1-1.5 wk |
| 2 | **Game server + protocol.** Rooms, WS, snapshot encode/delta, client interpolation, event channel for spells/banners/SFX. First playable online match (LAN feel). | 1.5-2 wk |
| 3 | **Lobbies + auth.** Clerk JWT validation on WS, lobby browser, auto-start countdown, private codes. | 1 wk |
| 4 | **Leaderboards.** Match recording, rankings API, a leaderboard page. | 3-4 d |
| 5 | **Feel + ops.** Latency tuning (maybe own-wizard prediction), reconnect handling, load test rooms/pod, deploy via ArgoCD, region choice (start us-west-2 only). | 1-2 wk |

**MVP (phases 1-4): ~4 weeks. Demo-grade online prototype (phases 1-2 only, hardcoded room): ~2 weeks.** At the pace this project has moved, realistically faster — but netcode feel iteration is play-test-bound, not typing-bound.

## Cheap fallback if we want leaderboards without netcode

Keep the game couch-multiplayer, add Clerk login + report match results to a leaderboard API (~2-3 days). Office ladder, zero netcode risk. Could ship this *first* while the real thing is built.

## Risks & open questions

1. **Latency feel** — biggest risk. Physics brawler + 100 ms ping = floaty. Mitigations: interpolation delay tuning, own-input prediction, regional servers. Must playtest early with real cross-country ping (Phase 2 exit criterion).
2. **Bandwidth** — busy rounds (Meteor Storm × 4 players) spike body counts; needs delta compression and per-effect events, not naive state dumps. Solved problem, but real work.
3. **Server cost** — rooms are stateful CPU; idle-scale to zero matters if usage is bursty. One small node covers an office; public playability needs autoscaling thought.
4. **Abuse/moderation** — public lobbies with strangers: name filtering, report/kick, rate limits on room creation. Small but nonzero scope.
5. **Account linkage** — confirm Clerk app/tenant to use, and whether "anyone with a Hyperspell account" means customers too (support/brand questions) or employees first (recommend: employees + invited friends first season).
6. **Mobile/touch** — out of scope for MVP; keyboard/gamepad only.

## Suggested sequencing

1. Ship the **office ladder** fallback now (days, zero risk, builds hype)
2. Phase 1-2 spike to a playable two-browser prototype over the real internet — this answers the only question that matters (*does it feel good?*) before we commit to the rest
3. If feel is good → phases 3-5 and a company-wide season one
