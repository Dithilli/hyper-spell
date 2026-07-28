// input-gamepad.js — a standard gamepad as a controller, with edge detection.
import { IDLE_INPUT } from '../sim/input-contract.js';

export class GamepadController {
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
