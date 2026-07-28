// emit.js — the sim's only outward channel for things that are not simulation
// state: particles, screen shake, flashes, banners, sounds, kill-feed lines.
//
// Locally the renderer drains this queue once per frame (src/render/fx.js's
// applyEmitted); online the server bridge drains it once per tick and puts the
// allowlisted names on the wire. One queue, so couch and online stop being two
// code paths — the couch player now runs the same event path a LAN client has
// always run, instead of the sim calling the renderer directly and the server
// monkeypatching those calls to fake an event stream (defect D3).
//
// The event shape is the wire shape on purpose: { f: name, a: args }. The
// server bridge forwards these objects verbatim, so there is no translation
// step that could quietly reorder or reshape them.
import { onWorldReset } from './world.js';

const queue = [];

// Order is the contract. Cosmetics narrate a tick — a flash, then the ring,
// then the text — and a consumer that saw them out of order would draw the
// wrong story. push/slice preserves emission order end to end.
export function emit(name, ...args) { queue.push({ f: name, a: args }); }

export function drainEmitted() {
  const out = queue.slice();
  queue.length = 0;
  return out;
}

export const emittedCount = () => queue.length;

// A world reset throws the picture away (src/render/fx.js clears the particle
// field on the same hook), so events queued for a world that no longer exists
// must go with it rather than arriving one frame into the next round.
onWorldReset(() => { queue.length = 0; });
