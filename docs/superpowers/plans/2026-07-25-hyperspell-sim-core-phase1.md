# HYPERSPELL Sim Core — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn HYPERSPELL's simulation into a deterministic, fixed-tick, module-structured core with a physics facade — without changing a single piece of content.

**Architecture:** The 24 classic-script files in `js/` become ES modules under `src/`, split into `sim/` (deterministic, no DOM/wall-clock/`Math.random`), `render/` (canvas only), `net/` and `platform/`. A fixed 60 Hz accumulator replaces the variable timestep; an integer tick becomes the only clock, exposed as `simNow()` so content keeps writing `now + 1500`. All Matter calls route through a facade so phase 2 can swap in planck.js. esbuild emits an IIFE bundle so `file://` couch play survives.

**Tech Stack:** Node 24 (`node --test`, zero test deps), esbuild (IIFE bundle), matter-js 0.19.0 (single pinned root dependency), `ws` (unchanged), vanilla canvas.

**Spec:** `docs/superpowers/specs/2026-07-25-hyperspell-sim-design.md`

## Global Constraints

- **Content is frozen.** No spell, map, boss, enemy, event, tier, recipe or declared number changes. `js/spellbook.js`, `js/hybrids.js`, `js/spelltiers.js`, `js/mapbook.js` move files but their contents change only where this plan names an exact line.
- **Node is not on bare PATH on this box.** Every node/npm command runs as `mise exec -- node …` / `mise exec -- npm …`.
- Node in production is `node:22-alpine` (`Dockerfile:12`). Use no API newer than Node 22.
- `file://` double-click play must keep working: the browser loads **one IIFE bundle**, never `type="module"`.
- Tick rate `TICK_HZ = 60`, `TICK_MS = 1000/60`, `MAX_CATCHUP = 5` steps.
- Preserved constants, exact values: `W = 1280`, `H = 720`, `MAX_PLAYERS = 8`, `MAX_HP = 150`, `CAST_FLOOR = 480`, `BASE_PACE = 0.85`, `FALL_SAFE_DROP = 440`, `GAP_MAX = 190`, `GAP_STEP = 165`, `BOSS_EVERY = 10`, `WAVE_ENEMY_CAP = 20`, `ENV_EVENT_CHANCE = 0.20`, `BLOCK_MS = 240`, `BLOCK_CD = 1400`, `TIER_WEIGHT = { common: 100, uncommon: 45, rare: 12, legendary: 4, hybrid: 0 }`.
- Wire behaviour is unchanged in phase 1: snapshots 30 Hz, inputs 60 Hz, stale guard 2000 ms, interpolation delay 36–90 ms adaptive. `GAME_VERSION` stays `9` until a task changes the wire format; no task in this plan does.
- `server/sim-smoke.js` and `server/verify-e2e.js` must pass at the end of every task.
- `server/*.js` stays CommonJS (`server/package.json` has no `"type"`, so it wins for that directory). New `src/` and `test/` code is ESM via a root `package.json` with `"type": "module"`.
- Commit after every task. Branch is `refactor/sim-core`.

## Tape discipline

Every task declares one of two contracts:

- **REFACTOR** — the golden tape must replay to byte-identical hashes. If it does not, the task is wrong.
- **BEHAVIOUR** — the task intentionally changes simulation output. The tape is re-recorded in the task's final steps, and the commit message states what changed and why.

---

## File Structure

`js/*.js` (24 files, 9,832 lines) maps to `src/` as follows. Files marked *(content)* move verbatim except where a task names an exact line.

| Current | Becomes | Responsibility |
|---|---|---|
| `js/core.js` | `src/sim/world.js`, `src/sim/rng.js`, `src/render/canvas.js`, `src/version.js` | world/engine; seeded RNG; canvas+ctx; GAME_VERSION |
| `js/artkit.js` | `src/render/artkit.js` | storybook draw primitives (pure) |
| `js/audio.js` | `src/render/audio.js` | `sfx` |
| `js/fx.js` | `src/render/fx.js`, `src/sim/pace.js` | particles/shake/flash; pace + hitstop scaling |
| `js/awards.js` | `src/sim/awards.js` | match stats |
| `js/telemetry.js` | `src/sim/telemetry.js` | balance tallies |
| `js/input.js` | `src/sim/input-contract.js`, `src/platform/input-keyboard.js`, `src/platform/input-gamepad.js` | `IDLE_INPUT`; keyboard+mouse; gamepad |
| `js/spells.js` | `src/sim/spells/core.js`, `src/sim/spells/registry.js` | projectile/explosion/zone/cast primitives; `SPELLS` |
| `js/spellbook.js` | `src/sim/spells/book.js` *(content)* | 100 spells |
| `js/spelltiers.js` | `src/sim/spells/tiers.js` *(content)* | rarity |
| `js/hybrids.js` | `src/sim/spells/fusion.js` *(content)* | 36 hybrids + recipes |
| `js/player.js` | `src/sim/player/lifecycle.js`, `src/sim/player/controller.js`, `src/sim/player/combat.js`, `src/sim/player/status.js`, `src/sim/player/ghost.js`, `src/render/draw-wizard.js` | spawn/despawn; movement; damage/death; statuses; ghosts; wizard art |
| `js/pickups.js` | `src/sim/pickups.js`, `src/render/draw-pickups.js` | tomes/hats/catalyst; their art |
| `js/maps.js` | `src/sim/maps/builders.js`, `src/sim/maps/extras.js` | `addStatic`/destructibles/hazards; seeded extras |
| `js/mapbook.js` | `src/sim/maps/book.js` *(content)* | 114 maps |
| `js/events.js` | `src/sim/events.js`, `src/render/draw-env.js` | env events; weather art |
| `js/boss.js` | `src/sim/ai/boss.js`, `src/render/draw-boss.js` | boss AI; boss art |
| `js/enemies.js` | `src/sim/ai/enemies.js`, `src/sim/waves.js` | enemy AI; wave manager |
| `js/bot.js` | `src/sim/ai/bot.js` | bot controller |
| `js/snapshot.js` | `src/net/snapshot.js`, `src/render/draw-snapshot.js` | serialize; render ghosts |
| `js/game.js` | `src/sim/tick.js`, `src/sim/match.js`, `src/sim/collision.js`, `src/render/draw-world.js`, `src/render/hud.js`, `src/platform/join.js` | step loop; round/match state; contacts; world draw; HUD; join/lobby input |
| `js/replay.js` | `src/sim/replay.js` | killcam |
| `js/net.js` | `src/net/client.js`, `src/platform/menu.js` | online client; mode menu |
| `server/sim-bridge.js` | `src/net/server-bridge.js` | server command surface |
| `server/sim-context.js`, `server/shims.js` | **deleted** (Task 2) | replaced by `src/platform/node.js` |

New files with no current equivalent:

| File | Responsibility |
|---|---|
| `src/sim/time.js` | tick counter, `simNow()`, `ticks(ms)` |
| `src/sim/schedule.js` | tick-scheduled callbacks |
| `src/sim/gravity.js` | gravity modifier stack |
| `src/sim/emit.js` | sim → outside cosmetic event queue |
| `src/sim/phys/facade.js` | the physics contract |
| `src/sim/phys/matter-backend.js` | Matter implementation |
| `src/platform/browser.js` | browser entry |
| `src/platform/node.js` | headless entry |
| `test/harness/*` | tape harness |

---

## Task 1: Deterministic tape harness and golden baseline

**Contract:** infrastructure only. No `js/` behaviour changes.

**Files:**
- Create: `package.json`, `test/harness/clock.js`, `test/harness/seeded-random.js`, `test/harness/hash.js`, `test/harness/tape.js`, `test/tape/one-round.input.json`, `test/tape/one-round.golden.json`, `test/golden-tape.test.js`, `.gitignore` entries
- Modify: `server/shims.js` (add `randomSeed` option)

**Interfaces:**
- Produces: `makeClock(startMs) → { now(): number, advance(ms): void }`; `seededRandom(seed) → () => number`; `hashState(bridge, tick) → string`; `runTape({ input, ticks, seed }) → string[]` (one hash per tick)
- Consumes: `createSimContext` from `server/sim-context.js` (CJS)

Why this is first: the current sim has no reproducibility, so there is no oracle for any refactor. This task manufactures one. The tape is deliberately **600 ticks inside a single round** — the existing round flow uses bare `setTimeout` (`js/game.js:92,134`), which cannot be made deterministic until Task 6, so the baseline avoids crossing a round boundary. Task 6 extends it.

- [ ] **Step 1: Create the root `package.json`**

`server/package.json` has no `"type"` field, so it keeps `server/*.js` as CommonJS. The root file makes `src/` and `test/` ESM.

```json
{
  "name": "hyperspell",
  "version": "9.0.0",
  "private": true,
  "type": "module",
  "description": "HYPERSPELL — wizards, physics, violence",
  "scripts": {
    "build": "esbuild src/platform/browser.js --bundle --format=iife --outfile=dist/hyperspell.js --target=es2022",
    "build:guide": "esbuild src/platform/spell-guide.js --bundle --format=iife --outfile=dist/spell-guide.js --target=es2022",
    "test": "node --test test/",
    "tape:record": "node test/harness/record.js"
  },
  "dependencies": {
    "matter-js": "0.19.0"
  },
  "devDependencies": {
    "esbuild": "^0.25.0"
  }
}
```

- [ ] **Step 2: Install and confirm the toolchain**

Run: `mise exec -- npm install`
Expected: `matter-js@0.19.0` and `esbuild` in `node_modules`; no audit failures that block.

Then add to `.gitignore` (it currently contains only `node_modules`, verify with `cat .gitignore`):

```
node_modules
dist/*.map
```

`dist/hyperspell.js` is **committed** — it is what `file://` play loads.

- [ ] **Step 3: Write the fake clock and seeded random**

`test/harness/clock.js`:

```js
// A fake `performance` for the sim sandbox: time only moves when we say so.
export function makeClock(startMs = 0) {
  let t = startMs;
  return {
    now: () => t,
    advance: (ms) => { t += ms; },
  };
}
```

`test/harness/seeded-random.js`:

```js
// mulberry32 — same algorithm as js/core.js makeRng, so seeded sim runs and
// seeded test runs agree.
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

- [ ] **Step 4: Teach the sandbox to accept a seeded `Math.random`**

`server/shims.js` already accepts `{ clock }`. Add `randomSeed` so the vm context's `Math.random` becomes reproducible. In `buildSandbox`, change the signature and return value:

```js
function buildSandbox({ clock, random } = {}) {
```

and at the end of `buildSandbox`, before `return`, add:

```js
  // tests inject a seeded generator so a run is reproducible; production passes
  // nothing and the context keeps its own Math.random
  if (random) sandbox.__seededRandom = random;
```

In `server/sim-context.js`, after the existing `vm.runInContext('globalThis.window = globalThis; …')` line, add:

```js
  // install the seeded generator before any game file loads, so every
  // Math.random() call in the sim is reproducible under test
  if (opts.random) vm.runInContext('Math.random = globalThis.__seededRandom;', ctx);
```

and thread the option through: `const { sandbox, ctxCounter, flushTimers } = buildSandbox({ clock: opts.clock, random: opts.random });`

- [ ] **Step 5: Write the state hash**

`test/harness/hash.js`:

```js
import { createHash } from 'node:crypto';

// A canonical, order-stable digest of everything the sim owns that a refactor
// must not change. Numbers are rounded to 6 decimals so that formatting noise
// (e.g. -0 vs 0) does not produce false failures, while real drift still does.
const r6 = (n) => (Number.isFinite(n) ? Math.round(n * 1e6) / 1e6 : String(n));

export function hashSnapshot(snap) {
  const canonical = {
    st: snap.st,
    mi: snap.mi,
    rn: snap.rn,
    wr: snap.wr,
    ps: snap.ps.map((p) => [p.s, r6(p.x), r6(p.y), r6(p.vx), r6(p.vy), p.hp, p.al, r6(p.sc), p.s0 ?? null, p.s1 ?? null, p.w ?? 0]),
    bodies: snap.bodies
      .map((b) => [b.l, r6(b.x), r6(b.y), r6(b.a)])
      .sort((a, b) => (a[0] === b[0] ? a[1] - b[1] || a[2] - b[2] : a[0] < b[0] ? -1 : 1)),
  };
  return createHash('sha1').update(JSON.stringify(canonical)).digest('hex').slice(0, 16);
}
```

Body order is sorted because `projectiles`/`summons` are `Set`s whose iteration order can legitimately differ after a refactor without the simulation differing.

- [ ] **Step 6: Write the tape runner**

`test/harness/tape.js`:

```js
import { createRequire } from 'node:module';
import { makeClock } from './clock.js';
import { seededRandom } from './seeded-random.js';
import { hashSnapshot } from './hash.js';

const require = createRequire(import.meta.url);
const { createSimContext } = require('../../server/sim-context.js');

const TICK_MS = 1000 / 60;

// input tape format: { players: [{ name }], frames: [ { "0": {m,j,c,c2,b,a}, ... } ] }
// A frame index beyond the tape's length repeats the last frame.
export function runTape({ tape, ticks, seed = 12345 }) {
  const clock = makeClock(0);
  const sim = createSimContext({ clock, random: seededRandom(seed) });
  const b = sim.bridge;

  const slots = tape.players.map((p) => b.addPlayer({ name: p.name }));
  b.start();

  const hashes = [];
  for (let i = 0; i < ticks; i++) {
    const frame = tape.frames[Math.min(i, tape.frames.length - 1)];
    for (const slot of slots) {
      const msg = frame?.[String(slot)];
      if (msg) b.setInput(slot, msg);
    }
    b.stepSim(clock.now(), TICK_MS);
    clock.advance(TICK_MS);
    hashes.push(hashSnapshot(b.takeWireSnapshot(clock.now())));
  }
  sim.destroy();
  return hashes;
}
```

`b.stepSim(now, rawDt)` is called with a constant `TICK_MS` deliberately: the harness holds the timestep fixed from day one so the baseline is not polluted by frame jitter. Task 3 makes the *game* do the same.

- [ ] **Step 7: Author the input tape**

`test/tape/one-round.input.json` — two wizards, one moving and casting, one jumping and parrying. Slot 0 is `"0"`, slot 1 is `"1"`.

```json
{
  "players": [{ "name": "TAPEA" }, { "name": "TAPEB" }],
  "frames": [
    { "0": { "m": 1, "j": 0, "c": 0, "c2": 0, "b": 0, "a": 0 }, "1": { "m": -1, "j": 0, "c": 0, "c2": 0, "b": 0, "a": 3.14159 } },
    { "0": { "m": 1, "j": 1, "c": 1, "c2": 0, "b": 0, "a": 0.2 }, "1": { "m": -1, "j": 1, "c": 0, "c2": 0, "b": 1, "a": 3.0 } },
    { "0": { "m": 0, "j": 0, "c": 1, "c2": 1, "b": 0, "a": -0.4 }, "1": { "m": 1, "j": 0, "c": 1, "c2": 0, "b": 0, "a": 2.6 } },
    { "0": { "m": -1, "j": 1, "c": 0, "c2": 0, "b": 1, "a": 0.9 }, "1": { "m": 0, "j": 1, "c": 1, "c2": 1, "b": 0, "a": 3.4 } }
  ]
}
```

- [ ] **Step 8: Write the recorder and record the baseline**

`test/harness/record.js`:

```js
import { readFileSync, writeFileSync } from 'node:fs';
import { runTape } from './tape.js';

const tape = JSON.parse(readFileSync('test/tape/one-round.input.json', 'utf8'));
const hashes = runTape({ tape, ticks: 600, seed: 12345 });
writeFileSync('test/tape/one-round.golden.json', JSON.stringify({ ticks: 600, seed: 12345, hashes }, null, 0) + '\n');
console.log(`recorded ${hashes.length} tick hashes; last = ${hashes.at(-1)}`);
```

Run: `mise exec -- npm run tape:record`
Expected: prints `recorded 600 tick hashes; last = <hex>`.

Then run it a **second** time and confirm the file is unchanged:

Run: `mise exec -- npm run tape:record && git diff --stat test/tape/one-round.golden.json`
Expected: no diff. If the file changes between runs, the sim still has an unseeded nondeterminism source the harness is not covering — investigate before continuing (likely `Date`, or a `Math.random` reached before the seed install in Step 4).

- [ ] **Step 9: Write the regression test**

`test/golden-tape.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runTape } from './harness/tape.js';

const tape = JSON.parse(readFileSync('test/tape/one-round.input.json', 'utf8'));
const golden = JSON.parse(readFileSync('test/tape/one-round.golden.json', 'utf8'));

test('the golden tape replays to identical per-tick hashes', () => {
  const hashes = runTape({ tape, ticks: golden.ticks, seed: golden.seed });
  assert.equal(hashes.length, golden.hashes.length);
  const firstDivergence = hashes.findIndex((h, i) => h !== golden.hashes[i]);
  assert.equal(firstDivergence, -1, `diverged at tick ${firstDivergence}`);
});

test('the same seed twice produces the same run', () => {
  const a = runTape({ tape, ticks: 120, seed: 999 });
  const b = runTape({ tape, ticks: 120, seed: 999 });
  assert.deepEqual(a, b);
});
```

Run: `mise exec -- node --test test/`
Expected: 2 passing tests.

- [ ] **Step 10: Confirm the existing rigs still pass**

Run: `cd server && mise exec -- node sim-smoke.js`
Expected: all `ok` lines, zero `FAIL`.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json .gitignore test/ server/shims.js server/sim-context.js
git commit -m "test: deterministic tape harness + golden baseline

Manufactures the oracle every later refactor is checked against: a fake
clock, a seeded Math.random inside the vm context, and a per-tick state
hash over players and bodies.

The tape is 600 ticks inside one round on purpose — round flow still runs
on bare setTimeout, so it cannot be deterministic until schedule.at lands.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: ES modules, esbuild bundle, and the sim/render/net split

**Contract:** **REFACTOR.** The golden tape must replay identically. This is the largest task in the plan and the tape is the only thing making it safe — do not proceed if Task 1's test is not green.

**Files:**
- Create: all of `src/` per the File Structure table; `src/platform/browser.js`; `src/platform/node.js`; `src/platform/spell-guide.js`; `test/module-boundaries.test.js`
- Modify: `index.html`, `controller-test.html`, `shot.html`, `smoke-test.html`, `wave-play.html`, `wave-test.html`, `spell-guide.html`, `server/serve.js`, `server/sim-smoke.js`, `server/verify-e2e.js`, `test/harness/tape.js`
- Delete: `js/` (all 24 files), `server/sim-context.js`, `server/shims.js`, `server/sim-bridge.js` (moves to `src/net/server-bridge.js`)

**Interfaces:**
- Produces: `src/platform/node.js` exports `createSim({ onFx, onSnapshot, telemetrySink, onPackUnlocked, clock, random }) → { bridge, destroy() }` — the same `bridge` shape `server/room.js` already drives (`stepSim`, `takeWireSnapshot`, `addPlayer`, `removePlayer`, `setInput`, `renamePlayer`, `setOffline`, `start`, `setWins`, `toggleMode`, `addBot`, `removeBot`, `reset`, `chat`, `worldInfo`, `state`, `round`, `packStaged`, `spellCount`, `packSource`, `playerCount`, `minPlayers`, `audit`).
- Produces: `src/platform/browser.js` — side-effecting entry; starts the rAF loop, mounts the menu.

- [ ] **Step 1: Move files verbatim, one module at a time, leaves first**

Convert in dependency order so each conversion compiles before the next. Order: `version.js` → `render/canvas.js` → `sim/rng.js` → `sim/world.js` → `render/artkit.js` → `render/audio.js` → `render/fx.js` + `sim/pace.js` → `sim/awards.js` → `sim/telemetry.js` → `sim/input-contract.js` → `sim/spells/*` → `sim/player/*` → `sim/pickups.js` → `sim/maps/*` → `sim/events.js` → `sim/ai/*` → `sim/waves.js` → `net/snapshot.js` → `sim/collision.js` → `sim/match.js` → `sim/tick.js` → `sim/replay.js` → `render/*` → `net/*` → `platform/*`.

For each file: add `export` to every symbol another module reads, and `import` for every symbol it reads from elsewhere. Get the exact cross-file symbol list with:

```bash
mise exec -- node -e "
const fs=require('fs');
const files=fs.readdirSync('js').filter(f=>f.endsWith('.js')&&!f.includes('pack'));
const decl=new Map();
for(const f of files){
  const s=fs.readFileSync('js/'+f,'utf8');
  for(const m of s.matchAll(/^(?:const|let|var|function|class)\s+([A-Za-z_\$][\w\$]*)/gm)) decl.set(m[1],f);
}
for(const f of files){
  const s=fs.readFileSync('js/'+f,'utf8');
  const needs=new Set();
  for(const [name,owner] of decl) if(owner!==f && new RegExp('\\\\b'+name+'\\\\b').test(s)) needs.add(owner+':'+name);
  console.log('--',f); console.log([...needs].sort().join(' '));
}"
```

That prints, per file, exactly which symbols it must import and from where. Work the list mechanically.

- [ ] **Step 2: Move load-time side effects into explicit `init()` calls**

Classic scripts ran side effects at load in an order `index.html` guaranteed. ESM import order is driven by the dependency graph, so these five must become explicit:

| Current side effect | New home |
|---|---|
| `js/core.js:8-13` grabs `#game`, creates `ctx`, `Engine.create()` | `src/render/canvas.js` `initCanvas(el)`; `src/sim/world.js` `createWorld()` |
| `js/game.js:2` `new KeyboardController(KEYMAPS[0], true)` at module top | `src/platform/browser.js`, after `initCanvas` |
| `js/input.js:3-9,21-40` `addEventListener` for keys/mouse | `src/platform/input-keyboard.js` `attachKeyboard(canvas)` |
| `js/game.js:220,280` two `addEventListener('keydown')` blocks | `src/platform/join.js` `attachLobbyKeys()` |
| `js/game.js:1541-1542` `loadMap(0); requestAnimationFrame(frame)` | `src/platform/browser.js` at the end |
| `js/net.js:6-125` IIFE that builds the menu DOM | `src/platform/menu.js` `mountMenu()` |

`src/sim/*` must contain **zero** `addEventListener`, `document`, `canvas`, `localStorage` or `navigator` references after this step. The two current `localStorage` reads inside sim logic (`js/enemies.js:279,287`, wave best score) move behind an injected `storage` port on the sim context — defaulting to an in-memory object headless, which is what `server/shims.js:55` fakes today. Fixing that it never persists online is **C7, Task 12** — for now preserve today's behaviour exactly (headless reads return null).

- [ ] **Step 3: Write the browser entry**

`src/platform/browser.js`:

```js
import { initCanvas } from '../render/canvas.js';
import { createWorld } from '../sim/world.js';
import { attachKeyboard } from './input-keyboard.js';
import { attachLobbyKeys } from './join.js';
import { mountMenu } from './menu.js';
import { loadMap } from '../sim/match.js';
import { stepSim } from '../sim/tick.js';
import { draw } from '../render/draw-world.js';
import { netClientFrame, netMode } from '../net/client.js';

const canvas = document.getElementById('game');
initCanvas(canvas);
createWorld();
attachKeyboard(canvas);
attachLobbyKeys();
mountMenu();

loadMap(0);

let last = performance.now();
function frame(now) {
  if (netMode() === 'online') {
    netClientFrame(now);
    requestAnimationFrame(frame);
    return;
  }
  const rawDt = Math.min(now - last, 33);
  last = now;
  stepSim(now, rawDt);
  draw(now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

This preserves `js/game.js:1526-1539` exactly, including the 33 ms clamp. Task 3 replaces the loop body; this task must not.

- [ ] **Step 4: Write the headless entry**

`src/platform/node.js` replaces `server/sim-context.js` + `server/shims.js`. No `vm`, no fake canvas, no fake `document` — `src/sim/*` no longer references any of them.

```js
import { createWorld, destroyWorld } from '../sim/world.js';
import { setClock, setRandom } from '../sim/env.js';
import { installServerBridge } from '../net/server-bridge.js';
import { clearAllScheduled } from '../sim/schedule.js';

// opts: { onFx(name,args), telemetrySink(rec), onPackUnlocked(src), clock, random, storage }
export function createSim(opts = {}) {
  setClock(opts.clock ?? performance);
  setRandom(opts.random ?? Math.random);
  createWorld();
  const bridge = installServerBridge(opts);
  return {
    bridge,
    destroy() { clearAllScheduled(); destroyWorld(); },
  };
}
```

`src/sim/env.js` is a two-value module (`clock`, `random`) so the sim never reaches for globals. Task 5 replaces `setRandom` with the seeded stream registry; Task 4 replaces `setClock` consumers with `simNow()`.

- [ ] **Step 5: Point `server/serve.js` and the harnesses at the ESM entry**

`server/serve.js` stays CommonJS; it loads the ESM sim with a dynamic import. Replace its `require('./sim-host')` usage so `SimHost` receives a factory. In `server/sim-host.js`, replace the top-level `require('./sim-context')` with an injected factory and make `buildContext` async-safe:

```js
// sim-host.js — top
let createSim = null;
async function loadSimFactory() {
  if (!createSim) ({ createSim } = await import('../src/platform/node.js'));
  return createSim;
}
```

`SimHost.start()` becomes `async start()` and awaits `loadSimFactory()` before its first tick. `server/serve.js` awaits `host.start()`.

Update `server/sim-smoke.js` and `server/verify-e2e.js` the same way: `const { createSim } = await import('../src/platform/node.js');` inside an async main.

Update `test/harness/tape.js` to drop `createRequire` and use `import { createSim } from '../../src/platform/node.js'`, replacing `createSimContext({clock, random})` with `createSim({clock, random})`.

- [ ] **Step 6: Build the bundle and repoint the HTML pages**

Run: `mise exec -- npm run build`
Expected: `dist/hyperspell.js` written, no errors.

`index.html` — replace the 25 script tags (`index.html:27-51`) with:

```html
<script src="dist/hyperspell.js"></script>
```

Do the same in `controller-test.html`, `shot.html`, `smoke-test.html`, `wave-play.html`, `wave-test.html`. Note these five currently omit `js/net.js`; the bundle includes it, and `src/net/client.js` already self-disables on `file://` (`js/net.js:7`) and only mounts the menu when `mountMenu()` is called — so leave `mountMenu()` out of a `?nomenu` path if a page regresses. Verify each page loads with no console errors.

`spell-guide.html` needs spell data only. Create `src/platform/spell-guide.js`:

```js
import { SPELLS } from '../sim/spells/registry.js';
import '../sim/spells/book.js';
import '../sim/spells/fusion.js';
import { SPELL_TIERS, TIER_COLOR, TIER_RANK, spellTier } from '../sim/spells/tiers.js';

globalThis.SPELLS = SPELLS;
globalThis.SPELL_TIERS = SPELL_TIERS;
globalThis.TIER_COLOR = TIER_COLOR;
globalThis.TIER_RANK = TIER_RANK;
globalThis.spellTier = spellTier;
```

Run: `mise exec -- npm run build:guide`, then replace the four script tags in `spell-guide.html` with `<script src="dist/spell-guide.js"></script>`.

- [ ] **Step 7: Enforce the module boundary with a test**

`test/module-boundaries.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.js')) out.push(p);
  }
  return out;
}

test('src/sim never imports render, net, or platform', () => {
  const offenders = [];
  for (const file of walk('src/sim')) {
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      if (/(^|\/)(render|net|platform)\//.test(m[1])) offenders.push(`${file} → ${m[1]}`);
    }
  }
  assert.deepEqual(offenders, [], `sim must not depend on outer layers:\n${offenders.join('\n')}`);
});

test('src/sim touches no browser or wall-clock globals', () => {
  const banned = /\b(document|window|localStorage|navigator|requestAnimationFrame)\b|performance\.now\(/;
  const offenders = [];
  for (const file of walk('src/sim')) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (banned.test(line) && !line.trimStart().startsWith('//')) offenders.push(`${file}:${i + 1}  ${line.trim()}`);
    });
  }
  assert.deepEqual(offenders, [], `sim must be platform-free:\n${offenders.join('\n')}`);
});
```

The second test **will fail** at this point on `performance.now(` (128 sites). That is intended and it is the debt ledger. Mark it `test.skip` with the exact comment `// unskipped by Task 4 (simNow)` and unskip it there. Do not weaken the assertion.

- [ ] **Step 8: Replay the golden tape**

Run: `mise exec -- node --test test/`
Expected: `golden-tape` tests PASS with zero divergence; `module-boundaries` first test PASS, second SKIP.

If the tape diverges, the conversion changed behaviour. Bisect by tick: the test prints the first diverging tick. Common causes, in order of likelihood: (a) a module-init side effect now runs in a different order than `index.html` guaranteed, (b) a `Set` iteration order changed because a body is added at a different point, (c) an accidental `const` → `let` rebinding across modules.

- [ ] **Step 9: Confirm the server rigs**

Run: `cd server && mise exec -- node sim-smoke.js`
Expected: all `ok`, zero `FAIL`, and the ctx-tripwire assertion still reports 0 — it now trivially holds, because there is no fake canvas at all.

Run: `cd server && mise exec -- node verify-e2e.js`
Expected: the v9 suite passes.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "refactor: ES modules, esbuild IIFE bundle, sim/render/net split

Mechanical conversion of 24 classic scripts into src/, split by
responsibility: sim (deterministic), render (canvas), net, platform.
game.js's 1543 lines become tick/match/collision/draw-world/hud/join.

The vm sandbox and shims.js are deleted — the headless entry imports the
sim directly and injects a clock, because sim/ no longer references any
browser global.

Browsers load one IIFE bundle, so file:// double-click play still works.
Golden tape replays bit-identically; sim-smoke and verify-e2e green.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Fixed-timestep accumulator

**Contract:** **BEHAVIOUR.** Closes A1, A7, A8, and the framerate half of A2.

**Files:**
- Create: `src/sim/tick-loop.js`, `test/fixed-timestep.test.js`
- Modify: `src/platform/browser.js`, `src/platform/node.js`, `server/sim-host.js`, `src/sim/pace.js`, `src/net/client.js`

**Interfaces:**
- Produces: `createTickLoop({ step }) → { pump(realDtMs) → { steps: number, alpha: number, dropped: number } }`; `TICK_MS`, `TICK_HZ`, `MAX_CATCHUP` from `src/sim/time.js`
- Consumes: `stepSim(tick)` from `src/sim/tick.js`

- [ ] **Step 1: Write the failing test**

`test/fixed-timestep.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTickLoop } from '../src/sim/tick-loop.js';
import { TICK_MS, MAX_CATCHUP } from '../src/sim/time.js';

test('a 16.7ms frame runs exactly one step', () => {
  let steps = 0;
  const loop = createTickLoop({ step: () => steps++ });
  loop.pump(TICK_MS);
  assert.equal(steps, 1);
});

test('a slow 100ms frame catches up with several fixed steps, never one big one', () => {
  const deltas = [];
  const loop = createTickLoop({ step: (dt) => deltas.push(dt) });
  loop.pump(100);
  assert.equal(deltas.length, 6);
  assert.ok(deltas.every((d) => d === TICK_MS), 'every step is exactly TICK_MS');
});

test('catch-up is capped and the shortfall is reported, not silently dropped', () => {
  const loop = createTickLoop({ step: () => {} });
  const r = loop.pump(1000);
  assert.equal(r.steps, MAX_CATCHUP);
  assert.ok(r.dropped > 0, 'dropped time is reported');
});

test('total steps over one simulated second is framerate independent', () => {
  const run = (fps) => {
    let steps = 0;
    const loop = createTickLoop({ step: () => steps++ });
    const dt = 1000 / fps;
    for (let i = 0; i < fps; i++) loop.pump(dt);
    return steps;
  };
  assert.equal(run(60), 60);
  assert.equal(run(144), 60);
  assert.equal(run(30), 60);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `mise exec -- node --test test/fixed-timestep.test.js`
Expected: FAIL — `Cannot find module '../src/sim/tick-loop.js'`.

- [ ] **Step 3: Write `src/sim/time.js`**

```js
export const TICK_HZ = 60;
export const TICK_MS = 1000 / TICK_HZ;
export const MAX_CATCHUP = 5;

let tick = 0;
export const currentTick = () => tick;
export const advanceTick = () => ++tick;
export const resetTick = (t = 0) => { tick = t; };

// The sim's only clock. Content keeps writing `now + 1500`; this makes that
// deterministic, tick-quantised, and correctly slowed by hitstop.
export const simNow = () => tick * TICK_MS;

// authoring helper: durations stay in milliseconds in content
export const ticks = (ms) => Math.round(ms / TICK_MS);
```

- [ ] **Step 4: Convert `pace.js` from a dt multiplier to a tick-rate scale**

This comes before the loop, because the loop imports `paceScale` and Task 2 left
`src/sim/pace.js` exporting `timeScale`/`updateTimeScale` (from `js/fx.js:5-16`).
Keep the exact easing and `BASE_PACE = 0.85`:

```js
import { simNow } from './time.js';

export const BASE_PACE = 0.85;
let scale = BASE_PACE;
let slowUntil = 0;

export const paceScale = () => scale;

export function slowMo(s, ms) {
  scale = s;
  slowUntil = simNow() + ms;
}

export function updatePace() {
  if (simNow() > slowUntil) scale += (BASE_PACE - scale) * 0.08;
}
```

`updatePace()` is called once per tick at the top of `stepSim`, replacing
`updateTimeScale(now)` (`js/game.js:1478`). Delete the `const dt = rawDt * timeScale`
line (`js/game.js:1479`) — `dt` is now always `TICK_MS`.

- [ ] **Step 5: Write `src/sim/tick-loop.js`**

```js
import { TICK_MS, MAX_CATCHUP } from './time.js';
import { paceScale } from './pace.js';

export function createTickLoop({ step }) {
  let accumulator = 0;
  return {
    pump(realDtMs) {
      // slow-mo and hitstop live HERE — they change how fast ticks are
      // consumed, never the size of a step
      accumulator += Math.min(realDtMs, 250) * paceScale();
      let steps = 0;
      while (accumulator >= TICK_MS && steps < MAX_CATCHUP) {
        step(TICK_MS);
        accumulator -= TICK_MS;
        steps++;
      }
      let dropped = 0;
      if (accumulator >= TICK_MS) {
        dropped = accumulator;
        accumulator = 0; // shed the backlog, but report it
      }
      return { steps, alpha: accumulator / TICK_MS, dropped };
    },
  };
}
```

- [ ] **Step 6: Run the test to confirm it passes**

Run: `mise exec -- node --test test/fixed-timestep.test.js`
Expected: 4 PASS.

- [ ] **Step 7: Wire both platforms to the loop**

`stepSim` still has its Task 2 signature `stepSim(now, rawDt)` — Task 4 changes
it. Pass sim time and the fixed step:

`src/platform/browser.js` — replace the loop body:

```js
const loop = createTickLoop({ step: () => { stepSim(simNow(), TICK_MS); advanceTick(); } });
let last = performance.now();
function frame(now) {
  if (netMode() === 'online') { netClientFrame(now); requestAnimationFrame(frame); return; }
  const { alpha } = loop.pump(now - last);
  last = now;
  draw(now, alpha);
  requestAnimationFrame(frame);
}
```

`server/sim-host.js` — replace the `rawDt` computation (`sim-host.js:35-42`) with the same `loop.pump(now - this.last)`, and log dropped time instead of swallowing it:

```js
const { dropped } = this.loop.pump(now - this.last);
this.last = now;
if (dropped > 0) {
  this.droppedMs += dropped;
  if (now - this.lastDropLog > 10000) {
    this.lastDropLog = now;
    console.warn(`sim behind: dropped ${Math.round(this.droppedMs)}ms of catch-up in 10s`);
    this.droppedMs = 0;
  }
}
```

- [ ] **Step 8: Fix the client's framerate-dependent particles (A8)**

`src/net/client.js` calls `updateParticles(1)` once per rAF (`js/net.js:339`), so particles move 2.4× faster at 144 Hz. Give the client the same accumulator, stepping particles at a fixed rate:

```js
const fxLoop = createTickLoop({ step: () => updateParticles(1) });
// in netClientFrame:
fxLoop.pump(now - lastFxAt);
lastFxAt = now;
```

- [ ] **Step 9: Re-record the tape and confirm the change is only what you expect**

The harness already drove a fixed `TICK_MS`, so `stepSim`'s per-step behaviour should be unchanged — but `pace.js` now scales tick consumption instead of `dt`, and the tape's first ticks run at `BASE_PACE`. Re-record:

Run: `mise exec -- npm run tape:record && mise exec -- node --test test/`
Expected: all green. Inspect `git diff test/tape/one-round.golden.json` and confirm hashes changed from some tick onward (they will, because slow-mo no longer shrinks `dt`).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: fixed 60Hz timestep with capped, reported catch-up

Engine.update now always receives exactly TICK_MS. Slow-mo and hitstop
scale how fast ticks are consumed, never the size of a step, so the
solver stops running 5ms steps during spectacle.

A 144Hz display and the 60Hz server now advance the simulation at the
same rate. The server reports dropped catch-up time instead of silently
running slow. Client particles get the same fixed cadence.

Closes A1, A7, A8, and the framerate half of A2.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: `simNow()` — one clock

**Contract:** **BEHAVIOUR.** Closes A4, A9, C5. Unskips the purity test from Task 2 Step 7.

**Files:**
- Create: `test/sim-time.test.js`
- Modify: every file under `src/sim/` that reads `performance.now()` (128 sites), `test/module-boundaries.test.js`

**Interfaces:**
- Consumes: `simNow`, `ticks` from `src/sim/time.js`
- Produces: no new API — this is a mechanical substitution that changes the *meaning* of `now` inside the sim from wall time to sim time.

- [ ] **Step 1: Write the failing test**

`test/sim-time.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSim } from '../src/platform/node.js';
import { makeClock } from './harness/clock.js';
import { seededRandom } from './harness/seeded-random.js';
import { TICK_MS } from '../src/sim/time.js';

// A freeze declared as 1500ms must last 1500ms of GAME time, even when the
// pace drops to 0.3 for hitstop. Under the old two-clock model it expired in
// roughly a third of that.
test('status durations are unaffected by hitstop', async () => {
  const { bridge, destroy } = createSim({ clock: makeClock(0), random: seededRandom(7) });
  const slot = bridge.addPlayer({ name: 'A' });
  bridge.addPlayer({ name: 'B' });
  bridge.start();

  // stepSim() takes no arguments after Step 5 of this task
  const frozenTicksAtPace = (pace) => {
    bridge.debugFreeze(slot, 1500);
    bridge.debugSetPace(pace);
    let n = 0;
    while (bridge.debugIsFrozen(slot) && n < 400) { bridge.stepSim(); n++; }
    return n;
  };

  const atFullPace = frozenTicksAtPace(1);
  const atHitstop = frozenTicksAtPace(0.3);
  assert.equal(atFullPace, atHitstop, 'freeze lasts the same number of ticks at any pace');
  assert.ok(Math.abs(atFullPace - 90) <= 1, `1500ms is ~90 ticks, got ${atFullPace}`);
  destroy();
});
```

`debugFreeze`, `debugSetPace` and `debugIsFrozen` are three test-only bridge methods added in Step 4 — they are the minimum surface needed to assert this without reaching into sim internals from the test.

- [ ] **Step 2: Run it to confirm it fails**

Run: `mise exec -- node --test test/sim-time.test.js`
Expected: FAIL — `bridge.debugFreeze is not a function`.

- [ ] **Step 3: Substitute the clock across `src/sim/`**

List the sites:

```bash
grep -rn "performance\.now()" src/sim/ | tee /tmp/clocksites.txt | wc -l
```

Replace each with `simNow()` and add `import { simNow } from '../time.js';` (adjust depth). Do it file by file, running `mise exec -- npm run build` after each to catch a missed import.

Three call sites are **not** mechanical and need judgement:

| Site | Handling |
|---|---|
| `src/sim/replay.js` (`js/replay.js:18,29,33,37,47,53`) | The killcam's own timeline is sim time too. Substitute; Task 6 replaces the tape-of-positions with a tape-of-inputs. |
| `src/sim/telemetry.js` | Records use `Date.now()` for wall-clock stamps on log lines — that is not simulation state. Leave `Date.now()`, and add `// wall clock: log stamp, not sim state` above it. |
| `src/render/*`, `src/net/*`, `src/platform/*` | **Do not touch.** Render and net legitimately use wall time for interpolation and animation. |

- [ ] **Step 4: Add the three debug bridge methods**

In `src/net/server-bridge.js`, inside the exported bridge object, add a clearly fenced block:

```js
  // --- test-only surface. Not reachable from the wire protocol; room.js never
  // calls these. Kept here so tests can assert sim behaviour without importing
  // sim internals directly.
  debugFreeze: (slot, ms) => {
    const p = players.find((q) => q.slot === slot);
    if (p) p.frozenUntil = simNow() + ms;
  },
  debugIsFrozen: (slot) => {
    const p = players.find((q) => q.slot === slot);
    return !!p && simNow() < (p.frozenUntil || 0);
  },
  debugSetPace: (s) => slowMo(s, 1e9),
```

- [ ] **Step 5: Change `stepSim`'s signature to take a tick**

`stepSim(now, rawDt)` becomes `stepSim()` — it reads `simNow()` and always steps `TICK_MS`. Update `src/sim/tick.js`, `src/platform/browser.js`, `server/sim-host.js`, `src/net/server-bridge.js` (`stepSim` passthrough), `test/harness/tape.js`, `server/sim-smoke.js`.

In `src/sim/tick.js` the physics step becomes:

```js
  updatePace();
  // Every existing update call stays exactly as Task 2 left it, in the same
  // order (js/game.js:1481-1518): poll inputs, lobby/victory checks, FIGHT!
  // banner, updatePlayers, updateGhosts, updateTomes, updateEffects, map
  // update, updateEnvEvent, updateBoss, updateEnemies, updateWaveMode,
  // spinners/phantoms, lobbed-projectile gravity. They now read simNow()
  // internally rather than taking `now`.
  physStep(TICK_MS);
```

- [ ] **Step 6: Run the test to confirm it passes**

Run: `mise exec -- node --test test/sim-time.test.js`
Expected: 1 PASS.

- [ ] **Step 7: Unskip the purity test**

In `test/module-boundaries.test.js`, remove the `.skip` and the `// unskipped by Task 4` comment from the second test.

Run: `mise exec -- node --test test/module-boundaries.test.js`
Expected: 2 PASS. If it still reports `performance.now(` sites, they are real misses — fix them, do not weaken the regex.

- [ ] **Step 8: Re-record the tape and commit**

Run: `mise exec -- npm run tape:record && mise exec -- node --test test/ && cd server && mise exec -- node sim-smoke.js`
Expected: all green.

```bash
git add -A
git commit -m "feat: simNow() is the sim's only clock

128 wall-clock reads inside sim/ become simNow() = tick x TICK_MS. Every
content-declared duration ('frozenUntil = now + 1500') reads exactly as
written but is now deterministic, tick-quantised, and correctly slowed by
hitstop — a 1500ms freeze lasts 1500ms of game time instead of ~450ms
during a slow-mo beat.

Content numbers are untouched. Render and net keep wall time, which is
correct for interpolation and animation.

Closes A4, A9, C5. Unskips the sim-purity boundary test.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Seeded RNG in the simulation

**Contract:** **BEHAVIOUR.** Closes A6.

**Files:**
- Create: `test/determinism.test.js`
- Modify: `src/sim/rng.js`, every `src/sim/` file calling `Math.random()` (49 sites), `src/sim/maps/builders.js:318`, `test/module-boundaries.test.js`, `src/platform/node.js`

**Interfaces:**
- Produces: `simRandom() → number`, `simRange(a, b) → number`, `simPick(arr) → item`, `reseed(seed)`, `makeRng(seed)` from `src/sim/rng.js`

- [ ] **Step 1: Write the failing test**

`test/determinism.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runTape } from './harness/tape.js';

const tape = JSON.parse(readFileSync('test/tape/one-round.input.json', 'utf8'));

test('sim/ contains no direct Math.random calls', () => {
  // enforced by test/module-boundaries.test.js; this asserts the consequence
  const a = runTape({ tape, ticks: 300, seed: 4242 });
  const b = runTape({ tape, ticks: 300, seed: 4242 });
  assert.deepEqual(a, b, 'same seed must produce an identical run');
});

test('different seeds produce different runs', () => {
  const a = runTape({ tape, ticks: 300, seed: 1 });
  const b = runTape({ tape, ticks: 300, seed: 2 });
  assert.notDeepEqual(a, b, 'the seed must actually influence the sim');
});
```

- [ ] **Step 2: Run it — the first test passes only because the harness patches `Math.random` globally**

Run: `mise exec -- node --test test/determinism.test.js`
Expected: both PASS, because Task 1's harness still monkey-patches the sandbox. That patch is what this task removes: after Step 5, `src/platform/node.js` no longer accepts `random`, and determinism comes from the sim owning its streams.

- [ ] **Step 3: Write `src/sim/rng.js`**

```js
// mulberry32 — the same generator js/core.js used for seeded map extras, now
// the sim's only source of randomness.
export function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let next = makeRng(1);

export function reseed(seed) { next = makeRng(seed); }
export const simRandom = () => next();
export const simRange = (a, b) => a + next() * (b - a);
export const simPick = (arr) => arr[Math.floor(next() * arr.length)];
```

- [ ] **Step 4: Substitute the 49 sites**

List them:

```bash
grep -rn "Math\.random()" src/sim/ | tee /tmp/randsites.txt | wc -l
```

Substitutions, mechanical: `Math.random()` → `simRandom()`; `rand(a, b)` (defined in `js/core.js:19`) → `simRange(a, b)`; `pick(arr)` (`js/core.js:20`) → `simPick(arr)`. Keep `rand`/`pick` as re-exported aliases of `simRange`/`simPick` so the ~200 content call sites in `book.js`, `fusion.js` and `book.js` (maps) do not change:

```js
export const rand = simRange;
export const pick = simPick;
```

Two sites need attention:

| Site | Handling |
|---|---|
| `src/sim/maps/builders.js:318` `addMover` phase uses `rand(0, 6.28)` | It is inside `def.build`, not `buildMapExtras`, so it is unseeded per-round. Route it through `simRandom` like the rest; the mover's position rides the snapshot so clients are unaffected either way, but the sim becomes replayable. |
| `src/render/**` | **Leave alone.** Cosmetic randomness in draw code is legal and desirable; `test/module-boundaries.test.js` only guards `src/sim`. |

- [ ] **Step 5: Seed per round and drop the sandbox patch**

In `src/sim/match.js` `startRound`, the map seed is already generated (`js/game.js:46`). Reuse it for the round's RNG so a round is reproducible from its seed:

```js
  game.mapSeed = (simRandom() * 0xffffffff) >>> 0;
  m.data.seed = game.mapSeed;
  reseed(game.mapSeed ^ 0x9e3779b9); // round stream, derived but distinct
```

Remove the `random` option from `src/platform/node.js` and `createSim`; replace the harness's `random: seededRandom(seed)` with `reseed(seed)` before the first tick. Update `test/harness/tape.js` accordingly.

- [ ] **Step 6: Add the boundary guard**

Append to `test/module-boundaries.test.js`:

```js
test('src/sim uses the seeded RNG, never Math.random', () => {
  const offenders = [];
  for (const file of walk('src/sim')) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (/Math\.random\s*\(/.test(line) && !line.trimStart().startsWith('//')) {
        offenders.push(`${file}:${i + 1}  ${line.trim()}`);
      }
    });
  }
  assert.deepEqual(offenders, [], `use simRandom():\n${offenders.join('\n')}`);
});
```

- [ ] **Step 7: Run everything, re-record, commit**

Run: `mise exec -- node --test test/ && mise exec -- npm run tape:record && cd server && mise exec -- node sim-smoke.js`
Expected: all green.

```bash
git add -A
git commit -m "feat: the simulation owns its randomness

49 Math.random() calls in sim/ become a seeded mulberry32 stream, reseeded
per round from the map seed. rand()/pick() stay as aliases so ~200 content
call sites are untouched.

A round is now reproducible from its seed, which is what makes replay,
rollback and A/B engine parity possible. Render keeps Math.random for
cosmetics.

Closes A6.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Tick-scheduled match flow and input-tape replay

**Contract:** **BEHAVIOUR.** Closes A5, D7. Extends the golden tape across round boundaries.

**Files:**
- Create: `src/sim/schedule.js`, `test/schedule.test.js`, `test/tape/three-rounds.input.json`, `test/tape/three-rounds.golden.json`
- Modify: `src/sim/match.js`, `src/sim/ai/boss.js`, `src/sim/player/lifecycle.js`, `src/sim/replay.js`, `src/sim/tick.js`, `test/golden-tape.test.js`, `test/harness/record.js`

**Interfaces:**
- Produces: `scheduleAt(tick, fn, tag?) → id`, `scheduleIn(ms, fn, tag?) → id`, `cancel(id)`, `cancelTag(tag)`, `drainScheduled(tick)`, `clearAllScheduled()`, `pendingCount()`

- [ ] **Step 1: Write the failing test**

`test/schedule.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scheduleIn, scheduleAt, cancelTag, drainScheduled, clearAllScheduled, pendingCount } from '../src/sim/schedule.js';
import { resetTick, advanceTick, currentTick, ticks } from '../src/sim/time.js';

test('a callback fires on the tick it was scheduled for', () => {
  clearAllScheduled(); resetTick(0);
  let fired = -1;
  scheduleIn(650, () => { fired = currentTick(); });
  for (let i = 0; i < 60; i++) { drainScheduled(currentTick()); advanceTick(); }
  assert.equal(fired, ticks(650));
});

test('callbacks fire in tick order, then insertion order', () => {
  clearAllScheduled(); resetTick(0);
  const order = [];
  scheduleAt(3, () => order.push('b'));
  scheduleAt(2, () => order.push('a'));
  scheduleAt(3, () => order.push('c'));
  for (let i = 0; i <= 4; i++) { drainScheduled(currentTick()); advanceTick(); }
  assert.deepEqual(order, ['a', 'b', 'c']);
});

test('cancelTag drops every pending callback with that tag', () => {
  clearAllScheduled(); resetTick(0);
  let fired = 0;
  scheduleIn(100, () => fired++, 'round');
  scheduleIn(200, () => fired++, 'round');
  scheduleIn(300, () => fired++, 'other');
  cancelTag('round');
  assert.equal(pendingCount(), 1);
  for (let i = 0; i < 30; i++) { drainScheduled(currentTick()); advanceTick(); }
  assert.equal(fired, 1);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `mise exec -- node --test test/schedule.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/sim/schedule.js`**

```js
import { currentTick, ticks } from './time.js';

let seq = 0;
let entries = []; // { at, id, fn, tag }

export function scheduleAt(at, fn, tag = null) {
  const id = ++seq;
  entries.push({ at, id, fn, tag });
  return id;
}

export const scheduleIn = (ms, fn, tag = null) => scheduleAt(currentTick() + ticks(ms), fn, tag);

export function cancel(id) { entries = entries.filter((e) => e.id !== id); }
export function cancelTag(tag) { entries = entries.filter((e) => e.tag !== tag); }
export function clearAllScheduled() { entries = []; }
export const pendingCount = () => entries.length;

export function drainScheduled(tick) {
  if (!entries.length) return;
  // tick order, then insertion order — deterministic regardless of array churn
  const due = entries.filter((e) => e.at <= tick).sort((a, b) => a.at - b.at || a.id - b.id);
  if (!due.length) return;
  const dueIds = new Set(due.map((e) => e.id));
  entries = entries.filter((e) => !dueIds.has(e.id));
  for (const e of due) e.fn();
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `mise exec -- node --test test/schedule.test.js`
Expected: 3 PASS.

- [ ] **Step 5: Replace all five `setTimeout` call sites**

Call `drainScheduled(currentTick())` as the **first** statement in `stepSim` (`src/sim/tick.js`).

| Current | Replacement |
|---|---|
| `js/game.js:86-89` lobby respawn after 1200 ms | `scheduleIn(1200, () => { if (game.state === 'LOBBY' && !p.alive) spawnPlayer(p, spawnPointFor(p)); }, 'lobby-respawn')` |
| `js/game.js:92` `setTimeout(checkRoundEnd, 650)` | `scheduleIn(650, checkRoundEnd, 'round')` |
| `js/game.js:115-117` boss-wipe next round | `scheduleIn(1900 + replayMs, () => { if (game.state === 'ROUND_END') startRound(nextMapIndex()); }, 'round')` |
| `js/game.js:134-138` round-end resolution | `scheduleIn(1900 + replayMs, () => { … }, 'round')` |
| `js/boss.js:385-387` slain-boss next round | `scheduleIn(1900 + replayMs, () => { if (game.state === 'ROUND_END') startRound(nextMapIndex()); }, 'round')` |

In `startRound` and `resetMatch`, add `cancelTag('round')` as the first statement. This makes the existing `if (game.state === 'ROUND_END')` guards belt-and-braces rather than the only defence, and removes the class of bug where two simultaneous deaths queue two resolutions.

- [ ] **Step 6: Convert the killcam to an input tape (D7)**

`src/sim/replay.js` currently ring-buffers serialized snapshots every 3rd frame (`js/replay.js:15-20`). Replace the buffer contents with `{ tick, inputs }` per tick plus one keyframe snapshot at the buffer's head, and reconstruct playback by re-simulating from the keyframe. The public API is unchanged — `replayRecord()`, `startReplay()`, `replayFrameAt()`, `clearReplay()` keep their signatures, so `src/net/server-bridge.js:71-79` and `src/render/draw-world.js` need no edits.

Keep `REPLAY.BUF_MS = 3400`, `TAIL_MS = 2200`, `SPEED = 0.45`, `LEAD_MS = 500`, `HOLD_MS = 400`, `MIN_MS = 600` exactly.

- [ ] **Step 7: Extend the tape across three rounds**

Write the generator, `test/harness/make-long-tape.js` — 2,400 frames, long enough
for the round-end scheduler, the killcam and `startRound` to run three times.
Both wizards hold cast most of the time so somebody actually dies:

```js
import { writeFileSync } from 'node:fs';

const frames = [];
for (let i = 0; i < 2400; i++) {
  const phase = i % 24;
  frames.push({
    // slot 0 pushes right, jumps every 24 frames, casts both slots in bursts
    '0': {
      m: phase < 12 ? 1 : -1,
      j: phase === 0 ? 1 : 0,
      c: phase % 6 < 3 ? 1 : 0,
      c2: phase % 12 < 2 ? 1 : 0,
      b: phase === 18 ? 1 : 0,
      a: (phase / 24) * Math.PI - Math.PI / 2,
    },
    // slot 1 mirrors it, offset, so the two actually meet
    '1': {
      m: phase < 12 ? -1 : 1,
      j: phase === 12 ? 1 : 0,
      c: phase % 6 < 3 ? 1 : 0,
      c2: 0,
      b: phase === 6 ? 1 : 0,
      a: Math.PI - (phase / 24) * Math.PI,
    },
  });
}
writeFileSync('test/tape/three-rounds.input.json', JSON.stringify({ players: [{ name: 'TAPEA' }, { name: 'TAPEB' }], frames }));
console.log('wrote 2400 frames');
```

Add to `test/golden-tape.test.js`:

```js
const long = JSON.parse(readFileSync('test/tape/three-rounds.input.json', 'utf8'));
const longGolden = JSON.parse(readFileSync('test/tape/three-rounds.golden.json', 'utf8'));

test('a three-round tape replays identically across round boundaries', () => {
  const hashes = runTape({ tape: long, ticks: longGolden.ticks, seed: longGolden.seed });
  const d = hashes.findIndex((h, i) => h !== longGolden.hashes[i]);
  assert.equal(d, -1, `diverged at tick ${d}`);
});

test('the long tape really does cross round boundaries', () => {
  // Guards against a tape that silently never leaves round 1 — which would
  // make the test above pass while proving nothing about round flow.
  // runTape returns per-tick hashes; runTapeWithRounds also reports the round
  // counter, so this asserts the tape exercises what it claims to.
  const { rounds } = runTapeWithRounds({ tape: long, ticks: longGolden.ticks, seed: longGolden.seed });
  assert.ok(rounds >= 3, `expected at least 3 rounds, saw ${rounds}`);
});
```

Add the reporting variant to `test/harness/tape.js`, sharing the same body as
`runTape`:

```js
export function runTapeWithRounds(opts) {
  let maxRound = 0;
  const hashes = runTape({ ...opts, onTick: (bridge) => { maxRound = Math.max(maxRound, bridge.round()); } });
  return { hashes, rounds: maxRound };
}
```

and give `runTape` an optional `onTick(bridge)` hook, called after each
`stepSim()`.

Extend `test/harness/record.js` to record both tapes.

Run: `mise exec -- npm run tape:record && mise exec -- node --test test/`
Expected: all green, and the three-round tape reproducible across two consecutive recordings (`git diff` clean on the second).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: tick-scheduled match flow; killcam replays inputs

Five bare setTimeouts driving round flow, boss resolution and lobby
respawns become scheduleIn(ms, fn, tag), drained in tick order at the top
of stepSim. Round transitions are now deterministic, pausable and
replayable, and cancelTag('round') makes simultaneous deaths incapable of
queueing two resolutions.

The killcam records an input tape plus a keyframe instead of a tape of
positions, so a replay is a re-simulation. Its public API and every timing
constant are unchanged.

Golden tape extended to three full rounds.

Closes A5, D7.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Per-frame forces become per-second

**Contract:** **BEHAVIOUR.** Closes A2 (fully), A3, A10.

**Files:**
- Create: `test/frame-rate-independence.test.js`
- Modify: `src/sim/player/controller.js`, `src/sim/maps/builders.js`, `src/sim/maps/book.js`, `src/sim/events.js`, `src/sim/spells/core.js`, `src/sim/spells/book.js`, `src/sim/spells/fusion.js`

**Interfaces:**
- Produces: `perSecond(v) → number` from `src/sim/time.js` — converts a legacy per-frame constant into the equivalent per-tick value, so the *observable* motion is preserved while the units become honest.

At 60 Hz the conversion is the identity (`TICK_MS/16.666… = 1`), which is deliberate: this task fixes the **units and the drift**, not the tuning. A 60 Hz player sees no change; a 144 Hz player stops being 2.4× stronger.

- [ ] **Step 1: Write the failing test**

`test/frame-rate-independence.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTickLoop } from '../src/sim/tick-loop.js';
import { createSim } from '../src/platform/node.js';
import { reseed } from '../src/sim/rng.js';

// Drive one simulated second of held-right input at three display rates. The
// wizard must end up in the same place: the loop already guarantees 60 steps,
// so this catches any force still applied per *frame* rather than per step.
function runOneSecond(fps) {
  reseed(31337);
  const { bridge, destroy } = createSim({});
  const slot = bridge.addPlayer({ name: 'A' });
  bridge.addPlayer({ name: 'B' });
  bridge.start();
  const loop = createTickLoop({ step: () => bridge.stepSim() });
  bridge.setInput(slot, { m: 1, j: 0, c: 0, c2: 0, b: 0, a: 0 });
  const dt = 1000 / fps;
  for (let i = 0; i < fps; i++) loop.pump(dt);
  const me = bridge.takeWireSnapshot().ps.find((p) => p.s === slot);
  destroy();
  return { x: me.x, vx: me.vx };
}

test('held movement covers the same ground at 30, 60 and 144 fps', () => {
  const a = runOneSecond(60);
  const b = runOneSecond(144);
  const c = runOneSecond(30);
  assert.ok(Math.abs(a.x - b.x) <= 1, `60fps x=${a.x} vs 144fps x=${b.x}`);
  assert.ok(Math.abs(a.x - c.x) <= 1, `60fps x=${a.x} vs 30fps x=${c.x}`);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `mise exec -- node --test test/frame-rate-independence.test.js`
Expected: PASS or FAIL depending on residual drift — record the actual numbers in the commit message. Task 3 already fixed the *step count*; what remains is any force whose magnitude was tuned against a frame rather than a step. Enumerate them:

```bash
grep -rnE "velocity\.(x|y) *[+-] " src/sim/ | grep -v "simNow" | tee /tmp/perframe.txt | wc -l
```

- [ ] **Step 3: Add `perSecond` and document the convention**

Append to `src/sim/time.js`:

```js
// Legacy tuning constants were authored against a 60Hz frame. This converts
// them to per-tick values so the same number keeps producing the same motion
// while the unit becomes explicit. At TICK_HZ = 60 this is the identity.
const LEGACY_FRAME_MS = 1000 / 60;
export const perSecond = (perFrameValue) => perFrameValue * (TICK_MS / LEGACY_FRAME_MS);
```

- [ ] **Step 4: Convert the movement blend**

`src/sim/player/controller.js` (from `js/player.js:538-539`):

```js
      const blend = onGround ? (icy ? perSecond(0.09) : currentMap.def.muddy ? perSecond(0.12) : perSecond(0.25)) : perSecond(0.08);
```

- [ ] **Step 5: Convert every environmental force**

Each of these multiplies its magnitude by `perSecond(...)`. The values stay exactly as written; only the unit changes.

| File | Sites |
|---|---|
| `src/sim/maps/builders.js` | `applyWind` (`js/maps.js:364`), `keepPendulumsSwinging` (`:304`) |
| `src/sim/maps/book.js` | Updraft Canyon `-0.9`, Conveyor/Assembly/Gauntlet belts `0.25`, The Core `0.35`, Eye of the Storm `0.3`, Event Horizon `0.25`, The Maw `0.3`, Gas Vents `-1.4` |
| `src/sim/events.js` | quake `rand(-1.6, 1.6)` / `rand(0, 1.2)` (`js/events.js:111`) |
| `src/sim/spells/core.js` | `spawnSingularity` pull `0.9` and tangent `0.35` (`js/spells.js:227`) |
| `src/sim/spells/book.js` | `tornado` `-0.9` / `-1.5` (`js/spellbook.js:440`) |
| `src/sim/spells/fusion.js` | `firestorm` `-0.8` / `-1.6` (`js/hybrids.js:218`) |

- [ ] **Step 6: Give effect `update()` handlers their `dt` (A10)**

`updateEffects(now, dt)` passes `dt` to 14 handlers, **zero** of which use it (`js/spells.js:447`). Now that `dt` is always `TICK_MS`, drop the parameter entirely rather than leaving a lie in the signature: `updateEffects()` and `e.update?.()`. Handlers that need per-second scaling use `perSecond` at their constant, which is clearer at the call site than a threaded `dt`.

Two map `update(m, now, dt)` handlers **do** use `dt` correctly and must keep working: `The Climb` and `Rising Lava` and `Everything` compute `m.data.lavaY -= 12 * dt / 1000`. Keep `dt` in the map-update signature and pass `TICK_MS`.

- [ ] **Step 7: Run everything, re-record, commit**

Run: `mise exec -- node --test test/ && mise exec -- npm run tape:record && cd server && mise exec -- node sim-smoke.js`

```bash
git add -A
git commit -m "fix: environmental forces are per-second, not per-frame

Wind, conveyors, updrafts, gravity wells, gas vents, earthquakes,
singularity pull, tornado and firestorm lift, and the movement blend were
all applied once per frame, so six map themes' identities scaled with the
player's refresh rate — Gale Force was ~2.4x stronger on a 144Hz display
than on the server.

Every constant keeps its exact value; perSecond() makes the unit explicit
and is the identity at 60Hz, so a 60Hz player sees no change.

updateEffects drops the dt parameter that none of its 14 handlers used.
Map updates keep dt, because three lava-rise handlers use it correctly.

Closes A2, A3, A10.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Physics facade over Matter, and the `setVelocity` classification

**Contract:** **REFACTOR.** The tape must replay identically — this is a pure indirection layer. The classification decisions are recorded but change no behaviour yet.

**Files:**
- Create: `src/sim/phys/facade.js`, `src/sim/phys/matter-backend.js`, `docs/superpowers/plans/velocity-classification.md`, `test/facade.test.js`
- Modify: every `src/sim/` file calling `Bodies.*`, `Body.*`, `Composite.*`, `Query.*`, `Constraint.*`, `Events.*`, `Engine.*` (353 sites)

**Interfaces:**
- Produces, from `src/sim/phys/facade.js`:

```js
export function createCircle(x, y, r, opts) {}      // → BodyHandle
export function createBox(x, y, w, h, opts) {}
export function createPolygon(x, y, sides, r, opts) {}
export function addBody(b) {}
export function removeBody(b, deep) {}
export function setType(b, type) {}                  // 'static' | 'kinematic' | 'dynamic'
export function setPosition(b, p) {}
export function setAngle(b, a) {}
export function setAngularVelocity(b, w) {}
export function setFixedRotation(b, on) {}
export function setVelocity(b, v) {}                 // authoritative override
export function addVelocity(b, dv) {}                // GAMEPLAY PUSH, mass-independent by design
export function applyImpulse(b, j) {}                // true, mass-scaled
export function applyForce(b, at, f) {}
export function setGravityScale(b, s) {}
export function setFilter(b, filter) {}
export function setFixtureEnabled(b, on) {}
export function queryRay(from, to, filter) {}        // → { body, point, normal } | null
export function queryRegion(aabb, filter) {}         // → BodyHandle[]
export function queryRadius(center, r, filter) {}    // → BodyHandle[]
export function queryCapsule(from, to, halfWidth, filter) {} // → BodyHandle[]
export function createJoint(desc) {}
export function removeJoint(j) {}
export function rescaleBody(b, targetScale) {}
export function allBodies() {}
export function onContact(handler) {}
export function physStep(dtMs) {}
export function setGravity(v) {}
export function setFrictionAir(b, v) {}

// Readers. Tasks 8, 9 and 12 assert against these, so they are part of the
// contract, not conveniences.
export function positionOf(b) {}   // → { x, y }
export function velocityOf(b) {}   // → { x, y }
export function radiusOf(b) {}     // → number  (circleRadius, or the vertex distance)
export function massOf(b) {}       // → number
```

- [ ] **Step 1: Write the failing test**

`test/facade.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as phys from '../src/sim/phys/facade.js';
import { createWorld, destroyWorld } from '../src/sim/world.js';

test('addVelocity is mass-independent — the design language of ~70 spell pushes', () => {
  createWorld();
  const light = phys.createCircle(100, 100, 10, { density: 0.004 });
  const heavy = phys.createCircle(200, 100, 10, { density: 0.02 });
  phys.addBody(light); phys.addBody(heavy);
  phys.addVelocity(light, { x: 10, y: 0 });
  phys.addVelocity(heavy, { x: 10, y: 0 });
  assert.equal(phys.velocityOf(light).x, phys.velocityOf(heavy).x, 'a Gust shoves an anvil like a wizard');
  destroyWorld();
});

test('applyImpulse IS mass-scaled — the physical operation, kept distinct', () => {
  createWorld();
  const light = phys.createCircle(100, 100, 10, { density: 0.004 });
  const heavy = phys.createCircle(200, 100, 10, { density: 0.02 });
  phys.addBody(light); phys.addBody(heavy);
  phys.applyImpulse(light, { x: 1, y: 0 });
  phys.applyImpulse(heavy, { x: 1, y: 0 });
  assert.ok(phys.velocityOf(light).x > phys.velocityOf(heavy).x, 'mass matters for a true impulse');
  destroyWorld();
});

test('queryRay finds a thin platform a 10px stepping loop would miss', () => {
  createWorld();
  const thin = phys.createBox(300, 400, 200, 8, { isStatic: true });
  phys.addBody(thin);
  const hit = phys.queryRay({ x: 300, y: 100 }, { x: 300, y: 700 });
  assert.ok(hit, 'an 8px platform must be hit');
  assert.equal(hit.body, thin);
  destroyWorld();
});

test('rescaleBody is absolute, not cumulative', () => {
  createWorld();
  const b = phys.createCircle(100, 100, 15, { density: 0.004 });
  phys.addBody(b);
  for (let i = 0; i < 50; i++) { phys.rescaleBody(b, 2); phys.rescaleBody(b, 1); }
  assert.ok(Math.abs(phys.radiusOf(b) - 15) < 1e-9, `50 grow/shrink cycles must not drift: ${phys.radiusOf(b)}`);
  destroyWorld();
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `mise exec -- node --test test/facade.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `matter-backend.js`**

Each facade function forwards to Matter. The two that carry design meaning:

```js
import Matter from 'matter-js';
const { Body, Bodies, Composite, Constraint, Query, Events, Engine, Vector } = Matter;

// GAMEPLAY PUSH. Mass-independent BY DESIGN — see spec §5.3. A Gust shoves an
// anvil (density 0.02), a grand piano (0.018) and a wizard (0.004) with equal
// authority, because that is what makes a chaotic brawler readable. Do not
// "correct" this into applyImpulse; doing so silently rebalances ~70 spells.
export function addVelocity(b, dv) {
  Body.setVelocity(b, { x: b.velocity.x + dv.x, y: b.velocity.y + dv.y });
}

// The physical operation, kept available and kept distinct.
export function applyImpulse(b, j) {
  Body.setVelocity(b, { x: b.velocity.x + j.x / b.mass, y: b.velocity.y + j.y / b.mass });
}

// Absolute, never cumulative — Body.scale applied repeatedly drifts vertices
// and mass (defect B5). Rebuild from the body's canonical definition.
export function rescaleBody(b, targetScale) {
  const from = b.__scale ?? 1;
  if (Math.abs(targetScale - from) < 1e-9) return;
  Body.scale(b, targetScale / from, targetScale / from);
  b.__scale = targetScale;
}
```

`queryRay` wraps `Query.ray`, which is a real segment test — that is what replaces the 10 px stepping loop in Task 9.

- [ ] **Step 4: Run the test to confirm it passes**

Run: `mise exec -- node --test test/facade.test.js`
Expected: 4 PASS.

- [ ] **Step 5: Classify all 107 `Body.setVelocity` sites**

Produce the list:

```bash
grep -rn "Body\.setVelocity\|setVelocity(" src/sim/ > /tmp/velsites.txt; wc -l /tmp/velsites.txt
```

Write `docs/superpowers/plans/velocity-classification.md` as a table of `file:line → classification → rationale`, using these rules:

| Pattern in the code | Classification | Facade call |
|---|---|---|
| `{ x: b.velocity.x + …, y: b.velocity.y + … }` | gameplay push | `addVelocity` |
| `{ x: <literal or computed>, y: <literal> }` with no read of current velocity | authoritative override | `setVelocity` |
| Inside `src/sim/player/controller.js` movement blend | controller drive | `setControlVelocity` (added in phase 3; for now `setVelocity`) |
| Conveyor belts: `Math.max(-9, Math.min(9, b.velocity.x + dir * 0.25))` | authoritative override (it clamps) | `setVelocity` |
| Spawn/reset/teleport (`spawnPlayer`, `chaostheory`, `blink`, `swaphex`) | authoritative override | `setVelocity` |

Expected distribution, from the spec: ~70 push, ~25 override, ~12 controller. If your counts differ by more than 10, re-read the outliers — a misclassification here is a silent content rebalance.

- [ ] **Step 6: Route all 353 Matter calls through the facade**

Mechanical, file by file. After each file, run `mise exec -- npm run build` and `mise exec -- node --test test/golden-tape.test.js`. The tape catches a misclassification immediately, which is the entire reason this task is a REFACTOR with an unchanged tape.

Add the guard:

```js
test('src/sim imports matter-js only through the facade', () => {
  const offenders = [];
  for (const file of walk('src/sim')) {
    if (file.includes('phys/')) continue;
    if (/from\s+['"]matter-js['"]/.test(readFileSync(file, 'utf8'))) offenders.push(file);
  }
  assert.deepEqual(offenders, [], `only src/sim/phys/* may import matter-js:\n${offenders.join('\n')}`);
});
```

- [ ] **Step 7: Run everything and commit**

Run: `mise exec -- node --test test/ && cd server && mise exec -- node sim-smoke.js && mise exec -- node verify-e2e.js`
Expected: all green, tape **unchanged** (`git diff test/tape/` empty).

```bash
git add -A
git commit -m "refactor: physics facade over Matter; classify 107 velocity writes

353 Matter calls route through a ~24-operation facade so phase 2 can swap
in planck.js as a config change with A/B parity diffing.

The important decision: addVelocity is a first-class, documented,
mass-independent gameplay operation, distinct from applyImpulse. All ~70
spell push sites add to velocity and ignore mass — a Gust shoves an anvil
like a wizard — and that is the design language of the content, not a bug.
Mechanically 'correcting' them to impulses would rebalance ~70 spells.

Classification of every site recorded in
docs/superpowers/plans/velocity-classification.md.

rescaleBody is absolute, not cumulative (closes B5's drift at the API).

Golden tape unchanged, which is the proof this was pure indirection.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Real spatial queries

**Contract:** **BEHAVIOUR.** Closes B2, B9, B11, B12.

**Files:**
- Create: `test/spatial-queries.test.js`
- Modify: `src/sim/spells/core.js`, `src/sim/player/controller.js`, `src/sim/pickups.js`, `src/sim/events.js`, `src/sim/maps/extras.js`, `src/sim/spells/book.js` (`disintegrate`, `railgun` only), `src/sim/player/ghost.js`

- [ ] **Step 1: Write the failing test**

`test/spatial-queries.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as phys from '../src/sim/phys/facade.js';
import { createWorld, destroyWorld } from '../src/sim/world.js';
import { groundYAt } from '../src/sim/spells/core.js';

test('groundYAt finds an 8px-thick platform', () => {
  createWorld();
  // The old implementation stepped y by 12, so an 8px platform could fall
  // entirely between two samples and read as "no ground here".
  const thin = phys.createBox(640, 300, 300, 8, { isStatic: true });
  phys.addBody(thin);
  const y = groundYAt(640);
  assert.ok(Math.abs(y - 296) < 6, `expected the platform top (~296), got ${y}`);
  destroyWorld();
});

test('a raycast hits a thin platform edge-on', () => {
  createWorld();
  const thin = phys.createBox(400, 500, 400, 10, { isStatic: true });
  phys.addBody(thin);
  const hit = phys.queryRay({ x: 220, y: 495 }, { x: 580, y: 495 });
  assert.ok(hit, 'a horizontal ray along a 10px platform must hit it');
  destroyWorld();
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `mise exec -- node --test test/spatial-queries.test.js`
Expected: FAIL on the first test — the stepping loop misses the thin platform.

- [ ] **Step 3: Replace the two stepping loops**

`groundYAt` (`js/spells.js:164-171`) becomes one downward ray:

```js
export function groundYAt(x) {
  const hit = phys.queryRay({ x, y: 0 }, { x, y: H }, (b) => b.isStatic && !b.isSensor && b.collisionFilter.mask !== 0);
  return hit ? hit.point.y : H - 30;
}
```

`raycastHit` (`js/spells.js:124-140`) becomes one ray along the aim, preserving the 22/-6/14 muzzle offsets and the 1400 px range exactly:

```js
export function raycastHit(p, angOff = 0) {
  let dir = aimDir(p, 1, 0);
  if (angOff) {
    const a = Math.atan2(dir.y, dir.x) + angOff;
    dir = { x: Math.cos(a), y: Math.sin(a) };
  }
  const from = { x: p.body.position.x + dir.x * 22, y: p.body.position.y - 6 + dir.y * 14 };
  const to = { x: from.x + dir.x * 1400, y: from.y + dir.y * 1400 };
  const hit = phys.queryRay(from, to, (b) =>
    b !== p.body && !b.isSensor && b.label !== 'gib' && b.label !== 'projectile' && b.collisionFilter.mask !== 0);
  return { hit: hit?.body ?? null, pt: hit?.point ?? to, from, dir };
}
```

- [ ] **Step 4: Replace the full-world scans**

| Site | Replacement |
|---|---|
| `explode` (`js/spells.js:87`) | `phys.queryRadius({x, y}, radius)` |
| `spawnSingularity.update` (`js/spells.js:211`) | `phys.queryRadius({x, y}, R)` |
| `makeZone.tickBody` (`js/spells.js:269`) | `phys.queryRadius({x, y}, r)` |
| `cyclone`, `vortexpull`, `updraft`, `gust`, `earthquake`, `poltergeist`, `tornado`, `firestorm` | `phys.queryRadius` / `phys.queryRegion` with the same range constant |
| `disintegrate` / `railgun` beam line test (`js/spellbook.js:280,318`) | `phys.queryCapsule(from, to, 26)` / `(…, 28)` — the existing half-widths |
| `groundInColumn` (`js/player.js:16`) | `phys.queryRegion` over the column |
| `tomeDropSpot` (`js/pickups.js:45`) | `phys.queryRegion` per candidate column |
| `platformSpots` (`js/events.js:10`) | `phys.queryRegion` per candidate column |
| `ensureTraversable` (`js/maps.js:429`) | keep the one-time full scan — it runs once per map build, not per frame |
| ghost carry search (`js/player.js:278`) | `phys.queryRadius(g, 70)` |

Keep every radius, range and filter predicate byte-identical. The behaviour change is *which* bodies are found (correctly, now), not the rules for finding them.

- [ ] **Step 5: Close B11 — projectiles must not spawn inside geometry**

`shoot` (`js/spells.js:19`) offsets the muzzle 28 px along the aim with no check. Add one ray from the caster to the muzzle and clamp:

```js
  const muzzle = { x: x + dir.x * 28, y: y - 6 + dir.y * 16 };
  const blocked = phys.queryRay({ x, y: y - 6 }, muzzle, (b) => b.isStatic && !b.isSensor && b.collisionFilter.mask !== 0);
  const spawn = blocked
    ? { x: blocked.point.x - dir.x * 4, y: blocked.point.y - dir.y * 4 }
    : muzzle;
```

- [ ] **Step 6: Run everything, re-record, commit**

Run: `mise exec -- node --test test/ && mise exec -- npm run tape:record && cd server && mise exec -- node sim-smoke.js && mise exec -- node verify-e2e.js`

```bash
git add -A
git commit -m "fix: real spatial queries replace stepping loops and world scans

raycastHit stepped 10px and groundYAt stepped 12px, so both could miss the
thin platforms the map book is full of — lightning passed through an 8px
ledge and Volcano/Trampoline/Lightning Rod could place themselves at the
wrong height. Both become single segment queries.

42 full-world Composite.allBodies scans become radius, region and capsule
queries against the broadphase, including explode, singularities, zones
and the Disintegrate/Railgun beams — same radii, same filters, correct
results, far less work per frame.

Projectiles now raycast their 28px muzzle offset and clamp instead of
spawning inside a wall.

Closes B2, B9, B11, B12.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Collision dispatch table

**Contract:** **REFACTOR.** Tape unchanged.

**Files:**
- Create: `src/sim/collision.js` (replacing the inline handler), `test/collision-dispatch.test.js`
- Modify: `src/sim/tick.js`

- [ ] **Step 1: Write the failing test**

`test/collision-dispatch.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rulesFor, pairCooldown } from '../src/sim/collision.js';

test('every rule is registered against an ordered label pair', () => {
  assert.ok(rulesFor('projectile', 'player').length > 0);
  assert.ok(rulesFor('tome', 'player').length > 0);
  assert.ok(rulesFor('banana', 'player').length > 0);
  assert.ok(rulesFor('lava', 'player').length > 0);
});

test('a pair cooldown gates repeat hits per body pair, not globally', () => {
  const a = { id: 1 }, b = { id: 2 }, c = { id: 3 };
  assert.equal(pairCooldown.ready(a, b, 400), true);
  assert.equal(pairCooldown.ready(a, b, 400), false, 'same pair is gated');
  assert.equal(pairCooldown.ready(a, c, 400), true, 'a different pair is not');
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `mise exec -- node --test test/collision-dispatch.test.js`
Expected: FAIL — `rulesFor` is not exported.

- [ ] **Step 3: Convert the 98-line handler into a table**

`js/game.js:358-456` is one `collisionStart` handler with a nested `for (const [a, b] of [[bodyA, bodyB], [bodyB, bodyA]])` loop that allocates two arrays per pair per frame. Replace with:

```js
const rules = new Map(); // "labelA|labelB" → [fn]

export function rule(labelA, labelB, fn) {
  const key = `${labelA}|${labelB}`;
  if (!rules.has(key)) rules.set(key, []);
  rules.get(key).push(fn);
}

export const rulesFor = (a, b) => rules.get(`${a}|${b}`) ?? [];

export function dispatchContact(bodyA, bodyB) {
  for (const [a, b] of orderedPairs(bodyA, bodyB)) {
    for (const fn of rulesFor(a.label, b.label)) fn(a, b);
  }
}
```

`orderedPairs` yields both orientations from a reused module-level array, so the
per-pair allocation in `js/game.js:361` disappears:

```js
const scratch = [[null, null], [null, null]];
function orderedPairs(a, b) {
  scratch[0][0] = a; scratch[0][1] = b;
  scratch[1][0] = b; scratch[1][1] = a;
  return scratch;
}
```

The scratch array is safe to reuse because `dispatchContact` never yields
control between reading it and finishing its loop — no rule is async, and no
rule calls `dispatchContact` re-entrantly.

Register each existing behaviour as a rule, preserving its exact logic and order: projectile↔anything, contactDamage, contactExplode, banana↔player, player↔player (STOMP), tramp↔player, tome↔player, hat↔player, icicle↔player, spikes↔player, anything↔lava.

- [ ] **Step 4: Unify the ad-hoc cooldown stamps**

Five different per-body timestamp conventions gate repeat hits: `a._cdAt` (contactDamage, 400 ms), `small._stompAt` (600 ms), `q.lastSpikeAt` (600 ms), `p._bossHurtAt` (700 ms, `js/boss.js:45`), `b._touchAt` (700 ms, `js/enemies.js:41`). Replace with one facility, keeping every interval exactly:

```js
const pairs = new Map(); // "idA|idB" → tick when the pair is next allowed
export const pairCooldown = {
  ready(a, b, ms) {
    const key = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
    if (currentTick() < (pairs.get(key) ?? 0)) return false;
    pairs.set(key, currentTick() + ticks(ms));
    return true;
  },
  clear() { pairs.clear(); },
};
```

Call `pairCooldown.clear()` from `loadMap` so a new round starts clean.

- [ ] **Step 5: Run everything and commit**

Run: `mise exec -- node --test test/ && cd server && mise exec -- node sim-smoke.js`
Expected: all green, tape **unchanged**.

```bash
git add -A
git commit -m "refactor: collision rules become a dispatch table

game.js's 98-line collisionStart handler becomes a label-pair rule
registry, and the per-pair array allocation in its hot loop goes away.

Five ad-hoc per-body cooldown stamps (_cdAt, _stompAt, lastSpikeAt,
_bossHurtAt, _touchAt) become one pair-keyed facility, keeping every
interval exactly as authored.

Golden tape unchanged.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Gravity modifier stack

**Contract:** **BEHAVIOUR.** Closes C2.

**Files:**
- Create: `src/sim/gravity.js`, `test/gravity-stack.test.js`
- Modify: `src/sim/spells/book.js` (`gravflip`, `moongrav` only), `src/sim/events.js` (`moonshot`), `src/sim/maps/book.js` (Flip Zone, Blink, Glitch), `src/sim/match.js` (`loadMap`), `src/sim/player/controller.js` (drop the counter-force hack's global read)

- [ ] **Step 1: Write the failing test**

`test/gravity-stack.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setBase, push, pop, currentGravity, clearModifiers } from '../src/sim/gravity.js';

test('overlapping modifiers compose and expire independently', () => {
  clearModifiers(); setBase(2);
  const low = push({ kind: 'scale', value: 0.3 });
  const flip = push({ kind: 'flip' });
  assert.equal(currentGravity(), -0.6, 'low gravity AND flipped');
  pop(flip);
  assert.equal(currentGravity(), 0.6, 'popping the flip leaves the low gravity intact');
  pop(low);
  assert.equal(currentGravity(), 2);
});

test('a map cycling gravity cannot cancel a spell', () => {
  clearModifiers(); setBase(2);
  // Flip Zone rewrites gravity every tick. Under the old global it erased
  // Gravity Flip within one tick; as a base change it composes instead.
  const spell = push({ kind: 'flip' });
  setBase(-2); // the map's cycle
  assert.equal(currentGravity(), 2, 'map flip + spell flip = upright, spell still live');
  pop(spell);
  assert.equal(currentGravity(), -2, 'the map cycle survives the spell expiring');
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `mise exec -- node --test test/gravity-stack.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/sim/gravity.js`**

```js
import * as phys from './phys/facade.js';

let base = 2;
let seq = 0;
let mods = []; // { id, kind: 'scale'|'flip'|'set', value }

export function setBase(v) { base = v; apply(); }
export const baseGravity = () => base;

export function push(mod) {
  const id = ++seq;
  mods.push({ id, ...mod });
  apply();
  return id;
}

export function pop(id) { mods = mods.filter((m) => m.id !== id); apply(); }
export function clearModifiers() { mods = []; apply(); }

export function currentGravity() {
  let g = base;
  for (const m of mods) {
    if (m.kind === 'scale') g *= m.value;
    else if (m.kind === 'flip') g = -g;
    else if (m.kind === 'set') g = m.value;
  }
  return g;
}

function apply() { phys.setGravity({ x: 0, y: currentGravity() }); }
```

- [ ] **Step 4: Convert the six writers**

| Writer | Now |
|---|---|
| `gravflip` (`js/spellbook.js:815`) | `const id = push({ kind: 'flip' })`; its effect `onEnd` calls `pop(id)`. The caster's `gravityLockDir`/`gravityLockUntil` stay exactly as-is. |
| `moongrav` (`js/spellbook.js:827`) | `const id = push({ kind: 'scale', value: 0.3 })`; `onEnd` → `pop(id)` |
| `moonshot` event (`js/events.js:91`) | `push({ kind: 'scale', value: 0.45 })` for the round; `loadMap` clears modifiers, which replaces the current `game.baseGravity *= 0.45` mutation |
| Flip Zone (`js/mapbook.js:122`) | `setBase(flipped ? -game.baseGravity : game.baseGravity)` — a **base** change, so a live Gravity Flip composes instead of being erased |
| Blink (`js/mapbook.js:162`) | same as Flip Zone |
| Glitch (`js/mapbook.js:165`) | `setBase(baseGravity() * (1 + Math.sin(simNow() / 2600) * 0.5))` — note it must read the map's own base, not the composed value, or it compounds |
| `loadMap` (`js/game.js:55-56`) | `clearModifiers(); setBase(def.gravity ?? 2)` |

The banner-spam side effect on Flip Zone and Blink (they compare `engine.gravity.y !== want` to decide whether to announce) must now compare against the *base*, not the composed gravity, or a live Gravity Flip retriggers the banner every tick.

- [ ] **Step 5: Add a regression test for the real bug**

Append to `test/gravity-stack.test.js`:

```js
import { createSim } from '../src/platform/node.js';

test('Gravity Flip survives a full second on a gravity-cycling map', () => {
  const { bridge, destroy } = createSim({});
  // load Glitch (writes gravity every tick), cast gravflip, and assert the
  // flip is still in effect 60 ticks later
  const flipped = bridge.debugCastOnMap('glitch', 'gravflip', 60);
  assert.equal(flipped, true, 'a legendary must not be erased by the map');
  destroy();
});
```

Add `debugCastOnMap(mapNameFragment, spellId, ticksToRun)` to the test-only bridge block from Task 4 Step 4: it loads the named map, gives slot 0 the spell, casts it, steps N ticks, and returns whether the flip modifier is still present.

- [ ] **Step 6: Run everything, re-record, commit**

Run: `mise exec -- node --test test/ && mise exec -- npm run tape:record && cd server && mise exec -- node sim-smoke.js`

```bash
git add -A
git commit -m "fix: gravity is a modifier stack, not one mutable global

Six writers shared engine.gravity.y: two spells, one event and three maps
that rewrite it every tick. Consequences: overlapping gravity spells
cancelled each other early, and on Flip Zone, Blink and Glitch the map's
per-tick write erased Gravity Flip within one tick — a legendary was inert
on three maps.

Modifiers now compose over a base the map owns, expire independently, and
a map cycling its base can no longer cancel a spell.

Closes C2.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Content-intent fixes

**Contract:** **BEHAVIOUR.** Closes C1, C3, C4, C7, C8, C9, and names C11/C12 as explicit rules.

**Files:**
- Create: `test/content-intent.test.js`
- Modify: `src/sim/spells/book.js` (`roulette`, `mirrorcast`, `dragonbreath`, `beehive`, `disarm`), `src/sim/spells/core.js` (`castSpell`, `boomBolt`/`statusBolt`/`shoot` potency), `src/sim/player/status.js`, `src/sim/player/lifecycle.js`, `src/sim/ai/boss.js`, `src/sim/match.js`, `src/render/hud.js`, `src/net/snapshot.js`, `src/sim/waves.js`, `src/platform/node.js`

- [ ] **Step 1: Write the failing tests**

`test/content-intent.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SPELLS } from '../src/sim/spells/registry.js';
import { roulettePool, mirrorPool } from '../src/sim/spells/book.js';
import { effectiveCooldown } from '../src/sim/spells/core.js';
import { CAST_FLOOR } from '../src/sim/spells/core.js';

test('Roulette can never roll a hybrid — hybrids exist only through fusion', () => {
  const pool = roulettePool();
  const hybrids = pool.filter((id) => SPELLS[id].hybrid);
  assert.deepEqual(hybrids, [], `hybrids must not be reachable from Roulette: ${hybrids}`);
  assert.ok(pool.length > 90, 'the pool is still the whole non-hybrid spell book');
});

test('Mirror Cast cannot copy a hybrid either', () => {
  assert.equal(mirrorPool().some((id) => SPELLS[id].hybrid), false);
});

test('the cooldown shown is the cooldown enforced', () => {
  // CAST_FLOOR gates casting at 480ms; four spells declare less, and the HUD
  // used to fill their bar early and then silently no-op the cast.
  const early = Object.entries(SPELLS).filter(([, s]) => s.cooldown < CAST_FLOOR);
  assert.ok(early.length >= 4, 'there are sub-floor spells to protect');
  for (const [id, s] of early) {
    assert.equal(effectiveCooldown(id), CAST_FLOOR, `${id} must report the floor, not ${s.cooldown}`);
  }
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `mise exec -- node --test test/content-intent.test.js`
Expected: FAIL — `roulettePool` is not exported.

- [ ] **Step 3: C1 — exclude hybrids from Roulette and Mirror Cast**

`js/spellbook.js:876` currently filters only itself and `mirrorcast`. The pool must exclude hybrids, matching `tomePool()` (`js/pickups.js:6`) and the stated rule in `js/hybrids.js:6`:

```js
export const roulettePool = () =>
  Object.keys(SPELLS).filter((k) => k !== 'roulette' && k !== 'mirrorcast' && !SPELLS[k].hybrid);
```

Mirror Cast (`js/spellbook.js:1018`) gains the same guard on the copied id, and
exposes its eligible set for the test:

```js
export const mirrorPool = () =>
  Object.keys(SPELLS).filter((k) => k !== 'mirrorcast' && k !== 'roulette' && !SPELLS[k].hybrid);

const mirrorEligible = (id) => !!id && mirrorPool().includes(id);

// inside cast(p):
    const src = t && t.spellId;
    const id = mirrorEligible(src) ? src : null;
```

- [ ] **Step 4: C3 — fix potency at cast time**

`castSpell` sets `p.mega` then calls `spell.cast(p)` (`js/spells.js:413,424`). Deferred spawners read `p.mega` when they *fire*, so Dragon's Breath (720 ms) and Beehive (2200 ms) inherit a later HYPERSPELL proc. Thread potency explicitly:

- `boomBolt(p, o)`, `statusBolt(p, o, apply)`, `shoot(p, o)`, `summonCritter(p, o)` accept `o.m` and use `o.m ?? p.mega ?? 1`.
- `dragonbreath` and `beehive` capture `const m = p.mega || 1` at cast (they already do for other purposes) and pass `{ ..., m }` into each deferred spawn.

Add the test. It asserts the *threading*, which is the actual fix, without
needing a full sim: the primitives must prefer an explicitly passed `m` over
whatever `p.mega` happens to be when they run.

```js
import { resolvePotency } from '../src/sim/spells/core.js';

test('an explicitly threaded potency beats the caster live value', () => {
  const p = { mega: 2.2 }; // a HYPERSPELL proc landed after the cast began
  assert.equal(resolvePotency(p, { m: 1 }), 1, 'the bolt keeps the potency it was cast with');
  assert.equal(resolvePotency(p, {}), 2.2, 'an immediate cast still reads the caster');
  assert.equal(resolvePotency({}, {}), 1, 'no potency anywhere is 1');
});

test("Dragon's Breath threads its potency into every deferred bolt", () => {
  const src = readFileSync('src/sim/spells/book.js', 'utf8');
  const breath = src.slice(src.indexOf("regSpell('dragonbreath'"), src.indexOf("regSpell('cannonball'"));
  assert.match(breath, /const m = p\.mega \|\| 1/, 'potency is captured at cast');
  assert.match(breath, /boomBolt\(p, \{[^}]*\bm\b/, 'and passed into each deferred bolt');
});
```

with the helper in `src/sim/spells/core.js`:

```js
export const resolvePotency = (p, o = {}) => o.m ?? p.mega ?? 1;
```

`boomBolt`, `statusBolt`, `shoot` and `summonCritter` all replace their
`const m = p.mega || 1` with `const m = resolvePotency(p, o)`.

- [ ] **Step 5: C4 — one cooldown number**

Add to `src/sim/spells/core.js`:

```js
export const effectiveCooldown = (id) => Math.max(SPELLS[id]?.cooldown ?? 0, CAST_FLOOR);
```

Use it in all three readers so the bar means "castable":
- `castSpell`'s gate (`js/spells.js:405`) — already effectively this; call the helper.
- HUD (`js/game.js:1220`) `cdf` computation.
- `serializeSnapshot` `c0`, `c1` and the `rd` flag (`js/snapshot.js:20,24-25`).

- [ ] **Step 6: C8 — statuses own their physical side-effects**

~12 freeze spells write `q.body.frictionAir = 0.001` directly and a single transition check in `updatePlayers` (`js/player.js:478`) restores `0.02`. Move both sides into `src/sim/player/status.js`:

```js
export function applyFreeze(p, ms) {
  p.frozenUntil = Math.max(p.frozenUntil || 0, simNow() + ms);
  phys.setFrictionAir(p.body, FROZEN_FRICTION_AIR); // 0.001
}

export function tickStatuses(p) {
  const frozen = simNow() < (p.frozenUntil || 0);
  if (p.wasFrozen && !frozen) {
    phys.setFrictionAir(p.body, BASE_FRICTION_AIR); // 0.02
    p.wetUntil = simNow() + 4500;
    // the thaw puff, unchanged from js/player.js:479. Task 13 converts this
    // and every other cosmetic call into an emit(); leave it direct for now.
    spawnParticles(pos.x, pos.y, '#9be7ff', 10, 4);
  }
  p.wasFrozen = frozen;
}
```

Replace every `q.frozenUntil = …; q.body.frictionAir = 0.001;` pair in `book.js`, `fusion.js`, `builders.js` (ice destructible), `boss.js` (Manu) with `applyFreeze(q, ms)`. Durations are unchanged; only ownership moves. Keep `Math.max` semantics where the original used it and plain assignment where it did not — grep `/frozenUntil/` and check each of the ~40 sites.

- [ ] **Step 7: C9 — effect teardown is explicit**

`loadMap` does `activeEffects.length = 0` (`js/game.js:33`), silently skipping every pending `onEnd()`. Replace with an explicit sweep that says what it does:

```js
// Round teardown: pending effects are ABANDONED, not resolved — a Sticky Bomb
// that never detonated must not explode into the next round's map. onEnd is
// only for effects that reach their own end.
for (const e of activeEffects) e.onAbandon?.();
activeEffects.length = 0;
```

No current effect defines `onAbandon`, so behaviour is preserved — but the intent is now stated and future effects have a hook.

- [ ] **Step 8: C7 — wave best score persists online**

`js/enemies.js:279,287` reads and writes `localStorage`, which the server shimmed to `null`. Introduce a `storage` port on the sim context (`src/platform/node.js` gets a file-backed implementation writing next to the telemetry directory; `src/platform/browser.js` passes `localStorage`):

```js
// src/sim/storage.js
let port = { get: () => null, set: () => {} };
export const setStoragePort = (p) => { port = p; };
export const getStored = (k) => port.get(k);
export const setStored = (k, v) => port.set(k, v);
```

- [ ] **Step 9: C11 and C12 — name the two intentional rules**

Both are confirmed intentional (spec §6). Make each a declared rule instead of a side-effect.

`disarm` (`js/spellbook.js:872`) currently relies on the `spellId` setter clearing both slots. State it:

```js
// Butterfingers is legendary (drop weight 4). Annihilating a charged fusion is
// the payoff for landing it — this is deliberate, not the accessor leaking.
// See spec §6 C11.
export function disarmPlayer(q) {
  q.slots[0] = q.slots[1] = null;
  q.slotCharges[0] = q.slotCharges[1] = null;
  q.casts[0] = q.casts[1] = 0;
  q.slotFilledAt[0] = q.slotFilledAt[1] = 0;
}
```

`damageBoss` (`js/boss.js:353`) gates on `bs.announced`. Replace with a named window:

```js
  // The awaken banner, flash and shake are a telegraph; the boss is
  // deliberately untouchable until it lands. See spec §6 C12.
  if (bs.invulnerableUntilAnnounced && !bs.announced) return;
```

set `invulnerableUntilAnnounced: true` in `spawnBoss`, and add a test asserting damage before announce is rejected and damage after is applied.

- [ ] **Step 10: Run everything, re-record, commit**

Run: `mise exec -- node --test test/ && mise exec -- npm run tape:record && cd server && mise exec -- node sim-smoke.js && mise exec -- node verify-e2e.js`

```bash
git add -A
git commit -m "fix: content behaves as designed

- Roulette and Mirror Cast can no longer produce hybrids. Both picked
  uniformly over every registered spell, so ~25% of Roulette casts handed
  out a fusion-only hybrid free, with no charge cost, against the stated
  rule that hybrids exist only through fusion.
- Deferred spawners keep the potency they were cast with. Dragon's Breath
  and Beehive read p.mega when each bolt fired, so a HYPERSPELL proc
  landing mid-cast retroactively supercharged the rest.
- The cooldown bar now means castable: CAST_FLOOR is what the HUD and the
  wire report, so Fireball and three others stop reading ready while
  silently refusing to fire.
- Freeze owns its own frictionAir, instead of ~12 spells writing the body
  directly and one transition check restoring it.
- Round teardown states that pending effects are abandoned, not resolved.
- Wave best score persists headless via a storage port.
- Butterfingers destroying fusions and the boss entrance invulnerability
  are confirmed intentional and are now declared rules with tests, not
  side-effects of an accessor and an announce flag.

Closes C1, C3, C4, C7, C8, C9; names C11, C12.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: Cosmetics as events; phase 1 gate

**Contract:** **BEHAVIOUR** (couch mode gains the event path; output is intended to be identical). Closes D1, D3. Proves the phase gate.

**Files:**
- Create: `src/sim/emit.js`, `test/sim-purity.test.js`, `test/phase1-gate.test.js`
- Modify: `src/sim/**` (cosmetic call sites), `src/render/fx.js`, `src/render/draw-world.js`, `src/net/server-bridge.js`, `src/net/client.js`, `src/render/hud.js`

- [ ] **Step 1: Write the failing test**

`test/sim-purity.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.js')) out.push(p);
  }
  return out;
}

test('sim/ never touches the particle array or the canvas', () => {
  const banned = /\bparticles\s*\.\s*(push|length)|\bctx\b/;
  const offenders = [];
  for (const file of walk('src/sim')) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (banned.test(line) && !line.trimStart().startsWith('//')) offenders.push(`${file}:${i + 1}  ${line.trim()}`);
    });
  }
  assert.deepEqual(offenders, [], `cosmetics must be emitted, not called:\n${offenders.join('\n')}`);
});

test('render/ never writes sim state', () => {
  const banned = /\b(damagePlayer|killPlayer|explode|Body\.set|phys\.(set|add|apply))/;
  const offenders = [];
  for (const file of walk('src/render')) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (banned.test(line) && !line.trimStart().startsWith('//')) offenders.push(`${file}:${i + 1}  ${line.trim()}`);
    });
  }
  assert.deepEqual(offenders, [], `render must be read-only:\n${offenders.join('\n')}`);
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `mise exec -- node --test test/sim-purity.test.js`
Expected: FAIL on both — sim pushes particles directly (~30 sites) and `drawDestructible`/`drawLava`/`drawGeysers`/`drawVictory` push particles from the draw path.

- [ ] **Step 3: Write `src/sim/emit.js`**

```js
// The sim's only outward channel for things that are not simulation state:
// particles, screen shake, flashes, banners, sounds, kill-feed lines.
// Locally the renderer drains this queue; online the server bridge forwards it.
// One queue, so couch and online stop being two code paths.
const queue = [];
export function emit(name, ...args) { queue.push({ f: name, a: args }); }
export function drainEmitted() { const out = queue.slice(); queue.length = 0; return out; }
export const emittedCount = () => queue.length;
```

- [ ] **Step 4: Convert sim cosmetic calls to emissions**

The ten names already allowlisted on the wire (`js/net.js:266`) are exactly the cosmetic surface: `spawnParticles`, `spawnRing`, `spawnText`, `doFlash`, `addShake`, `slowMo`, `boltVisual`, `setBanner`, `addKillFeed`, `spawnBurst`, plus `sfx.*`. In `src/sim/**`, each becomes `emit('spawnParticles', x, y, color, n, speed)` etc.

`slowMo` is the one exception: it changes simulation pacing *and* is cosmetic. Keep the direct call to `pace.slowMo` **and** emit it, exactly as `wrapServerFx` does today (`server/sim-bridge.js:51`).

`src/render/fx.js` gains the drain:

```js
const HANDLERS = { spawnParticles, spawnRing, spawnText, doFlash, addShake, slowMo: () => {}, boltVisual, setBanner, addKillFeed, spawnBurst };
export function applyEmitted(events) {
  for (const e of events) {
    if (e.f === 'sfx') { sfx[e.a[0]]?.(); continue; }
    HANDLERS[e.f]?.(...e.a);
  }
}
```

`src/render/draw-world.js` calls `applyEmitted(drainEmitted())` once per rendered frame before drawing. `src/net/server-bridge.js` drops `wrapServerFx` entirely and forwards `drainEmitted()` on each tick.

- [ ] **Step 5: Move render-side particle spawning into render**

`drawDestructible` (`js/game.js:762-770`), `drawLava` (`:871`), `drawGeysers` (`:704`), `drawGasVents` (`:728`), `drawVictory` (`:1393`) push particles from the draw path. They stay in `render/`, and now push into `render/fx.js`'s array directly — which is legal, because they are render code. The `test/sim-purity.test.js` first test only guards `src/sim`.

- [ ] **Step 6: Write the phase-1 gate test**

`test/phase1-gate.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runTape } from './harness/tape.js';

const tape = JSON.parse(readFileSync('test/tape/three-rounds.input.json', 'utf8'));

test('GATE: a full three-round match is reproducible from its seed', () => {
  const a = runTape({ tape, ticks: 2400, seed: 20260725 });
  const b = runTape({ tape, ticks: 2400, seed: 20260725 });
  assert.deepEqual(a, b);
});

test('GATE: every spell casts on every map without corrupting the world', async () => {
  const { SPELLS } = await import('../src/sim/spells/registry.js');
  const { MAPS } = await import('../src/sim/maps/book.js');
  const { createSim } = await import('../src/platform/node.js');
  const ids = Object.keys(SPELLS);
  assert.ok(ids.length >= 140, `expected the full spell book, got ${ids.length}`);
  assert.equal(MAPS.length, 114);

  for (let mi = 0; mi < MAPS.length; mi++) {
    const { bridge, destroy } = createSim({});
    bridge.addPlayer({ name: 'A' }); bridge.addPlayer({ name: 'B' });
    bridge.start();
    for (const id of ids) {
      bridge.debugCastSpell(0, id, mi);
      for (let t = 0; t < 30; t++) bridge.stepSim();
      const snap = bridge.takeWireSnapshot();
      for (const p of snap.ps) {
        assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), `NaN position after ${id} on map ${mi}`);
        assert.ok(Number.isFinite(p.hp), `NaN hp after ${id} on map ${mi}`);
      }
    }
    const audit = bridge.audit();
    assert.ok(audit.effects < 200, `effect leak on map ${mi}: ${audit.effects}`);
    destroy();
  }
});
```

`debugCastSpell(slot, id, mapIndex)` joins the test-only bridge block. This test is slow (114 maps × 142 spells); mark it with node:test's `{ timeout: 600000 }`.

- [ ] **Step 7: Run the whole suite and the gate**

Run: `mise exec -- node --test test/`
Expected: every test PASS, including both purity tests and both gate tests.

Run: `cd server && mise exec -- node sim-smoke.js && mise exec -- node verify-e2e.js`
Expected: green.

Run: `mise exec -- npm run build && mise exec -- npm run build:guide`
Expected: both bundles written. Open `index.html` from the filesystem and confirm a couch match plays with no console errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: cosmetics leave the sim as events; phase 1 gate green

The fx monkeypatch that existed only server-side becomes the actual
architecture: sim emits, renderer drains, server forwards. Couch and
online now run the same path with the same data.

Draw functions that pushed particles keep doing so — they are render code
— and two boundary tests now enforce the split in both directions: sim
touches no particle array and no ctx; render writes no sim state.

Phase 1 gate: a three-round match is reproducible from its seed, and all
142 spells cast on all 114 maps without NaN or effect leaks.

Closes D1, D3.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Phase 1 exit criteria

All of these must hold before phase 2 begins:

- [ ] `mise exec -- node --test test/` — every test green, no skips
- [ ] `cd server && mise exec -- node sim-smoke.js` — all `ok`, zero `FAIL`
- [ ] `cd server && mise exec -- node verify-e2e.js` — v9 suite green
- [ ] Golden tape reproducible across two consecutive recordings
- [ ] `index.html` opened via `file://` plays a couch match with no console errors
- [ ] `wss` online play works: server boots, two browsers join, a round completes
- [ ] Defects closed: A1–A10, B2, B5 (at the API), B9, B11, B12, C1–C5, C7–C9, D1–D4, D6, D7
- [ ] `docs/superpowers/plans/velocity-classification.md` reviewed and complete
- [ ] `GAME_VERSION` still `9` — no wire change in this phase

## Subsequent phases

Each gets its own plan, written at its gate, because its content depends on
measurements that do not exist yet.

| Phase | Plan written when | Depends on |
|---|---|---|
| 2 — planck backend | Phase 1 gate green | The facade's final shape and the parity harness |
| 3 — controller rebuild | Phase 2 parity numbers in hand | Measured jump arc from the planck backend, which sets `GAP_MAX`/`FALL_SAFE_DROP` |
| 4 — prediction netcode | Phase 3 controller frozen | The controller being deterministic and cheap enough to re-simulate |
| 5 — teardown | Phase 4 shipped | Everything above |

The spec's §14 phase table and §6 defect-to-phase mapping are the roadmap.
