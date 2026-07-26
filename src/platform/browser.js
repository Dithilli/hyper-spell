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
installDebugGlobals();
// the dev harness pages drive the game themselves and never wanted the menu
if (!/(^|[?&])nomenu(=|&|$)/.test(location.search)) mountMenu();

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
globalThis.frame = frame; // the dev harness pages step the loop by hand
requestAnimationFrame(frame);
