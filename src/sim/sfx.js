// sfx.js — the sound cues the simulation fires.
//
// The synth is browser-only (src/render/audio.js needs window.AudioContext), so
// what lives here is a table of *emitters*: `sfx.cast()` says a cast was heard,
// and nothing else. The couch renderer drains that event and plays the voice; a
// LAN client gets the same event off the wire and plays the same voice;
// headless, nobody plays anything and the event is simply forwarded.
//
// That is the change from before. The table used to hold no-op stubs which the
// browser overwrote with real voices and the server monkeypatched with
// broadcasting wrappers — two processes rewriting the same object was how a
// sound reached anyone. The table is now constant.
import { emit } from './emit.js';

export const SFX_KEYS = [
  'jump', 'cast', 'explosion', 'lightning', 'death', 'pickup', 'blackhole',
  'freeze', 'fight', 'boing', 'clang', 'squeak', 'oink', 'hyper', 'event',
  'thud', 'boss', 'roundWin', 'victory',
];

export const sfx = {};
for (const key of SFX_KEYS) sfx[key] = () => emit('sfx', key);
