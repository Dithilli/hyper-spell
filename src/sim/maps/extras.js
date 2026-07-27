// maps/extras.js — post-build map extras.
// Everything here runs AFTER def.build, seeded, on host AND LAN clients alike
// (statics never ride the snapshot, so both sides must generate the identical
// layout from the shared per-round seed — see buildMapExtras).
import { W, H } from '../world.js';
import { allBodies, createBox } from '../phys/facade.js';
import { makeRng } from '../rng.js';
import { platformSpots } from '../events.js';
import {
  addBody, addStatic, addBarrels, addThemedCover, buildCrateStack, ensureSetPiece,
} from './builders.js';

// scatter a few destructible props on platform tops — cover to hide behind,
// clutter to knock around. Runs on every map after its builder.
export function scatterProps(m, rng) {
  const rr = (a, b) => a + rng() * (b - a);
  const pk = arr => arr[Math.floor(rng() * arr.length)];
  const spots = platformSpots(m, 3 + Math.floor(rng() * 3), rng);
  for (const s of spots) {
    const roll = rng();
    if (roll < 0.26) buildCrateStack(m, s.x, s.y - 14, pk([1, 2]), pk([1, 2, 3]));
    else if (roll < 0.4) addBarrels(m, [s.x - 14, s.x + 14], s.y - 16);
    else if (roll < 0.54) buildCrateStack(m, s.x, s.y - 14, 2, pk([3, 4])); // a wall to duck behind
    else if (roll < 0.9) addThemedCover(m, s.x, s.y + 8, rr, pk);           // biome cover to duck behind
    else {
      const big = createBox(s.x, s.y - 24, 42, 42, { density: 0.004, friction: 0.6, label: 'crate' });
      addBody(m, big, '#9a7440');
    }
  }
}

// scan the walkable profile and plant stepping platforms in any void too wide to
// clear with a running double jump — no more expanses you simply can't cross.
// Designed gaps in the mapbook top out around 170px; anything wider gets help.
export const GAP_MAX = 190;   // widest void we leave alone
export const GAP_STEP = 165;  // max span between inserted steppers
export function ensureTraversable(m, rng) {
  if ((m.def.gravity ?? 2) < 0) return; // ceiling-walker maps play by their own rules
  const rr = (a, b) => a + rng() * (b - a);
  const walkable = allBodies(m.composite).filter(b =>
    !b.isSensor && b.label !== 'spikes' && b.collisionFilter.mask !== 0 &&
    (b.isStatic || b.label === 'plank') &&
    b.bounds.min.x > -60 && b.bounds.max.x < W + 60);
  const deathY = (m.data.lavaY ?? H) - 24;
  const step = 16;
  const cols = [];
  for (let x = 24; x <= W - 24; x += step) {
    const tops = walkable
      .filter(b => x > b.bounds.min.x + 2 && x < b.bounds.max.x - 2)
      .map(b => b.bounds.min.y)
      .filter(y => y > 90 && y < deathY);
    cols.push({ x, y: tops.length ? Math.min(...tops) : null });
  }
  let i = 0;
  while (i < cols.length) {
    if (cols[i].y != null) { i++; continue; }
    let j = i;
    while (j < cols.length && cols[j].y == null) j++;
    const leftEdge = i > 0 ? cols[i - 1] : null;
    const rightEdge = j < cols.length ? cols[j] : null;
    const x0 = leftEdge ? leftEdge.x : cols[i].x;
    const x1 = rightEdge ? rightEdge.x : cols[j - 1].x;
    const width = x1 - x0;
    if (width > GAP_MAX) {
      const edgeY = Math.min(leftEdge?.y ?? 560, rightEdge?.y ?? 560);
      const n = Math.max(1, Math.ceil(width / GAP_STEP) - 1);
      // steppers sit near the lower neighbor's height so both sides can make the hop
      for (let k = 1; k <= n; k++) {
        const px = Math.max(60, Math.min(W - 60, x0 + (width * k) / (n + 1)));
        const py = Math.max(150, Math.min(deathY - 80, edgeY + rr(-40, 25)));
        // borrow the nearest platform's palette so inserts read as native terrain
        let color = '#171221', bd = 1e9;
        for (const b of walkable) {
          const d = Math.hypot(b.position.x - px, b.position.y - py);
          if (d < bd) { bd = d; color = b.render.fillStyle || color; }
        }
        addStatic(m, px, py, rr(104, 148), 22, { color, friction: m.def.icy ? 0.01 : 0.6 });
        if (rng() < 0.35) addThemedCover(m, px, py - 11, rr, arr => arr[Math.floor(rng() * arr.length)]); // an obstacle to duck behind mid-crossing
      }
    }
    i = j + 1;
  }
}

// guarantee every map has real destructible cover, whatever its builder did
export function ensureCover(m, rng) {
  const rr = (a, b) => a + rng() * (b - a);
  const pk = arr => arr[Math.floor(rng() * arr.length)];
  const want = m.def.cozy ? 2 : 3;
  const have = allBodies(m.composite).filter(b => b.label === 'destructible').length;
  if (have >= want * 3) return; // builder already made a cover-rich map (trees are many segments)
  const spots = platformSpots(m, want, rng);
  for (const s of spots) addThemedCover(m, s.x, s.y + 8, rr, pk);
}

// the one entry point: seed-deterministic extras, run identically on host & client
export function buildMapExtras(m, seed) {
  const rng = makeRng(seed);
  ensureTraversable(m, rng);
  scatterProps(m, rng);
  ensureCover(m, rng);
  ensureSetPiece(m, rng);
}
