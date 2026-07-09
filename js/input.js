// input.js — keyboard + gamepad controllers with edge detection
const keys = {};
addEventListener('keydown', e => {
  ensureAudio();
  keys[e.code] = true;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Space'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup', e => keys[e.code] = false);
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

// cast = slot A, cast2 = slot B (two spell slots)
const KEYMAPS = [
  { left: 'KeyA', right: 'KeyD', jump: 'KeyW', cast: 'KeyE', cast2: 'KeyQ', label: 'E', label2: 'Q' },
  { left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp', cast: 'Enter', cast2: 'ShiftRight', label: 'ENTER', label2: 'R-SHIFT' },
];

const IDLE_INPUT = { move: 0, jump: false, cast: false, cast2: false, jumpPressed: false, castPressed: false, cast2Pressed: false, startPressed: false, aimPoint: null, aimVec: null };

// mouse state in canvas/world coordinates
const mouse = { x: W / 2, y: H / 2, down: false, rdown: false, present: false };
if (typeof canvas.addEventListener === 'function') {
  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * (W / r.width);
    mouse.y = (e.clientY - r.top) * (H / r.height);
    mouse.present = true;
  });
  canvas.addEventListener('mousedown', e => {
    ensureAudio(); mouse.present = true;
    if (e.button === 0) mouse.down = true;      // left → slot A
    if (e.button === 2) mouse.rdown = true;     // right → slot B
  });
  addEventListener('mouseup', e => {
    if (e.button === 0) mouse.down = false;
    if (e.button === 2) mouse.rdown = false;
  });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
}

class KeyboardController {
  constructor(map, useMouse = false) {
    this.map = map;
    this.useMouse = useMouse;
    this.prev = { jump: false, cast: false, cast2: false, start: false };
    this.assigned = false;
  }
  poll() {
    const m = this.map;
    const useM = this.useMouse && mouse.present;
    const jump = !!keys[m.jump] || (this.useMouse && !!keys['Space']);
    const cast = !!keys[m.cast] || (useM && mouse.down);
    const cast2 = !!keys[m.cast2] || (useM && mouse.rdown);
    const start = !!keys['Space'];
    const s = {
      move: (keys[m.right] ? 1 : 0) - (keys[m.left] ? 1 : 0),
      jump, cast, cast2,
      jumpPressed: jump && !this.prev.jump,
      castPressed: cast && !this.prev.cast,
      cast2Pressed: cast2 && !this.prev.cast2,
      startPressed: start && !this.prev.start,
      aimPoint: useM ? { x: mouse.x, y: mouse.y } : null,
      aimVec: null,
    };
    this.prev = { jump, cast, cast2, start };
    return s;
  }
}

class GamepadController {
  constructor(index) {
    this.index = index;
    this.prev = { jump: false, cast: false, cast2: false, start: false };
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
    const start = !!gp.buttons[9]?.pressed;
    // right stick aims
    const ax = gp.axes[2] ?? 0, ay = gp.axes[3] ?? 0;
    const aimVec = Math.hypot(ax, ay) > 0.35 ? { x: ax, y: ay } : null;
    const s = {
      move, jump, cast, cast2,
      jumpPressed: jump && !this.prev.jump,
      castPressed: cast && !this.prev.cast,
      cast2Pressed: cast2 && !this.prev.cast2,
      startPressed: start && !this.prev.start,
      aimPoint: null,
      aimVec,
    };
    this.prev = { jump, cast, cast2, start };
    return s;
  }
}
