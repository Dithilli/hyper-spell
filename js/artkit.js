// artkit.js — "arcane storybook" rendering toolkit.
// Pure, ctx-explicit helpers so the same look is shared by the game AND the
// review gallery. Everything derives its shades from a base tint, so wizards,
// spells and pickups stay fully recolorable (p.color / p.hat / spell.color).

// ---------- colour math (work from any hex tint) ----------
function _hx(hex) {
  if (typeof hex !== 'string' || hex[0] !== '#') return { r: 150, g: 140, b: 165 };
  let h = hex.slice(1);
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
// amt > 0 lightens toward white, amt < 0 darkens toward black
function shade(hex, amt) {
  const c = _hx(hex), t = amt < 0 ? 0 : 255, p = Math.min(1, Math.abs(amt));
  const m = v => Math.round(v + (t - v) * p);
  return `rgb(${m(c.r)},${m(c.g)},${m(c.b)})`;
}
function rgba(hex, a) { const c = _hx(hex); return `rgba(${c.r},${c.g},${c.b},${a})`; }
function mix(a, b, t) {
  const x = _hx(a), y = _hx(b), m = (u, v) => Math.round(u + (v - u) * t);
  return `rgb(${m(x.r, y.r)},${m(x.g, y.g)},${m(x.b, y.b)})`;
}

// warm parchment-storybook constants
const PARCHMENT = '#e8d2b0';
const INK = '#2a1f38';

// ---------- shared marks ----------
// a rotating sigil ring — the signature "magic is happening here" mark
function runeRing(ctx, x, y, r, color, now, o = {}) {
  const n = o.count || 6, spin = o.spin ?? 0.0018;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(now * spin);
  ctx.globalAlpha = o.alpha ?? 0.85;
  ctx.strokeStyle = color;
  ctx.lineWidth = o.lw || 1;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (r - 2), Math.sin(a) * (r - 2));
    ctx.lineTo(Math.cos(a) * (r + 2.5), Math.sin(a) * (r + 2.5));
    ctx.stroke();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

// a soft inner glow orb (spell motes, catalysts, hat gem)
function glowOrb(ctx, x, y, r, color, alpha = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(shade(color, 0.55), alpha));
  g.addColorStop(0.4, rgba(color, alpha));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

// ---------- the wizard: a hooded, robed storybook figure ----------
// o: {x,y,scale,angle,now,color,hat,hp,facing,walkPhase,vx,piggy,alive,spellReady,spellColor}
// map longstanding public character names to bespoke avatar variants
function avatarVariant(name) {
  const n = (name || '').toLowerCase();
  if (/a\s*linea/.test(n)) return 'alinea';
  if (/grey|gray|gandalf|szarz/.test(n)) return 'grey';
  return null;
}

function drawStoryWizard(ctx, o) {
  if (o.variant === 'alinea') return drawStorySorceress(ctx, o); // Alinea gets her own avatar
  if (o.variant === 'grey') return drawStoryGandalf(ctx, o);     // David "Grey" → the grey pilgrim
  const scale = o.scale ?? 1, now = o.now || 0, facing = o.facing || 1;
  const piggy = !!o.piggy, alive = o.alive !== false && o.alive !== 0;
  const col = piggy ? '#ff9ecb' : (o.color || '#b98cff');
  const hatc = o.hat || '#6c4bd6';
  const ink = shade(col, -0.62), lift = shade(col, 0.42), dark = shade(col, -0.32);
  const hp = o.hp ?? 100;
  const f = Math.min(1, Math.abs(o.vx || 0) / 6);
  const ph = o.walkPhase || 0;

  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(o.angle || 0);
  ctx.scale(scale, scale);
  ctx.translate(0, Math.sin(ph) * 0.8 * f); // walking bob
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // --- boots peeking under the hem, stepping ---
  ctx.fillStyle = shade(hatc, -0.2);
  for (const side of [0, Math.PI]) {
    const sp = ph + side;
    const bx = Math.sin(sp) * 5 * f * facing + (side ? 3 : -3) * (1 - f * 0.5);
    const lft = Math.max(0, Math.cos(sp)) * 3 * f;
    ctx.beginPath();
    ctx.ellipse(bx, 15 - lft, 3.4, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- the robe: a swaying bell with a lifted front hem ---
  const sway = Math.sin(now * 0.004 + ph) * 1.4 + facing * f * 2.5;
  const hemL = -9 - (facing < 0 ? f * 3 : 0);
  const hemR = 9 + (facing > 0 ? f * 3 : 0);
  ctx.beginPath();
  ctx.moveTo(-4.5, -6);
  ctx.quadraticCurveTo(-8, 4, hemL + sway * 0.3, 15);
  ctx.quadraticCurveTo(-3, 17, 0, 16.5);
  ctx.quadraticCurveTo(3, 17, hemR + sway * 0.3, 15);
  ctx.quadraticCurveTo(8, 4, 4.5, -6);
  ctx.closePath();
  const rg = ctx.createLinearGradient(0, -6, 0, 16);
  rg.addColorStop(0, shade(col, 0.12));
  rg.addColorStop(0.55, col);
  rg.addColorStop(1, dark);
  ctx.fillStyle = rg;
  ctx.fill();
  // fold shadows
  ctx.strokeStyle = rgba(shade(col, -0.4), 0.5);
  ctx.lineWidth = 1;
  for (const fx of [-3.5, 0.5, 4]) {
    ctx.beginPath();
    ctx.moveTo(fx * 0.4, -4);
    ctx.quadraticCurveTo(fx * 0.8, 6, fx + sway * 0.25, 14);
    ctx.stroke();
  }
  // rim light on the lit (facing) edge
  ctx.strokeStyle = rgba(lift, 0.7);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(facing * 4.6, -5.5);
  ctx.quadraticCurveTo(facing * 7.5, 4, (facing > 0 ? hemR : hemL) + sway * 0.3, 14.5);
  ctx.stroke();
  // ink silhouette
  ctx.strokeStyle = ink;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-4.5, -6);
  ctx.quadraticCurveTo(-8, 4, hemL + sway * 0.3, 15);
  ctx.quadraticCurveTo(0, 17.5, hemR + sway * 0.3, 15);
  ctx.quadraticCurveTo(8, 4, 4.5, -6);
  ctx.stroke();

  // --- sleeves: back arm tucked, front arm raised toward aim ---
  ctx.strokeStyle = dark;
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(-facing * 2, -4);
  ctx.quadraticCurveTo(-facing * 7, 0, -facing * 6.5, 5);
  ctx.stroke();
  ctx.strokeStyle = col;
  ctx.lineWidth = 3.6;
  const reach = o.spellReady ? 1 : 0.7;
  ctx.beginPath();
  ctx.moveTo(facing * 2, -4);
  ctx.quadraticCurveTo(facing * 8, -6 * reach, facing * 11, -6 * reach - 1);
  ctx.stroke();

  // --- head: parchment face with a soft brow shadow ---
  ctx.fillStyle = PARCHMENT;
  ctx.beginPath(); ctx.arc(0, -11, 5.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = rgba(INK, 0.12);
  ctx.beginPath(); ctx.arc(0, -13.5, 5.4, Math.PI, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = rgba(INK, 0.5); ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.arc(0, -11, 5.4, 0, Math.PI * 2); ctx.stroke();
  // eyes / snout
  if (piggy) {
    ctx.fillStyle = '#ff7eb6';
    ctx.beginPath(); ctx.arc(facing * 4.5, -10, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d84f8f';
    ctx.beginPath(); ctx.arc(facing * 4, -10.6, 0.5, 0, Math.PI * 2);
    ctx.arc(facing * 5, -10.6, 0.5, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(facing * 2.4, -11, 0.9, 0, Math.PI * 2); ctx.fill();
  }

  // --- the hat: IS the health bar (proud >=75 / askew 50-74 / gone <50) ---
  if (hp >= 50) {
    ctx.save();
    if (hp < 75) { ctx.translate(facing * 2, -15); ctx.rotate(facing * 0.4); ctx.translate(0, 15); }
    // brim
    ctx.fillStyle = shade(hatc, -0.15);
    ctx.beginPath();
    ctx.ellipse(0, -15.5, 12, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    // drooping cone with a curled tip
    ctx.beginPath();
    ctx.moveTo(-8.5, -15);
    ctx.quadraticCurveTo(-4, -26, facing * 2, -31);
    ctx.quadraticCurveTo(facing * 7, -33, facing * 8.5, -29); // curl
    ctx.quadraticCurveTo(2, -24, 8.5, -15);
    ctx.closePath();
    const hg = ctx.createLinearGradient(-8, -15, 8, -30);
    hg.addColorStop(0, shade(hatc, -0.25));
    hg.addColorStop(0.5, hatc);
    hg.addColorStop(1, shade(hatc, 0.25));
    ctx.fillStyle = hg;
    ctx.fill();
    ctx.strokeStyle = shade(hatc, -0.55); ctx.lineWidth = 0.9; ctx.stroke();
    // hat band + a little star buckle (filigree accent)
    ctx.strokeStyle = shade(hatc, 0.4); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-8, -16); ctx.quadraticCurveTo(0, -14.5, 8, -16); ctx.stroke();
    drawStar(ctx, facing * 1, -16, 2.1, mix(hatc, '#fff6c8', 0.7));
    // faint hat-tip sparkle when at full health (not on pig — reads as a bullseye on the snout)
    if (hp >= 75 && alive && !piggy) {
      ctx.globalAlpha = 0.35 + 0.15 * Math.sin(now * 0.004);
      runeRing(ctx, facing * 2, -20, 9, rgba(mix(hatc, '#fff', 0.4), 1), now, { count: 5, lw: 0.6, alpha: 1 });
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  // --- smoldering when near death ---
  if (hp < 25 && alive) {
    for (let i = 0; i < 3; i++) {
      const t = (now * 0.05 + i * 37) % 30;
      ctx.globalAlpha = 0.4 * (1 - t / 30);
      ctx.fillStyle = mix('#8a7ba0', '#ffb27a', 0.3);
      ctx.beginPath();
      ctx.arc(Math.sin(now * 0.004 + i * 2.4) * 4, -18 - t, 2 + t * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // --- charged spell mote in the raised hand ---
  if (o.spellReady) {
    const sc = o.spellColor || '#fff';
    glowOrb(ctx, facing * 12, -7, 4.5 + Math.sin(now * 0.008) * 0.8, sc, 0.9);
    runeRing(ctx, facing * 12, -7, 5, rgba(sc, 1), now, { count: 4, lw: 0.7, spin: 0.004 });
  }

  ctx.restore();
}

function drawStar(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fill();
}

// ---------- Alinea: a Boris Vallejo / Julie Bell warrior-sorceress ----------
// Bronzed skin, black leather & bronze, oxblood cloak, torch-lit chiaroscuro.
// Same state contract as drawStoryWizard — the bronze diadem reads HP like the hat.
const VAL_SKIN = '#c98a5a', VAL_SKIN_SH = '#7f5231', VAL_HAIR = '#3a1e12', VAL_HAIR_HI = '#7a4a28';
const VAL_BRONZE = '#c48a2c', VAL_GOLD = '#e6bd6a', VAL_OX = '#6e2230', VAL_RIM = '#ffcf8a';
function drawStorySorceress(ctx, o) {
  const scale = o.scale ?? 1, now = o.now || 0, facing = o.facing || 1;
  const piggy = !!o.piggy, alive = o.alive !== false && o.alive !== 0;
  const leather = piggy ? '#c86a8a' : mix('#2a1c12', o.color || '#2a1c12', 0.4); // black-brown leather, faintly tinted
  const skin = piggy ? '#ff9ecb' : VAL_SKIN;
  const hp = o.hp ?? 100;
  const f = Math.min(1, Math.abs(o.vx || 0) / 6);
  const ph = o.walkPhase || 0;

  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(o.angle || 0);
  ctx.scale(scale, scale);
  ctx.translate(0, Math.sin(ph) * 0.8 * f);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';

  // warm torch backlight — a low amber glow, painterly not neon
  if (alive) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowOrb(ctx, facing * -2, -2, 22 + Math.sin(now * 0.004) * 2, VAL_RIM, 0.09); ctx.restore(); }

  // oxblood cloak billowing BEHIND, trailing away from the facing
  const cs = Math.sin(now * 0.0035) * 2;
  ctx.beginPath();
  ctx.moveTo(-facing * 3, -7);
  ctx.quadraticCurveTo(-facing * 13 + cs, -2, -facing * 12 + cs, 16);
  ctx.quadraticCurveTo(-facing * 6, 13, -facing * 2, 14);
  ctx.quadraticCurveTo(-facing * 4, 2, -facing * 3, -7);
  ctx.closePath();
  const cg = ctx.createLinearGradient(0, -7, -facing * 12, 16);
  cg.addColorStop(0, VAL_OX); cg.addColorStop(1, shade(VAL_OX, -0.5));
  ctx.fillStyle = cg; ctx.fill();
  ctx.strokeStyle = rgba(VAL_RIM, 0.4); ctx.lineWidth = 1; // warm rim on the cloak edge
  ctx.beginPath(); ctx.moveTo(-facing * 3, -7); ctx.quadraticCurveTo(-facing * 13 + cs, -2, -facing * 12 + cs, 16); ctx.stroke();

  // long dark windswept hair behind the shoulders
  const hg = ctx.createLinearGradient(0, -14, -facing * 6, 10);
  hg.addColorStop(0, VAL_HAIR_HI); hg.addColorStop(1, VAL_HAIR);
  ctx.strokeStyle = hg; ctx.lineWidth = 3.4;
  for (const k of [0, 1]) { const sw = Math.sin(now * 0.004 + k) * 2; ctx.beginPath(); ctx.moveTo(-facing * 1 + k * 2, -13); ctx.quadraticCurveTo(-facing * 7 + sw, -2, -facing * 5 + sw, 8 + k * 2); ctx.stroke(); }

  // tall laced leather boots, stepping
  for (const side of [0, Math.PI]) {
    const sp = ph + side;
    const bx = Math.sin(sp) * 5 * f * facing + (side ? 3 : -3) * (1 - f * 0.5);
    const lft = Math.max(0, Math.cos(sp)) * 3 * f;
    const bg = ctx.createLinearGradient(bx - 2, 7, bx + 2, 16);
    bg.addColorStop(0, shade(leather, 0.15)); bg.addColorStop(1, shade(leather, -0.3));
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.ellipse(bx, 15 - lft, 3, 2.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(bx - 2, 5 - lft, 4, 10);
    ctx.strokeStyle = rgba(VAL_BRONZE, 0.7); ctx.lineWidth = 0.5; // laces
    for (let ly = 6; ly < 14; ly += 2.5) { ctx.beginPath(); ctx.moveTo(bx - 1.6, ly - lft); ctx.lineTo(bx + 1.6, ly - lft); ctx.stroke(); }
  }

  // curvy leather battle skirt — cinched waist flaring over full hips
  ctx.beginPath();
  ctx.moveTo(-3, 2);
  ctx.quadraticCurveTo(-10, 8, -8.5, 16);   // left hip bows out
  ctx.quadraticCurveTo(0, 18, 8.5, 16);
  ctx.quadraticCurveTo(10, 8, 3, 2);        // right hip
  ctx.closePath();
  const sg = ctx.createLinearGradient(0, 2, 0, 16);
  sg.addColorStop(0, shade(leather, 0.12)); sg.addColorStop(1, shade(leather, -0.4));
  ctx.fillStyle = sg; ctx.fill();
  ctx.strokeStyle = rgba(shade(leather, -0.5), 0.6); ctx.lineWidth = 0.8; // hanging strap panels
  for (const px of [-5, -1.5, 1.5, 5]) { ctx.beginPath(); ctx.moveTo(px * 0.5, 3); ctx.lineTo(px, 15.5); ctx.stroke(); }
  // bronze belt with a boss
  ctx.strokeStyle = VAL_BRONZE; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-4, 2.5); ctx.quadraticCurveTo(0, 4, 4, 2.5); ctx.stroke();
  ctx.fillStyle = VAL_GOLD; ctx.beginPath(); ctx.arc(0, 3.2, 1.3, 0, Math.PI * 2); ctx.fill();

  // bare bronzed midriff (Vallejo signature) — a sliver of lit skin at the waist
  ctx.fillStyle = skin; ctx.fillRect(-2.6, -0.5, 5.2, 3);
  ctx.fillStyle = rgba(VAL_SKIN_SH, 0.5); ctx.fillRect(-2.6, 1.2, 5.2, 1.3); // core shadow

  // back arm (behind), bronze bracer
  ctx.strokeStyle = shade(skin, -0.25); ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(-facing * 2, -4); ctx.quadraticCurveTo(-facing * 7, 0, -facing * 6, 5); ctx.stroke();
  ctx.strokeStyle = VAL_BRONZE; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-facing * 5.4, 3); ctx.lineTo(-facing * 6.2, 5.2); ctx.stroke();

  // leather bustier over a full bust — cinched to the waist (the hourglass)
  ctx.beginPath();
  ctx.moveTo(-4.6, -6.5);
  ctx.quadraticCurveTo(-5.4, -2.5, -2.6, 0);   // left cup down to cinch
  ctx.quadraticCurveTo(0, 1.4, 2.6, 0);
  ctx.quadraticCurveTo(5.4, -2.5, 4.6, -6.5);
  ctx.quadraticCurveTo(0, -4.2, -4.6, -6.5);   // neckline dips
  ctx.closePath();
  const bg2 = ctx.createLinearGradient(-5, -6, 5, 1);
  bg2.addColorStop(0, shade(leather, 0.2)); bg2.addColorStop(0.5, leather); bg2.addColorStop(1, shade(leather, -0.35));
  ctx.fillStyle = bg2; ctx.fill();
  // bronzed décolletage + cleavage shadow above the neckline
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.moveTo(-4.4, -6.6); ctx.quadraticCurveTo(0, -4.4, 4.4, -6.6); ctx.quadraticCurveTo(0, -8.6, -4.4, -6.6); ctx.fill();
  ctx.strokeStyle = rgba(VAL_SKIN_SH, 0.6); ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(0, -6.8); ctx.lineTo(0, -5.2); ctx.stroke();
  // gold lacing + trim
  ctx.strokeStyle = VAL_GOLD; ctx.lineWidth = 0.6;
  for (let ly = -5.5; ly < 0; ly += 1.5) { ctx.beginPath(); ctx.moveTo(-1.4, ly); ctx.lineTo(1.4, ly + 0.6); ctx.moveTo(1.4, ly); ctx.lineTo(-1.4, ly + 0.6); ctx.stroke(); }
  ctx.strokeStyle = VAL_BRONZE; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(0, -6.5, 5, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();

  // front arm raised, gripping a bronze-capped stave with an amber jewel
  ctx.strokeStyle = skin; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(facing * 2, -4); ctx.quadraticCurveTo(facing * 8, -6, facing * 10, -8); ctx.stroke();
  ctx.strokeStyle = VAL_BRONZE; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(facing * 6.5, -6.6); ctx.lineTo(facing * 8.2, -7.4); ctx.stroke(); // bracer
  const wood = '#4a3120';
  ctx.strokeStyle = wood; ctx.lineWidth = 1.7; ctx.beginPath(); ctx.moveTo(facing * 10, -8); ctx.lineTo(facing * 12.5, -26); ctx.stroke();
  ctx.strokeStyle = VAL_BRONZE; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(facing * 12, -22); ctx.lineTo(facing * 13, -28); ctx.stroke(); // bronze cap claws
  if (alive) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowOrb(ctx, facing * 13, -28, 5, '#ffab5e', 0.85); ctx.restore(); }
  ctx.fillStyle = '#c85a2a'; ctx.beginPath(); ctx.arc(facing * 13, -28, 1.8, 0, Math.PI * 2); ctx.fill();

  // head — bronzed, strong features, chiaroscuro
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(0, -11, 5.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = rgba(VAL_SKIN_SH, 0.55); // shadow on the away side
  ctx.beginPath(); ctx.arc(-facing * 1.5, -11, 5.2, Math.PI * 0.5, Math.PI * 1.5, facing < 0); ctx.fill();
  ctx.fillStyle = hg; // hair framing / crown
  ctx.beginPath(); ctx.arc(0, -13, 5.7, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
  if (piggy) {
    ctx.fillStyle = '#ff7eb6'; ctx.beginPath(); ctx.arc(facing * 4.2, -10, 2.3, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(facing * 2.2, -11, 1, 0.8, 0, 0, Math.PI * 2); ctx.fill(); // strong eye
    ctx.strokeStyle = shade(VAL_HAIR, 0.1); ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(facing * 0.8, -12.6); ctx.lineTo(facing * 3.8, -12.2); ctx.stroke(); // brow
    ctx.strokeStyle = '#7a2e28'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-1, -7.6); ctx.lineTo(1.2, -7.6); ctx.stroke(); // deep lips
  }
  // warm rim light down the lit edge of the face/shoulder
  ctx.strokeStyle = rgba(VAL_RIM, 0.7); ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.arc(0, -11, 5.2, Math.PI * (facing > 0 ? -0.45 : 1.45), Math.PI * (facing > 0 ? 0.4 : 0.55), facing < 0); ctx.stroke();

  // the bronze DIADEM is her health bar (>=75 proud / 50-74 askew / gone <50)
  if (hp >= 50) {
    ctx.save();
    if (hp < 75) { ctx.translate(facing * 2, -15); ctx.rotate(facing * 0.4); ctx.translate(0, 15); }
    ctx.strokeStyle = VAL_BRONZE; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(0, -12.5, 6, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
    ctx.fillStyle = VAL_GOLD; // side studs
    for (const px of [-4.5, 4.5]) { ctx.beginPath(); ctx.arc(px, -14.6, 0.9, 0, Math.PI * 2); ctx.fill(); }
    // central amber cabochon
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowOrb(ctx, 0, -16.5, 3, '#ffab5e', 0.8); ctx.restore();
    ctx.fillStyle = '#c85a2a';
    ctx.beginPath(); ctx.ellipse(0, -16.5, 1.6, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = rgba('#ffd9a8', 0.9); ctx.beginPath(); ctx.arc(-0.5, -17.2, 0.5, 0, Math.PI * 2); ctx.fill();
    if (hp >= 75 && alive && !piggy) {
      ctx.globalAlpha = 0.3 + 0.15 * Math.sin(now * 0.005);
      runeRing(ctx, 0, -16.5, 8, rgba(VAL_RIM, 1), now, { count: 6, lw: 0.6, alpha: 1, spin: 0.0016 });
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  // smolder near death — warm embers
  if (hp < 25 && alive) {
    for (let i = 0; i < 3; i++) {
      const t = (now * 0.05 + i * 37) % 30;
      ctx.globalAlpha = 0.4 * (1 - t / 30);
      ctx.fillStyle = mix('#ffab5e', '#8a6a4a', 0.4);
      ctx.beginPath(); ctx.arc(Math.sin(now * 0.004 + i * 2.4) * 4, -18 - t, 2 + t * 0.1, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // charged spell mote — warm ember
  if (o.spellReady) {
    const sc = o.spellColor || '#ffab5e';
    glowOrb(ctx, facing * 12, -7, 4.5 + Math.sin(now * 0.008) * 0.8, sc, 0.9);
  }

  ctx.restore();
}

// ---------- David "Grey": a grey pilgrim wizard, Gandalf-ish ----------
// Robe/beard are grey by identity; p.color only tints faintly. Broad hat = HP.
function drawStoryGandalf(ctx, o) {
  const scale = o.scale ?? 1, now = o.now || 0, facing = o.facing || 1;
  const piggy = !!o.piggy, alive = o.alive !== false && o.alive !== 0;
  const robe = piggy ? '#ff9ecb' : mix('#8c8794', o.color || '#8c8794', 0.25);
  const beard = '#dcd9e0', hatc = '#6f6a78', wood = '#6b4f34';
  const ink = shade(robe, -0.55), dark = shade(robe, -0.3), lift = shade(robe, 0.4);
  const hp = o.hp ?? 100;
  const f = Math.min(1, Math.abs(o.vx || 0) / 6);
  const ph = o.walkPhase || 0;

  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(o.angle || 0);
  ctx.scale(scale, scale);
  ctx.translate(0, Math.sin(ph) * 0.7 * f);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';

  // sandalled feet under a long travelling robe
  ctx.fillStyle = shade(wood, 0.1);
  for (const side of [0, Math.PI]) {
    const sp = ph + side;
    const bx = Math.sin(sp) * 4 * f * facing + (side ? 3 : -3) * (1 - f * 0.5);
    ctx.beginPath(); ctx.ellipse(bx, 15, 3.2, 2, 0, 0, Math.PI * 2); ctx.fill();
  }

  // the robe — a long, heavy, floor-length grey travelling cloak
  const sway = Math.sin(now * 0.003 + ph) * 1.2 + facing * f * 2;
  ctx.beginPath();
  ctx.moveTo(-5, -6);
  ctx.quadraticCurveTo(-9, 4, -10 + sway * 0.3, 16);
  ctx.quadraticCurveTo(0, 18, 10 + sway * 0.3, 16);
  ctx.quadraticCurveTo(9, 4, 5, -6);
  ctx.closePath();
  const rg = ctx.createLinearGradient(0, -6, 0, 16);
  rg.addColorStop(0, shade(robe, 0.1)); rg.addColorStop(0.55, robe); rg.addColorStop(1, dark);
  ctx.fillStyle = rg; ctx.fill();
  ctx.strokeStyle = rgba(shade(robe, -0.4), 0.5); ctx.lineWidth = 1; // folds
  for (const fx of [-4, 0, 4]) { ctx.beginPath(); ctx.moveTo(fx * 0.4, -4); ctx.quadraticCurveTo(fx * 0.8, 6, fx + sway * 0.25, 15); ctx.stroke(); }
  ctx.strokeStyle = rgba(lift, 0.6); ctx.lineWidth = 1.1; // rim light
  ctx.beginPath(); ctx.moveTo(facing * 5, -5.5); ctx.quadraticCurveTo(facing * 8.5, 4, (facing > 0 ? 10 : -10) + sway * 0.3, 15.5); ctx.stroke();
  ctx.strokeStyle = ink; ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(-5, -6); ctx.quadraticCurveTo(-9, 4, -10 + sway * 0.3, 16); ctx.quadraticCurveTo(0, 18.5, 10 + sway * 0.3, 16); ctx.quadraticCurveTo(9, 4, 5, -6); ctx.stroke();
  // a grey shoulder mantle
  ctx.fillStyle = shade(robe, -0.18);
  ctx.beginPath(); ctx.moveTo(-6, -4); ctx.quadraticCurveTo(0, 2, 6, -4); ctx.quadraticCurveTo(0, -7, -6, -4); ctx.closePath(); ctx.fill();

  // back arm; front hand grips a tall gnarled staff
  ctx.strokeStyle = dark; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-facing * 2, -3); ctx.quadraticCurveTo(-facing * 7, 1, -facing * 6, 6); ctx.stroke();
  ctx.strokeStyle = robe; ctx.lineWidth = 3.2;
  ctx.beginPath(); ctx.moveTo(facing * 2, -3); ctx.quadraticCurveTo(facing * 8, -2, facing * 9, 0); ctx.stroke();
  ctx.strokeStyle = wood; ctx.lineWidth = 1.8; // staff, taller than he is
  ctx.beginPath(); ctx.moveTo(facing * 9, -18); ctx.quadraticCurveTo(facing * 10, 0, facing * 9.5, 17); ctx.stroke();
  ctx.fillStyle = shade(wood, 0.15); // gnarled knob
  ctx.beginPath(); ctx.arc(facing * 9, -18, 2.4, 0, Math.PI * 2); ctx.fill();
  if (o.spellReady) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowOrb(ctx, facing * 9, -18, 6, o.spellColor || '#cfe0ff', 0.85); ctx.restore(); }

  // head, then the great beard over it
  ctx.fillStyle = PARCHMENT;
  ctx.beginPath(); ctx.arc(0, -11, 5.2, 0, Math.PI * 2); ctx.fill();
  // shadowed eyes under bushy brows
  ctx.fillStyle = rgba(INK, 0.16); ctx.beginPath(); ctx.arc(0, -12.5, 5.2, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.arc(facing * 2.2, -11.4, 0.8, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = beard; ctx.lineWidth = 1.4; // brows
  ctx.beginPath(); ctx.moveTo(facing * 0.6, -13.4); ctx.lineTo(facing * 4, -12.8); ctx.stroke();
  // flowing beard
  ctx.fillStyle = beard;
  ctx.beginPath();
  ctx.moveTo(-4.5, -9);
  ctx.quadraticCurveTo(-5.5, -1, -2.5, 4);
  ctx.quadraticCurveTo(0, 7 + Math.sin(now * 0.004) * 0.6, 2.5, 4);
  ctx.quadraticCurveTo(5.5, -1, 4.5, -9);
  ctx.quadraticCurveTo(0, -6, -4.5, -9);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = rgba('#b8b4c0', 0.6); ctx.lineWidth = 0.5; // beard strands
  ctx.beginPath(); ctx.moveTo(-1.5, -6); ctx.lineTo(-1, 4); ctx.moveTo(1.5, -6); ctx.lineTo(1, 4); ctx.stroke();
  // moustache
  ctx.fillStyle = beard;
  ctx.beginPath(); ctx.moveTo(-3, -8.5); ctx.quadraticCurveTo(0, -6.5, 3, -8.5); ctx.quadraticCurveTo(0, -7.2, -3, -8.5); ctx.fill();

  // the broad, drooping pointed hat IS his HP (>=75 / 50-74 askew / gone <50)
  if (hp >= 50) {
    ctx.save();
    if (hp < 75) { ctx.translate(facing * 2, -15); ctx.rotate(facing * 0.36); ctx.translate(0, 15); }
    ctx.fillStyle = shade(hatc, -0.2); // wide floppy brim
    ctx.beginPath(); ctx.ellipse(0, -15, 13, 3.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); // tall crooked drooping cone
    ctx.moveTo(-8, -15);
    ctx.quadraticCurveTo(-5, -27, facing * 1, -33);
    ctx.quadraticCurveTo(facing * 6, -35, facing * 6.5, -31);
    ctx.quadraticCurveTo(2, -25, 8, -15);
    ctx.closePath();
    const hgd = ctx.createLinearGradient(-8, -15, 8, -32);
    hgd.addColorStop(0, shade(hatc, -0.25)); hgd.addColorStop(0.5, hatc); hgd.addColorStop(1, shade(hatc, 0.2));
    ctx.fillStyle = hgd; ctx.fill();
    ctx.strokeStyle = shade(hatc, -0.5); ctx.lineWidth = 0.9; ctx.stroke();
    ctx.strokeStyle = rgba(shade(hatc, -0.4), 0.7); ctx.lineWidth = 1.5; // simple cord band
    ctx.beginPath(); ctx.moveTo(-7.5, -16); ctx.quadraticCurveTo(0, -14.5, 7.5, -16); ctx.stroke();
    ctx.restore();
  }

  if (hp < 25 && alive) {
    for (let i = 0; i < 3; i++) {
      const t = (now * 0.05 + i * 37) % 30;
      ctx.globalAlpha = 0.4 * (1 - t / 30);
      ctx.fillStyle = '#9c96a6';
      ctx.beginPath(); ctx.arc(Math.sin(now * 0.004 + i * 2.4) * 4, -18 - t, 2 + t * 0.1, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// ---------- spell tome: a leather grimoire with a clasp & embossed sigil ----------
// o: {x,y,angle,now,color,rank,rarityColor}
function drawStoryTome(ctx, o) {
  const now = o.now || 0, color = o.color || '#b98cff';
  const rank = o.rank || 0;
  const bob = Math.sin(now * 0.003 + o.x * 0.05) * 1.5;
  // rarity halo
  if (rank >= 2 && o.rarityColor) {
    const pulse = 0.5 + 0.5 * Math.sin(now * (rank >= 3 ? 0.012 : 0.008));
    glowOrb(ctx, o.x, o.y + bob, 22 + 8 * pulse + rank * 3, o.rarityColor, 0.35 + 0.2 * pulse);
  }
  ctx.save();
  ctx.translate(o.x, o.y + bob);
  ctx.rotate((o.angle || 0) * 0.5);
  // covers
  const leather = shade(color, -0.5);
  const cg = ctx.createLinearGradient(-11, 0, 11, 0);
  cg.addColorStop(0, shade(leather, -0.3));
  cg.addColorStop(0.5, leather);
  cg.addColorStop(1, shade(leather, 0.2));
  // page block (right edge)
  ctx.fillStyle = PARCHMENT;
  ctx.fillRect(-6, -13, 15, 26);
  ctx.strokeStyle = rgba(INK, 0.3); ctx.lineWidth = 0.5;
  for (let i = -10; i < 12; i += 2.5) { ctx.beginPath(); ctx.moveTo(8.5, i); ctx.lineTo(9.5, i); ctx.stroke(); }
  // front cover
  ctx.fillStyle = cg;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-10, -14, 17, 28, 2) : ctx.rect(-10, -14, 17, 28);
  ctx.fill();
  // spine in the spell colour
  ctx.fillStyle = color;
  ctx.fillRect(-10, -14, 3.5, 28);
  ctx.strokeStyle = shade(color, 0.4); ctx.lineWidth = 0.6;
  ctx.strokeRect(-10, -14, 3.5, 28);
  // embossed sigil, glowing in the spell colour
  ctx.shadowColor = color; ctx.shadowBlur = 8 + 4 * Math.sin(now * 0.008);
  drawStar(ctx, -1.5, 0, 5, color);
  ctx.shadowBlur = 0;
  runeRing(ctx, -1.5, 0, 7, rgba(color, 1), now, { count: 6, lw: 0.7, alpha: 0.7 });
  // clasp
  ctx.fillStyle = mix(color, '#ffe9a8', 0.6);
  ctx.fillRect(6, -3, 3, 6);
  ctx.strokeStyle = rgba(INK, 0.6); ctx.lineWidth = 0.9;
  ctx.strokeRect(-10, -14, 17, 28);
  ctx.restore();
}

// ---------- the Mega Hat: ornate golden wizard hat ----------
function drawStoryHat(ctx, o) {
  const now = o.now || 0, gold = '#ffd700';
  const bob = Math.sin(now * 0.004) * 2;
  ctx.save();
  ctx.translate(o.x, o.y + bob);
  ctx.rotate((o.angle || 0) * 0.4);
  glowOrb(ctx, 0, -4, 20 + 4 * Math.sin(now * 0.01), gold, 0.4);
  ctx.shadowColor = gold; ctx.shadowBlur = 12;
  // brim
  ctx.fillStyle = shade(gold, -0.15);
  ctx.beginPath(); ctx.ellipse(0, 7, 15, 4, 0, 0, Math.PI * 2); ctx.fill();
  // cone
  ctx.beginPath();
  ctx.moveTo(-11, 7);
  ctx.quadraticCurveTo(-5, -12, 3, -16);
  ctx.quadraticCurveTo(9, -18, 10, -13);
  ctx.quadraticCurveTo(4, -6, 11, 7);
  ctx.closePath();
  const hg = ctx.createLinearGradient(-11, 7, 10, -16);
  hg.addColorStop(0, '#c99700'); hg.addColorStop(0.5, gold); hg.addColorStop(1, '#fff3b0');
  ctx.fillStyle = hg; ctx.fill();
  ctx.shadowBlur = 0;
  // band, stars, filigree
  ctx.strokeStyle = '#8a6a00'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(-10, 4); ctx.quadraticCurveTo(0, 6, 10, 3); ctx.stroke();
  drawStar(ctx, 0, 3.5, 2.6, '#fff3b0');
  drawStar(ctx, -5, -3, 1.6, '#fff8d8');
  drawStar(ctx, 4, -8, 1.4, '#fff8d8');
  ctx.restore();
}

// ---------- Fusion Catalyst: a floating cut-gem prism ----------
function drawStoryCatalyst(ctx, o) {
  const now = o.now || 0, mag = '#ff4df0';
  const pulse = 0.5 + 0.5 * Math.sin(now * 0.01);
  glowOrb(ctx, o.x, o.y, 20 + 9 * pulse, mag, 0.45);
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(now * 0.004);
  ctx.shadowColor = mag; ctx.shadowBlur = 14 + 6 * pulse;
  // outer gem with facets
  const g = ctx.createLinearGradient(0, -12, 0, 12);
  g.addColorStop(0, '#ffd6fb'); g.addColorStop(0.5, mag); g.addColorStop(1, '#a01e9a');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(11, -2); ctx.lineTo(6, 12); ctx.lineTo(-6, 12); ctx.lineTo(-11, -2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = rgba('#ffd6fb', 0.8); ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(0, 12); ctx.moveTo(-11, -2); ctx.lineTo(11, -2); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = rgba('#fff', 0.85);
  ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(4, -2); ctx.lineTo(0, 3); ctx.lineTo(-4, -2); ctx.closePath(); ctx.fill();
  ctx.restore();
  runeRing(ctx, o.x, o.y, 16, rgba(mag, 1), now, { count: 8, lw: 0.8, alpha: 0.5, spin: -0.003 });
}

// ---------- wooden crate: grain, iron corners, storybook chest ----------
// o: {vertices, x, y, angle}
function drawStoryCrate(ctx, o) {
  const wood = '#a6763c';
  ctx.save();
  ctx.fillStyle = wood;
  ctx.strokeStyle = shade(wood, -0.35);
  ctx.lineWidth = 5; ctx.lineJoin = 'round';
  ctx.beginPath();
  const v = o.vertices;
  ctx.moveTo(v[0].x, v[0].y);
  for (let i = 1; i < v.length; i++) ctx.lineTo(v[i].x, v[i].y);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.translate(o.x, o.y);
  ctx.rotate(o.angle || 0);
  // top-lit gradient sheen
  const gg = ctx.createLinearGradient(0, -10, 0, 10);
  gg.addColorStop(0, rgba('#ffffff', 0.18));
  gg.addColorStop(0.5, rgba('#ffffff', 0));
  gg.addColorStop(1, rgba(INK, 0.22));
  ctx.fillStyle = gg; ctx.fillRect(-10, -10, 20, 20);
  // plank grain
  ctx.strokeStyle = rgba(shade(wood, -0.4), 0.55); ctx.lineWidth = 1;
  for (const gx of [-4.5, 0, 4.5]) { ctx.beginPath(); ctx.moveTo(gx, -9); ctx.lineTo(gx, 9); ctx.stroke(); }
  ctx.strokeStyle = rgba(shade(wood, -0.2), 0.4);
  ctx.beginPath(); ctx.moveTo(-9, -3); ctx.lineTo(9, -3); ctx.moveTo(-9, 4); ctx.lineTo(9, 4); ctx.stroke();
  // iron corner brackets
  ctx.strokeStyle = '#3d3550'; ctx.lineWidth = 2;
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    ctx.beginPath();
    ctx.moveTo(sx * 9, sy * 5); ctx.lineTo(sx * 9, sy * 9); ctx.lineTo(sx * 5, sy * 9);
    ctx.stroke();
    ctx.fillStyle = '#5a5070';
    ctx.beginPath(); ctx.arc(sx * 7.5, sy * 7.5, 1, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// ---------- backdrop: warm storybook depth with drifting motes & sigils ----------
// o: {bg, W, H, now, stars, voidTop}
// a parallaxing silhouette ridge; sharp>1 pushes rolling hills toward jagged peaks/spires
function _ridge(ctx, W, H, baseY, amp, freq, sharp, tint, rim, phase) {
  const yAt = x => { let s = Math.sin(x * freq + phase) * 0.6 + Math.sin(x * freq * 2.3 + phase * 1.6) * 0.4; s = s * 0.5 + 0.5; if (sharp > 1) s = Math.pow(s, sharp); return baseY - amp * s; };
  ctx.beginPath(); ctx.moveTo(-30, H + 30); ctx.lineTo(-30, yAt(-30));
  for (let x = -30; x <= W + 30; x += 22) ctx.lineTo(x, yAt(x));
  ctx.lineTo(W + 30, H + 30); ctx.closePath();
  ctx.fillStyle = tint; ctx.fill();
  if (rim) {
    ctx.strokeStyle = rim; ctx.lineWidth = 1.4;
    ctx.beginPath();
    let first = true;
    for (let x = -30; x <= W + 30; x += 22) { const y = yAt(x); first ? ctx.moveTo(x, y) : ctx.lineTo(x, y); first = false; }
    ctx.stroke();
  }
}

function drawStoryBackdrop(ctx, o) {
  const W = o.W, H = o.H, now = o.now || 0, base = o.bg || '#241d2e';
  const icy = !!o.icy, lava = o.lavaY != null, space = !!o.stars, acid = !!o.acid;
  const biome = icy ? { accent: '#bfe8ff', far: mix(base, '#0a1830', 0.5), near: '#233a54', rim: rgba('#eafaff', 0.5), sharp: 2.0, freq: 0.016 }
    : lava ? { accent: acid ? '#c5f97d' : '#ff8c5a', far: mix(base, '#160608', 0.5), near: '#2a1518', rim: rgba(acid ? '#c5f97d' : '#ff8c5a', 0.55), sharp: 1.4, freq: 0.011 }
    : space ? { accent: '#c8b8ff', far: mix(base, '#0a0818', 0.5), near: shade(base, -0.5), rim: rgba('#c8b8ff', 0.3), sharp: 1, freq: 0.01 }
    : { accent: '#b98cff', far: mix(base, '#0c0818', 0.4), near: shade(base, -0.45), rim: rgba('#b98cff', 0.28), sharp: 2.4, freq: 0.02 };

  // sky wash, tinted toward the biome accent at the top
  const vg = ctx.createLinearGradient(0, -30, 0, H + 30);
  vg.addColorStop(0, mix(shade(base, 0.14), biome.accent, 0.14));
  vg.addColorStop(0.5, base);
  vg.addColorStop(1, lava ? mix(shade(base, -0.2), biome.accent, 0.22) : shade(base, -0.32));
  ctx.fillStyle = vg;
  ctx.fillRect(-30, -30, W + 60, H + 60);

  // celestial body (arcane/ice = moon, space = ringed planet); lava gets bottom-glow instead
  if (!lava) {
    const cx = space ? W * 0.78 : W * 0.2, cy = H * 0.24, cr = space ? 54 : 44;
    glowOrb(ctx, cx, cy, cr * 2.2, biome.accent, 0.14);
    const mg = ctx.createRadialGradient(cx - cr * 0.3, cy - cr * 0.3, cr * 0.2, cx, cy, cr);
    mg.addColorStop(0, rgba(mix(biome.accent, '#fff', 0.5), 0.9));
    mg.addColorStop(1, rgba(biome.accent, 0.28));
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.fill();
    if (space) { // planet ring
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.4); ctx.scale(1, 0.32);
      ctx.strokeStyle = rgba('#e8d2b0', 0.4); ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(0, 0, cr + 20, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    } else { // crescent shadow
      ctx.fillStyle = rgba(shade(base, -0.2), 0.5);
      ctx.beginPath(); ctx.arc(cx + cr * 0.35, cy - cr * 0.1, cr, 0, Math.PI * 2); ctx.fill();
    }
    if (icy) { // aurora ribbons
      for (let k = 0; k < 2; k++) {
        ctx.strokeStyle = rgba(k ? '#9be1c8' : '#bfe8ff', 0.12); ctx.lineWidth = 18;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 40) ctx[x ? 'lineTo' : 'moveTo'](x, 120 + k * 34 + Math.sin(x * 0.006 + now * 0.0006 + k) * 26);
        ctx.stroke();
      }
    }
  }

  // faint constellation-sigils
  ctx.strokeStyle = rgba('#e8d2b0', 0.05); ctx.lineWidth = 1;
  for (const [cx, cy, cr] of [[210, 150, 46], [1080, 180, 40]]) {
    ctx.beginPath(); ctx.arc(cx, cy, cr + Math.sin(now * 0.001) * 2, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2 + now * 0.0004;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * cr, cy + Math.sin(a) * cr, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = rgba('#e8d2b0', 0.12); ctx.fill();
    }
  }

  // starfield behind the ranges (space maps)
  if (o.stars) {
    for (const s of o.stars) {
      ctx.globalAlpha = 0.4 + 0.4 * Math.sin(now * 0.002 + s.tw);
      ctx.fillStyle = '#f4ecd0'; ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    ctx.globalAlpha = 1;
  }

  // two parallax silhouette ranges — the depth upgrade
  ctx.globalAlpha = 0.85;
  _ridge(ctx, W, H, H * 0.72, 70, biome.freq * 0.6, 1, biome.far, null, now * 0.00003);
  ctx.globalAlpha = 1;
  _ridge(ctx, W, H, H * 0.86, space ? 70 : 120, biome.freq, biome.sharp, biome.near, biome.rim, now * 0.00007);
  if (space) { // a couple of floating islands drifting between the ranges
    for (const [ix, iy, iw] of [[300, 380, 90], [820, 300, 70], [1050, 440, 100]]) {
      const dy = Math.sin(now * 0.0005 + ix) * 6;
      ctx.fillStyle = biome.near;
      ctx.beginPath(); ctx.ellipse(ix, iy + dy, iw, 12, 0, 0, Math.PI); ctx.fill();
      ctx.beginPath(); ctx.moveTo(ix - iw, iy + dy); ctx.quadraticCurveTo(ix, iy + dy + 40, ix + iw, iy + dy); ctx.fill();
      ctx.strokeStyle = biome.rim; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(ix, iy + dy, iw, 12, 0, Math.PI, Math.PI * 2); ctx.stroke();
    }
  }

  // lava/acid maps: molten glow rising from the pit
  if (lava) {
    const lg = ctx.createLinearGradient(0, H, 0, H - 220);
    lg.addColorStop(0, rgba(biome.accent, 0.4));
    lg.addColorStop(1, rgba(biome.accent, 0));
    ctx.fillStyle = lg; ctx.fillRect(0, H - 220, W, 220);
    for (let i = 0; i < 14; i++) { // rising embers
      const ex = (i * 97 + now * 0.02) % W;
      const ey = H - (now * 0.03 + i * 60) % 260;
      ctx.globalAlpha = 0.3 * (1 - (H - ey) / 260);
      ctx.fillStyle = biome.accent;
      ctx.beginPath(); ctx.arc(ex, ey, 1.5 + (i % 2), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // drifting dust motes (over the ranges, catch the light)
  for (let i = 0; i < 26; i++) {
    const mx = (i * 137.5 + now * 0.01 * (1 + i % 3)) % (W + 40) - 20;
    const my = (i * 53.3 + Math.sin(now * 0.0006 + i) * 20) % (H + 40) - 20;
    ctx.globalAlpha = 0.06 + 0.06 * Math.sin(now * 0.002 + i);
    ctx.fillStyle = mix('#f0e2c4', biome.accent, 0.4);
    ctx.beginPath(); ctx.arc(mx, my, 1 + (i % 2), 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  if (o.voidTop) {
    const g = ctx.createLinearGradient(0, 0, 0, 60);
    g.addColorStop(0, 'rgba(165,94,234,0.5)');
    g.addColorStop(1, 'rgba(165,94,234,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 60);
  }
}

// ---------- terrain: storybook stone with an animated, biome-aware crust ----------
function _thash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
// o: {vertices, bounds, angle, color, now, crust:'grass'|'snow'|'char'|'crystal', flip}
function drawStoryTerrain(ctx, o) {
  const v = o.vertices, b = o.bounds, now = o.now || 0, base = o.color || '#2a2336';
  const top = b.min.y, bot = b.max.y, left = b.min.x, right = b.max.x;
  const flip = !!o.flip, crustY = flip ? bot : top, dir = flip ? 1 : -1;
  const aligned = Math.abs(Math.sin(o.angle || 0)) < 0.15;

  const trace = () => { ctx.beginPath(); ctx.moveTo(v[0].x, v[0].y); for (let i = 1; i < v.length; i++) ctx.lineTo(v[i].x, v[i].y); ctx.closePath(); };

  // stone body — vertical gradient, lit toward the crust side
  trace();
  const g = ctx.createLinearGradient(0, top, 0, bot);
  g.addColorStop(0, shade(base, flip ? -0.4 : 0.14));
  g.addColorStop(0.5, base);
  g.addColorStop(1, shade(base, flip ? 0.14 : -0.4));
  ctx.fillStyle = g; ctx.fill();

  // texture + soil band, clipped to the body
  ctx.save(); trace(); ctx.clip();
  ctx.strokeStyle = rgba(shade(base, -0.45), 0.5); ctx.lineWidth = 1; // cracks
  for (let i = 0; i < 5; i++) {
    const hx = left + (right - left) * _thash(i * 9.1 + left), hy = top + (bot - top) * _thash(i * 4.7 + top);
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + 4 + _thash(i) * 4, hy + 6 + _thash(i + 1) * 5); ctx.stroke();
  }
  ctx.fillStyle = rgba(shade(base, 0.3), 0.28); // mineral speckles
  for (let i = 0; i < 9; i++) { const hx = left + (right - left) * _thash(i * 13.3 + left + 5), hy = top + (bot - top) * _thash(i * 7.7 + bot); ctx.beginPath(); ctx.arc(hx, hy, 0.7, 0, Math.PI * 2); ctx.fill(); }
  if (aligned) { // soil/crust band just under the top edge
    const cc = _crustColors(o.crust, base);
    const bandH = 6;
    const bg = ctx.createLinearGradient(0, crustY, 0, crustY - dir * bandH);
    bg.addColorStop(0, rgba(cc.soil, 0)); bg.addColorStop(1, cc.soil);
    ctx.fillStyle = bg; ctx.fillRect(left, Math.min(crustY, crustY - dir * bandH), right - left, bandH);
  }
  ctx.restore();

  // ink outline
  ctx.strokeStyle = shade(base, -0.6); ctx.lineWidth = 1.5; ctx.lineJoin = 'round'; trace(); ctx.stroke();

  // rim light along the crust edge
  if (aligned) { ctx.strokeStyle = rgba(_crustColors(o.crust, base).rim, 0.55); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(left + 1, crustY + dir * 0.5); ctx.lineTo(right - 1, crustY + dir * 0.5); ctx.stroke(); }

  // the animated crust — tufts/mounds/embers/crystals overhanging the edge
  if (aligned) _crustTufts(ctx, o.crust, left, right, crustY, dir, now, base);
}

function _crustColors(kind, base) {
  if (kind === 'snow') return { soil: '#dfefff', rim: '#ffffff', a: '#eaf6ff', b: '#bcd8f0' };
  if (kind === 'char') return { soil: '#241014', rim: '#ff8c5a', a: '#3a1c18', b: '#ffab5e' };
  if (kind === 'crystal') return { soil: '#2a1d44', rim: '#c8b8ff', a: '#8a6de0', b: '#d8c8ff' };
  return { soil: '#3a6a2e', rim: '#8fe6a2', a: '#4f8a3d', b: '#8fe6a2' }; // grass
}

function _crustTufts(ctx, kind, x0, x1, cy, dir, now, base) {
  const cc = _crustColors(kind, base), step = 7, w = x1 - x0;
  // one vertical gradient serves every grass blade on the edge (the axis is
  // vertical, so the paint is x-independent) — allocating per tuft was the
  // single hottest path in the whole frame on wide platforms
  let grassGrad = null;
  if (kind === 'grass') {
    grassGrad = ctx.createLinearGradient(x0, cy, x0, cy + dir * 8);
    grassGrad.addColorStop(0, cc.a); grassGrad.addColorStop(1, cc.b);
  }
  for (let x = x0 + 4; x < x1 - 2; x += step) {
    const s = _thash(Math.round(x) * 3.3), sway = Math.sin(now * 0.003 + x * 0.12) * 2;
    if (kind === 'grass') {
      ctx.strokeStyle = grassGrad; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
      for (const off of [-2, 0, 2]) { ctx.beginPath(); ctx.moveTo(x + off, cy); ctx.quadraticCurveTo(x + off + sway * 0.5, cy + dir * 4, x + off + sway + off * 0.4, cy + dir * (6 + s * 3)); ctx.stroke(); }
      if (s > 0.86) { ctx.fillStyle = ['#ffd166', '#ff8fc7', '#e8d5ff'][Math.floor(s * 20) % 3]; ctx.beginPath(); ctx.arc(x + sway, cy + dir * (7 + s * 3), 1.4, 0, Math.PI * 2); ctx.fill(); }
    } else if (kind === 'snow') {
      ctx.fillStyle = cc.a;
      ctx.beginPath(); ctx.ellipse(x, cy, 4 + s * 2, 2.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x - 1, cy - dir * 0.5, 2 + s, 1.2, 0, 0, Math.PI * 2); ctx.fill();
      const tw = 0.5 + 0.5 * Math.sin(now * 0.005 + x); if (s > 0.7) { ctx.globalAlpha = tw; ctx.fillStyle = '#eaf6ff'; ctx.fillRect(x + 2, cy + dir * (3 + s * 3), 1, 1); ctx.globalAlpha = 1; }
    } else if (kind === 'char') {
      ctx.fillStyle = shade(base, -0.5);
      ctx.beginPath(); ctx.moveTo(x - 2.5, cy); ctx.lineTo(x + sway * 0.4, cy + dir * (5 + s * 4)); ctx.lineTo(x + 2.5, cy); ctx.closePath(); ctx.fill();
      const flick = 0.4 + 0.6 * Math.abs(Math.sin(now * 0.008 + x * 0.5));
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = flick * (0.5 + s * 0.5);
      ctx.fillStyle = cc.b; ctx.beginPath(); ctx.arc(x + sway * 0.3, cy + dir * (5 + s * 4), 1.1, 0, Math.PI * 2); ctx.fill(); ctx.restore(); ctx.globalAlpha = 1;
    } else { // crystal
      const pulse = 0.5 + 0.5 * Math.sin(now * 0.004 + x * 0.3);
      const h = 5 + s * 5;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowOrb(ctx, x, cy + dir * h * 0.5, 4, cc.b, 0.25 + pulse * 0.25); ctx.restore();
      const cg = ctx.createLinearGradient(x, cy, x, cy + dir * h);
      cg.addColorStop(0, cc.a); cg.addColorStop(1, rgba(cc.b, 0.9));
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.moveTo(x - 2, cy); ctx.lineTo(x + (s - 0.5) * 2, cy + dir * h); ctx.lineTo(x + 2, cy); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgba('#fff', 0.4 + pulse * 0.3); ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x + (s - 0.5) * 2, cy + dir * h); ctx.stroke();
    }
  }
}

// ---------- iron spikes: lit teeth with a cruel glint ----------
// o: {x,y,angle,w,h,color}
function drawStorySpikes(ctx, o) {
  const w = o.w || 100, h = o.h || 20, base = o.color || '#8a2f3d';
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(o.angle || 0);
  const teeth = Math.max(3, Math.round(w / 18));
  const tw = w / teeth;
  // base plinth
  ctx.fillStyle = shade(base, -0.45);
  ctx.fillRect(-w / 2, h / 2 - 5, w, 6);
  // teeth with a metal gradient + ink edge + rust wash from the base colour
  for (let i = 0; i < teeth; i++) {
    const x0 = -w / 2 + i * tw, xm = x0 + tw / 2, x1 = x0 + tw;
    ctx.beginPath();
    ctx.moveTo(x0, h / 2); ctx.lineTo(xm, -h / 2 - 4); ctx.lineTo(x1, h / 2); ctx.closePath();
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, shade(base, -0.3));
    g.addColorStop(0.45, mix(base, '#e8e8f0', 0.35));
    g.addColorStop(0.5, '#f4f4ff');
    g.addColorStop(0.55, mix(base, '#e8e8f0', 0.35));
    g.addColorStop(1, shade(base, -0.4));
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = shade(base, -0.6); ctx.lineWidth = 0.8; ctx.stroke();
    // bright tip glint
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(xm - 1, -h / 2 + 1); ctx.lineTo(xm, -h / 2 - 4); ctx.stroke();
  }
  ctx.restore();
}

// ---------- bosses: hooded, horned, luminous — the same four silhouettes, lit ----------
// o: {x,y,r,type,color,now}
// Rare team bosses — shared by the live boss fight and private local art review.
// type: rizard_rizz | rizard_tizz | manu_de | manu_mx
function drawSecretBoss(ctx, o) {
  const { x, y, now = 0 } = o;
  const r = o.r || 46;
  const type = o.type || 'rizard_rizz';
  const founder = (opts) => {
    glowOrb(ctx, x, y, r * 1.8, opts.aura, 0.26);
    const hr = r * 0.6, hy = y - r * 0.58;
    const shoulderY = y - r * 0.05, hemY = y + r * 1.4;
    const shoulderW = r * 1.8, hemW = r * 1.55;
    ctx.fillStyle = opts.inner || '#d3d8de';
    ctx.beginPath(); ctx.moveTo(x - shoulderW * 0.45, shoulderY); ctx.lineTo(x + shoulderW * 0.45, shoulderY); ctx.lineTo(x + hemW * 0.45, hemY); ctx.lineTo(x - hemW * 0.45, hemY); ctx.closePath(); ctx.fill();
    ctx.fillStyle = opts.jacket;
    ctx.beginPath(); ctx.moveTo(x - shoulderW / 2, shoulderY); ctx.lineTo(x + shoulderW / 2, shoulderY); ctx.lineTo(x + hemW / 2, hemY); ctx.lineTo(x - hemW / 2, hemY); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = shade(opts.jacket, -0.5); ctx.lineWidth = 1.3; ctx.stroke();
    ctx.fillStyle = opts.inner || '#d3d8de';
    ctx.beginPath(); ctx.moveTo(x - r * 0.3, shoulderY); ctx.lineTo(x + r * 0.3, shoulderY); ctx.lineTo(x, shoulderY + r * 0.55); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = shade(opts.jacket, -0.6); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, shoulderY + r * 0.55); ctx.lineTo(x, hemY); ctx.stroke();
    const patchSize = r * 0.36, patchX = x - r * 0.5, patchY = y + r * 0.5;
    ctx.fillStyle = opts.accent; ctx.fillRect(patchX - patchSize / 2, patchY - patchSize / 2, patchSize, patchSize);
    ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.round(patchSize * 0.85)}px Georgia`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Y', patchX, patchY + 1); ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = opts.skin; ctx.fillRect(x - r * 0.15, hy + hr * 0.55, r * 0.3, r * 0.5);
    ctx.beginPath(); ctx.arc(x, hy, hr, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = shade(opts.skin, -0.4); ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#f6f8fa';
    for (const side of [-1, 1]) {
      ctx.fillRect(x + side * hr * 0.85 - 1.5, hy, 3, hr * 0.5);
      ctx.beginPath(); ctx.arc(x + side * hr * 0.85, hy - 2, 2.7, 0, Math.PI * 2); ctx.fill();
    }
    return { hy, hr };
  };
  const eyes = (cx, cy, dx, ey, er, glow) => {
    ctx.shadowColor = glow; ctx.shadowBlur = 10; ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx - dx, cy + ey, er, 0, Math.PI * 2); ctx.arc(cx + dx, cy + ey, er, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = '#16121c';
    ctx.beginPath(); ctx.arc(cx - dx, cy + ey, er * 0.4, 0, Math.PI * 2); ctx.arc(cx + dx, cy + ey, er * 0.4, 0, Math.PI * 2); ctx.fill();
  };
  if (type === 'rizard_rizz' || type === 'rizard_tizz') {
    const tizz = type === 'rizard_tizz';
    if (tizz) runeRing(ctx, x, y - r * 0.5, r * 0.9, '#3fb5ff', now, { count: 8, lw: 1.5, alpha: 0.6 });
    const { hy, hr } = founder({ aura: tizz ? '#3fb5ff' : '#ffd166', jacket: '#1c2b4a', accent: '#ff6a00', skin: '#e8b98a', inner: '#e6eaee' });
    ctx.fillStyle = '#2a2018';
    ctx.beginPath(); ctx.arc(x, hy - hr * 0.3, hr, Math.PI * 1.05, Math.PI * 1.95); ctx.lineTo(x + hr * 0.7, hy - hr * 0.1); ctx.quadraticCurveTo(x, hy - hr * 1.1, x - hr * 0.9, hy - hr * 0.1); ctx.closePath(); ctx.fill();
    if (tizz) {
      eyes(x, hy, hr * 0.42, hr * 0.05, hr * 0.2, '#eaffff');
      ctx.strokeStyle = '#5a3a24'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, hy + hr * 0.45, hr * 0.35, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    } else {
      ctx.fillStyle = '#16121c';
      ctx.fillRect(x - hr * 0.75, hy - hr * 0.12, hr * 1.5, 2.5);
      ctx.beginPath(); ctx.ellipse(x - hr * 0.42, hy, hr * 0.34, hr * 0.24, 0, 0, Math.PI * 2); ctx.ellipse(x + hr * 0.42, hy, hr * 0.34, hr * 0.24, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.arc(x - hr * 0.5, hy - hr * 0.08, 2, 0, Math.PI * 2); ctx.arc(x + hr * 0.34, hy - hr * 0.08, 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#5a3a24'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x + hr * 0.12, hy + hr * 0.5, hr * 0.4, 0.1 * Math.PI, 0.55 * Math.PI); ctx.stroke();
    }
    return;
  }
  if (type === 'manu_de' || type === 'manu_mx') {
    const de = type === 'manu_de';
    const { hy, hr } = founder({ aura: de ? '#c9cdd8' : '#e3a86a', jacket: de ? '#3d4450' : '#4a4f57', accent: de ? '#c0392b' : '#2e8b57', skin: '#d69a6a', inner: de ? '#cfd6e0' : '#e8dcc0' });
    ctx.fillStyle = '#2a2018';
    ctx.beginPath(); ctx.arc(x, hy - hr * 0.18, hr * 0.98, Math.PI * 1.08, Math.PI * 1.92); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#20242c'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(x - hr * 0.42, hy, hr * 0.3, 0, Math.PI * 2); ctx.moveTo(x + hr * 0.72, hy); ctx.arc(x + hr * 0.42, hy, hr * 0.3, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - hr * 0.12, hy); ctx.lineTo(x + hr * 0.12, hy); ctx.stroke();
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - hr * 0.5, hy + hr * 0.58); ctx.quadraticCurveTo(x - hr * 0.06, hy + hr * 0.9, x, hy + hr * 0.5); ctx.quadraticCurveTo(x + hr * 0.06, hy + hr * 0.9, x + hr * 0.5, hy + hr * 0.58); ctx.stroke();
    ctx.lineCap = 'butt';
    if (de) {
      ctx.fillStyle = '#2b2f38';
      ctx.beginPath(); ctx.arc(x, hy - hr * 0.12, hr * 1.02, Math.PI * 1.02, Math.PI * 1.98); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c0392b'; ctx.fillRect(x - hr * 0.95, hy - hr * 0.6, hr * 1.9, 4);
    } else {
      ctx.fillStyle = '#8a5a2b';
      ctx.beginPath(); ctx.ellipse(x, hy - hr * 0.7, hr * 1.5, hr * 0.3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x, hy - hr * 1.02, hr * 0.55, hr * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#2e8b57'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(x, hy - hr * 0.82, hr * 0.55, hr * 0.16, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }
}

function drawStoryBoss(ctx, o) {
  const { x, y, now = 0 } = o, r = o.r || 46, type = o.type, color = o.color || '#e15d5d';
  // secret bosses share the team-portrait path
  if (type === 'rizard_rizz' || type === 'rizard_tizz' || type === 'manu_de' || type === 'manu_mx') {
    return drawSecretBoss(ctx, o);
  }
  glowOrb(ctx, x, y, r * 1.7, color, 0.28); // aura
  const bodyOrb = (fill, rim) => {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.2, x, y, r);
    g.addColorStop(0, shade(fill, 0.28)); g.addColorStop(0.6, fill); g.addColorStop(1, shade(fill, -0.4));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = shade(fill, -0.6); ctx.lineWidth = 1.4; ctx.stroke();
    ctx.strokeStyle = rgba(shade(fill, 0.5), 0.6); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, r - 2, Math.PI * 1.05, Math.PI * 1.6); ctx.stroke();
    if (rim) { ctx.shadowColor = rim; }
  };
  const eyes = (dx, ey, er, glow) => {
    ctx.shadowColor = glow; ctx.shadowBlur = 10;
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(x - dx, y + ey, er, 0, Math.PI * 2); ctx.arc(x + dx, y + ey, er, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = '#16121c';
    ctx.beginPath(); ctx.arc(x - dx, y + ey, er * 0.4, 0, Math.PI * 2); ctx.arc(x + dx, y + ey, er * 0.4, 0, Math.PI * 2); ctx.fill();
  };
  if (type === 'dragon') {
    const flap = Math.sin(now * 0.012) * 0.5;
    for (const side of [-1, 1]) { // membraned wings with ribs
      ctx.beginPath();
      ctx.moveTo(x + side * r * 0.4, y - 8);
      ctx.quadraticCurveTo(x + side * (r + 30), y - 40 - flap * 26, x + side * (r + 46), y - 30 - flap * 26);
      ctx.quadraticCurveTo(x + side * (r + 30), y - 2, x + side * (r + 14), y + 16);
      ctx.closePath();
      const wg = ctx.createLinearGradient(x, y - 30, x + side * (r + 46), y);
      wg.addColorStop(0, '#7a2b2b'); wg.addColorStop(1, '#c15353');
      ctx.fillStyle = wg; ctx.fill();
      ctx.strokeStyle = 'rgba(40,12,12,0.6)'; ctx.lineWidth = 1;
      for (const t of [0.4, 0.7]) { ctx.beginPath(); ctx.moveTo(x + side * r * 0.4, y - 8); ctx.lineTo(x + side * (r * 0.4 + (r + 40) * t), y - 30 - flap * 26 * t); ctx.stroke(); }
    }
    bodyOrb('#e15d5d');
    ctx.fillStyle = '#a13d3d'; // horns
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + side * 14, y - r + 6); ctx.lineTo(x + side * 24, y - r - 18); ctx.lineTo(x + side * 30, y - r + 12); ctx.closePath(); ctx.fill(); ctx.strokeStyle = shade('#a13d3d', -0.5); ctx.lineWidth = 0.8; ctx.stroke(); }
    ctx.fillStyle = shade('#e15d5d', -0.35); // snout
    ctx.beginPath(); ctx.ellipse(x, y + 12, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
    eyes(14, -10, 5, '#ffd166');
  } else if (type === 'lich') {
    ctx.fillStyle = '#2a1d3d'; // hood
    ctx.beginPath(); ctx.arc(x, y, r + 7, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = shade('#2a1d3d', 0.3); ctx.lineWidth = 1; ctx.stroke();
    bodyOrb('#c084fc');
    ctx.fillStyle = PARCHMENT; // skull-pale face
    ctx.beginPath(); ctx.ellipse(x, y + 2, r * 0.68, r * 0.78, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd166'; // crown
    ctx.beginPath(); ctx.moveTo(x - 18, y - r - 2);
    for (let i = 0; i < 3; i++) { ctx.lineTo(x - 12 + i * 12, y - r - 16); ctx.lineTo(x - 6 + i * 12, y - r - 2); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e15d5d';
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x - 12 + i * 12, y - r - 9, 1.6, 0, Math.PI * 2); ctx.fill(); }
    eyes(10, -4, 4.8, '#9be15d');
    runeRing(ctx, x, y, r + 16, rgba('#9be15d', 1), now, { count: 8, lw: 0.8, alpha: 0.35, spin: 0.001 });
  } else if (type === 'golem') {
    bodyOrb('#a6763c');
    ctx.strokeStyle = rgba('#ff8c5a', 0.7); ctx.lineWidth = 2.5; ctx.lineCap = 'round'; // molten cracks
    ctx.shadowColor = '#ff8c5a'; ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(x - 20, y - 30); ctx.lineTo(x - 6, y - 10); ctx.lineTo(x - 16, y + 14);
    ctx.moveTo(x + 22, y - 20); ctx.lineTo(x + 10, y + 4); ctx.lineTo(x + 18, y + 22);
    ctx.stroke(); ctx.shadowBlur = 0;
    ctx.strokeStyle = rgba(shade('#a6763c', -0.5), 0.6); ctx.lineWidth = 1.5; // chips
    ctx.beginPath(); ctx.moveTo(x - r + 6, y - 6); ctx.lineTo(x - r * 0.5, y - 2); ctx.stroke();
    eyes(13, -18, 5, '#ff8c5a');
  } else if (type === 'kraken') {
    for (const side of [-1, 1]) { // tentacle stubs with suckers
      ctx.strokeStyle = '#356082'; ctx.lineWidth = 10; ctx.lineCap = 'round';
      const ex = x + side * (r + 34), ey = y + r + Math.sin(now * 0.004 + side) * 4;
      ctx.beginPath(); ctx.moveTo(x + side * r * 0.7, y + r * 0.5);
      ctx.quadraticCurveTo(x + side * (r + 24), y + r * 0.2 + Math.sin(now * 0.004 + side) * 10, ex, ey); ctx.stroke();
      ctx.fillStyle = rgba('#8fc2dd', 0.7);
      for (let t = 0.4; t < 1; t += 0.25) { ctx.beginPath(); ctx.arc(x + side * (r * 0.7 + (r + 20) * t), y + r * 0.5 + (ey - y - r * 0.5) * t, 1.6, 0, Math.PI * 2); ctx.fill(); }
    }
    bodyOrb('#4d7a9a');
    eyes(15, -8, 8, '#f4ecd0');
  } else {
    bodyOrb(color);
    eyes(13, -8, 5, mix(color, '#fff', 0.5));
  }
}

// ---------- destructible cover: per-kind storybook materials ----------
// Deterministic per-block detail (knots, moss, glints) keyed off the block's
// position, so patterns hold still frame-to-frame and match on LAN clients.
function _detSeed(x, y) {
  let a = (Math.round(x) * 73856093) ^ (Math.round(y) * 19349663);
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// One destructible block. kind: wood | ice | stone | crate | obsidian | shroom.
// frac = hp fraction; damage reads differently per material (scorch, glow, chips).
function drawStoryDestructible(ctx, { x, y, w, h, angle = 0, kind = 'wood', frac = 1, color = '#6b4a2a', now = 0 }) {
  const rnd = _detSeed(x, y);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const hw = w / 2, hh = h / 2;

  if (kind === 'ice') {
    // translucent slab with inner glints and a frost cap
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = color;
    ctx.fillRect(-hw, -hh, w, h);
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    for (let i = 0; i < 2; i++) { // frozen-in shimmer streaks
      const gx = -hw + w * (0.25 + rnd() * 0.5), gy = -hh + h * (0.2 + rnd() * 0.5);
      const shim = 0.5 + 0.5 * Math.sin(now * 0.002 + gx);
      ctx.globalAlpha = 0.18 + 0.2 * shim;
      ctx.beginPath(); ctx.moveTo(gx - 5, gy + 7); ctx.lineTo(gx + 5, gy - 7); ctx.stroke();
    }
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = shade(color, 0.6);
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-hw + 2, -hh + 1.5); ctx.lineTo(hw - 2, -hh + 1.5); ctx.stroke(); // frost cap
    ctx.globalAlpha = 1;
    ctx.strokeStyle = rgba(color, 0.9);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-hw, -hh, w, h);
  } else if (kind === 'obsidian') {
    // volcanic glass: near-black, one glassy highlight — and its cracks GLOW
    // hotter as hp drops (the block telegraphs its own death)
    ctx.fillStyle = mix(color, '#120c18', 0.55);
    ctx.fillRect(-hw, -hh, w, h);
    ctx.globalAlpha = 0.14;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-hw * 0.5, -hh); ctx.lineTo(-hw * 0.1, hh); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-hw, -hh, w, h);
  } else if (kind === 'stone') {
    // chiselled masonry with moss creeping up from the base
    ctx.fillStyle = color;
    ctx.fillRect(-hw, -hh, w, h);
    ctx.strokeStyle = shade(color, -0.35);
    ctx.lineWidth = 1.2;
    const rows = Math.max(1, Math.round(h / 22));
    for (let r = 1; r < rows; r++) {
      const yy = -hh + (h * r) / rows;
      ctx.beginPath(); ctx.moveTo(-hw, yy); ctx.lineTo(hw, yy); ctx.stroke();
      const off = -hw + w * (0.3 + 0.4 * rnd());
      ctx.beginPath(); ctx.moveTo(off, yy); ctx.lineTo(off, yy - h / rows); ctx.stroke();
    }
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#4a6b3a';
    for (let i = 0; i < 2; i++) { // moss tufts
      const mx = -hw + w * rnd(), my = hh - h * 0.18 * rnd();
      ctx.beginPath(); ctx.ellipse(mx, my, 4 + rnd() * 5, 3, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-hw, -hh, w, h);
  } else if (kind === 'crate') {
    // planked crate with cross-brace and nail heads
    ctx.fillStyle = color;
    ctx.fillRect(-hw, -hh, w, h);
    ctx.strokeStyle = shade(color, -0.3);
    ctx.lineWidth = 1.5;
    for (let i = 1; i < 3; i++) { const yy = -hh + (h * i) / 3; ctx.beginPath(); ctx.moveTo(-hw, yy); ctx.lineTo(hw, yy); ctx.stroke(); }
    ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.moveTo(-hw + 2, -hh + 2); ctx.lineTo(hw - 2, hh - 2); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = shade(color, -0.45);
    for (const [nx, ny] of [[-hw + 4, -hh + 4], [hw - 4, -hh + 4], [-hw + 4, hh - 4], [hw - 4, hh - 4]]) {
      ctx.beginPath(); ctx.arc(nx, ny, 1.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.strokeRect(-hw, -hh, w, h);
  } else if (kind === 'shroom') {
    // mushroom flesh: soft rounded fill with cream speckles
    ctx.fillStyle = color;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') ctx.roundRect(-hw, -hh, w, h, Math.min(10, h / 3));
    else ctx.rect(-hw, -hh, w, h);
    ctx.fill();
    ctx.fillStyle = '#f2e8d4';
    for (let i = 0; i < Math.max(2, Math.round(w / 26)); i++) {
      const sx = -hw + w * (0.12 + 0.76 * rnd()), sy = -hh + h * (0.2 + 0.5 * rnd());
      ctx.beginPath(); ctx.ellipse(sx, sy, 3.5 + rnd() * 3, 2.5 + rnd() * 2, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (kind === 'wood' && _hx(color).g > _hx(color).r + 20) {
    // leafy canopy block: billowing scalloped foliage, not planks
    ctx.fillStyle = color;
    ctx.fillRect(-hw, -hh + 4, w, h - 4);
    const lobes = Math.max(3, Math.round(w / 18));
    for (let i = 0; i <= lobes; i++) {
      const lx = -hw + (w * i) / lobes;
      const lr = 7 + rnd() * 6;
      ctx.beginPath(); ctx.arc(lx, -hh + 4, lr, 0, Math.PI * 2); ctx.fill();
      if (rnd() < 0.4) { ctx.fillStyle = shade(color, 0.18); ctx.beginPath(); ctx.arc(lx - 3, -hh + 1, lr * 0.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = color; }
    }
    ctx.fillStyle = shade(color, -0.22); // under-shadow gives the mass depth
    ctx.fillRect(-hw, hh - 5, w, 5);
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = shade(color, -0.3);
    ctx.lineWidth = 1;
    for (let i = 0; i < Math.max(2, Math.round(w / 30)); i++) { // leaf-vein ticks
      const vx = -hw + w * (0.2 + 0.6 * rnd()), vy = -hh + h * (0.3 + 0.4 * rnd());
      ctx.beginPath(); ctx.moveTo(vx - 3, vy + 3); ctx.lineTo(vx + 3, vy - 3); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else { // wood: bark grain and a knot
    ctx.fillStyle = color;
    ctx.fillRect(-hw, -hh, w, h);
    ctx.strokeStyle = shade(color, -0.28);
    ctx.lineWidth = 1.4;
    for (let i = 0; i < Math.max(2, Math.round(w / 14)); i++) {
      const gx = -hw + w * (0.12 + 0.76 * rnd());
      ctx.beginPath();
      ctx.moveTo(gx, -hh + 2);
      ctx.quadraticCurveTo(gx + (rnd() - 0.5) * 6, 0, gx, hh - 2);
      ctx.stroke();
    }
    if (rnd() < 0.6) { // a knot
      const kx = -hw + w * (0.25 + 0.5 * rnd()), ky = -hh + h * (0.3 + 0.4 * rnd());
      ctx.strokeStyle = shade(color, -0.4);
      ctx.beginPath(); ctx.ellipse(kx, ky, 3.5, 2.5, 0.3, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.strokeStyle = shade(color, 0.12);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-hw + 1, -hh + 1); ctx.lineTo(hw - 1, -hh + 1); ctx.stroke(); // lit top edge
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-hw, -hh, w, h);
  }

  // damage: obsidian cracks glow hot; everything else scorches & cracks dark
  if (frac < 1) {
    if (kind === 'obsidian') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = (1 - frac) * 0.95;
      ctx.strokeStyle = '#ff7043';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-hw, -h / 5); ctx.lineTo(0, 0); ctx.lineTo(w / 4, -h / 3);
      if (frac < 0.5) { ctx.moveTo(0, 0); ctx.lineTo(-w / 4, h / 3); ctx.moveTo(0, 0); ctx.lineTo(hw, h / 5); }
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = `rgba(0,0,0,${(1 - frac) * (kind === 'ice' ? 0.22 : 0.4)})`;
      ctx.fillRect(-hw, -hh, w, h);
      if (frac < 0.7) {
        ctx.strokeStyle = kind === 'ice' ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.55)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-hw, -h / 5); ctx.lineTo(0, 0); ctx.lineTo(w / 4, -h / 3);
        if (frac < 0.35) { ctx.moveTo(0, 0); ctx.lineTo(-w / 4, h / 3); ctx.moveTo(0, 0); ctx.lineTo(hw, h / 5); }
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

// ---------- particles: glowing storybook embers, motes & sigil rings ----------
function drawStoryParticles(ctx, particles) {
  ctx.save();
  for (const pt of particles) {
    const a = Math.max(0, Math.min(1, pt.life / pt.maxLife));
    const hex = typeof pt.color === 'string' && pt.color[0] === '#';
    if (pt.kind === 'ring') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = pt.color;
      ctx.globalAlpha = a; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = a * 0.35; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    } else if (pt.kind === 'text') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = a;
      ctx.font = 'bold 16px Georgia'; ctx.textAlign = 'center';
      ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(18,10,24,0.75)';
      ctx.strokeText(pt.str, pt.x, pt.y);
      ctx.fillStyle = pt.color; ctx.fillText(pt.str, pt.x, pt.y);
    } else if (pt.kind === 'spark') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a; ctx.strokeStyle = pt.color; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(pt.x, pt.y); ctx.lineTo(pt.x - pt.vx * 2, pt.y - pt.vy * 2); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    } else if (pt.kind === 'bird') {
      // a tiny flapping silhouette — two arcs beating with the particle's life
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = Math.min(1, a * 1.6);
      ctx.strokeStyle = pt.color;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      const flap = Math.sin(pt.life * 0.55) * 4;
      ctx.beginPath();
      ctx.moveTo(pt.x - 5, pt.y - flap);
      ctx.quadraticCurveTo(pt.x - 2, pt.y + 1, pt.x, pt.y);
      ctx.quadraticCurveTo(pt.x + 2, pt.y + 1, pt.x + 5, pt.y - flap);
      ctx.stroke();
    } else if (pt.kind === 'leaf') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = a;
      ctx.fillStyle = pt.color;
      ctx.save();
      ctx.translate(pt.x, pt.y);
      ctx.rotate(Math.sin(pt.life * 0.12) * 0.9);
      ctx.beginPath(); ctx.ellipse(0, 0, pt.r * 1.2, pt.r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else if (pt.kind === 'glint') {
      // a stationary twinkle: a four-point star that swells and fades
      ctx.globalCompositeOperation = 'lighter';
      const tw = Math.sin((1 - a) * Math.PI); // 0→1→0 over its life
      ctx.globalAlpha = tw * 0.9;
      ctx.strokeStyle = pt.color;
      ctx.lineWidth = 1.2;
      const rr = pt.r * (0.6 + tw);
      ctx.beginPath();
      ctx.moveTo(pt.x - rr, pt.y); ctx.lineTo(pt.x + rr, pt.y);
      ctx.moveTo(pt.x, pt.y - rr); ctx.lineTo(pt.x, pt.y + rr);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    } else if (pt.kind === 'confetti') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = a; ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - pt.r / 2, pt.y - pt.r / 2, pt.r, pt.r * 0.6);
    } else { // ember mote — additive glow with a hot core
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a; ctx.fillStyle = pt.color;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r * 0.9, 0, Math.PI * 2); ctx.fill();
      if (hex) { ctx.globalAlpha = a * 0.9; ctx.fillStyle = shade(pt.color, 0.6);
        ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r * 0.4, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}
