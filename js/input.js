// input.js — keyboard + gamepad controllers with edge detection
const keys = {};
addEventListener('keydown', e => {
  ensureAudio();
  keys[e.code] = true;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Space'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup', e => keys[e.code] = false);
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

const KEYMAPS = [
  { left: 'KeyA', right: 'KeyD', jump: 'KeyW', cast: 'KeyE', label: 'E' },
  { left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp', cast: 'Enter', label: 'ENTER' },
];

const IDLE_INPUT = { move: 0, jump: false, cast: false, jumpPressed: false, castPressed: false, startPressed: false };

class KeyboardController {
  constructor(map) {
    this.map = map;
    this.prev = { jump: false, cast: false, start: false };
    this.assigned = false;
  }
  poll() {
    const m = this.map;
    const jump = !!keys[m.jump], cast = !!keys[m.cast], start = !!keys['Space'];
    const s = {
      move: (keys[m.right] ? 1 : 0) - (keys[m.left] ? 1 : 0),
      jump, cast,
      jumpPressed: jump && !this.prev.jump,
      castPressed: cast && !this.prev.cast,
      startPressed: start && !this.prev.start,
    };
    this.prev = { jump, cast, start };
    return s;
  }
}

class GamepadController {
  constructor(index) {
    this.index = index;
    this.prev = { jump: false, cast: false, start: false };
  }
  poll() {
    const gp = navigator.getGamepads()[this.index];
    if (!gp) return { ...IDLE_INPUT };
    let move = Math.abs(gp.axes[0]) > 0.3 ? Math.sign(gp.axes[0]) : 0;
    if (gp.buttons[14]?.pressed) move = -1;
    if (gp.buttons[15]?.pressed) move = 1;
    const jump = !!(gp.buttons[0]?.pressed || gp.buttons[12]?.pressed);
    const cast = !!(gp.buttons[2]?.pressed || gp.buttons[5]?.pressed || gp.buttons[7]?.pressed);
    const start = !!gp.buttons[9]?.pressed;
    const s = {
      move, jump, cast,
      jumpPressed: jump && !this.prev.jump,
      castPressed: cast && !this.prev.cast,
      startPressed: start && !this.prev.start,
    };
    this.prev = { jump, cast, start };
    return s;
  }
}
