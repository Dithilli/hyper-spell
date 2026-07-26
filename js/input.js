// input.js — keyboard + gamepad controllers with edge detection
const keys = {};
addEventListener('keydown', e => {
  ensureAudio();
  keys[e.code] = true;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Space'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup', e => keys[e.code] = false);
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

// cast = slot A, cast2 = slot B (two spell slots), block = the parry
const KEYMAPS = [
  { left: 'KeyA', right: 'KeyD', jump: 'KeyW', cast: 'KeyE', cast2: 'KeyQ', block: 'KeyS', label: 'E', label2: 'Q' },
  { left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp', cast: 'Enter', cast2: 'ShiftRight', block: 'ArrowDown', label: 'ENTER', label2: 'R-SHIFT' },
];

const IDLE_INPUT = { move: 0, jump: false, cast: false, cast2: false, block: false, jumpPressed: false, castPressed: false, cast2Pressed: false, blockPressed: false, startPressed: false, aimPoint: null, aimVec: null };

// Mouse state. sx/sy are SCREEN coords (the 1280x720 logical frame); x/y are the
// WORLD coords aim actually uses. With a camera between the two they're no longer
// the same point, and the world pair has to be re-derived every frame — the
// camera keeps moving under a stationary cursor.
const mouse = { x: W / 2, y: H / 2, sx: W / 2, sy: H / 2, down: false, rdown: false, mdown: false, present: false };

function syncMouseWorld() {
  if (typeof screenToWorld !== 'function') return; // headless
  const w = screenToWorld(mouse.sx, mouse.sy);
  mouse.x = w.x; mouse.y = w.y;
}

if (typeof canvas.addEventListener === 'function') {
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

class KeyboardController {
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

class GamepadController {
  constructor(index) {
    this.index = index;
    this.prev = { jump: false, cast: false, cast2: false, block: false, start: false };
  }
  poll() {
    const gp = navigator.getGamepads()[this.index];
    if (!gp) return { ...IDLE_INPUT };
    let move = Math.abs(gp.axes[0]) > 0.3 ? Math.sign(gp.axes[0]) : 0;
    if (gp.buttons[14]?.pressed) move = -1;
    if (gp.buttons[15]?.pressed) move = 1;
    const jump = !!(gp.buttons[0]?.pressed || gp.buttons[12]?.pressed);
    const cast = !!(gp.buttons[2]?.pressed || gp.buttons[7]?.pressed);   // X / RT → slot A
    const cast2 = !!(gp.buttons[1]?.pressed || gp.buttons[5]?.pressed);  // B / RB → slot B
    const block = !!(gp.buttons[4]?.pressed || gp.buttons[6]?.pressed);  // LB / LT → block
    const start = !!gp.buttons[9]?.pressed;
    // right stick aims
    const ax = gp.axes[2] ?? 0, ay = gp.axes[3] ?? 0;
    const aimVec = Math.hypot(ax, ay) > 0.35 ? { x: ax, y: ay } : null;
    const s = {
      move, jump, cast, cast2, block,
      jumpPressed: jump && !this.prev.jump,
      castPressed: cast && !this.prev.cast,
      cast2Pressed: cast2 && !this.prev.cast2,
      blockPressed: block && !this.prev.block,
      startPressed: start && !this.prev.start,
      aimPoint: null,
      aimVec,
    };
    this.prev = { jump, cast, cast2, block, start };
    return s;
  }
}
