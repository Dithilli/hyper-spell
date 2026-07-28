// fx.js — the cosmetic vocabulary the simulation speaks.
//
// Every function here is one line, and that is the whole change task 13 makes:
// the sim NAMES a cosmetic and hands over its arguments. It no longer owns a
// particle array, no longer rolls the sparks' velocities off the round's seeded
// stream, and no longer has to be monkeypatched by the server to make those
// calls visible to anyone but the local canvas. src/render/fx.js decides what
// any of it looks like; src/net/server-bridge.js puts the allowlisted names on
// the wire. Both read the same queue, in the same order (src/sim/emit.js).
//
// The arguments are forwarded verbatim rather than re-declared with defaults,
// because these events ARE the wire payload — `{ f, a }` with `a` exactly as
// the call site wrote it, byte-for-byte what the old wrapper broadcast.
import { emit } from './emit.js';

export function spawnParticles(...a) { emit('spawnParticles', ...a); }
export function spawnRing(...a) { emit('spawnRing', ...a); }
export function spawnText(...a) { emit('spawnText', ...a); }
export function spawnBurst(...a) { emit('spawnBurst', ...a); }
export function doFlash(...a) { emit('doFlash', ...a); }
export function addShake(...a) { emit('addShake', ...a); }

// One fully-described particle, for the looks the five spawners above cannot
// express: rain, an icicle's melt, a ghost's grip sparks, the victory confetti.
// These are local-only and always were — the old wrapper broadcast ten named
// functions and nothing else, so a LAN client never saw a raw `particles.push`
// either. The difference is that the sim no longer performs the push itself.
export function spawnParticle(spec) { emit('particle', spec); }

// a new round throws the picture away with the world
export function clearParticles() { emit('clearParticles'); }
