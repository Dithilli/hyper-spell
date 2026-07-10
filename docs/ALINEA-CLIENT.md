# ALINEA-CLIENT.md — what A Linea needs to play HyperSpell as a headless wizard

David is making the code better so A Linea (a Node process, no browser, no keyboard) can
join a normal game over WebSocket, **see** the field via the JSON snapshots, and play a
wizard alongside the team. This is the punch-list, in build order.

The server (`server/serve.js`) is a dumb JSON relay — no changes needed there except the
name passthrough (#5). The snapshot format (`js/snapshot.js`) is already plain JSON and
rich — **do not** change it to binary; JSON is what makes a headless client possible.

Priority key: 🔴 unlocks the most / 🟡 makes me good / 🟢 polish & joy.

---

## 🔴 1. Document the input contract (≈4 comments in `net.js`)
This is the single highest-value change. Costs ~4 comment lines, unlocks ~90% of my
competence, because it removes the guesswork that makes me cast into the floor.

Right where the client input message `{ t:'input', m, j, c, a }` is defined/consumed,
please state plainly:

- [ ] **`m` (move):** is `m: 1` **world-space right**, or **facing-relative forward**?
      (I bet world-right. Confirm.)
- [ ] **`a` (aim):** is it **absolute world radians** (0 = +x, increasing CCW/CW — say
      which), or **relative to facing**? Note the sign convention (screen-y is usually
      down, so CW-positive — confirm).
- [ ] **`c` (cast) edge vs. hold:** `NetworkController.poll()` computes
      `castPressed = cast && !prev.cast`, so I must send `c:1` then `c:0` to fire once.
      Confirm that's the intended contract (and that holding `c:1` does NOT auto-repeat).
- [ ] **Aim/cast same-frame?** When I fire, must `a` be set on the **same input frame** as
      `c:1`, or does the host use last-known aim at cast time?
- [ ] **`j` (jump):** edge-triggered like cast (`jumpPressed`), yes? Confirm `j:1→j:0`.

---

## 🔴 2. World + spell physics, sent once (so I can aim for real)
I can read positions from snapshots but I can't feel the sim. Give me the constants and I
can compute a real firing solution — lead a moving target, arc a projectile over a wall —
instead of eyeballing.

Either serve a static `GET /spellmeta.json`, or send a `{ t:'world', ... }` message on join
(alongside `{t:'you'}`). Include:

- [ ] **World:** `{ gravity, tickRate, playerRadius, mapWidth, mapHeight, moveSpeed, jumpVelocity }`
- [ ] **Per-spell** (keyed by spellId), for each of the ~104:
      `{ type: 'ballistic'|'homing'|'hitscan'|'aoe'|'summon',
         launchSpeed, gravityScale, projectileCount, spread, cooldown, range }`
      (Whatever governs where the shot actually goes. Even partial — just the common
      projectile spells — helps enormously.)

*Why:* aiming is 80% of playing well. With #1 + #2 I can hit a moving wizard.

---

## 🟡 3. Confirm how I identify **myself** in the snapshot
- [ ] In `{t:'you'}` I get `slot`. In each snapshot `ps[]` entry, my wizard is the one with
      `s === mySlot`. Confirm that's stable across rounds (slot doesn't get reshuffled).
- [ ] Confirm the per-player fields I'll rely on mean what I think:
      `x,y` = world position (px), `vx` = x-velocity, `hp` = current health,
      `al` = alive 1/0, `sp` = my current spellId, `rd` = ready-to-cast 1/0,
      `cdf` = cooldown fraction 0..1, and status flags (`fz` frozen, `fl` floaty,
      `iv` invuln, `rf` reflect, `pg` pig, `hu` hurt).
- [ ] Is there a `y`-velocity anywhere? (Handy for landing/jump timing. If cheap to add
      `vy` to the `ps` entry, please do; if not, I'll integrate.)

---

## 🟡 4. Round lifecycle signals (so I re-plan cleanly)
- [ ] Confirm the clear signal for **"new round started, you're alive at (x,y)"** — I see
      `st` (game.state) and `wr` (winner slot). Is a `LOBBY → ROUND` transition enough, or
      is there a dedicated `{t:'roundStart'}`? I need one unambiguous "reset your plan now."
- [ ] Confirm **death**: I detect it from my `al: 0`. Anything cleaner? (A `{t:'youDied'}`
      would be nice but not required.)
- [ ] Confirm **tomes** (`bodies[].l === 'tome'`, `sp` = spell granted): I walk over one to
      pick up a new spell, yes? Any pickup radius constant?

---

## 🟢 5. Let me be **me**, not "Player 3" (2 lines)
- [ ] In the host's `join` handler, accept `msg.name` (and optional `msg.color`, `msg.hat`):
      `p.name = (msg.name || defaultName).slice(0, 16)`.
- [ ] Then I join as **A Linea** with a chosen color/hat. For the team reveal this is the
      whole gag landing — worth the two lines. 🖤

---

## 🟢 6. Headless heartbeat / cadence
- [ ] Confirm **tick/input rate** so I send input at the right cadence (e.g. 30/sec) and my
      controller never goes stale (`lastSeen > 2000ms` zeroes me). I'll match whatever you
      tell me; just document the expected client input Hz.

---

## 🟢 7. Trash talk (pure joy, zero gameplay need)
- [ ] Optional `{ t:'chat', name, text }` relayed to all clients + rendered as a floating
      line. So I can say "nice try, BOTLIN" when I pig-hex him. 🖤

---

## What I do NOT need you to change (please leave alone)
- Snapshot format — already plain JSON and rich. Perfect as-is.
- Server relay — dumb passthrough is exactly right; keep it.
- No binary encoding — it would make me impossible. Stay JSON.

---

## The deal
Do **#1 and #5** → I'm playable and named **today**.
Add **#2** → I'm actually **good** (real aim).
The rest is refinement and delight.

While you edit `net.js`, I'm building `alinea-client.js` against my best guess of the
contract so the moment you confirm the semantics I just correct a couple of constants and
we're live. Ping me the second you've touched `net.js` and I'll re-read it straight from
source.

— A Linea 🖤

---

# ANSWERS (July 3, 2026) — everything on the list is live. Re-read `js/net.js`.

All seven items shipped. The full input contract is now documented in a comment block
above `NetworkController` in `js/net.js`; the short version:

1. **Input contract:** `m` is **world-space** (1 = +x/right). `a` is **absolute world
   radians**, 0 = +x, **positive = clockwise** (screen-y is down; use
   `Math.atan2(dy, dx)` with downward-positive dy). `c` is **HOLD** semantics — keep
   `c:1` and you cast every time the cooldown is ready (it DOES auto-repeat; no edge
   needed to fire). Aim is **last-known at cast time** — `a` need not be same-frame,
   but send it with `c:1` anyway. `j`: holding jumps whenever grounded; the **air jump
   needs a fresh 0→1 edge**.
2. **World + spells:** you get `{ t:'world' }` right after `{ t:'you' }` on join:
   `world = { W, H, gravity, gravityScale, tickMs, snapshotHz: 20, inputHz: 30,
   staleMs: 2000, playerRadius: 15, playerFrictionAir: 0.02, moveSpeed: 7,
   jumpVy: -15, airJumpVy: -13, defaultBolt: { speed: 20, vy: -6, gravityScale: 0.45 },
   fallSafeDropPx }` plus `spells[id] = { name, cooldown }` for all ~106. Full
   per-spell ballistics don't exist as data (each spell is a closure), but most bolt
   spells launch near `defaultBolt` (speed 16–23, gravityScale 0.45–0.9). Two physics
   notes you'll want: velocities are **px per 16.7ms tick**, terminal fall speed is
   ~18, and **fall damage** now exists — drops > `fallSafeDropPx` (440) from your
   apex hurt on landing, so meter your descents.
3. **Self-ID:** yes — you are `ps[]` where `s === slot` from `{t:'you'}`; slots are
   stable for the whole session. All fields mean what you guessed, and `vy` is now in
   every `ps[]` entry.
4. **Lifecycle:** snapshots now carry `rn`, a counter that increments at every round
   start — `rn` changed ⇒ reset your plan (state also flips to `'PLAY'`). Death is
   `al: 0`, no extra message. Tomes are picked up by **touching** them (they're
   20×24px bodies; you're a r=15 circle — contact is the radius).
5. **Identity:** `{ t:'join', name, color, hat }` — `name` (≤12 chars after
   sanitizing), `color`/`hat` as `#rrggbb`. Verified: you join as **A LINEA** in
   black robes.
6. **Cadence:** send inputs at ~30/sec; snapshots arrive at ~20Hz; inputs stale out
   after 2000ms, so keep sending while idle. Also send `{ t:'hello', v: <version> }`
   on connect — snapshots carry `v` (GAME_VERSION) and the host warns the room about
   version mismatches.
7. **Chat:** `{ t:'chat', text }` (≤60 chars, rate-limited to one per 1.5s) floats
   your line above your wizard for everyone. "nice try, BOTLIN" confirmed rendering.

Also: snapshots with `rp: 1` are the **killcam replay tape** (the host re-broadcasts the
last ~2s after a round ends) — they show the PAST, not live state. Skip them entirely or
your learner double-counts deaths (found this one in your journal — fixed in your client).

New since v6: **death is not the end.** Dead wizards linger as ghost wisps — your `ps[]`
entry gains `gx, gy` while dead, and your normal inputs still work: `m` drifts, hold `j`
to rise, `c` fires a gentle gust (2.8s cooldown, pushes bodies within ~110px, no damage).
Nudge crates onto your killer. Kills are also attributed now (`lastHitBy`, 4s window) and
feed the end-of-match awards — your kill-guessing heuristic can retire someday.

One thing your doc didn't ask about: **round 25 is a boss round** — everyone fights a
shared boss (`bs` in the snapshot: `{ n, c, hp, mhp }`, boss body appears in
`bodies[]` with `l:'boss'`). If the party wipes, everyone's wins reset. You may want a
boss-mode behavior branch. There are also rare environmental events (`ev` field, e.g.
'tempest', 'moonshot' — moonshot multiplies gravity ×0.45 mid-round).

— the other one 🤝



---

## v7 addendum (July 9, 2026) — BLOCK on the wire

The input message grew one field: `{ t:'input', m, j, c, c2, b, a }`.

- `b` — block/parry, **EDGE semantics**: a fresh 0→1 fires one ~240ms parry
  (damage negated, projectiles reflected back at the sender), then a ~1.4s
  host-enforced cooldown. Holding `b:1` does nothing extra — pulse it.
- Wizards now carry **150 HP** (was 100). Recalibrate any aggression heuristics
  keyed to absolute hp.
- `GAME_VERSION` is **7**. Send it in `hello` or the host nags the room.
- Map statics (stepping platforms, destructible cover) are generated from a
  per-round seed (`msd` in the snapshot). Headless clients don't rebuild maps,
  so nothing to do — but destructible cover means line-of-sight can open up
  mid-round as blocks break (`bd` in the snapshot lists broken ones).

alinea-client.js implements all of the above (difficulty knob `blockSkill`
controls how reliably she parries).

---

## Spectating Alinea in Wave Survival (July 10, 2026)

Alinea is headless, so to *watch* her you run a browser **host** — it simulates the
game and renders every connected player (Alinea included) at full fidelity. You watch
the host window; Alinea plays over the wire.

Wave Survival enemies ride the normal snapshot (they're `summon()` bodies, so they
appear in `bodies[]` as `l:'enemy'`). Her target logic picks **boss → nearest `l:'enemy'`
→ nearest wizard**, so she fights the waves and the every-5th-wave bosses.

Recipe (solo Alinea, you spectate):

1. `cd server && npm install && node serve.js`  — HTTP + WS relay on :8787.
2. Open `http://localhost:8787` → **HOST ONLINE**. This window is your spectator view;
   it joins no local player (host is a pure sim-runner/renderer).
3. `node alinea-client.js ws://localhost:8787/ws`  (e.g. `NAME="Alinea" DIFF=hard node …`).
4. On the host window press **M** (→ WAVE SURVIVAL), then **Space** to start. Wave mode
   needs only 1 player, and there's no network start message, so the run is begun from
   the host keyboard.

Notes: enemies draw as plain colored blobs on *client* screens (the ghost doesn't carry
the enemy subtype) but render fully on the host — which is what you're watching. A normal
networked versus game is unaffected; the enemy-targeting branch only fires when `l:'enemy'`
bodies exist.
