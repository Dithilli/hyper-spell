// sim-context.js — load the browser game files, unmodified, into a node:vm
// context so the sim runs headless. The game is classic scripts sharing one
// global lexical scope; vm.runInContext of sequential scripts reproduces that
// exactly (require() would wall each file into its own module scope and break
// every cross-file top-level const).
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { buildSandbox } = require('./shims');

const ROOT = path.join(__dirname, '..');

// index.html's script order, minus net.js (browser transport; the server-side
// equivalents live in sim-bridge.js). The content pack DOES load: evaluating
// extra-content.pack.js first pre-seeds globalThis.__hsPackData, so the
// loader's DOM script-injection fallback is never reached — unlocks work
// headless (sim-bridge probes player names on join/rename).
const SIM_FILES = [
  'server/node_modules/matter-js/build/matter.min.js',
  'js/core.js',
  'js/camera.js',
  'js/bloom.js',
  'js/artkit.js',
  'js/extra-content.pack.js',
  'js/extra-content.js',
  'js/audio.js',
  'js/fx.js',
  'js/awards.js',
  'js/telemetry.js',
  'js/input.js',
  'js/spells.js',
  'js/player.js',
  'js/pickups.js',
  'js/spellbook.js',
  'js/spelltiers.js',
  'js/spellcast.js',
  'js/hybrids.js',
  'js/maps.js',
  'js/mapbook.js',
  'js/events.js',
  'js/boss.js',
  'js/enemies.js',
  'js/bot.js',
  'js/snapshot.js',
  'js/game.js',
  'js/replay.js',
  'server/sim-bridge.js',
];

// opts: { emitFx(name, args), postTelemetry(rec), onPackUnlocked(src), clock }
function createSimContext(opts = {}) {
  const { sandbox, ctxCounter, flushTimers } = buildSandbox({ clock: opts.clock });
  sandbox.__emitFx = opts.emitFx || (() => {});
  sandbox.__postTelemetry = opts.postTelemetry || (() => {});
  sandbox.__onPackUnlocked = opts.onPackUnlocked || (() => {});
  const ctx = vm.createContext(sandbox);
  // classic scripts expect window/self; Matter's UMD attaches to the global this
  vm.runInContext('globalThis.window = globalThis; globalThis.self = globalThis;', ctx);
  for (const rel of SIM_FILES) {
    const file = path.join(ROOT, rel);
    const script = new vm.Script(fs.readFileSync(file, 'utf8'), { filename: rel });
    script.runInContext(ctx);
  }
  const bridge = vm.runInContext('__bridge', ctx);
  return {
    bridge,
    ctxCounter, // { calls } — any nonzero means a draw path ran headless (a bug)
    destroy() { flushTimers(); },
  };
}

module.exports = { createSimContext, SIM_FILES };
