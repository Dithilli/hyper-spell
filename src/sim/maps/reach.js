// reach.js — escape analysis: no wizard starts a round somewhere it can't get
// out of.
//
// Spawns are authored as sky positions — the wizard falls and lands wherever the
// terrain, plus everything the seeded passes just planted, puts it. A sealed
// pocket (a shaft between two crate stacks, a nook a set-piece grew a roof over,
// a spawn buried inside a ceiling slab) is a whole round spent watching. So
// model the arena as a coarse grid and ask the only question that matters: from
// where this wizard LANDS, can it reach the rest of the map?
//
// Ported from upstream js/maps.js (3c2b225, refined by b798196 and 898d796).
// This is its own module rather than another 250 lines in builders.js: it has
// its own vocabulary (a grid, a flood fill, a climb budget) and shares nothing
// with the map builders but the map object.
//
// DETERMINISM. Upstream describes this as read-only and host-only, safe to run
// without desyncing LAN clients because only the resulting spawn position rides
// the snapshot. Under this layout it runs inside the sim on every peer, which is
// stronger — but it means every input must be something the seeded stream can
// reproduce. It reads static geometry and map data only: no clock, no
// Math.random, no live player state. The one seeded input is the map itself,
// which was already built from game.mapSeed before this ever runs.
import { W, H } from '../world.js';
import { allBodies, pointInBody } from '../phys/facade.js';

export const REACH_CELL = 16;    // grid step
export const REACH_PAD = 15;     // the wizard's radius: grow terrain by it and the wizard is a point
export const REACH_CLIMB = 21;   // cells of travel a jump (~200px) plus an air jump (~150px) buys
export const REACH_SHARE = 0.35; // reach less of the main arena than this and you're walled in

export function buildReach(m) {
  const cols = Math.ceil(W / REACH_CELL), rows = Math.ceil(H / REACH_CELL);
  const n = cols * rows;
  // solid: everything you can stand on or bump into. firm: the subset steady
  // enough to fall onto from the sky. A rope bridge carries a wizard who walks
  // across it but a sky-drop punches through the slack; cover is a 46px block
  // (often a leaning crystal) that flicks a falling wizard off sideways. Both
  // are fine ground once you're on them — neither is a landing pad.
  const solid = new Uint8Array(n), firm = new Uint8Array(n);
  for (const b of allBodies(m.composite)) {
    // planks are dynamic but they're ground all the same — a rope bridge or a
    // hanging platform is the only floor some of the sky maps have
    if ((!b.isStatic && b.label !== 'plank') || b.isSensor || b.collisionFilter.mask === 0 || b.label === 'lava') continue;
    const solidOnly = !!b.rope || b.label === 'destructible';
    const x0 = Math.max(0, Math.floor((b.bounds.min.x - REACH_PAD) / REACH_CELL));
    const x1 = Math.min(cols - 1, Math.floor((b.bounds.max.x + REACH_PAD) / REACH_CELL));
    const y0 = Math.max(0, Math.floor((b.bounds.min.y - REACH_PAD) / REACH_CELL));
    const y1 = Math.min(rows - 1, Math.floor((b.bounds.max.y + REACH_PAD) / REACH_CELL));
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const i = cy * cols + cx;
        if (solid[i] && (solidOnly || firm[i])) continue;
        const x = cx * REACH_CELL + REACH_CELL / 2, y = cy * REACH_CELL + REACH_CELL / 2;
        // centre plus four body-radius probes: a one-cell crack isn't a corridor
        if (pointInBody(b, { x, y }) ||
            pointInBody(b, { x: x - REACH_PAD, y }) || pointInBody(b, { x: x + REACH_PAD, y }) ||
            pointInBody(b, { x, y: y - REACH_PAD }) || pointInBody(b, { x, y: y + REACH_PAD })) {
          solid[i] = 1;
          if (!solidOnly) firm[i] = 1;
        }
      }
    }
  }
  const gdir = (m.def.gravity ?? 2) < 0 ? -1 : 1; // ceiling-walker maps fall the other way
  const deadFrom = gdir > 0 ? (m.data.lavaY ?? H + 40) - 8 : null; // lava is a floor you fall through
  const pass = new Uint8Array(n), stand = new Uint8Array(n), footing = new Uint8Array(n);
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const i = cy * cols + cx;
      if (solid[i]) continue;
      if (deadFrom != null && (cy + 1) * REACH_CELL > deadFrom) continue;
      const head = i - gdir * cols; // 32px of headroom, or the ball doesn't fit
      if (head < 0 || head >= n || solid[head]) continue;
      pass[i] = 1;
      const foot = i + gdir * cols;
      if (foot < 0 || foot >= n) continue;
      if (solid[foot]) stand[i] = 1;
      if (firm[foot]) footing[i] = 1;
    }
  }
  return { cols, rows, solid, pass, stand, footing, gdir, wrap: !!m.def.wrap, escape: new Map() };
}

// every cell you can get to from `start`, tagged with the climb budget left on
// arrival. Standing refills the budget; going up spends it; drifting sideways
// through the air spends it too, so nobody "flies" across the map at altitude.
export function reachFrom(g, start) {
  const { cols, pass, stand, gdir, wrap } = g;
  const best = new Int16Array(pass.length).fill(-1);
  best[start] = REACH_CLIMB;
  const stack = [start];
  while (stack.length) {
    const i = stack.pop();
    const b = best[i];
    const cx = i % cols, cy = (i - cx) / cols;
    const step = (ni, nb) => {
      if (nb < 0 || ni < 0 || ni >= pass.length || !pass[ni]) return;
      const v = stand[ni] ? REACH_CLIMB : nb;
      if (v <= best[ni]) return;
      best[ni] = v;
      stack.push(ni);
    };
    step(i + gdir * cols, b);      // falling is free
    step(i - gdir * cols, b - 1);  // climbing costs
    const air = stand[i] ? b : b - 1;
    if (cx > 0) step(i - 1, air); else if (wrap) step(cy * cols + cols - 1, air);
    if (cx < cols - 1) step(i + 1, air); else if (wrap) step(cy * cols, air);
  }
  return best;
}

export function reachCount(g, best) {
  let n = 0;
  for (let i = 0; i < best.length; i++) if (best[i] >= 0 && g.stand[i]) n++;
  return n;
}

// where a wizard dropped at (x, y) actually comes to rest. -1 means the drop is
// no good at all: buried in geometry, or a straight fall into the lava/void.
export function reachLanding(g, x, y) {
  const { cols, rows, pass, stand, gdir } = g;
  const cx = Math.max(0, Math.min(cols - 1, Math.floor(x / REACH_CELL)));
  const cy = Math.max(0, Math.min(rows - 1, Math.floor(y / REACH_CELL)));
  let i = cy * cols + cx;
  if (!pass[i]) return -1;
  for (let t = 0; t < rows; t++) {
    if (stand[i]) return i;
    const next = i + gdir * cols;
    if (next < 0 || next >= pass.length || !pass[next]) return -1;
    i = next;
  }
  return -1;
}

// how much of the map you can work with from a given landing cell. Everything
// along one flat run shares a reach set, so collapse to the run's left end
// first: a 300px platform then costs one flood fill instead of twenty.
export function reachEscape(g, land) {
  let k = land;
  while (k % g.cols > 0 && g.stand[k - 1]) k--;
  let n = g.escape.get(k);
  if (n == null) { n = reachCount(g, reachFrom(g, k)); g.escape.set(k, n); }
  return n;
}

export function reachInfo(m) {
  if (m.data.reach) return m.data.reach;
  const g = buildReach(m);
  // the main arena is simply the biggest region anything can reach; every
  // sealed pocket measures a tiny fraction of it
  const seeds = m.def.spawns.map(s => reachLanding(g, s.x, s.y));
  for (let cx = 2; cx < g.cols; cx += 5) {
    for (let cy = 0; cy < g.rows; cy++) {
      const i = cy * g.cols + cx;
      if (g.stand[i]) { seeds.push(i); break; }
    }
  }
  g.arenaN = 1;
  for (const i of seeds) if (i >= 0) g.arenaN = Math.max(g.arenaN, reachEscape(g, i));
  m.data.reach = g;
  return g;
}

// somewhere you can actually come down onto: level ground either side, so a
// wizard falling from the sky lands on the platform instead of clipping its lip
// and tumbling off. The grid is dilated by half a body, so this is ~a wizard's
// width of margin from the real edge.
export function reachLandable(g, i) {
  const cx = i % g.cols;
  return !!g.footing[i] && cx > 0 && cx < g.cols - 1 && !!g.footing[i - 1] && !!g.footing[i + 1];
}

// the question spawnPointFor asks: drop a wizard here and can it get out again?
export function spawnEscapes(m, x, y) {
  const g = reachInfo(m);
  const land = reachLanding(g, x, y);
  return land >= 0 && reachLandable(g, land) && reachEscape(g, land) >= g.arenaN * REACH_SHARE;
}

function reachSpots(g) {
  if (g.spots) return g.spots;
  g.spots = [];
  for (let i = 0; i < g.stand.length; i++) {
    const cx = i % g.cols;
    if (cx < 3 || cx > g.cols - 4) continue; // not squeezed against the side walls
    if (!reachLandable(g, i)) continue;
    g.spots.push({ i, x: cx * REACH_CELL + REACH_CELL / 2, y: ((i - cx) / g.cols) * REACH_CELL + REACH_CELL / 2 });
  }
  return g.spots;
}

// loose cover settles on platform tops, and the grid above only knows about
// statics — landing square on a crate stack and pinballing off a sky island is
// as fatal as landing in a pit. So the drop column has to be clear of anything
// that rolls. Planks don't count: a rope bridge is a fine place to come down.
const DROP_LABELS = new Set(['crate', 'barrel', 'ball']);
function dropColumnClear(m, x, y0, y1) {
  // a body radius past the landing row: the wizard comes to rest with its
  // CENTRE on that row, and a barrel its feet touch is still a barrel it
  // rolls off. Same half-cell slip that used to let a spawn clip a tree.
  y1 += y1 >= y0 ? REACH_PAD : -REACH_PAD;
  const lo = Math.min(y0, y1), hi = Math.max(y0, y1);
  for (const b of allBodies(m.composite)) {
    if (b.isStatic || b.isSensor || !DROP_LABELS.has(b.label)) continue;
    if (b.bounds.max.x < x - 18 || b.bounds.min.x > x + 18) continue;
    if (b.bounds.max.y < lo || b.bounds.min.y > hi) continue;
    return false;
  }
  return true;
}

function arenaSpawnNear(m, x, y, busy = []) {
  const g = reachInfo(m);
  const cost = s => Math.abs(s.x - x) + Math.abs(s.y - y) * 0.35;
  const ranked = reachSpots(g)
    .filter(s => !busy.some(q => Math.hypot(q.x - s.x, q.y - s.y) < 70))
    .sort((a, b) => cost(a) - cost(b));
  // two passes: prefer a clear drop, but a spot you might bounce on beats
  // giving up and leaving the wizard walled in
  for (const needClear of [true, false]) {
    for (const s of ranked) {
      if (reachEscape(g, s.i) < g.arenaN * REACH_SHARE) continue;
      // drop in from as high as the column above is clear, so it still reads as an arrival
      let lift = 0;
      while (lift < 8) {
        const above = s.i - g.gdir * g.cols * (lift + 1);
        if (above < 0 || above >= g.pass.length || !g.pass[above]) break;
        lift++;
      }
      const y0 = s.y - g.gdir * lift * REACH_CELL;
      if (needClear && !dropColumnClear(m, s.x, y0, s.y)) continue;
      return { x: s.x, y: y0 };
    }
  }
  return null;
}

// the whole guarantee in one call. Three outcomes, least invasive first:
// the authored spot as designed; a nudge of a few cells along the same ledge
// when the drop only clips its edge; a relocation into the main arena when the
// spot is a genuine trap — buried in terrain, a straight fall into the lava, or
// a pocket walled off from everywhere else.
// Two wizards dropped into the same column arrive together and shove each
// other off the ledge, so a candidate cell has to be clear of the wizards
// already placed. A wizard is 30px across; 44 leaves a body's width between
// them, which is enough that they land rather than collide.
//
// Upstream applied `busy` only in arenaSpawnNear, so the NUDGE path could walk
// two slots onto the same cell — and on a map with one good ledge it reliably
// did. Measured over 110 maps x 2 seeds with four wizards: 10 fell out of the
// world with the nudge path blind to busy, 0 with this check. (Upstream's own
// sweep drops one probe at a time, which is exactly the case that cannot see
// this.) spawnPointFor's comment already promised the behaviour.
const SPAWN_CLEAR = 44;

export function safeSpawnPoint(m, x, y, busy = []) {
  const g = reachInfo(m);
  const escapes = i => i >= 0 && reachEscape(g, i) >= g.arenaN * REACH_SHARE;
  // grade at the cell CENTRE and hand back that same centre. Grading one point
  // and dropping the wizard at another up to half a cell away is how a spawn
  // the grid called clear still clips a tree trunk on the way down.
  const cellX = i => (i % g.cols) * REACH_CELL + REACH_CELL / 2;
  const clearOfBusy = px => !busy.some(q => Math.abs(q.x - px) < SPAWN_CLEAR);
  const sound = i => i >= 0 && reachLandable(g, i) && escapes(i) &&
    dropColumnClear(m, cellX(i), y, ((i - (i % g.cols)) / g.cols) * REACH_CELL);
  const land = reachLanding(g, x, y);
  if (escapes(land)) {
    if (sound(land) && clearOfBusy(cellX(land))) return { x: cellX(land), y };
    // far enough to step past a set-piece or a cover block and still be on the
    // ledge the map put you on — relocating somewhere else entirely is the last
    // resort, not the answer to a crate in the way
    for (let d = 1; d <= 11; d++) {
      for (const side of [-1, 1]) {
        const nx = x + side * d * REACH_CELL;
        if (nx < 40 || nx > W - 40) continue;
        const ni = reachLanding(g, nx, y);
        if (sound(ni) && clearOfBusy(cellX(ni))) return { x: cellX(ni), y };
      }
    }
  }
  return arenaSpawnNear(m, x, y, busy) || { x, y };
}
