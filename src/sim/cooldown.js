// cooldown.js — the one place a repeat hit is gated.
//
// Five separate conventions used to do this, each a timestamp hung off whatever
// object was to hand: `a._cdAt` (contact damage, 400ms), `small._stompAt`
// (600ms), `q.lastSpikeAt` (600ms), `p._bossHurtAt` (700ms) and `b._touchAt`
// (700ms). One idea, five names, five places to get the comparison wrong — and
// they DID disagree: three compared `now > stamp` and two `now < stamp`, which
// is the same rule off by one tick (see THE BOUNDARY below).
//
// It lives here rather than in collision.js because two of the five callers are
// ai/boss.js and ai/enemies.js, and collision.js imports both of those. A leaf
// module keeps the graph acyclic; collision.js re-exports `pairCooldown` so the
// contact rules and their gate still read as one thing from the outside.
//
// WHY TICKS AND NOT MILLISECONDS. The old comparisons ran on simNow(), which is
// tick * TICK_MS — a float, and not an exact one: 1000/60 has no finite binary
// expansion, so `(T + 24) * TICK_MS > T * TICK_MS + 400` is not reliably false
// the way exact arithmetic says it must be. It comes out true for 112 of the
// first 400,000 values of T (159/400,000 for the 600ms gates, 183/400,000 for
// the 700ms ones), and on exactly those ticks the old code opened the gate one
// tick early. Counting in ticks retires the noise: 400ms is 24 ticks, always.
import { onWorldReset } from './world.js';
import { currentTick, ticks } from './time.js';

// key → the first tick on which the pair may act again
const pairs = new Map();

const keyOf = (a, b) => (a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`);

export const pairCooldown = {
  // True if this pair may act now, in which case the gate closes for `ms`.
  // ASKING IS TAKING: call it last in a condition, after everything else that
  // could veto the hit, which is exactly where the stamp assignments it
  // replaced sat.
  //
  // THE BOUNDARY. `<` means the gate opens on tick T + ticks(ms) — a 700ms gate
  // taken on tick T is open again 42 ticks later, the duration as authored.
  // That is what `p._bossHurtAt` and `b._touchAt` did (`now < stamp` → skip),
  // and those two are polled EVERY TICK from the boss and enemy update loops,
  // so their reopening tick is observed every time the gate is used. The other
  // three wrote `now > stamp`, which held one tick longer; they are driven by
  // collisionStart, which only fires when a contact is newly formed, so their
  // reopening tick is almost never the tick a contact actually lands on.
  // Unifying has to pick one, and this picks the one that is both the authored
  // duration and faithful where the difference is observable. Neither choice
  // moves either golden tape — both were run.
  //
  // The `?? 0` default falls out of the same choice: at tick 0 the gate is
  // open, as it was for the two `<` sites.
  ready(a, b, ms) {
    const t = currentTick();
    const key = keyOf(a, b);
    if (t < (pairs.get(key) ?? 0)) return false;
    pairs.set(key, t + ticks(ms));
    return true;
  },

  // A gate scoped to ONE entity rather than to a pair — `ready(x, x, ms)`.
  //
  // Four of the five stamps had this shape and it has to be kept: `a._cdAt`
  // gated the falling anvil against every wizard at once, not against one of
  // them, so the anvil hit whoever it reached first and nobody else for 400ms.
  // Re-keying those on (attacker, victim) would let the same anvil hit a second
  // wizard inside the same window — a livelier game, and a different one.
  readySelf(x, ms) { return pairCooldown.ready(x, x, ms); },

  clear() { pairs.clear(); },

  // For tests and diagnostics. Unlike the per-body stamps this replaced, an
  // entry does not die with its body — it lives until loadMap clears the map.
  // Measured over the 4,200-tick three-round tape the peak is 5 entries and the
  // count at every round boundary is 5 or fewer, so the round-boundary clear is
  // the whole of the story and there is no sweep here to justify. The bound is
  // one entry per body that has ever LANDED a gated hit this round, not per
  // body and not per contact.
  get size() { return pairs.size; },
};

onWorldReset(() => pairs.clear());
