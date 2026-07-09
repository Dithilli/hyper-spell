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
function drawStoryWizard(ctx, o) {
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
    // faint sigil aura when at full health
    if (hp >= 75 && alive) {
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
function drawStoryBoss(ctx, o) {
  const { x, y, now = 0 } = o, r = o.r || 46, type = o.type, color = o.color || '#e15d5d';
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
