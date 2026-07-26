// node.js — the headless entry. Replaces server/sim-context.js + server/shims.js:
// no vm, no fake canvas, no fake document, because src/sim/* no longer
// references any of them.
import '../../dist/extra-content.pack.js'; // pre-seeds globalThis.__hsPackData
import '../sim/content.js';                // fills SPELLS and MAPS, in order
import '../render/content-pack.js';        // the optional-content unlock probe
import { createWorld, destroyWorld } from '../sim/world.js';
import { setClock, setRandom, restoreRandom } from '../sim/env.js';
import { setStorage } from '../sim/storage.js';
import { clearAllScheduled } from '../sim/schedule.js';
import { loadMap } from '../sim/match.js';
import { installServerBridge, uninstallServerBridge } from '../net/server-bridge.js';

// opts: { onFx(name, args), telemetrySink(rec), onPackUnlocked(src), clock, random, storage }
export function createSim(opts = {}) {
  setClock(opts.clock ?? globalThis.performance);
  setRandom(opts.random ?? Math.random);
  setStorage(opts.storage);
  createWorld();
  // js/game.js:1541 loaded the first arena as a script side effect, and the vm
  // sandbox inherited that — the room can seat a player before the first tick,
  // and spawnPointFor needs a map. It also draws the first number off the seeded
  // stream (the map seed), which the golden tape's hashes depend on.
  loadMap(0);
  const bridge = installServerBridge(opts);
  return {
    bridge,
    destroy() {
      clearAllScheduled();
      uninstallServerBridge();
      restoreRandom();
      destroyWorld();
    },
  };
}
