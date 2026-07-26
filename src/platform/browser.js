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

let last = performance.now();
function frame(now) {
  if (netMode() === 'online') {
    netClientFrame(now);
    requestAnimationFrame(frame);
    return;
  }
  const rawDt = Math.min(now - last, 33);
  last = now;
  scanJoins();
  scanLobbyPads();
  stepSim(now, rawDt);
  draw(now);
  requestAnimationFrame(frame);
}
if (harness) globalThis.frame = frame; // the dev harness pages step the loop by hand
requestAnimationFrame(frame);
