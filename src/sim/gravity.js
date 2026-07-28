// gravity.js — the world's gravity, as a base the map owns plus a stack of
// modifiers that compose over it.
//
// It used to be one mutable global (matter's engine.gravity.y) with six
// writers: two spells (Gravity Flip, Moon Gravity), one environmental event
// (Moonshot) and three maps (Flip Zone, Blink, Glitch) that rewrite gravity
// EVERY TICK. Every writer both read and clobbered the same number, so:
//
//   - two overlapping gravity spells cancelled each other early. Moon Gravity
//     then Gravity Flip left `-baseGravity`, not `-0.3 * baseGravity`; whichever
//     expired first restored the full base and snuffed the other one out.
//   - on the three cycling maps the per-tick write erased Gravity Flip inside a
//     single tick. A legendary spell was inert on three maps, and the map's
//     "did gravity change?" banner check fired every tick while it was live.
//
// The split that fixes it is base vs. modifier. The map owns the base and may
// rewrite it as often as it likes; a spell owns a modifier that composes over
// whatever the base currently is. The two no longer meet.
//
// TWO MODIFIERS OF THE SAME KIND ARE TWO MODIFIERS. push() never merges, never
// dedupes on (kind, value), and never reuses an id — the identity of a modifier
// is the push that created it, not what it does. Two Moon Gravity casts must
// both apply and must expire on their own timers; if they shared a slot the
// first expiry would cancel the second cast. See the aggregate section of
// test/gravity-stack.test.js.
import { setGravityY } from './phys/facade.js';

// The map's own gravity. loadMap sets it from the map def; Flip Zone, Blink and
// Glitch rewrite it as they cycle. 2 is the default the arena starts at.
let base = 2;

// Modifier ids are monotonic FOR THE PROCESS, and deliberately not reset by
// clearModifiers() or by a world reset. An effect's onEnd can outlive the round
// that pushed it (loadMap clears the stack, the effect's timer fires later), and
// a restarted counter would let that stale pop() cancel a fresh spell that
// happened to draw the same number.
let seq = 0;

// { id, kind: 'scale' | 'flip' | 'set', value } — insertion order is
// composition order.
let mods = [];

const KINDS = new Set(['scale', 'flip', 'set']);

export function setBase(v) { base = v; apply(); }
export const baseGravity = () => base;

export function push(mod) {
  if (!KINDS.has(mod?.kind)) throw new Error(`unknown gravity modifier kind: ${mod?.kind}`);
  const id = ++seq;
  mods.push({ ...mod, id });
  apply();
  return id;
}

// Removes exactly the modifier `id` names — not the newest, not the first of
// its kind. An id that is not on the stack (already popped, or cleared by a map
// load) is a no-op.
export function pop(id) {
  const i = mods.findIndex((m) => m.id === id);
  if (i < 0) return;
  mods.splice(i, 1);
  apply();
}

// Every modifier is round-scoped: loadMap drops them all. This is what replaces
// Moonshot's old `game.baseGravity *= 0.45` mutation — the event pushes a
// modifier for the round and the next map load takes it back off.
export function clearModifiers() { mods = []; apply(); }

export function currentGravity() {
  let g = base;
  for (const m of mods) {
    if (m.kind === 'scale') g *= m.value;
    else if (m.kind === 'flip') g = -g;
    else g = m.value; // 'set'
  }
  return g;
}

// A copy, for tests and diagnostics. Handing out `mods` itself would let a
// caller mutate the stack without going through apply().
export function activeModifiers() { return mods.map((m) => ({ ...m })); }

function apply() { setGravityY(currentGravity()); }
