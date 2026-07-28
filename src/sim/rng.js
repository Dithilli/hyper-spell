// rng.js — the simulation's randomness, and the only source of it. Nothing here
// touches Math.random (test/module-boundaries.test.js enforces that across all
// of src/sim), and nothing is injected from outside any more: the sim owns the
// stream, so a round is reproducible from its seed. That is what makes replay,
// rollback and A/B engine parity possible later.
//
// Two independent uses of the same generator, deliberately not sharing state:
//
//   * the ROUND stream (`next` below) — every gameplay draw. Reseeded per round
//     in src/sim/match.js from the map seed, so the round replays from a number.
//   * makeRng(seed) — a private generator handed to post-build map extras
//     (src/sim/maps/extras.js). A LAN host and its clients must build identical
//     static bodies from the shared per-round seed, because statics never ride
//     the snapshot. Those callers pass their generator down explicitly and never
//     read the round stream, so where the host's round stream happens to sit
//     cannot move a client's geometry.

// mulberry32
export function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The round stream. Seeded to a constant so a sim that never reaches startRound
// (a unit test poking at content, say) is still reproducible rather than
// undefined; match.js replaces it on every map load.
let next = makeRng(1);

export function reseed(seed) { next = makeRng(seed); }

export const simRandom = () => next();
export const simRange = (a, b) => a + next() * (b - a);
export const simPick = arr => arr[Math.floor(next() * arr.length)];

// rand/pick are the names ~200 content call sites in the spell, fusion and map
// books already use. They are these functions, not wrappers.
export const rand = simRange;
export const pick = simPick;
