// sfx.js — the sound cues the simulation fires.
//
// The synth is browser-only (src/render/audio.js needs window.AudioContext), so
// what lives here is just the cue table. Headless every entry stays a no-op —
// byte-for-byte the behaviour of audio.js's `if (!audioCtx) return` guard inside
// the vm sandbox — but every key has to exist, because the server bridge wraps
// each one to broadcast the cue to LAN clients.
export const SFX_KEYS = [
  'jump', 'cast', 'explosion', 'lightning', 'death', 'pickup', 'blackhole',
  'freeze', 'fight', 'boing', 'clang', 'squeak', 'oink', 'hyper', 'event',
  'thud', 'boss', 'roundWin', 'victory',
];

export const sfx = {};
for (const key of SFX_KEYS) sfx[key] = () => {};
