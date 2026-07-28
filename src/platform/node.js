// node.js — the headless entry. Replaces server/sim-context.js + server/shims.js:
// no vm, no fake canvas, no fake document, because src/sim/* no longer
// references any of them.
import '../../dist/extra-content.pack.js'; // pre-seeds globalThis.__hsPackData
import '../sim/content.js';                // fills SPELLS and MAPS, in order
import '../render/content-pack.js';        // the optional-content unlock probe
import { createWorld, destroyWorld } from '../sim/world.js';
import { setClock } from '../sim/env.js';
import { resetTick } from '../sim/time.js';
import { setStorage } from '../sim/storage.js';
import { clearAllScheduled } from '../sim/schedule.js';
import { loadMap } from '../sim/match.js';
import { installServerBridge, uninstallServerBridge } from '../net/server-bridge.js';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// C7. THE HEADLESS SIM GETS A REAL STORE.
//
// The sim's only persistent read is wave mode's best score. In the browser that
// is localStorage; headless, server/shims.js faked localStorage as a thing that
// always answered null and swallowed writes, so an ONLINE wave run could never
// remember a best wave — you cleared wave 14 and the next run still showed
// nothing. The shim is gone but the amnesia outlived it, because the node
// platform passed `undefined` and src/sim/storage.js fell back to the same
// stand-in. It now gets a file.
//
// Small, synchronous and read-on-every-get on purpose: one key, touched twice
// per run (startRun reads, endRun writes). A corrupt or missing file reads as
// empty rather than throwing — a lost high score must never take the room down.
//
// The default lives beside the telemetry the same host already writes, which is
// the one directory this process is expected to own. HS_STATE_DIR overrides it
// (tests, and anyone running the server from a read-only tree).
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DEFAULT_STATE_DIR = join(REPO_ROOT, 'server', 'telemetry');

export function fileStorage(dir) {
  const file = join(dir, 'sim-state.json');
  const load = () => {
    try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return {}; }
  };
  return {
    getItem(k) {
      const v = load()[k];
      return v === undefined ? null : String(v);
    },
    setItem(k, v) {
      const data = load();
      data[k] = String(v);
      try {
        mkdirSync(dir, { recursive: true });
        writeFileSync(file, JSON.stringify(data));
      } catch (e) {
        console.warn(`sim state not persisted (${file}): ${e.message}`);
      }
    },
    removeItem(k) {
      const data = load();
      delete data[k];
      try { writeFileSync(file, JSON.stringify(data)); } catch {}
    },
  };
}

// opts: { onFx(name, args), telemetrySink(rec), onPackUnlocked(src), clock, storage }
//
// There is no `random` option: the sim owns its stream (src/sim/rng.js) and
// reseeds it per round from the map seed. A caller that wants a reproducible run
// calls reseed(seed) before createSim — loadMap(0) below already draws.
export function createSim(opts = {}) {
  setClock(opts.clock ?? globalThis.performance);
  setStorage(opts.storage ?? fileStorage(process.env.HS_STATE_DIR || DEFAULT_STATE_DIR));
  // the tick counter is sim state like any other: a rebuilt sim (the crash
  // watchdog in server/sim-host.js) has to start from the same tick 0 the first
  // one did, for the same reason createWorld() runs every module's reset hook.
  resetTick();
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
      destroyWorld();
    },
  };
}
