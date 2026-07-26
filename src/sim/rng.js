// rng.js — random helpers shared by the whole simulation. Every draw goes
// through the injected source in env.js, so a seeded run is reproducible without
// touching the platform's Math.random.
import { random } from './env.js';

export const rand = (a, b) => a + random() * (b - a);
export const pick = arr => arr[Math.floor(random() * arr.length)];

// deterministic RNG (mulberry32) — host and LAN clients must generate identical
// post-build map extras (stepping platforms, scattered cover) from a shared seed,
// because static bodies never ride the snapshot
export function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
