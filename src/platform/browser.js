// browser.js — the browser entry. One IIFE bundle loads this, so file://
// double-click play needs no server and no CDN.
import '../sim/content.js';         // fills SPELLS and MAPS, in the classic order
import '../render/content-pack.js'; // the optional-content unlock probe
import { initCanvas } from '../render/canvas.js';
import { createWorld } from '../sim/world.js';
import { setStorage } from '../sim/storage.js';
import { setPostTelemetry } from '../sim/telemetry.js';
import { postTelemetryHttp } from '../net/telemetry-post.js';
import { attachKeyboard } from './input-keyboard.js';
import { attachLobbyKeys, scanJoins, scanLobbyPads } from './join.js';
import { mountMenu } from './menu.js';
import { loadMap } from '../sim/match.js';
import { stepSim } from '../sim/tick.js';
import { createTickLoop } from '../sim/tick-loop.js';
import { simNow } from '../sim/time.js';
import { draw } from '../render/draw-world.js';
import { netClientFrame, netMode } from '../net/client.js';
import { installDebugGlobals } from './debug-globals.js';

const canvas = document.getElementById('game');
initCanvas(canvas);
createWorld();
setStorage(globalThis.localStorage);
setPostTelemetry(postTelemetryHttp);
attachKeyboard(canvas);
attachLobbyKeys();

// The dev harness pages tag the bundle's own src with ?nomenu — they are opened
// by file path, so the page URL carries no query. That flag means "an inline
// script is driving this page": it suppresses the online menu and is the only
// thing that publishes the module surface as globals.
//
// index.html gets neither. The published globals are accessors without setters,
// and the optional content pack runs its decrypted module as
// `new Function(code)()` at global scope — an assignment to one of them would be
// dropped in sloppy mode and throw in strict, and that throw would abort the
// unlock. A real player's page must not carry that hazard for a dev affordance.
const bundleSrc = document.currentScript?.src || '';
const harness = /[?&]nomenu\b/.test(bundleSrc) || /[?&]nomenu\b/.test(location.search);
if (harness) installDebugGlobals();
else mountMenu();

loadMap(0);

// The display draws whenever it likes; the simulation advances in fixed TICK_MS
// steps, as many as the elapsed real time paid for. A 144Hz monitor now draws
// 144 frames over the same 60 steps a 60Hz one runs, instead of racing ahead of
// the 60Hz server.
//
// The step callback hands stepSim nothing. The sim keeps its own clock now
// (simNow() = tick x TICK_MS) and advances the tick itself, so this loop's only
// job is deciding HOW MANY steps the elapsed real time paid for. The tick is
// deliberately not advanced here as well — that would run sim time at double
// rate.
const loop = createTickLoop({ step: () => stepSim() });

let last = performance.now();
function frame(now) {
  if (netMode() === 'online') {
    // the server owns the match now, so this frame simulated nothing. Keep
    // `last` current anyway: banking the online stretch would hand the local
    // accumulator minutes of "elapsed" time the moment we came back, and it
    // would spend it as a MAX_CATCHUP burst plus a bogus dropped-time report.
    last = now;
    netClientFrame(now);
    requestAnimationFrame(frame);
    return;
  }
  // once per FRAME, not per tick: both are edge-detecting input scans (a pad
  // pressed, a controller plugged in), and re-running them inside a catch-up
  // burst would swallow the edges. They are what seat a wizard at all.
  scanJoins();
  scanLobbyPads();
  loop.pump(now - last);
  last = now;
  // draw() is handed SIM time, not the rAF timestamp. The couch renderer is a
  // view of live sim objects, and almost every `now` it threads is compared
  // against a sim deadline — `now < p.frozenUntil` (draw-wizard.js:140),
  // `now < bannerUntil` (hud.js:169), `now - l.at` (the kill feed),
  // `now - p.casts[s]` (the cooldown rings), and every activeEffect's own
  // draw(now). Those deadlines are simNow() from this task on, and sim time
  // runs at paceScale() x real time, so feeding the renderer wall time would
  // put it (1 - 0.85) x uptime ahead of the sim: about 4.5s adrift after 30s,
  // 45s after five minutes, at which point no banner and no status overlay
  // ever draws again. The purely decorative uses of `now` (sine-driven glows)
  // become tick-quantised as a result, which costs nothing — a frame that ran
  // no tick redraws an unchanged world anyway.
  //
  // The ONLINE branch above is different and keeps wall time: it never runs
  // stepSim, it interpolates between wire snapshots stamped with its own real
  // clock, and it drives its cosmetic tick from src/net/client.js.
  draw(simNow());
  requestAnimationFrame(frame);
}
if (harness) globalThis.frame = frame; // the dev harness pages step the loop by hand
requestAnimationFrame(frame);
