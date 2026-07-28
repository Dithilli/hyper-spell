// input-keyboard.js — keyboard + mouse, with edge detection.
//
// js/input.js registered its listeners the moment the script loaded. Nothing
// headless has a keyboard, so attaching them is an explicit call the browser
// entry makes once the canvas exists.
import { W, H } from '../sim/world.js';
import { ensureAudio } from '../render/audio.js';
import { screenToWorld, setCameraEnabled, cameraEnabled } from '../render/camera.js';

export const keys = {};

// cast = slot A, cast2 = slot B (two spell slots), block = the parry
export const KEYMAPS = [
  { left: 'KeyA', right: 'KeyD', jump: 'KeyW', cast: 'KeyE', cast2: 'KeyQ', block: 'KeyS', label: 'E', label2: 'Q' },
  { left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp', cast: 'Enter', cast2: 'ShiftRight', block: 'ArrowDown', label: 'ENTER', label2: 'R-SHIFT' },
];

// Mouse state. sx/sy are SCREEN coords (the 1280x720 logical frame); x/y are the
// WORLD coords aim actually uses. With a camera between the two they are no
// longer the same point, and the world pair has to be re-derived every frame —
// the camera keeps moving under a stationary cursor, so deriving it on mousemove
// alone would leave aim pointing at wherever the world was when you last twitched.
export const mouse = { x: W / 2, y: H / 2, sx: W / 2, sy: H / 2, down: false, rdown: false, mdown: false, present: false };

// Called once per frame from the render path, right after updateCamera(). It
// lives here rather than inside camera.js so the dependency runs one way:
// platform imports render, never the reverse.
export function syncMouseWorld() {
  const w = screenToWorld(mouse.sx, mouse.sy);
  mouse.x = w.x;
  mouse.y = w.y;
}

export class KeyboardController {
  constructor(map, useMouse = false) {
    this.map = map;
    this.useMouse = useMouse;
    this.prev = { jump: false, cast: false, cast2: false, block: false, start: false };
    this.assigned = false;
  }
  poll() {
    const m = this.map;
    const useM = this.useMouse && mouse.present;
    const jump = !!keys[m.jump] || (this.useMouse && !!keys['Space']);
    const cast = !!keys[m.cast] || (useM && mouse.down);
    const cast2 = !!keys[m.cast2] || (useM && mouse.rdown);
    const block = !!keys[m.block] || (useM && mouse.mdown);
    const start = !!keys['Space'];
    const s = {
      move: (keys[m.right] ? 1 : 0) - (keys[m.left] ? 1 : 0),
      jump, cast, cast2, block,
      jumpPressed: jump && !this.prev.jump,
      castPressed: cast && !this.prev.cast,
      cast2Pressed: cast2 && !this.prev.cast2,
      blockPressed: block && !this.prev.block,
      startPressed: start && !this.prev.start,
      aimPoint: useM ? { x: mouse.x, y: mouse.y } : null,
      aimVec: null,
    };
    this.prev = { jump, cast, cast2, block, start };
    return s;
  }
}

// The two couch keyboard seats. js/game.js:2 built them at script load; they are
// created here so the array stays a stable import for the lobby and the reticle.
export const kbControllers = [];

export function attachKeyboard(canvas) {
  addEventListener('keydown', e => {
    ensureAudio();
    keys[e.code] = true;
    // F9 drops the camera back to the old fixed framing — for A/B'ing the shot,
    // and for anyone who would rather the arena just sat still
    if (e.code === 'F9') setCameraEnabled(!cameraEnabled());
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Space'].includes(e.code)) e.preventDefault();
  });
  addEventListener('keyup', e => keys[e.code] = false);
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

  if (canvas && typeof canvas.addEventListener === 'function') {
    canvas.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      mouse.sx = (e.clientX - r.left) * (W / r.width);
      mouse.sy = (e.clientY - r.top) * (H / r.height);
      syncMouseWorld();
      mouse.present = true;
    });
    canvas.addEventListener('mousedown', e => {
      ensureAudio(); mouse.present = true;
      if (e.button === 0) mouse.down = true;      // left → slot A
      if (e.button === 2) mouse.rdown = true;     // right → slot B
      if (e.button === 1 || e.button === 3 || e.button === 4) { mouse.mdown = true; e.preventDefault(); } // middle/side → block
    });
    addEventListener('mouseup', e => {
      if (e.button === 0) mouse.down = false;
      if (e.button === 2) mouse.rdown = false;
      if (e.button === 1 || e.button === 3 || e.button === 4) mouse.mdown = false;
    });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  if (!kbControllers.length) {
    kbControllers.push(new KeyboardController(KEYMAPS[0], true), new KeyboardController(KEYMAPS[1]));
  }
  return kbControllers;
}
