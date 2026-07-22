# HYPERSPELL — Patch Notes

## v8 · July 21, 2026 — "The Smooth Update"

### 🚀 Remote play feels like local again
- Faster wire, tighter interp: snapshots **20→30Hz**, client inputs **30→60Hz**, client interpolation delay **60ms → ~42ms adaptive** — about **40–45ms less input-to-screen latency** for every remote player.
- Snapshot and input cadence are now **time-based** instead of every-Nth-frame — a struggling machine no longer silently starves the connection (a 40fps client used to drop to 20Hz inputs; a slow host starved everyone to 13Hz snapshots).
- Draw path benchmarked while investigating (~6.6ms/frame full draw on the heavy maps — comfortably inside budget); the grass crust no longer allocates a gradient per tuft.

### 🟢 Gas Vents you can actually see
- The Goo Swamp vent columns only existed as host-side particles — remote players got shoved skyward by pure poltergeist. Vents now have **mossy glowing nozzles and a rising gas shimmer on every screen** (host, clients, killcam), and the eruption puffs broadcast over LAN like every other effect.

### ⚗️ Four flat hybrids got an identity
- **Superconductor** (ICE+ZAP): the beam's freeze now **crystallizes an ice pillar at the impact point** — instant cover, a wall to trap a wizard against, or a rude slippery platform. (2 charges now, was 3.)
- **Firestorm** (FIRE+AIR): no more "three orange bolts" — casts a **living fire tornado** that sweeps the arena, lifting wizards and loose junk and setting whoever it swallows alight.
- **Molten Meteor** (FIRE+EARTH): the impact now bursts into **molten shards that arc away and pop where they land** — a near-miss still turns the ground into a firework.
- **Frost Ward** (ICE+LIFE): a true ward — heal, the nearby freeze, and now a **mirror of ice that reflects incoming spells** back at the sender for ~2s.

## v7 · July 9, 2026 — "The Proving Grounds"

### ⚡ Fusion charges — hybrids burn bright, then burn out
- Fusion hybrids are no longer limitless: they carry **1–3 charges scaled to their power** (Big Crunch gets one apocalyptic shot; Steam Burst gets three), and every hybrid cast is **boosted** — ×1.5 / ×1.35 / ×1.2 for 1- / 2- / 3-charge hybrids. The HUD shows charges left; spending the last one snuffs the fusion with a "FUSION SPENT" beat. A charged fusion is **protected from tome grabs** — new spells route to your other hand until the fusion burns out.

### 🛡 BLOCK — the parry
- A third action button: **S** / **↓** / **middle mouse** / gamepad **LB·LT**. Throws up a quarter-second shield that **negates damage and reflects projectiles back at the sender**, then needs ~1.4s to recharge. Time it — a whiffed parry is an opening. Bots and Alinea know how to use it too.

### ❤️ Beefier wizards
- Max HP raised **100 → 150** so rounds run long enough to grab tomes, land a fusion, and actually see the rare spells before someone dies. Hat still flies off below half.

### 🗺 No more uncrossable expanses
- Every map is scanned after it builds: any void too wide to clear with a running double-jump gets **stepping platforms** planted mid-gap (sometimes with cover on top). More obstacles, less falling to your death.

### 🎨 Storybook materials & ambient life
- Destructible cover is no longer a colored block with cracks — every kind has real material art: **knotted bark and billowing leaf canopies** on trees, **translucent ice with frozen-in glints**, **mossy chiselled masonry**, **planked crates with nail heads**, **speckled mushroom flesh**, and **volcanic glass whose cracks glow hotter** as it nears breaking. LAN clients finally see damage states too (they were drawing cover as plain terrain).
- The world breathes: leaves drift from canopies, ice sheds snow and twinkles, obsidian bleeds embers, dust falls from old stone — and the **first hit on an untouched tree startles a few birds out of it**.
- **Biome landmarks**: most arenas now grow one big set-piece matched to their world — **glacier spires** on the frost maps, **obsidian fangs** in the lava works, **giant bouncy-capped mushrooms** in the swamp, **ruined stone arches** you can fight on top of, and **leaning void crystals** under the stars. All destructible, all part of the fight.

### 🌳 Cover that eventually explodes
- Every map now guarantees **themed destructible cover** — trees in the woods and swamp, stone pillars in the ruins, **ice blocks** on the frost maps, crates in Box Land. Duck behind it, chip it down, and mind the finish: breaking cover now goes off with a **small blast** (ice flash-freezes whoever's standing close).
- LAN fix: scattered cover is now **seeded**, so remote players finally see the exact same props the host does.

### 🤖 Bots got humbled
- Bots aim like people now: wobblier at range and against fast movers, and **much** wobblier with instant beams (Zap, Lightning, Railgun…) — no more zap snipers. They also fire beams on a measured cadence, hesitate at fast targets, and occasionally **parry your projectiles**.

### 📖 Spell Guide
- New **📖 Spell Guide** button on the game page — the whole spell system explained (slots, tiers, fusion recipes with the full matrix, synergies, every spell), generated live from the game's own spellbook so it can't go stale.

### ⚖️ The must-land pass
- **Fusion ultimates never hurt their caster.** Your own Inferno/Big Crunch/Rockslide still flings you around (physics is physics) but deals you zero damage — spending a precious charge should never be a self-own. Normal spells keep the classic 50% self-damage risk (rocket-jumps stay a gamble).
- New rule enforced across the spellbook: **offensive magic has to actually hit you** — nothing auto-lands at unlimited range anymore.
  - **Balloon Hex, Anchor Hex, Cold Snap** are now real bolts: dodge them or parry them back.
  - **Sky Smite** telegraphs its strike point for half a second before the bolt falls.
  - **Booby Trap** is finally a trap: an armed charge with a visible fuse at the target's feet.
  - Hybrid riders (**Superconductor's** freeze, **Plasma Lance's** burn, **Joy Buzzer's** reverse, **Firestorm/Molten Meteor/Steam Burst's** statuses) now apply to the wizard your beam or bolt *actually hit* — not to whoever happened to be nearest. **Thunderstorm** lost its auto knock-up entirely.
  - **Inferno's** burn is capped to the blast's reach instead of the whole map.
- **Feather Fall** (and **Zephyr's** self-glide) no longer hurl the caster skyward — floaty's 1.5× balloon lift was being reused as a self-buff; they now use a gentle slow-fall that also forgives fall damage.

### 🐛 Fixes
- Setting your name on the opening screen no longer leaves a live name-editor running in the lobby (stray keys were appending letters until you hit Enter).


## v4 · July 9, 2026 — "The Fusion Update"

### 🎴 Two spell slots
- Carry **two spells at once** and cast each independently — **Slot A** = E / Left-click / gamepad X·RT, **Slot B** = Q / Right-click / gamepad B·RB (arrow player: Enter + R-Shift). Pick up a new tome and it fills an empty slot, or replaces your oldest.

### ⚗️ Fusion & hybrids
- Hold two spells from the right **elemental schools** (Fire, Ice, Lightning, Air, Earth, Void, Life, Trickster) and they **fuse into a bespoke hybrid** — **36 one-of-a-kind fusions** covering every school pairing, each with its own signature look. Fire + Ice = **Steam Burst**, two Lightning = **Overload**, Void + Air = **Event Horizon**, two Tricksters = **Pandemonium**, and 32 more.
- **Fusion Catalyst** — a rare spinning magenta pickup that fuses with whatever you're holding (a wildcard), turning a lone spell into its school's amped form.

### ✨ Elemental synergies
- **SHATTER** — a solid hit on a **frozen** wizard cracks the ice for bonus damage.
- **CONDUCT** — **Wet** wizards (just-thawed, or standing on ice/snow) take amplified lightning that **arcs** to a neighbor.

### 🎲 Rarity tiers
- Spells now drop by **rarity** (common → legendary): the strong ones are rarer, and finding a **★ LEGENDARY ★** is a jackpot. Rare+ tomes glow.

### 🐉 Boss scaling
- Bosses now scale each time they appear (**THE LICH III** hits harder and tankier than the first) and **ENRAGE** if you stall too long — sooner for later bosses.

### 📖 End-of-match report
- The victory screen now shows a **Spellbook Report**: the match's deadliest spells by kills and damage.

## v3 · July 3, 2026 — "The Boss Update"

### ⚔️ Boss Battles
- Every **10th round**, the arena goes quiet and a boss awakens. Fight it **together**.
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
