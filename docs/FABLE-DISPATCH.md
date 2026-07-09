# HyperSpell — Fable Review & Dispatch Plan

*Fable 5 code overlook, 2026-07-09. Reviewed: spells.js, spellbook.js, hybrids.js, spelltiers.js, pickups.js, player.js, telemetry.js in depth; full architecture scan of the rest. This doc is written to be dispatched: each task is scoped for an independent agent and states its files, contract, and acceptance criteria.*

---

## 1. State of the codebase (review verdict)

The good: the spell system is genuinely well-factored for a no-build vanilla-JS game. `boomBolt`/`statusBolt`/`zapRay`/`makeZone`/`spawnSingularity`/`summon` are strong reusable primitives; telemetry attribution through the `spellId` accessor is clean; the rarity-tier system gracefully defaults new spells to `common`; snapshot serialization is a single source of truth reused by net, killcam, and replay; the audio gate/ducking is thoughtful.

Confirmed findings (verified in code, not guesses):

1. **The 8×8 fusion matrix is 100% full** — all 36 recipes (8 amps + 28 cross) exist. There is no room for new combos without new schools or a new fusion order.
2. **15 spells belong to no fusion family** and can never fuse; a Fusion Catalyst on them fizzles "NO FUSION": `bouncer, cluster, homing, landmine, sticky, disintegrate, fireflies, blink, rocketleap, springheel, featherfall, bouncycastle, trampoline, beehive, earthquake`.
3. **Kill-credit / telemetry attribution holes**: `damagePlayer(p, amt, src)` drives both the kill feed (`lastHitBy`, awards.js) and per-spell damage telemetry (`telDmg`), but many spells omit `src`: core `lightning` (spells.js:329), `frost` (spells.js:341), `chain` (spellbook.js:238), `railgun` (:307), `disintegrate` (:268), `shove` (:313), `magnetpalm` (:401), `blizzard` tick (:463), `teslacoil` (:1055), `vampirebolt` (:982), and the singularity consume-kill (`damagePlayer(b.player, 999)` spells.js:210). These kills credit nobody and their damage vanishes from the balance report.
4. **`roulette` can roll hybrid casts** — it picks from `Object.keys(SPELLS)` filtering only itself and mirrorcast (spellbook.js:846), so it can fire fusion-only spells, undermining "hybrids only exist through fusion." (Bonus: switching it to `weightedSpellPick` fixes this for free since hybrid tier weight is 0, and makes roulette respect rarity.)
5. **`statusBolt` mega-scaling inconsistency** — some `apply` callbacks use the `m` they're handed (permafrost), others ignore it (iceshard).
6. **Doc/version drift**: `GAME_VERSION=6` (core.js:5) vs PATCHNOTES topping out at "v4"; `ENV_EVENT_CHANCE=0.20` (events.js:4) vs "15%" in PATCHNOTES; spell/map counts differ across README/MULTIPLAYER.
7. **`applyFx` invokes any global by name** (`globalThis[msg.f](...msg.a)`, net.js:328) with no allowlist, even though `wrapFx` has a fixed name list. Also `wrapFx` snapshots `sfx` keys once — sounds added after init silently don't broadcast.
8. **Render dispatch is duplicated 3×** (live bodies in game.js `drawDynamicBody`, ghost bodies in snapshot.js, wizard status overlays in player.js vs snapshot.js) and the **HUD is duplicated** host (game.js) vs client (net.js:412-511). Every new summon label or status effect must be added in two places or LAN clients won't see it.
9. Minor: dead `core.js:drawBody`; legacy `sp`/`rd` snapshot fields alongside `s0/s1/c0/c1`; `sendInput` stores state on the function object; pervasive unnamed magic numbers.

**Non-issue, verified**: `disarm` writing `q.spellId = null` still works — `spellId` is an accessor that clears both slots (player.js:53). Wet/CONDUCT is reachable (thaw-after-freeze and icy maps set `wetUntil`).

### Constraints every implementing agent must respect

- **No modules.** Plain script tags in `index.html:24-46`, load order is load-bearing. New files go in that list after their dependencies (new hybrid content belongs in or after `hybrids.js`).
- **LAN visibility contract.** One-shot FX must go through the wrapped globals (`spawnParticles`, `spawnRing`, `spawnText`, `doFlash`, `addShake`, `slowMo`, `boltVisual`, `setBanner`, `addKillFeed`, `spawnBurst`, `sfx.*` — see net.js:226). Persistent `activeEffects` with a `draw()` are host-only unless they carry a `net:{k:...}` descriptor rendered by snapshot.js (`zone`, `sing`, `tor` exist today). **Safest pattern for new spells: compose from `makeZone`, `spawnSingularity`, summons (physical bodies auto-sync as ghosts), and the wrapped one-shots.** A new summon *label* needs draw handling in both game.js (`drawDynamicBody`) and the snapshot ghost path — prefer reusing existing labels (`crate`, `critter`, `wall`, `mine`, `saw`, `bouncy`).
- **Spell conventions**: scale by `const m = p.mega || 1`; pass the caster as `owner`/`src` on all damage; hybrids register via `regHybrid` (auto-excluded from tome pool, auto-tiered `hybrid`); `CAST_FLOOR` is 480ms; recipes in `FUSIONS` are scanned first-match-wins with amps listed first (a WILD catalyst resolves to the school's amp).
- **Fun first, balance second.** Every big moment gets a dramatic beat (banner/flash/shake/slowMo). Special content stays rare.

---

## 2. New content design (approved direction: new schools + ascensions)

### 2a. Two new ingredient schools

Rehome the 15 orphans; every spell in the game becomes fusable.

**Into existing schools** (pure family-list edits in hybrids.js):
- `disintegrate` → `F_ZAP` · `fireflies` → `F_FIRE` · `earthquake` → `F_EARTH`

**`F_TINKER` — contraptions & gadgets** (new):
`landmine, sticky, cluster, bouncer, homing, beehive, trampoline, bouncycastle` + dual-listed: `sawblade` (also EARTH), `teslacoil`, `lightningrod` (also ZAP), `banana` (also TRICK).

**`F_SWIFT` — motion & haste** (new):
`blink, rocketleap, springheel, featherfall` + dual-listed: `phoenixdash` (also FIRE), `smokebomb` (also TRICK), `ghostwalk` (also LIFE), `timeskip` (also TRICK).

10 schools → full matrix = 55 recipes; we add **19 new hybrids** (2 amps + 17 cross). Recipe list order: append the 2 new amps to the amp block (before all cross entries), then the 17 cross pairs.

### 2b. The 19 new hybrids (specs)

Cooldowns sit in the established hybrid band (1800–4200). All damage passes `p` as owner. Colors chosen to read against the storybook palette.

**Amps**
1. `doomsday` — **Doomsday Device** (TINKER+TINKER, #ff8a5c, cd 4200). Plant a contraption at `frontPos(p, 90)` (summon, `crate` label, 2.4s life). It beeps at an accelerating rate (blinking draw + `sfx.clang` ticks via activeEffect). On expiry: `explode(x, y, 260*m, 30*m, 45*m, p)` + 4 scattered bomblets (`dropProjectile`) + `addShake(14)`. Enemies can knock it around — it's a physics body, that's the counterplay.
2. `quicksilver` — **Quicksilver** (SWIFT+SWIFT, #e8f4ff, cd 4000). 3s: `speedUntil`, `jumpBoostUntil`, +0.6s `invulnUntil` on cast. A follow-zone activeEffect samples `p.body.position` each tick; enemies within 46px take `8*m` contact damage (0.4s per-enemy debounce) and get shoved. Afterimage: `spawnBurst` trail each ~80ms. Banner "QUICKSILVER".

**TINKER cross**
3. `fireworksfactory` — **Fireworks Factory** (×FIRE, #ff9d5c, cd 3400). Summon a launcher crate (`crate` label, 3s); an activeEffect fires 6 scheduled rockets from it (shoot-like bolts, random upward angles, each `explode 70*m/11*m/14*m` + 0.8s burn on hit). Confetti-adjacent spectacle, `sfx.cast` per rocket.
4. `snowglobe` — **Snow Globe** (×ICE, #d8f4ff, cd 3600). `makeZone` dome at `frontPos(p,170)` (r 200*m, 3.2s): enemies inside get `frozenUntil` refreshed +250ms and take occasional chip damage (reuse blizzard's tick pattern, owner p). On end: shatter — `explode(x, y, 150*m, 14*m, 18*m, p)` + ice `spawnBurst`.
5. `teslamine` — **Tesla Mines** (×ZAP, #9ef0f0, cd 3000). Plant 3 hopping mines via `summonCritter` (5s life). ActiveEffect every 400ms: `boltVisual` arcs between surviving mines; any enemy within 120px of an arc endpoint takes `9*m` via `zapHit` (conducts!).
6. `windturbine` — **Wind Turbine** (×AIR, #d7f5ef, cd 3200). Summon a fan contraption (`wall` label, static, 4s) at `frontPos(p,80)`; activeEffect pushes all non-static bodies in a lane (facing direction, 500×160px) each tick, redirecting projectiles like `gust` does. Spark streaks along the lane.
7. `trebuchet` — **Trebuchet** (×EARTH, #8a7a5a, cd 3400). Summon a frame (`crate`, 2.5s); activeEffect lobs 3 boulders (`dropProjectile` arcs computed toward nearest enemy at fire time, 0.7s apart), each `explode(…, 110*m, 16*m, 26*m, p)`. `sfx.thud` per lob.
8. `wormholetrap` — **Wormhole Trap** (×VOID, #a55eea, cd 3800). Plant a mine-like body (reuse `mine` label pattern, 8s life, arm delay 700ms). When an enemy comes within 90px (checked in an activeEffect), consume it and `spawnSingularity(enemy.x, enemy.y, m)`.
9. `clockworkmedic` — **Clockwork Medic** (×LIFE, #7bd88f, cd 4200). `summonCritter` that hops toward its owner (6s life). ActiveEffect: if owner within 140px, heal `3*m` every 500ms (`spawnBurst` green plus-sparks); enemies it touches take `8*m` (contactDamage). The only sustained heal in the game — cooldown priced accordingly.
10. `jackinthebox` — **Jack-in-the-Box** (×TRICK, #ff9ff3, cd 3000). Plant a box (`crate`, 6s, arm 500ms). First enemy within 110px springs it: launch them `y:-16`, `floatyUntil` +1.5s, `reversedUntil` +1.5s, `12*m` damage, `chaosBurst` confetti, `sfx.boing`, box consumed.

**SWIFT cross**
11. `cometdash` — **Comet Dash** (×FIRE, #ffb347, cd 2400). Phoenix Dash amplified: dash along aim (speed 27, 0.7s invuln), leave a burning trail `makeZone` strip (3 small zones along the path, 2s, burn tick), `explode(end.x, end.y, 120*m, 16*m, 20*m, p)` at the endpoint.
12. `glacialglide` — **Glacial Glide** (×ICE, #bfe8ff, cd 2600). Dash along aim; drop 4 freezing patches (`makeZone` r 70, 2.5s: enemies get `freezePlayer(q, 500*m)`); caster gets `speedUntil` +2s. Crystalline `spawnBurst` at each patch.
13. `stormstep` — **Storm Step** (×ZAP, #fff89e, cd 3000). Blink to up to 3 enemies in sequence (nearest-first, 120ms apart via activeEffect): at each, `boltVisual` from previous position, `zapHit(q, 18*m, p)`, small knockup. End at the last enemy with 300ms invuln. `slowMo(0.3, 250)` on cast — this is the flashiest new spell, let it land.
14. `slipstream` — **Slipstream** (×AIR, #e0ffff, cd 3200). 3s: `floatyUntil` + `speedUntil` + `jumpBoostUntil`; follow-zone wake shoves enemies within 90px away (no damage — pure displacement); ribbon of `spawnBurst` sparks.
15. `juggernaut` — **Juggernaut** (×EARTH, #5a5245, cd 3400). `growUntil` +1.2s, `heavyUntil` (self — embrace it) +1.2s, 0.8s invuln, launch forward at 24; follow-zone for 1s: enemies contacted get `explode`-grade knock + `14*m`. `addShake` while charging.
16. `phaserift` — **Phase Rift** (×VOID, #b58aff, cd 3200). Teleport 300px along aim (Blink pattern with clamping); leave a 0.8×-scale singularity at the *departure* point; 400ms invuln on arrival.
17. `guardianangel` — **Guardian Angel** (×LIFE, #fff3d6, cd 5000). Heal `18*m`, **cleanse** (zero out frozen/burn/reversed/shrink/heavy/slip/pig timers), 1s invuln, wing-shaped `spawnBurst`, `spawnText 'CLEANSED'`. The only cleanse in the game.
18. `nowyouseeme` — **Now You See Me** (×TRICK, #e8d5ff, cd 3400). Smoke burst at current spot, blink to a random safe spot (reuse chaostheory's placement bounds), leave 2 decoys (existing `decoy` label) at the old position; enemies within 160px of the old spot get `reversedUntil` +2s.
19. `ejectorseat` — **Ejector Seat** (×TINKER, #ffab76, cd 2800). Launch self `y:-26` with 0.5s invuln; as you rise, drop 3 armed bomblets (`dropProjectile`, each `explode 70*m/11*m/14*m`) and one `banana` peel. `sfx.boing`.

### 2c. Ascensions — second-order fusions (rare by construction)

**Mechanic**: in `grabCatalyst(p)` (pickups.js:126), *before* the wildcard logic: if either held slot is an **amp hybrid** with an entry in a new `ASCENSIONS` table, replace it with its ascended form and run an ascension ceremony (bigger than fusion: gold `setBanner('☄ ASCENSION! <NAME>')`, `slowMo(0.25, 900)`, `doFlash` gold, `addShake(12)`, `sfx.victory`). Rarity is structural: fuse a same-school pair → keep the amp alive → find a *second* catalyst (~10% of drops). No new pickup logic needed.

Ascended spells: register via `regHybrid` (excluded from tomes automatically) plus `def.ascended = true`; add tier `ascended` (`TIER_WEIGHT: 0`, `TIER_COLOR: '#ffd166'`, `TIER_RANK: 5`) so HUD/report styling can go gold. Cooldowns 5000–7000; these are round-swinging ultimates, cast maybe twice before you die.

| Amp held | Ascension | Effect sketch |
|---|---|---|
| inferno | `ragnarok` — **Ragnarök** (#ff3b1f, cd 6000) | 3s arena-wide firestorm: scheduled meteor drops (meteor-storm pattern, full width) + 3 skybolts; all enemies burn 3s. |
| absolutezero | `heatdeath` — **Heat Death** (#eaffff, cd 6000) | All enemies frozen 2.2s + heavy; arena flash-tint; `14*m` up-front (SHATTER follow-ups are the payoff). |
| overload | `zeus` — **Wrath of Zeus** (#fff89e, cd 6000) | First: all enemies get `wetUntil` +4s ("drenched in ozone"). Then 5 skybolts tracking the nearest enemy's x over 2s — conduction city. |
| maelstrom | `hurricane` — **Hurricane** (#c8f7f7, cd 6500) | Two tornados (existing tornado effect, opposite directions) + global sideways wind + periodic skybolts, 4s. |
| rockslide | `tectonic` — **Tectonic Break** (#8a7a5a, cd 6000) | Screen `addShake(24)`, all enemies heavy 2.5s, rain of mixed heavies across full width: boulders + an anvil + a piano (reuse those summon defs). |
| bigcrunch | `supernova` — **Supernova** (#fff3d6, cd 7000) | Center-arena singularity at 2× scale for 1.4s, then a 500-radius, `50*m`-damage rebirth explosion. Longest windup in the game; telegraph loudly. |
| sanctuary | `elysium` — **Elysium** (#7bd88f, cd 7000) | Full heal, 3.5s invuln, and a 4s healing/cleansing zone around the caster (allies-in-zone concept: any player, it's FFA — heals whoever stands with you, spicy). |
| pandemonium | `aprilfools` — **April Fools** (#ff9ff3, cd 6500) | Every enemy: pigmorphed 3s + teleported randomly + one random hex each; confetti apocalypse; banner 'APRIL FOOLS'. |
| doomsday | `bigredbutton` — **The Big Red Button** (#ff5e57, cd 7000) | 2.5s countdown banner (3…2…1 via spawnText), then every destructible breaks and all enemies take `40*m` + huge knock, wherever they are. Caster is not exempt from knockback — style points. |
| quicksilver | `timelord` — **Time Lord** (#e8f4ff, cd 7000) | 2.2s `slowMo(0.18)` while the caster gets compensating `speedUntil` + cast-floor exemption feel (they move ~normal while the world crawls) + 1s invuln. |

---

## 3. Dispatch task list

Suggested order: **A and E1 first** (B/C build on the helpers and fixed attribution), then **B → C → D**, F last. Tasks within a track are parallel-safe unless noted. File references are current as of this review.

### Track A — Bugs & consistency (small, independent)

- **A1 · Damage-attribution audit.** Pass the caster as `src` in every spell-damage call missing it (list in §1.3; do a full `grep -n "damagePlayer(" js/*.js` sweep and check each 2-arg call). Also give the singularity consume-kill (spells.js:210) an owner — thread the caster through `spawnSingularity`. *Accept: a scripted audit finds no 2-arg `damagePlayer` calls in spell code; killing with chain/railgun/disintegrate/blizzard/teslacoil credits the caster in the kill feed and the spell report shows their damage.*
- **A2 · Roulette respects rarity, excludes hybrids.** Replace roulette's uniform `pick` (spellbook.js:846-850) with `weightedSpellPick` over non-self, non-mirrorcast ids (hybrid weight 0 excludes fusions automatically). *Accept: 200 simulated rolls in console produce no hybrid ids and a rarity-shaped distribution.*
- **A3 · `statusBolt` mega-scaling pass.** Make every `apply(q, m)` callback in spellbook.js actually use `m` (iceshard and friends). *Accept: grep shows no apply callback ignoring its `m` param.*
- **A4 · Doc sync.** PATCHNOTES entry for v5/v6 changes (two-slot, fusion catalyst, terrain overhaul per git log), fix ENV_EVENT_CHANCE 20% and spell/map counts. *Accept: PATCHNOTES top version matches `GAME_VERSION`; numbers match code constants.*
- **A5 · `applyFx` allowlist.** Share `wrapFx`'s name array; `applyFx` rejects anything not in it (plus `sfx` keys). *Accept: crafted `{t:'fx', f:'resetMatch'}` message is ignored.*

### Track B — New schools & 19 hybrids (split into B2/B3/B4 for parallel agents; B1 first)

- **B1 · Families & recipes** (hybrids.js). Add `F_TINKER`/`F_SWIFT` with the §2a memberships (including dual listings), move the 3 rehomed orphans into existing families, append 2 amp + 17 cross entries to `FUSIONS` (amps stay before all cross entries — WILD resolution depends on it). *Accept: the orphan-audit snippet (below) reports 0 orphans; `hybridFor('landmine','sticky') === 'doomsday'`; `hybridFor('blink','fireball') === 'cometdash'`; `hybridFor('sawblade','anvil') === 'rockslide'` (dual-listing doesn't break existing amps).*
- **B2 · TINKER hybrids** — implement spells 1, 3–10 of §2b in hybrids.js.
- **B3 · SWIFT hybrids** — implement spells 2, 11–19 of §2b.
- **B4 · LAN pass for B2/B3.** Verify every new hybrid is fully visible on a client tab (host + client on localhost): summons appear (ghost path), persistent zones render (they ride `fxLite` via `makeZone`'s `net` descriptor), one-shots broadcast. Fix any label without a client draw. *Accept: cast each of the 19 on a host with one connected client; nothing is invisible client-side.*
- **B5 · Storybook art for contraptions** (artkit.js + both render paths). `drawStory*` adapters so the launcher crate, mines, jack-box, and medic bot read as storybook objects, not plain rects — wire into game.js `drawDynamicBody` *and* the snapshot ghost path. Follow the existing drawStory* style. *(Depends on B2/B3 landing.)*

### Track C — Ascensions (after B1; C1 before C2)

- **C1 · Ascension mechanic.** `ASCENSIONS` table, `grabCatalyst` hook (check both slots), ceremony beat (§2c), `ascended` tier entries in spelltiers.js, gold slot styling hook. *Accept: console-arm `slots=[‘inferno’,null]`, grab a catalyst → Ragnarök with gold ceremony; catalyst on a non-amp hybrid still runs the old wild/fizzle path.*
- **C2 · The 11 ascended spells** per §2c table (hybrids.js or a new `ascensions.js` script-tagged after hybrids.js). Same LAN-visibility contract as B4. *Accept: each castable, dramatic, client-visible, and telemetry-counted (`telPick`/`telCast` fire).*

### Track D — Discoverability & spectacle

- **D1 · Fusion hints on tomes.** In `drawTomes`, when any living wizard within ~140px holds a spell that `hybridFor`-matches the tome's spell, add a hybrid-pink shimmer ring + the would-be hybrid's name in small text under the tome. Host-side draw only is fine for couch; for LAN, include a `fuseHint` flag in the tome's snapshot ghost. *Accept: holding fireball near an ice tome shows "Steam Burst" shimmer; no hint when nothing matches.*
- **D2 · Grimoire recipe page.** A discovered-recipes screen (lobby key, e.g. G): 10×10 school grid, discovered hybrids shown, undiscovered as "???"; persist discovered ids in `localStorage`. Record discovery in `tryFuse`/ascension. *Accept: fuse once, reopen page → recipe revealed; survives reload.*
- **D3 · HUD slot styling.** Hybrid spells already exist in slots — give them the hybrid-pink ring, ascended gold ring in the HUD slot chips (host drawHUD + client HUD in net.js — both copies until E3 lands).

### Track E — Code health

- **E1 · Spell helpers.** `forEachEnemyInRange(p, r, fn)` and `freezePlayer(q, ms)` (sets `frozenUntil` + `frictionAir=0.001` in one place) in spells.js; sweep hybrids.js/spellbook.js call sites (~30 hypot-radius loops, ~12 freeze duos). Behavior-preserving. *Accept: grep finds no remaining `frictionAir = 0.001` outside the helper; game plays identically.*
- **E2 · Dedupe wizard status overlays.** Extract the shared frozen/floaty/shield/hurt overlay drawing used by player.js `drawWizard` and snapshot.js `drawGhostWizard` into one artkit-style function.
- **E3 · Dedupe host/client HUD** (net.js:412-511 vs game.js). Bigger; do after D3. Optional this pass.
- **E4 · Dead code.** Remove `core.js:drawBody`; drop legacy `sp`/`rd` snapshot fields (bump `GAME_VERSION` — version gate makes this safe).

### Track F — Balance & telemetry

- **F1 · Fusion funnel telemetry.** Count per round: fusions, catalyst fizzles ("NO FUSION"), ascensions — add to the round record in `flushRoundTelemetry`; extend `scripts/balance-report.js` to rank hybrids/ascended separately from tome spells (their pick counts mean "times fused," not "times drawn"). *Accept: a bot round with a forced fusion shows `fusions:1` in rounds.jsonl; report renders a Hybrids section.*
- **F2 · Post-playtest tuning pass.** After a team session, run balance-report over rounds.jsonl and tune outlier hybrids (win-correlation + damage-per-pick). Human-in-the-loop; not dispatchable yet.

---

## 4. Verification (per the house rule: implement → test → drive it end-to-end)

1. **Console-driven fusion harness** (fast to check any recipe without tome luck):
   ```js
   const p = players[0];
   clearSpells(p); addSpell(p,'landmine'); addSpell(p,'sticky'); // → auto-fuse: Doomsday Device
   ```
2. **Orphan audit** (should print 0 after B1): the node snippet that parses `F_*` arrays from hybrids.js and diffs against all `regSpell` ids — keep it as `scripts/fusion-audit.js` (an agent should check it in as part of B1).
3. **Real drive**: `node server/serve.js`, open two tabs (host + client), add bots (B key), play a boss round and a fusion-heavy round; confirm client sees every new effect, kill feed credits correctly, and the round record lands in `server/telemetry/rounds.jsonl`.
4. `scripts/balance-report.js` runs clean over the new jsonl fields.
