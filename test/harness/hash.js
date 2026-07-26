import { createHash } from 'node:crypto';

// A canonical, order-stable digest of everything the sim owns that a refactor
// must not change. Numbers are rounded to 6 decimals so that formatting noise
// (e.g. -0 vs 0) does not produce false failures, while real drift still does.
const r6 = (n) => (Number.isFinite(n) ? Math.round(n * 1e6) / 1e6 : String(n));

export function hashSnapshot(snap) {
  const canonical = {
    st: snap.st,
    mi: snap.mi,
    rn: snap.rn,
    wr: snap.wr,
    ps: snap.ps.map((p) => [p.s, r6(p.x), r6(p.y), r6(p.vx), r6(p.vy), p.hp, p.al, r6(p.sc), p.s0 ?? null, p.s1 ?? null, p.w ?? 0]),
    bodies: snap.bodies
      .map((b) => [b.l, r6(b.x), r6(b.y), r6(b.a)])
      .sort((a, b) => (a[0] === b[0] ? a[1] - b[1] || a[2] - b[2] : a[0] < b[0] ? -1 : 1)),
  };
  return createHash('sha1').update(JSON.stringify(canonical)).digest('hex').slice(0, 16);
}
