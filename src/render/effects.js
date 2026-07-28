// effects.js — the transient spell visuals.
//
// Two populations meet here, and the split is the point of task 13:
//
//   * Render-owned effects (`fxEffects`) have no simulation behind them at all.
//     A lightning bolt's zigzag is nine random points and a stroke; it damages
//     nothing, so the sim has no business knowing where the kinks are. It
//     arrives as an emitted event and lives and dies in this file.
//
//   * Sim-owned effects (src/sim/spells/core.js's `activeEffects`) do have
//     behaviour — they pull bodies, freeze wizards, explode on expiry — so they
//     stay in the sim. What they no longer carry is a draw() closure holding a
//     canvas context. They carry a `vfx` descriptor instead: plain data naming
//     a look, which drawVfx below interprets. The sim says "a tornado is here";
//     this file knows what a tornado looks like.
import { H, onWorldReset } from '../sim/world.js';
import { simNow } from '../sim/time.js';
import * as art from './artkit.js';
import { pushParticle } from './fx.js';

export const fxEffects = [];

const fxRange = (a, b) => a + Math.random() * (b - a);

function prune(now) {
  for (let i = fxEffects.length - 1; i >= 0; i--) if (now > fxEffects[i].until) fxEffects.splice(i, 1);
}

// the jagged bolt every zap/smite/chain spell draws. Nine segments of jitter,
// rolled on cosmetic randomness — it used to be rolled on the round stream,
// which made the arc of a lightning bolt part of the match's determinism.
export function boltVisual(x0, y0, x1, y1, color = '#fff89e', width = 3, life = 130) {
  const now = simNow();
  prune(now);
  const pts = [{ x: x0, y: y0 }];
  const segs = 9;
  for (let i = 1; i <= segs; i++) {
    pts.push({
      x: x0 + (x1 - x0) * i / segs + (i < segs ? fxRange(-14, 14) : 0),
      y: y0 + (y1 - y0) * i / segs + (i < segs ? fxRange(-14, 14) : 0),
    });
  }
  fxEffects.push({ until: now + life, pts, color, width });
}

export function clearFxEffects() { fxEffects.length = 0; }

export function drawFxEffects(now, ctx) {
  prune(now);
  for (const e of fxEffects) {
    ctx.strokeStyle = e.color;
    ctx.lineWidth = e.width;
    ctx.beginPath();
    ctx.moveTo(e.pts[0].x, e.pts[0].y);
    for (const q of e.pts.slice(1)) ctx.lineTo(q.x, q.y);
    ctx.stroke();
  }
}

// ---- sim-owned effects: their look, from their descriptor -----------------
// `e` is the whole effect, not just e.vfx, because three of these track
// something that moves every tick — the tornado's column, the sticky bomb's
// body — and a descriptor snapshotted at cast time would draw them standing
// still. The sim updates the position; this reads it and never writes.
export function drawVfx(e, now, ctx) {
  const v = e.vfx;
  if (!v) return;
  switch (v.k) {
    case 'sing': {
      ctx.fillStyle = '#0a0510';
      ctx.beginPath(); ctx.arc(v.x, v.y, 26, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#a55eea';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(now * 0.02);
      ctx.beginPath(); ctx.arc(v.x, v.y, 36 + 5 * Math.sin(now * 0.011), 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
      break;
    }
    case 'zone': {
      ctx.globalAlpha = 0.16 + 0.06 * Math.sin(now * 0.01);
      ctx.fillStyle = v.c;
      ctx.beginPath(); ctx.arc(v.x, v.y, v.r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      break;
    }
    case 'blizzard': {
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = v.c;
      ctx.beginPath(); ctx.arc(v.x, v.y, v.r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      // the snowfall inside the zone. Its spread is a fixed box, not the
      // (mega-scaled) radius — that is how the spell has always looked.
      for (let i = 0; i < 3; i++) {
        pushParticle({ kind: 'square', x: v.x + fxRange(-220, 220), y: v.y + fxRange(-200, 100), vx: fxRange(-1, 1), vy: fxRange(1, 3), life: 24, maxLife: 24, color: '#fff', r: 2 });
      }
      break;
    }
    // The air tornado. Untinted, always: the only sim descriptor of this kind
    // is spells/book.js's Tornado, and Firestorm's tinted funnel is `firetor`
    // below. The tint lives on the WIRE's `tor` payload instead — a LAN client
    // gets one descriptor for both funnels and draws them in
    // src/render/draw-snapshot.js's drawFxLite, which does read `c`.
    case 'tor': {
      ctx.strokeStyle = 'rgba(207,232,232,0.55)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 5; i++) {
        const yy = H - 80 - i * 90;
        const w = 26 + i * 22;
        ctx.beginPath();
        ctx.ellipse(e.x + Math.sin(now * 0.01 + i) * 8, yy, w, 12, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    // Firestorm's funnel: narrower rings, a per-ring heat gradient, faster sway
    case 'firetor': {
      ctx.lineWidth = 3;
      for (let i = 0; i < 5; i++) {
        const yy = H - 80 - i * 90, w = 24 + i * 20;
        ctx.strokeStyle = `rgba(255, ${100 + i * 26}, 60, 0.6)`;
        ctx.beginPath();
        ctx.ellipse(e.x + Math.sin(now * 0.013 + i) * 9, yy, w, 12, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    // an armed charge blinking between two colours: the sticky bomb (stuck to a
    // body, so it reads the body's position) and the booby trap (a fixed spot)
    case 'blink': {
      const x = v.body ? v.body.position.x : v.x;
      const y = v.body ? v.body.position.y : v.y;
      ctx.fillStyle = Math.sin(now * v.rate) > 0 ? v.a : v.b;
      ctx.beginPath(); ctx.arc(x, y, v.r, 0, Math.PI * 2); ctx.fill();
      break;
    }
    // the telegraph ring the smite falls into
    case 'pulsering': {
      ctx.strokeStyle = v.c;
      ctx.lineWidth = v.lw;
      ctx.globalAlpha = 0.35 + 0.4 * Math.abs(Math.sin(now * 0.02));
      ctx.beginPath(); ctx.arc(v.x, v.y, v.r, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
      break;
    }
    // a ghost's haunt sigil — the one effect that needs an artkit primitive
    case 'rune': {
      ctx.globalAlpha = 0.75;
      art.runeRing(ctx, v.x, v.y, v.r, v.c, now, { count: 6, lw: 1.2, alpha: 0.8, spin: 0.003 });
      ctx.globalAlpha = 1;
      break;
    }
    default: break;
  }
}

onWorldReset(clearFxEffects);
