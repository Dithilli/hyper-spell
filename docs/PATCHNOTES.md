# HYPERSPELL — Patch Notes

## v3 · July 3, 2026 — "The Boss Update"

### ⚔️ Boss Battles
- Every **25th round**, the arena goes quiet and a boss awakens. Fight it **together**.
- Four classics, picked at random: **THE DRAGON** (swooping fireball fans, meteor volleys), **THE LICH** (teleports, snipes a random wizard, raises skeletons), **THE GOLEM** (stalks you on foot, leap-slams with an explosive shockwave), **THE KRAKEN** (lurks below, erupts tentacles under your feet — watch for the warning bubbles).
- Boss HP scales with the head count. **Slay it** → the match continues, scores intact. **Party wipe** → everyone's round wins reset to ZERO. Start over.
- Yes, friendly fire is still on during boss rounds. Choose your meteors wisely.

### 🌪️ Environmental Events
- **10 rare round modifiers**, announced right after FIGHT! — now at a **15% chance** per round:
  **OVERGROWTH** (destructible vines slow you — shoot them), **WINTER** (everything is ice), **TEMPEST** (crosswinds + lightning), **METEOR SHOWER**, **MOONSHOT** (45% gravity), **NIGHTFALL** (only wizards, spells, and tomes cast light), **EARTHQUAKE**, **RUBBER WORLD** (bouncy everything), **CRITTER PLAGUE**, **ARCANE SURGE** (it's raining tomes).

### 🎥 Killcam
- Every round now ends with a **slow-mo replay of the final kill**, letterboxed like it deserves. Draws replay too — mutual destruction is cinema.

### 🩸 Combat changes
- **Fall damage!** Long drops (roughly 1.5× a double-jump's height) hurt on landing, up to 40. Balloon and low-gravity landings are safe. Double jumps are always safe.
- **Gravity Flip reworked:** the world flips for everyone EXCEPT the caster, who keeps their footing and watches.

### 🖥️ Interface
- **Spell recharge bar** under every spell name. All spells have infinite uses — the bar shows when your next cast is ready (Mega Hat casts show as ★ gold stars).
- **Win target up to 20**: digits 1–9 as before, then +/− in the lobby to fine-tune. Above 9 the score shows as "wins / target".

### 🗺️ Maps
- **Destructible props everywhere:** every map now scatters crate stacks, barrels, and duck-behind walls. Knock them around, hide behind them, blow them up.
- **Ziggurat no longer yeets P1 and P2 straight into lava on spawn** (real spawn points), and a safety net now relocates ANY spawn that hangs over a straight drop — on all 104 maps.
- With **6+ wizards**, cramped maps (Box Pit, The Cauldron, Islet Duel…) are skipped; spawn points grew from 4 to 8 so big lobbies don't spawn in a pile; tome drops scale with player count.

### 🤖 Bots
- Press **B** in the lobby to add an AI wizard (BOTLIN, CLANKY, SPARKY…). Not smart. Very committed.

### 🌐 Online
- **Fixed: joining a hosted game did nothing.** (The lobby handshake deadlocked — remote play works now.)
- **Fixed: "it's raining on my screen but not hers"** — a tab left open across updates kept running old code. The game now version-checks every client: stale tabs get a full-screen REFRESH prompt and the host gets a warning banner.
- Plays over Tailscale — see the README for setup.
