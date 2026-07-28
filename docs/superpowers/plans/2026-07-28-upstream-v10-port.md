# Upstream v10 Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-express all ten upstream `origin/main` commits (camera, lighting/bloom, particle budget, cast descriptors, frame profiler, bot AI, spawn safety, snapshot playout, opening loadouts) inside the `src/` module architecture, so `pr/sim-refactor` → `pr/e2e-suite` → `pr/online-sessions` merge cleanly into `origin/main` with no upstream behavior lost.

**Architecture:** Upstream code is script-tag globals in `js/*.js`; this branch deleted `js/` and rebuilt it as ES modules under `src/{sim,render,net,platform}` with a bundled `dist/`. A textual merge is impossible — git reports 7 `modify/delete` conflicts. So: land one **merge skeleton** commit that resolves the conflicts structurally (`js/` stays deleted, HTML keeps the `dist` bundle), then port each upstream feature as its own commit into the correct layer, under the branch's architectural gates.

**Tech Stack:** ES2022 modules, esbuild bundle → `dist/hyperspell.js`, `node --test` for unit tests, matter-js behind `src/sim/phys/facade.js`.

## Global Constraints

Every task inherits these. They are enforced by `test/module-boundaries.test.js` and `test/sim-purity.test.js`, which run on every `npm test`.

- `src/sim/**` must not import from `render/`, `net/`, or `platform/` — neither `from '…'` nor bare `import '…'`.
- `src/sim/**` must not import `matter-js` nor name a Matter namespace (`Bodies|Body|Composite|Constraint|Events|Engine|Query|Vector|Common` followed by `.`). Use `src/sim/phys/facade.js`. This ban also covers `test/**`.
- `src/sim/**` must not reference `document`, `window`, `localStorage`, `navigator`, `requestAnimationFrame`, `setTimeout`, `setInterval`, or `performance.now(`. The single exemption is `src/sim/pace.js` for `performance.now(` only. Deferred work goes through `src/sim/schedule.js`.
- `src/sim/**` must not call `Math.random()`. Use `simRandom()`, `rand()`, `pick()` from `src/sim/rng.js`. `src/render/**` may use `Math.random()` freely — cosmetic randomness is legal there.
- `src/sim/**` must not match `particles.push`, `particles.length`, or the bare identifier `ctx`. Cosmetics leave the sim via `src/sim/emit.js` as data descriptors.
- `src/render/**` must not match `damagePlayer|killPlayer|explode|Body.set|phys.(set|add|apply)`. The draw path is read-only.
- Time inside the sim is `simNow()` from `src/sim/time.js` (tick × TICK_MS), never wall time.
- Upstream's `js/*.js` files stay **deleted**. Never restore one to resolve a conflict.
- Rebuild `dist/` (`npm run build && npm run build:guide`) in any task that changes `src/`, and commit it — the browser suite loads `dist`.
- Known-failing browser specs (2 wind-map, 2 statusBolt, 1 pre-existing) stay documented, not fixed. Do not expand scope to them.

**Verification commands** (run from the worktree root, `/home/fahim/Projects/hyper-spell-port`):

```bash
npm test                                    # 174 unit tests, includes the architectural gates
node server/verify-e2e.js                   # server e2e (only on pr/online-sessions)
npm run build && npm run build:guide        # rebuild dist
```

## Upstream coverage

Every commit in `pr/sim-refactor..origin/main`, and the task that absorbs it. `3b2f38b` is a merge commit that re-states `c11b4b2` + `83ad928`; it carries no unique work.

| Commit | Task |
|---|---|
| `c11b4b2` The Lighting Update | 2 (camera, and the `core`/`player`/`replay`/`events` plumbing that hangs off the world transform), 3 (bloom, artkit), 9 (`net.js` interpolation) |
| `83ad928` bots: ledges | 7 |
| `3b2f38b` merge v10 | — (duplicate) |
| `4302ace` camera frames the boss | 11 |
| `5292ab8` bots: retreat | 7 |
| `c1ee936` particle budget + cast descriptors | 4, 5, 10 (`pickups.js`) |
| `832ef00` bots: double jump | 7 |
| `3c2b225` spawn safety, playout, loadouts, profiler | 6, 8, 9, 10 (`js/enemies.js`'s one-line change rides Task 8) |
| `b798196` spawn safety + net hardening | 8 |
| `898d796` spawn safety: half-cell gaps | 8 |

---

### Task 1: The merge skeleton

Resolve every structural conflict without porting any behavior, so the branch has a real merge commit with `origin/main` in its ancestry. Behavior arrives in Tasks 2–11.

**Files:**
- Modify: `index.html`, `controller-test.html`, `shot.html`, `smoke-test.html`, `wave-play.html`, `wave-test.html`, `spell-guide.html`
- Modify: `server/sim-context.js`, `server/sim-bridge.js` (upstream edits; branch has `src/net/server-bridge.js`)
- Delete (keep deleted): `js/core.js`, `js/enemies.js`, `js/fx.js`, `js/game.js`, `js/input.js`, `js/net.js`, `js/player.js`
- Create: `docs/PORT-LOG.md`

**Interfaces:**
- Consumes: nothing.
- Produces: a merge commit whose tree equals `pr/sim-refactor`'s tree plus `docs/PORT-LOG.md`, with `origin/main` as second parent. Tasks 2–11 commit on top of it.

- [ ] **Step 1: Start the merge**

```bash
cd /home/fahim/Projects/hyper-spell-port
git merge origin/main
```

Expected: `CONFLICT (content)` on `index.html` and `controller-test.html`, plus 7 `CONFLICT (modify/delete)` on the `js/` files.

- [ ] **Step 2: Keep the js/ monolith deleted**

```bash
git rm -f js/core.js js/enemies.js js/fx.js js/game.js js/input.js js/net.js js/player.js
```

Verify nothing survives under `js/`:

```bash
ls js 2>&1
```

Expected: `No such file or directory`.

- [ ] **Step 3: Resolve the HTML conflicts**

Upstream added `<script src="js/camera.js"></script>`-style tags for its new files. This branch loads one bundle instead. For each of `index.html` and `controller-test.html`, remove every conflict marker and every `<script src="js/…">` line upstream introduced, keeping this branch's `dist/hyperspell.js` bundle tag exactly as it was.

Check the result carries no markers and no `js/` references:

```bash
grep -nE '<<<<<<<|>>>>>>>|=======|src="js/' *.html
```

Expected: no output.

- [ ] **Step 4: Take upstream's server-side edits where the file still exists**

`server/sim-context.js` exists on both sides. Upstream added entries listing the new `js/` files it loads into the headless context. This branch's headless path runs through `src/platform/node.js`, so those entries have no referent — drop the added lines, keep the rest of upstream's diff. `server/sim-bridge.js` was deleted by this branch in favour of `src/net/server-bridge.js`; keep it deleted:

```bash
git rm -f server/sim-bridge.js 2>/dev/null || true
git checkout --ours server/sim-context.js 2>/dev/null || true
```

Then reconcile `server/sim-context.js` by hand against `git show origin/main:server/sim-context.js`, keeping only changes that name something this branch still has.

- [ ] **Step 5: Place upstream's four new files as untracked stubs**

Git's directory-rename heuristic wants `js/bloom.js`, `js/camera.js`, `js/profiler.js` and `js/spellcast.js` to land in `src/render/`. Three of those are right; `spellcast.js` is cast **classification**, not drawing, and belongs in `src/sim`. Remove all four from the merge — later tasks author them properly in the right layer:

```bash
git rm -f --cached src/render/bloom.js src/render/camera.js src/render/profiler.js src/render/spellcast.js 2>/dev/null || true
rm -f src/render/bloom.js src/render/camera.js src/render/profiler.js src/render/spellcast.js
```

Also drop the merge's copies of `src/sim/maps/builders.js`, `src/sim/ai/bot.js`, `src/sim/pickups.js`, `src/sim/replay.js`, `src/render/artkit.js`, `src/render/draw-env.js`, `src/render/draw-snapshot.js` if git rewrote them with upstream hunks — this branch's versions must survive Task 1 untouched:

```bash
git checkout --ours src/ && git add src/
git diff --stat HEAD -- src/
```

Expected: no output (this branch's `src/` is byte-identical to `pr/sim-refactor`).

- [ ] **Step 6: Record what the skeleton deliberately dropped**

Create `docs/PORT-LOG.md`:

```markdown
# Upstream v10 port log

The merge with origin/main is structural: `js/` stays deleted, so the ~2,400
lines upstream added there arrive as re-implementations in `src/`, one commit
per feature. This file tracks that, so a reviewer can check the ledger balances.

| Upstream commit | Feature | Lands in | Status |
|---|---|---|---|
| c11b4b2 | camera + world transform | `src/render/camera.js` | pending |
| c11b4b2 | bloom / light pass | `src/render/bloom.js`, `src/render/artkit.js` | pending |
| c1ee936 | particle budget | `src/render/fx.js`, `src/render/artkit.js` | pending |
| c1ee936 | cast descriptors | `src/sim/spells/cast-kind.js` | pending |
| 3c2b225 | frame profiler | `src/render/profiler.js` | pending |
| 83ad928 | bots: ledge avoidance | `src/sim/ai/bot.js` | pending |
| 5292ab8 | bots: retreat | `src/sim/ai/bot.js` | pending |
| 832ef00 | bots: double jump | `src/sim/ai/bot.js` | pending |
| 3c2b225 898d796 b798196 | spawn safety | `src/sim/maps/builders.js`, `server/verify-spawns.js` | pending |
| 3c2b225 | snapshot playout | `src/net/client.js`, `src/sim/snapshot.js` | pending |
| 3c2b225 | opening loadouts | `src/sim/pickups.js`, `src/sim/events.js` | pending |
| 4302ace | camera frames the boss online | `src/render/camera.js`, `src/render/draw-snapshot.js` | pending |

Nothing else in the upstream range changes behavior this branch keeps.
```

- [ ] **Step 7: Verify the skeleton is green**

```bash
npm test
```

Expected: 174/174 pass. The tree is unchanged from `pr/sim-refactor` except `docs/PORT-LOG.md`, so any failure here is a botched conflict resolution — re-check Steps 3–5 before continuing.

- [ ] **Step 8: Commit the merge**

```bash
git add index.html controller-test.html shot.html smoke-test.html wave-play.html wave-test.html spell-guide.html server/sim-context.js docs/PORT-LOG.md
git commit -m "merge: take origin/main structurally — js/ stays deleted, behavior ports next

The upstream range edits files this branch replaced with src/ modules, so the
merge resolves the layout and PORT-LOG.md tracks the behavior still owed."
```

---

### Task 2: The camera

**Files:**
- Create: `src/render/camera.js`
- Modify: `src/render/draw-world.js`, `src/render/canvas.js`, `src/render/draw-wizard.js`, `src/render/replay.js`, `src/platform/input-keyboard.js`
- Test: `test/camera-framing.test.js`

**Source:** `git show origin/main:js/camera.js` (c11b4b2, refined by 4302ace). The c11b4b2 hunks in `js/core.js` (+35), `js/player.js` (+93), `js/replay.js` (+20) and `js/events.js` (+18) are the plumbing that hangs off the world transform — the shake feed moving to `addTrauma`, the wizard draw working in world space, and the replay viewer using the same transform. They land in `src/render/canvas.js`, `src/render/draw-wizard.js` and `src/render/replay.js` as part of this task. Anything in those hunks that writes sim state stays where it is — only the draw side moves.

**Interfaces:**
- Consumes: `initCanvas`/`W`/`H` from `src/render/canvas.js`.
- Produces:
  - `updateCamera(now, pts)` — `pts` is `Array<{x, y, r}>`; smooths toward the fit box.
  - `cameraPoints()` — builds `pts` from live `players` + `game.boss` (couch path).
  - `beginWorld()` / `endWorld()` — push/pop the world transform on the 2D context.
  - `clearFrame(color)`, `cameraViewRect()`, `screenToWorld(sx, sy)`, `cameraParallax()`.
  - `setCameraEnabled(on)` / `cameraEnabled()` — F9 toggle.
  - `addTrauma(amount)` — replaces the old `addShake`.
  - `resetCamera()` — restores `CAM` to its declared initial values; called at round start and by the tests.

**Constraint:** `src/render/` may read sim objects but must not write them. `cameraPoints()` reads `p.body.position` and `game.boss.body.bounds` — reads only. Do not import `camera.js` from anything under `src/sim/`.

- [ ] **Step 1: Write the failing test**

Create `test/camera-framing.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  updateCamera, cameraViewRect, screenToWorld, setCameraEnabled, resetCamera,
} from '../src/render/camera.js';

// A camera that frames the fight has exactly one job: everyone it was given is
// inside the rect it produces. These run headless, so they exercise the maths
// only — beginWorld/endWorld need a real 2D context and are covered by the
// browser suite.
test('the view rect contains every point it was given', () => {
  resetCamera();
  const pts = [
    { x: 300, y: 500, r: 26 },
    { x: 900, y: 560, r: 26 },
  ];
  for (let i = 0; i < 600; i++) updateCamera(i * 16, pts); // let the easing settle
  const r = cameraViewRect();
  for (const p of pts) {
    assert.ok(p.x - p.r >= r.x && p.x + p.r <= r.x + r.w, `${p.x} outside ${r.x}..${r.x + r.w}`);
    assert.ok(p.y - p.r >= r.y && p.y + p.r <= r.y + r.h, `${p.y} outside ${r.y}..${r.y + r.h}`);
  }
});

test('zoom never goes below 1 — the arena is one screen', () => {
  resetCamera();
  const spread = [{ x: -400, y: -200, r: 26 }, { x: 2000, y: 1200, r: 26 }];
  for (let i = 0; i < 600; i++) updateCamera(i * 16, spread);
  const r = cameraViewRect();
  assert.ok(r.w <= 1280 + 1e-6, `view wider than the arena: ${r.w}`);
});

test('screenToWorld inverts the world transform', () => {
  resetCamera();
  const pts = [{ x: 640, y: 400, r: 26 }, { x: 700, y: 430, r: 26 }];
  for (let i = 0; i < 600; i++) updateCamera(i * 16, pts);
  const w = screenToWorld(640, 360);
  const r = cameraViewRect();
  assert.ok(Math.abs(w.x - (r.x + r.w / 2)) < 0.5, 'screen centre maps to view centre');
  assert.ok(Math.abs(w.y - (r.y + r.h / 2)) < 0.5, 'screen centre maps to view centre');
});

test('disabled, the camera is the identity framing', () => {
  resetCamera();
  setCameraEnabled(false);
  for (let i = 0; i < 300; i++) updateCamera(i * 16, [{ x: 100, y: 100, r: 26 }]);
  const r = cameraViewRect();
  assert.deepEqual(
    { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) },
    { x: 0, y: 0, w: 1280, h: 720 },
    'F9 off must reproduce the old fixed framing exactly',
  );
  setCameraEnabled(true);
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
node --test test/camera-framing.test.js
```

Expected: FAIL — `Cannot find module '../src/render/camera.js'`.

- [ ] **Step 3: Port the module**

Author `src/render/camera.js` from `git show origin/main:js/camera.js`, with these changes and nothing else:
- `import { W, H } from './canvas.js';` instead of relying on globals.
- Export every symbol in the Interfaces block above.
- Replace `typeof players !== 'undefined'` / `typeof game !== 'undefined'` guards with real imports (`import { players } from '../sim/player/lifecycle.js'; import { game } from '../sim/match.js';`) inside `cameraPoints()` only.
- Add `resetCamera()` — sets `CAM` back to its declared initial values. The tests need it and so does round start.
- Keep `CAM_TUNE` values exactly as upstream authored them (`min: 1, max: 2.15, padX: 170, padY: 105, headroom: 60, lerpIn: 0.035, lerpOut: 0.10, panLerp: 0.06, maxTrauma: 26, shakePx: 22, shakeRot: 0.012`). They are tuned; do not adjust.

- [ ] **Step 4: Run the test to verify it passes**

```bash
node --test test/camera-framing.test.js
```

Expected: 4/4 PASS.

- [ ] **Step 5: Wire it into the draw path**

In `src/render/draw-world.js`, wrap the world-space drawing in `beginWorld()`/`endWorld()` and replace the existing full-canvas clear with `clearFrame(color)`. Route the existing screen-space HUD draw **outside** `endWorld()` so it stays unzoomed. In `src/platform/input-keyboard.js`, bind F9 to `setCameraEnabled(!cameraEnabled())`.

- [ ] **Step 6: Full suite + build**

```bash
npm test && npm run build && npm run build:guide
```

Expected: 178/178 pass (174 + 4 new). The purity gates must stay green — if `render/ never writes sim state` fires, `camera.js` is mutating something it should only read.

- [ ] **Step 7: Commit**

```bash
git add src/render/camera.js src/render/draw-world.js src/render/canvas.js src/platform/input-keyboard.js test/camera-framing.test.js dist/
git commit -m "render: the fit-to-action camera, ported to the module layout"
```

Then flip the camera row in `docs/PORT-LOG.md` to `done` as part of this commit.

---

### Task 3: Bloom and the light pass

**Files:**
- Create: `src/render/bloom.js`
- Modify: `src/render/artkit.js`, `src/render/draw-world.js`
- Test: `test/bloom-budget.test.js`

**Source:** `git show origin/main:js/bloom.js` plus the `js/artkit.js` hunks in c11b4b2 (282 insertions — the "real pixels" pass).

**Interfaces:**
- Consumes: `beginWorld`/`endWorld`/`cameraViewRect` from Task 2.
- Produces: `applyBloom(now)`, `setBloomEnabled(on)`, `bloomEnabled()`, and from `artkit.js` the light-pass entry upstream added. Keep `BLOOM` tuning constants byte-identical to upstream.

**Constraint:** bloom allocates offscreen canvases (`_ensureBloomBuffers`). That is `document.createElement('canvas')` — legal in `src/render/`, banned in `src/sim/`. Guard it so the headless Node path never calls it: `applyBloom` must return immediately when there is no canvas context.

- [ ] **Step 1: Write the failing test**

Create `test/bloom-budget.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyBloom, setBloomEnabled, bloomEnabled } from '../src/render/bloom.js';

// The headless server imports the render tree only through the bundle graph,
// never to draw — but a stray document.createElement at import time would take
// the whole sim host down. This is the guard for that.
test('bloom is inert without a canvas', () => {
  assert.doesNotThrow(() => applyBloom(0), 'applyBloom must no-op headless');
});

test('the toggle round-trips', () => {
  const before = bloomEnabled();
  setBloomEnabled(!before);
  assert.equal(bloomEnabled(), !before);
  setBloomEnabled(before);
  assert.equal(bloomEnabled(), before);
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
node --test test/bloom-budget.test.js
```

Expected: FAIL — module not found.

- [ ] **Step 3: Port bloom and the artkit light pass**

Author `src/render/bloom.js` from upstream's `js/bloom.js`, converting the module-private `_bufA/_bufB/_bctxA/_bctxB/_bufW/_bufH` globals to module scope and exporting the three functions above. Add an early `if (!hasContext()) return;` at the top of `applyBloom` and `_ensureBloomBuffers`.

Then apply the c11b4b2 `js/artkit.js` hunks to `src/render/artkit.js`. Take them hunk by hunk — this branch's `artkit.js` is 1,377 lines and already diverged from upstream's; port the *intent* of each hunk into the branch's function of the same name rather than pasting.

- [ ] **Step 4: Run the test to verify it passes**

```bash
node --test test/bloom-budget.test.js
```

Expected: 2/2 PASS.

- [ ] **Step 5: Wire the pass into draw-world**

Call `applyBloom(now)` in `src/render/draw-world.js` after `endWorld()` and before the HUD, matching upstream's ordering in `js/game.js`.

- [ ] **Step 6: Full suite + build**

```bash
npm test && npm run build && npm run build:guide
```

Expected: 180/180 pass.

- [ ] **Step 7: Commit**

```bash
git add src/render/bloom.js src/render/artkit.js src/render/draw-world.js test/bloom-budget.test.js dist/ docs/PORT-LOG.md
git commit -m "render: the light pass and bloom, behind a headless guard"
```

---

### Task 4: The particle budget

**Files:**
- Modify: `src/render/fx.js`, `src/render/artkit.js`
- Test: `test/particle-budget.test.js`

**Source:** the `js/fx.js` (85 insertions) and `js/artkit.js` (215 insertions) hunks in c1ee936.

**Interfaces:**
- Consumes: `pumpEmitted`, `updateParticles` (existing exports of `src/render/fx.js`).
- Produces: `setParticleBudget(n)`, `particleCount()`, and a budget that drops the oldest cosmetic particles once the cap is hit.

**Constraint:** the budget lives entirely in `src/render/`. `src/sim/` keeps emitting descriptors unconditionally — a sim that emits differently under load is a sim that desyncs.

- [ ] **Step 1: Write the failing test**

Create `test/particle-budget.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnParticle, updateParticles, particleCount, setParticleBudget } from '../src/render/fx.js';

test('the budget caps the particle array', () => {
  setParticleBudget(50);
  for (let i = 0; i < 500; i++) spawnParticle({ x: i, y: 0, vx: 0, vy: 0, life: 100, color: '#fff' });
  assert.ok(particleCount() <= 50, `budget blown: ${particleCount()}`);
});

test('the newest particles survive the cull', () => {
  setParticleBudget(10);
  for (let i = 0; i < 100; i++) spawnParticle({ x: i, y: 0, vx: 0, vy: 0, life: 100, color: '#fff' });
  updateParticles(1);
  assert.ok(particleCount() <= 10);
  assert.ok(particleCount() > 0, 'the cull must not empty the array');
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
node --test test/particle-budget.test.js
```

Expected: FAIL — `setParticleBudget is not a function`.

- [ ] **Step 3: Implement the budget**

Port c1ee936's budget logic into `src/render/fx.js`, exporting `setParticleBudget` and `particleCount`. If `spawnParticle` is not already exported, export it. Apply the matching `artkit.js` hunks for the budget-aware draw calls.

- [ ] **Step 4: Run the test to verify it passes**

```bash
node --test test/particle-budget.test.js
```

Expected: 2/2 PASS.

- [ ] **Step 5: Full suite + build**

```bash
npm test && npm run build && npm run build:guide
```

Expected: 182/182 pass.

- [ ] **Step 6: Commit**

```bash
git add src/render/fx.js src/render/artkit.js test/particle-budget.test.js dist/ docs/PORT-LOG.md
git commit -m "render: a particle budget, so a busy round stays a readable one"
```

---

### Task 5: Cast descriptors

**Files:**
- Create: `src/sim/spells/cast-kind.js`
- Modify: `src/platform/spell-guide.js`, `src/render/hud.js`
- Test: `test/cast-kind.test.js`

**Source:** `git show origin/main:js/spellcast.js` (c1ee936, 90 lines) — `CAST_KINDS`, `CAST_OVERRIDES`, `CAST_RULES`, `classifyCast(id, def)`, `castKind(id)`, `classifyAllCasts()`.

**Interfaces:**
- Consumes: `SPELLS` from `src/sim/spells/book.js`.
- Produces: `CAST_KINDS`, `castKind(id)`, `classifyAllCasts()`.

**Constraint:** this is pure classification over static spell data — no randomness, no clock, no DOM. It belongs in `src/sim/spells/`, so all sim gates apply. `test/vfx-descriptors.test.js` already exists and covers a different descriptor set; do not modify it.

- [ ] **Step 1: Write the failing test**

Create `test/cast-kind.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../src/sim/content.js';
import { SPELLS } from '../src/sim/spells/book.js';
import { CAST_KINDS, castKind, classifyAllCasts } from '../src/sim/spells/cast-kind.js';

test('every spell classifies to a known kind', () => {
  const kinds = new Set(Object.keys(CAST_KINDS));
  const bad = [];
  for (const s of SPELLS) {
    const k = castKind(s.id);
    if (!kinds.has(k)) bad.push(`${s.id} → ${k}`);
  }
  assert.deepEqual(bad, [], `unclassifiable spells:\n${bad.join('\n')}`);
});

test('classification is total and stable', () => {
  const a = classifyAllCasts();
  const b = classifyAllCasts();
  assert.equal(Object.keys(a).length, SPELLS.length, 'every spell must get a verdict');
  assert.deepEqual(a, b, 'classification must be deterministic');
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
node --test test/cast-kind.test.js
```

Expected: FAIL — module not found.

- [ ] **Step 3: Port the classifier**

Author `src/sim/spells/cast-kind.js` from upstream, importing `SPELLS` rather than reading a global. Keep `CAST_OVERRIDES` and the `CAST_RULES` order exactly — the rules are first-match-wins and reordering silently reclassifies spells.

- [ ] **Step 4: Run the test to verify it passes**

```bash
node --test test/cast-kind.test.js
```

Expected: 2/2 PASS. If the first test fails, upstream's overrides reference spell ids this branch renamed — add the branch's id to `CAST_OVERRIDES` rather than loosening the assertion.

- [ ] **Step 5: Surface it**

In `src/platform/spell-guide.js` and `src/render/hud.js`, show the cast kind where upstream showed it (`spell-guide.html` gained one line in c1ee936; match it).

- [ ] **Step 6: Full suite + build**

```bash
npm test && npm run build && npm run build:guide
```

Expected: 184/184 pass, `module-boundaries` green.

- [ ] **Step 7: Commit**

```bash
git add src/sim/spells/cast-kind.js src/platform/spell-guide.js src/render/hud.js test/cast-kind.test.js dist/ docs/PORT-LOG.md
git commit -m "sim: spells say how they cast"
```

---

### Task 6: The frame profiler

**Files:**
- Create: `src/render/profiler.js`
- Modify: `src/platform/browser.js`, `src/platform/input-keyboard.js`
- Test: `test/profiler.test.js`

**Source:** `git show origin/main:js/profiler.js` (3c2b225, 316 lines).

**Interfaces:**
- Produces: `perfFrameStart()`, `perfFrameEnd()`, `perfBegin(name)`, `perfEnd()`, `perfCount(name, value)`, `drawPerfHud(now)`, `perfDump()`, `perfSetEnabled(on)`.

**Constraint:** the profiler reads `performance.now()` and draws a HUD — both banned in `src/sim/`, both fine in `src/render/`. It must never be imported from `src/sim/**`, so sim-phase timings are taken by wrapping the `stepSim()` call in `src/platform/browser.js`, not by instrumenting inside the sim.

- [ ] **Step 1: Write the failing test**

Create `test/profiler.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { perfFrameStart, perfFrameEnd, perfBegin, perfEnd, perfCount, perfDump, perfSetEnabled } from '../src/render/profiler.js';

test('a frame records its phases without a canvas', () => {
  perfSetEnabled(true);
  perfFrameStart();
  perfBegin('sim'); perfEnd();
  perfBegin('draw'); perfEnd();
  perfCount('particles', 120);
  perfFrameEnd();
  const dump = perfDump();
  assert.ok(dump, 'perfDump must return a summary');
  assert.ok(/sim/.test(JSON.stringify(dump)), 'the sim phase must appear in the dump');
});

test('unbalanced perfEnd does not corrupt the next frame', () => {
  perfSetEnabled(true);
  perfFrameStart();
  perfEnd(); // stray
  perfFrameEnd();
  perfFrameStart();
  perfBegin('sim'); perfEnd();
  perfFrameEnd();
  assert.ok(perfDump(), 'the profiler must survive a stray perfEnd');
});

test('disabled, the hooks are free', () => {
  perfSetEnabled(false);
  assert.doesNotThrow(() => { perfFrameStart(); perfBegin('x'); perfEnd(); perfFrameEnd(); });
  perfSetEnabled(true);
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
node --test test/profiler.test.js
```

Expected: FAIL — module not found.

- [ ] **Step 3: Port the profiler**

Author `src/render/profiler.js` from upstream, keeping `PERF_CAP = 240`, `PERF_MAX_SLOTS = 32`, `PERF_HITCH_MS = 22`, `PERF_KEEP_HITCHES = 6`, `PERF_PANEL_W = 268` as authored. Guard `drawPerfHud` so it returns early with no canvas context.

- [ ] **Step 4: Run the test to verify it passes**

```bash
node --test test/profiler.test.js
```

Expected: 3/3 PASS.

- [ ] **Step 5: Wire the hooks**

In `src/platform/browser.js`, wrap the `step` callback and the `draw(simNow())` call:

```javascript
const loop = createTickLoop({
  step: () => {
    perfBegin('sim'); stepSim(); perfEnd();
    perfBegin('fx'); pumpEmitted(); updateParticles(1); perfEnd();
  },
});
```

and bracket the body of `frame()` with `perfFrameStart()` / `perfFrameEnd()`, calling `drawPerfHud(now)` last. Bind the profiler toggle to the key upstream used in `js/input.js` (c11b4b2's `js/input.js` hunk — check `git show c11b4b2:js/input.js`).

- [ ] **Step 6: Full suite + build**

```bash
npm test && npm run build && npm run build:guide
```

Expected: 187/187 pass.

- [ ] **Step 7: Commit**

```bash
git add src/render/profiler.js src/platform/browser.js src/platform/input-keyboard.js test/profiler.test.js dist/ docs/PORT-LOG.md
git commit -m "render: the frame profiler, hooked from the platform edge"
```

---

### Task 7: Bots — ledge avoidance, retreat, double jump

**Files:**
- Modify: `src/sim/ai/bot.js`, `src/sim/player/controller.js`
- Test: `test/bot-navigation.test.js`

**Source:** 83ad928 (ledges, 131 insertions), 5292ab8 (retreat, + `js/player.js`), 832ef00 (double jump, 31 insertions) — all against `js/bot.js`.

**Interfaces:**
- Consumes: `simRandom`, `rand`, `pick` from `src/sim/rng.js`; `phys` facade for ground probes.
- Produces: on `BotController` — `wouldStepOffLedge(p, dir)` returning boolean, and a `retreat` field on the plan object. `BOT_PERSONAS` gains upstream's retreat tuning key.

**Constraint — the one that matters most in this plan:** upstream's bot calls `Math.random()` for its blunders and its retreat rolls. Every one of those becomes `simRandom()`. A single `Math.random()` under `src/sim/` fails `test/sim-purity.test.js` *and* silently breaks `test/determinism.test.js` and the golden tape. Also: ground probes must go through `src/sim/phys/facade.js`, never a `Query.` call.

- [ ] **Step 1: Write the failing test**

Create `test/bot-navigation.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../src/sim/content.js';
import { createSim } from '../src/platform/node.js';
import { game, startRound } from '../src/sim/match.js';
import { players } from '../src/sim/player/lifecycle.js';
import { addBot } from '../src/sim/ai/bot.js';
import { stepSim } from '../src/sim/tick.js';

function botRound(seed = 7) {
  const bridge = createSim({ seed });
  addBot('brawler');
  addBot('trickster');
  startRound(0);
  return bridge;
}

test('bots do not walk off the map', () => {
  botRound();
  const fell = [];
  for (let i = 0; i < 1800; i++) {
    stepSim();
    for (const p of players) {
      if (p.body && p.body.position.y > 900 && p.alive) fell.push(p.name);
    }
  }
  assert.deepEqual([...new Set(fell)], [], `bots walked into the void: ${fell.join(', ')}`);
});

// The whole point of routing bot randomness through simRandom: same seed, same
// round, byte-identical decisions. This is the test that catches a stray
// Math.random the purity scanner would only catch if it were on its own line.
test('bot decisions are seed-reproducible', () => {
  const trace = () => {
    botRound(99);
    const out = [];
    for (let i = 0; i < 600; i++) {
      stepSim();
      for (const p of players) out.push(`${p.name}:${Math.round(p.body?.position.x ?? 0)}`);
    }
    return out.join('|');
  };
  assert.equal(trace(), trace(), 'the same seed must produce the same bot round');
});

test('a bot with an air jump uses it to cross a gap it cannot walk', () => {
  botRound(3);
  const bot = players.find((p) => p.bot);
  assert.ok(bot, 'the round must seat a bot');
  let airJumps = 0;
  for (let i = 0; i < 1200; i++) {
    const wasAir = !bot.grounded;
    const vyBefore = bot.body?.velocity.y ?? 0;
    stepSim();
    const vyAfter = bot.body?.velocity.y ?? 0;
    if (wasAir && vyAfter < vyBefore - 3) airJumps++;
  }
  assert.ok(airJumps > 0, 'the bot never used its double jump in 20s of play');
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
node --test test/bot-navigation.test.js
```

Expected: FAIL — the ledge and air-jump assertions fail against the un-ported bot.

- [ ] **Step 3: Port the three bot commits, in upstream order**

Apply 83ad928, then 5292ab8, then 832ef00 into `src/sim/ai/bot.js`. Convert every `Math.random()` to `simRandom()` as you go. Take 5292ab8's `js/player.js` hunk into `src/sim/player/controller.js` (it is the movement side of retreat).

Confirm no entropy leaked in:

```bash
grep -n 'Math.random' src/sim/ai/bot.js src/sim/player/controller.js
```

Expected: no output.

- [ ] **Step 4: Run the test to verify it passes**

```bash
node --test test/bot-navigation.test.js
```

Expected: 3/3 PASS.

- [ ] **Step 5: Full suite + build**

```bash
npm test && npm run build && npm run build:guide
```

Expected: 190/190 pass. `test/golden-tape.test.js` **will** fail — bot behavior changed, so the recorded tape no longer matches. That is expected and correct. Re-record it deliberately:

```bash
npm run tape:record
git diff --stat test/tape
```

Confirm the diff is the tape only, then re-run `npm test` and expect green. If `determinism.test.js` fails, a `Math.random()` survived — go back to Step 3.

- [ ] **Step 6: Commit**

```bash
git add src/sim/ai/bot.js src/sim/player/controller.js test/bot-navigation.test.js test/tape dist/ docs/PORT-LOG.md
git commit -m "sim: bots read ledges, retreat, and know about the double jump

Upstream rolled these on Math.random; under this layout they roll on the
seeded stream, so a bot round replays. Golden tape re-recorded to match."
```

---

### Task 8: Spawn safety

**Files:**
- Modify: `src/sim/maps/builders.js`
- Create: `server/verify-spawns.js`
- Test: `test/spawn-escape.test.js`

**Source:** 3c2b225 (`js/maps.js` +240, `server/verify-spawns.js` +166), b798196 (`js/maps.js` +8), 898d796 (`js/maps.js` +59, the half-cell fix and the landing test).

**Interfaces:**
- Produces, from `src/sim/maps/builders.js`: `buildReach(m)`, `reachFrom(g, start)`, `reachCount(g, best)`, `reachLanding(g, x, y)`, `reachEscape(g, land)`, `reachInfo(m)`, `reachLandable(g, i)`, `spawnEscapes(m, x, y)`. Tuning constants `REACH_CELL = 16`, `REACH_PAD = 15`, `REACH_CLIMB = 21`, `REACH_SHARE = 0.35` keep upstream's values (898d796 adjusted these — take the *final* values, not c11b4b2's).

**Constraint:** this is sim code, so the escape analysis must be deterministic and facade-only. Upstream's comment says the analysis is read-only and host-side; in this layout it runs inside the sim on every peer, which is *better* — but it means it must not consult anything the seeded stream cannot reproduce.

- [ ] **Step 1: Write the failing test**

Create `test/spawn-escape.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../src/sim/content.js';
import { createSim } from '../src/platform/node.js';
import { MAPS, spawnEscapes, reachInfo } from '../src/sim/maps/builders.js';
import { startRound } from '../src/sim/match.js';
import { players } from '../src/sim/player/lifecycle.js';
import { stepSim } from '../src/sim/tick.js';

test('every map reports a reach grid', () => {
  createSim({ seed: 1 });
  const broken = [];
  for (let i = 0; i < MAPS.length; i++) {
    startRound(i);
    const info = reachInfo(MAPS[i]);
    if (!info || !info.grid) broken.push(MAPS[i].name);
  }
  assert.deepEqual(broken, [], `maps with no reach analysis: ${broken.join(', ')}`);
});

// The real acceptance criterion, and the one 898d796 added upstream: a wizard
// dropped at its spawn must actually come to rest somewhere it can leave.
test('no spawn strands a wizard, across seeds', () => {
  const stranded = [];
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    createSim({ seed });
    for (let i = 0; i < MAPS.length; i++) {
      startRound(i);
      const m = MAPS[i];
      for (const s of m.spawns ?? []) {
        if (!spawnEscapes(m, s.x, s.y)) stranded.push(`${m.name} seed ${seed} @ ${s.x},${s.y}`);
      }
    }
  }
  assert.deepEqual(stranded, [], `sealed spawns:\n${stranded.join('\n')}`);
});

test('a wizard dropped at spawn is standing 2s later', () => {
  createSim({ seed: 11 });
  const bad = [];
  for (let i = 0; i < MAPS.length; i++) {
    startRound(i);
    for (let t = 0; t < 120; t++) stepSim();
    for (const p of players) {
      if (p.alive && p.body && p.body.position.y > 900) bad.push(`${MAPS[i].name}: ${p.name}`);
    }
  }
  assert.deepEqual(bad, [], `spawns that drop into the void:\n${bad.join('\n')}`);
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
node --test test/spawn-escape.test.js
```

Expected: FAIL — `spawnEscapes is not a function`.

- [ ] **Step 3: Port the escape analysis**

Apply 3c2b225's `js/maps.js` hunk into `src/sim/maps/builders.js`, then b798196's, then 898d796's (which supersedes parts of the first — apply in order and keep the final state). Convert any Matter namespace call to the facade. Export the eight functions listed above.

- [ ] **Step 4: Run the test to verify it passes**

```bash
node --test test/spawn-escape.test.js
```

Expected: 3/3 PASS across all 110 maps × 6 seeds. A failure here is a real authored-map defect, not a port bug — record the map in `docs/PORT-LOG.md` and nudge the spawn, exactly as upstream's `moved`/`nudged` counters do.

- [ ] **Step 5: Port the verifier**

Author `server/verify-spawns.js` from upstream, importing from `src/sim/maps/builders.js` and `src/platform/node.js` instead of loading `js/` into a context. Keep the `--seeds` (default 6) and `--map` flags and the `mapsChecked / slotsChecked / authoredBad / moved / nudged / finalBad / physicsBad` tally.

```bash
node server/verify-spawns.js --seeds 6
```

Expected: exit 0, `finalBad 0` and `physicsBad 0`.

- [ ] **Step 6: Full suite + build**

```bash
npm test && npm run build && npm run build:guide
```

Expected: 193/193 pass. If the golden tape moves, spawn positions changed — re-record as in Task 7 Step 5 and say so in the commit.

- [ ] **Step 7: Commit**

```bash
git add src/sim/maps/builders.js server/verify-spawns.js test/spawn-escape.test.js dist/ docs/PORT-LOG.md
git commit -m "sim: no wizard starts a round somewhere it cannot leave"
```

---

### Task 9: Snapshot playout and server-clock interpolation

**Files:**
- Modify: `src/net/client.js`, `src/sim/snapshot.js`, `src/net/server-bridge.js`
- Test: `test/snapshot-playout.test.js`

**Source:** the `js/net.js` hunks in c11b4b2 (30 lines, "interpolation on the SERVER clock") and 3c2b225 (145 lines, playout buffer), plus `js/snapshot.js` in c11b4b2/4302ace/3c2b225.

**Interfaces:**
- Produces, from `src/net/client.js`: `pushSnapshot(snap, recvAt)`, `playoutAt(now)` returning the interpolated frame or `null`, `setPlayoutDelay(ms)`, `playoutStats()` returning `{ buffered, delay, drift }`.

**Constraint:** `src/sim/snapshot.js` is sim-side and stays platform-free — the buffer and the wall clock live in `src/net/client.js`. Do not bump the wire protocol: `server/room.js` speaks v9 and `pr/online-sessions` builds on that. If a field must be added to the snapshot, add it optional and tolerate its absence.

- [ ] **Step 1: Write the failing test**

Create `test/snapshot-playout.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pushSnapshot, playoutAt, setPlayoutDelay, playoutStats, resetPlayout } from '../src/net/client.js';

const snap = (t, x) => ({ t, v: 9, players: [{ id: 1, x, y: 100, hp: 100 }] });

test('playout interpolates between the two straddling snapshots', () => {
  resetPlayout();
  setPlayoutDelay(100);
  pushSnapshot(snap(1000, 0), 1000);
  pushSnapshot(snap(1100, 100), 1100);
  const f = playoutAt(1150); // 100ms behind → sim time 1050 → halfway
  assert.ok(f, 'a frame must be available');
  assert.ok(Math.abs(f.players[0].x - 50) < 1e-6, `expected 50, got ${f.players[0].x}`);
});

test('playout holds the last frame rather than extrapolating into a gap', () => {
  resetPlayout();
  setPlayoutDelay(100);
  pushSnapshot(snap(1000, 0), 1000);
  pushSnapshot(snap(1100, 100), 1100);
  const f = playoutAt(2000); // far past the buffer
  assert.ok(f, 'a stall must still render something');
  assert.ok(f.players[0].x <= 100, 'never extrapolate past the last known position');
});

test('the buffer does not grow without bound', () => {
  resetPlayout();
  setPlayoutDelay(100);
  for (let i = 0; i < 2000; i++) pushSnapshot(snap(1000 + i * 50, i), 1000 + i * 50);
  assert.ok(playoutStats().buffered < 100, `buffer leaked: ${playoutStats().buffered}`);
});

test('an out-of-order snapshot is ignored, not rendered', () => {
  resetPlayout();
  setPlayoutDelay(100);
  pushSnapshot(snap(1000, 0), 1000);
  pushSnapshot(snap(1100, 100), 1100);
  pushSnapshot(snap(1050, 999), 1120); // late arrival, already played past
  const f = playoutAt(1150);
  assert.ok(Math.abs(f.players[0].x - 50) < 1e-6, 'a stale snapshot must not warp the view');
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
node --test test/snapshot-playout.test.js
```

Expected: FAIL — `pushSnapshot is not a function`.

- [ ] **Step 3: Port the playout buffer**

Apply the `js/net.js` interpolation hunks into `src/net/client.js`, exporting the five functions above plus `resetPlayout()`. Take the `js/snapshot.js` hunks into `src/sim/snapshot.js` — but only the *encoding* changes; anything reading a wall clock stays on the client side.

- [ ] **Step 4: Run the test to verify it passes**

```bash
node --test test/snapshot-playout.test.js
```

Expected: 4/4 PASS.

- [ ] **Step 5: Full suite + build**

```bash
npm test && npm run build && npm run build:guide
```

Expected: 197/197 pass.

- [ ] **Step 6: Commit**

```bash
git add src/net/client.js src/sim/snapshot.js src/net/server-bridge.js test/snapshot-playout.test.js dist/ docs/PORT-LOG.md
git commit -m "net: snapshot playout on the server clock"
```

---

### Task 10: Opening loadouts

**Files:**
- Modify: `src/sim/pickups.js`, `src/sim/events.js`, `src/sim/match.js`
- Test: `test/opening-loadout.test.js`

**Source:** the `js/pickups.js` (+25/+34) and `js/events.js` (+31) hunks in 3c2b225 and c1ee936, plus the `js/game.js` (+36) round-start hunk.

**Interfaces:**
- Produces: `openingLoadout(p, rng)` in `src/sim/pickups.js`, called from round start; every player begins the round holding spells rather than empty slots.

**Constraint:** the loadout is rolled from the seeded stream, so two peers deal the same opening hand. `simRandom()` only.

- [ ] **Step 1: Write the failing test**

Create `test/opening-loadout.test.js`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../src/sim/content.js';
import { createSim } from '../src/platform/node.js';
import { startRound } from '../src/sim/match.js';
import { players } from '../src/sim/player/lifecycle.js';

function opening(seed) {
  const bridge = createSim({ seed });
  bridge.addPlayer({ name: 'a' });
  bridge.addPlayer({ name: 'b' });
  startRound(0);
  return players.map((p) => p.slots.join(','));
}

test('everyone starts the round with a loadout', () => {
  const hands = opening(5);
  for (const h of hands) {
    assert.ok(h.length > 0, 'a wizard must not start empty-handed');
    assert.ok(!/^,*$/.test(h), `empty slots: "${h}"`);
  }
});

test('the opening hand is seed-reproducible', () => {
  assert.deepEqual(opening(42), opening(42), 'same seed must deal the same hand');
});

test('different seeds deal different hands', () => {
  assert.notDeepEqual(opening(1), opening(2), 'the loadout must actually be rolled');
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
node --test test/opening-loadout.test.js
```

Expected: FAIL — wizards start with empty slots.

- [ ] **Step 3: Port the loadout**

Apply the pickups/events/round-start hunks, converting randomness to `simRandom()`.

- [ ] **Step 4: Run the test to verify it passes**

```bash
node --test test/opening-loadout.test.js
```

Expected: 3/3 PASS.

- [ ] **Step 5: Full suite + build**

```bash
npm test && npm run build && npm run build:guide
```

Expected: 200/200 pass. Re-record the golden tape if round openings changed, as in Task 7 Step 5.

- [ ] **Step 6: Commit**

```bash
git add src/sim/pickups.js src/sim/events.js src/sim/match.js test/opening-loadout.test.js test/tape dist/ docs/PORT-LOG.md
git commit -m "sim: wizards open the round holding something"
```

---

### Task 11: The camera frames the boss, online too

**Files:**
- Modify: `src/render/camera.js`, `src/render/draw-snapshot.js`
- Test: `test/camera-framing.test.js` (extend)

**Source:** 4302ace (`js/camera.js` +13, `js/snapshot.js` +11).

**Interfaces:**
- Consumes: `playoutAt(now)` from Task 9, `updateCamera(now, pts)` from Task 2.
- Produces: the online draw path feeds the camera interpolated ghost positions plus the boss extent, so a boss fight frames identically couch and online.

- [ ] **Step 1: Write the failing test**

Append to `test/camera-framing.test.js`:

```javascript
import { cameraPointsFromSnapshot } from '../src/render/draw-snapshot.js';

test('the boss is framed by its extent, not its centre', () => {
  const frame = {
    players: [{ id: 1, x: 600, y: 500, alive: true }],
    boss: { x: 900, y: 300, r: 140 },
  };
  const pts = cameraPointsFromSnapshot(frame);
  const boss = pts.find((p) => p.r > 100);
  assert.ok(boss, 'the boss must contribute a point');
  assert.ok(boss.r >= 140, `boss framed by centre only: r=${boss.r}`);
});

test('dead players do not drag the shot', () => {
  const frame = {
    players: [
      { id: 1, x: 600, y: 500, alive: true },
      { id: 2, x: -900, y: 1400, alive: false },
    ],
  };
  const pts = cameraPointsFromSnapshot(frame);
  assert.equal(pts.length, 1, 'a corpse flying off the map must not be a camera point');
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
node --test test/camera-framing.test.js
```

Expected: FAIL — `cameraPointsFromSnapshot` is not exported.

- [ ] **Step 3: Port the online framing**

Add `cameraPointsFromSnapshot(frame)` to `src/render/draw-snapshot.js` and apply 4302ace's `js/camera.js` hunk (boss extent, `bounds`-derived radius) to `src/render/camera.js`. In the online branch of the draw path, call `updateCamera(now, cameraPointsFromSnapshot(frame))`.

- [ ] **Step 4: Run the test to verify it passes**

```bash
node --test test/camera-framing.test.js
```

Expected: 6/6 PASS.

- [ ] **Step 5: Full suite + build**

```bash
npm test && npm run build && npm run build:guide
```

Expected: 202/202 pass.

- [ ] **Step 6: Commit**

```bash
git add src/render/camera.js src/render/draw-snapshot.js test/camera-framing.test.js dist/ docs/PORT-LOG.md
git commit -m "render: keep the boss framed, including online"
```

---

### Task 12: Close the ledger and verify the whole branch

**Files:**
- Modify: `docs/PORT-LOG.md`, `README.md`, `docs/PATCHNOTES.md`

- [ ] **Step 1: Confirm every row is done**

```bash
grep -c pending docs/PORT-LOG.md
```

Expected: `0`. Any remaining `pending` is upstream behavior this branch would silently drop — port it or write down why it does not apply.

- [ ] **Step 2: Confirm no upstream file was left behind**

```bash
git diff --stat origin/main HEAD -- js/ server/sim-bridge.js
```

Expected: shows those paths deleted, nothing else.

- [ ] **Step 3: Full verification**

```bash
npm test && npm run build && npm run build:guide && node server/verify-spawns.js --seeds 6
```

Expected: 202/202 unit tests, clean build, `finalBad 0`.

- [ ] **Step 4: Document the new keys and the port**

Add F9 (camera) and the profiler key to `README.md`'s controls, and a `docs/PATCHNOTES.md` entry describing the v10 features now living in `src/`.

- [ ] **Step 5: Commit and push**

```bash
git add docs/PORT-LOG.md README.md docs/PATCHNOTES.md
git commit -m "docs: the v10 port ledger balances"
git push fork pr/sim-refactor
```

---

### Task 13: Propagate up the stack

**Files:** none authored — this task is merges and re-verification.

**Interfaces:**
- Consumes: the completed `pr/sim-refactor`.
- Produces: `pr/e2e-suite` and `pr/online-sessions` carrying the same port, each verified with its own suite.

- [ ] **Step 1: Merge into pr/e2e-suite**

```bash
cd /home/fahim/Projects/hyper-spell
git checkout pr/e2e-suite
git merge pr/sim-refactor
```

`dist/` will conflict. Never hand-merge a bundle — rebuild it:

```bash
npm run build && npm run build:guide && git add dist/
```

- [ ] **Step 2: Update the e2e manifest for the new modules**

The suite has a coverage allowlist and a module manifest that enumerate `src/`. Add `src/render/camera.js`, `src/render/bloom.js`, `src/render/profiler.js`, `src/sim/spells/cast-kind.js`. Find them with:

```bash
grep -rln 'src/render/artkit.js' test/ e2e/ 2>/dev/null
```

- [ ] **Step 3: Verify**

```bash
npm test
```

Expected: 202/202. Then run the browser suite per `docs/` and expect the previously documented failures **and no new ones** — 6 known failures, unchanged. A seventh is a port regression.

- [ ] **Step 4: Commit and push**

```bash
git commit -m "merge: the v10 port, with the browser suite following the new modules"
git push fork pr/e2e-suite
```

- [ ] **Step 5: Merge into pr/online-sessions**

```bash
cd /home/fahim/Projects/hyper-spell-sessions
git merge pr/e2e-suite
npm run build && npm run build:guide && git add dist/
```

Pay attention to `src/net/client.js`: Task 9's playout buffer and this branch's session/rejoin flow both live there. Neither changes the v9 wire format, so the merge is additive — but re-read the merged file rather than trusting the auto-merge.

- [ ] **Step 6: Verify the online branch**

```bash
npm test && node server/verify-e2e.js
```

Expected: 235/235 unit (202 + this branch's 33) and 58/0 on verify-e2e. Then the browser suite: 29/29 across the menu, online and session specs.

- [ ] **Step 7: Commit and push**

```bash
git commit -m "merge: the v10 port, under the session flow"
git push fork pr/online-sessions
```

---

### Task 14: Re-describe the PRs

- [ ] **Step 1: Update each PR body**

For #3, #4, #5, state: the branch now merges cleanly into `origin/main`; the upstream range is present as re-implementations rather than a textual merge; `docs/PORT-LOG.md` is the ledger; and the golden tape was re-recorded (with the reason). Keep the existing note that the three are a stack.

```bash
gh pr edit 3 --body-file /tmp/claude-1000/-home-fahim-Projects-hyper-spell/ac586a3e-072b-470b-bb03-68b2b7d8aa87/scratchpad/pr3.md
```

- [ ] **Step 2: Confirm mergeability**

```bash
for n in 3 4 5; do gh pr view $n --json number,mergeable,mergeStateStatus; done
```

Expected: `MERGEABLE` on all three.
