// hud.js — everything drawn on top of the world: the score line, spell slots,
// kill feed, banners, lobby panel and the end-of-match ceremony.
import { ctx } from './canvas.js';
import { W, H } from '../sim/world.js';
import { game, currentMap, minPlayers, banner, bannerColor, bannerUntil, bannerHyper } from '../sim/match.js';
import { players, MAX_PLAYERS, MAX_HP } from '../sim/player/lifecycle.js';
import { killFeedLines } from '../sim/awards.js';
import { nameEdit, PAD_ALPHABET } from '../sim/lobby.js';
import { MAPS } from '../sim/maps/builders.js';
import { SPELLS } from '../sim/spells/registry.js';
import { effectiveCooldown } from '../sim/spells/core.js';
import { TIER_COLOR, tierColor } from '../sim/spells/tiers.js';
import { CAST_KINDS, castKind } from '../sim/spells/cast-kind.js';
import { enemies } from '../sim/ai/enemies.js';
import { BotController } from '../sim/ai/bot.js';
import { drawBossBar } from './draw-boss.js';
import { envHash } from './draw-env.js';
import { KEYMAPS, KeyboardController } from '../platform/input-keyboard.js';
import { GamepadController } from '../platform/input-gamepad.js';


export function drawKillFeed(now) {
  ctx.textAlign = 'left';
  ctx.font = 'bold 12px Georgia';
  let y = 96;
  for (const l of killFeedLines) {
    const age = now - l.at;
    if (age > 4500) continue;
    ctx.globalAlpha = Math.min(1, (4500 - age) / 800);
    let x = 16;
    const put = (txt, col) => { ctx.fillStyle = col; ctx.fillText(txt, x, y); x += ctx.measureText(txt).width + 5; };
    if (l.self) { put(l.a, l.ac); put('⚡ themself', '#9c8ab8'); }
    else if (!l.a) { put('☠', '#9c8ab8'); put(l.b, l.bc); }
    else { put(l.a, l.ac); put('⚡', '#ffd166'); put(l.b, l.bc); }
    y += 17;
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
}

// shared by the host victory screen and the LAN client (from snap.aw)
export function drawAwards(awards, now) {
  if (!awards || !awards.length) return;
  let y = 592;
  for (const a of awards) {
    ctx.font = 'bold 13px Georgia';
    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'right';
    ctx.fillText(`🏆 ${a.t}`, W / 2 - 20, y);
    ctx.font = '14px Georgia';
    ctx.fillStyle = a.c;
    ctx.textAlign = 'left';
    ctx.fillText(`${a.n} — ${a.v}`, W / 2 + 5, y);
    y += 22;
  }
  ctx.textAlign = 'center';
}

// shared by the host victory screen and the LAN client (from snap.sr), like drawAwards
export function drawSpellReport(report, now) {
  if (!report || !report.length) return;
  const x = 60;
  let y = 356;
  ctx.textAlign = 'left';
  ctx.font = 'bold 15px Georgia';
  ctx.fillStyle = '#ffd166';
  ctx.fillText('📖 SPELLBOOK REPORT', x, y);
  y += 26;
  for (const r of report) {
    // tier dot
    ctx.fillStyle = (typeof TIER_COLOR !== 'undefined' && TIER_COLOR[r.t]) || '#c9c9d6';
    ctx.beginPath(); ctx.arc(x + 5, y - 4, 4, 0, Math.PI * 2); ctx.fill();
    // spell name
    ctx.font = 'bold 14px Georgia';
    ctx.fillStyle = r.c;
    ctx.fillText(r.n, x + 16, y);
    // stat line
    ctx.font = '13px Georgia';
    ctx.fillStyle = '#c8bcd8';
    const parts = [];
    if (r.k) parts.push(`${r.k} KO`);
    if (r.d) parts.push(`${r.d} dmg`);
    parts.push(`${r.ca} cast${r.ca === 1 ? '' : 's'}`);
    ctx.fillText(parts.join(' · '), x + 16, y + 16);
    y += 38;
  }
  ctx.textAlign = 'center';
}

// spell recharge indicator under the spell name (all spells are infinite-use;
// this shows when the next cast is ready)
export function drawCooldownBar(x, y, spell, frac, megaCasts) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x - 22, y, 44, 4);
  ctx.fillStyle = frac >= 1 ? spell.color : '#675a7d';
  ctx.fillRect(x - 22, y, 44 * Math.max(0, frac), 4);
  if (megaCasts > 0) {
    ctx.font = 'bold 11px Georgia';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`★${megaCasts}`, x + 36, y + 5);
  }
}

// two spell slots stacked under a player's name — shared by host HUD and LAN client.
// slots = [idA, idB], cdf = [fracA, fracB]; empty slots read as "· · ·".
export function drawPlayerSpells(x, slots, cdf, megaCasts, charges) {
  ctx.textAlign = 'center';
  for (let i = 0; i < 2; i++) {
    const y = 74 + i * 22;
    const def = slots[i] && SPELLS[slots[i]]; // guards empty + any transient/unknown id
    ctx.font = '13px Georgia';
    ctx.fillStyle = def ? (tierColor(slots[i]) || '#9c8ab8') : '#4a415c';
    const n = charges?.[i];
    ctx.fillText(def ? def.name + (n != null ? ` ×${n}` : '') : '· · ·', x, y);
    if (def) {
      drawCooldownBar(x, y + 6, def, cdf[i], i === 0 ? megaCasts : 0);
      // how it delivers, under the name — the thing you need before you commit
      // a cast and previously had to learn by casting it once and watching
      const kind = CAST_KINDS[castKind(slots[i])];
      if (kind) {
        ctx.font = '9px Georgia';
        ctx.fillStyle = '#6d6086';
        ctx.fillText(kind.label, x, y + 15);
      }
    }
  }
}

export function drawHUD(now) {
  if (game.state === 'LOBBY' || game.state === 'VICTORY') return;
  ctx.textAlign = 'center';
  ctx.font = '12px Georgia';
  ctx.fillStyle = '#675a7d';
  if (game.mode === 'wave') {
    ctx.font = 'bold 16px Georgia';
    ctx.fillStyle = '#ffd166';
    const left = enemies.size + (game.boss ? 1 : 0);
    ctx.fillText(game.waveState === 'intermission' ? `WAVE ${game.wave} CLEARED — NEXT INCOMING` : `WAVE ${game.wave} · ${left} LEFT`, W / 2, 18);
  } else {
    ctx.fillText(`${currentMap.def.name} · ${game.mapIndex + 1}/${MAPS.length}`, W / 2, 18);
  }
  if (game.envEvent?.announced) {
    ctx.font = 'bold 11px Georgia';
    ctx.fillStyle = game.envEvent.def.color;
    ctx.fillText(`⚠ ${game.envEvent.def.name}`, W / 2, H - 12);
  }
  if (game.boss?.announced) drawBossBar(game.boss.title || game.boss.def.name, game.boss.enraged ? '#ff4d4d' : game.boss.def.color, game.boss.hp, game.boss.maxHp);
  drawKillFeed(now);
  const spacing = Math.min(300, (W - 220) / Math.max(players.length - 1, 1));
  players.forEach((p, i) => {
    const x = players.length === 1 ? 150 : W / 2 + (i - (players.length - 1) / 2) * spacing;
    ctx.font = 'bold 20px Georgia';
    ctx.fillStyle = p.color;
    ctx.fillText(p.name, x, 38);
    ctx.strokeStyle = p.color;
    if (game.mode === 'wave') {
      // wave mode has no round wins — show a health bar (or DOWN when fallen)
      if (p.alive) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x - 30, 48, 60, 6);
        ctx.fillStyle = p.hp > MAX_HP * 0.3 ? '#7bd88f' : '#ff5e57';
        ctx.fillRect(x - 30, 48, 60 * Math.max(0, p.hp / MAX_HP), 6);
      } else {
        ctx.font = 'bold 13px Georgia'; ctx.fillStyle = '#675a7d';
        ctx.fillText('DOWN', x, 54);
      }
    } else if (game.winsNeeded <= 9) {
      const pipStart = x - (game.winsNeeded - 1) * 9;
      for (let w = 0; w < game.winsNeeded; w++) {
        ctx.beginPath();
        ctx.arc(pipStart + w * 18, 54, 5.5, 0, Math.PI * 2);
        if (w < p.roundWins) ctx.fill();
        else { ctx.lineWidth = 1.5; ctx.stroke(); }
      }
    } else {
      ctx.font = 'bold 15px Georgia';
      ctx.fillText(`${p.roundWins} / ${game.winsNeeded}`, x, 58);
    }
    // C4: the bar fills against the cooldown the cast gate enforces, so a
    // full bar means castable. It used to divide by the DECLARED cooldown,
    // which for Fireball and three others reads ready up to 230ms early.
    const cdf = [0, 1].map(s => p.slots[s] ? Math.min(1, (now - p.casts[s]) / effectiveCooldown(p.slots[s])) : 0);
    drawPlayerSpells(x, p.slots, cdf, p.megaCasts, p.slotCharges);
  });
  if (now < bannerUntil) {
    if (bannerHyper) {
      const pulse = 1 + 0.12 * Math.sin(now * 0.03);
      ctx.save();
      ctx.translate(W / 2, 160);
      ctx.scale(pulse, pulse);
      ctx.font = 'bold 78px Georgia';
      ctx.shadowColor = '#a55eea';
      ctx.shadowBlur = 34;
      ctx.fillStyle = `hsl(${(now * 0.4) % 360}, 90%, 78%)`;
      ctx.fillText(banner, 0, 0);
      ctx.restore();
      ctx.shadowBlur = 0;
    } else {
      ctx.font = 'bold 52px Georgia';
      ctx.fillStyle = bannerColor;
      ctx.fillText(banner, W / 2, 150);
    }
  }
}

export function controllerHint(p) {
  if (p.controller instanceof BotController) return 'BOT';
  if (p.controller instanceof GamepadController) return `GAMEPAD ${p.controller.index + 1}`;
  if (p.controller instanceof KeyboardController) return p.controller.map === KEYMAPS[0] ? 'WASD + MOUSE' : '← → ↑ + ENTER';
  return 'ONLINE';
}

// 80s arcade wordmark: chrome-banded letters floating in a wave, pulsing neon
// glow, a glint sweeping through, and star sparkles. Zero assets, pure canvas.
export function drawArcadeLogo(cx, cy, px, now, text = 'HYPERSPELL') {
  ctx.save();
  ctx.font = `italic 900 ${px}px Georgia, serif`;
  ctx.textAlign = 'left';
  const widths = [...text].map(ch => ctx.measureText(ch).width);
  const spacing = px * 0.05;
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
  const left = cx - total / 2;
  const sweep = left + ((now * 0.28) % (total * 2.2)) - total * 0.6; // glint position
  let x = left;
  for (let i = 0; i < text.length; i++) {
    const yy = cy + Math.sin(now * 0.0028 + i * 0.55) * px * 0.07;
    const g = ctx.createLinearGradient(0, yy - px * 0.8, 0, yy + px * 0.18);
    g.addColorStop(0, '#bfe8ff');   // sky chrome
    g.addColorStop(0.44, '#e8d5ff');
    g.addColorStop(0.5, '#5d3a8f'); // horizon band
    g.addColorStop(0.56, '#ff6b81'); // sunset
    g.addColorStop(1, '#ffd166');
    ctx.shadowColor = '#a55eea';
    ctx.shadowBlur = 16 + 9 * Math.sin(now * 0.0045);
    ctx.fillStyle = g;
    ctx.fillText(text[i], x, yy);
    ctx.shadowBlur = 0;
    const d = Math.abs(x + widths[i] / 2 - sweep);
    if (d < px * 1.1) { // the glint catches this letter
      ctx.globalAlpha = Math.max(0, 1 - d / (px * 1.1)) * 0.75;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text[i], x, yy);
      ctx.globalAlpha = 1;
    }
    x += widths[i] + spacing;
  }
  ctx.strokeStyle = '#fff'; // twinkling star crosses
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    const tw = Math.max(0, Math.sin(now * 0.004 + i * 2.1));
    if (tw < 0.05) continue;
    ctx.globalAlpha = tw * 0.9;
    const sx = left + envHash(i + 4) * total;
    const sy = cy - px * (0.15 + 0.6 * envHash(i + 11));
    const r = px * (0.06 + 0.05 * tw);
    ctx.beginPath();
    ctx.moveTo(sx - r, sy); ctx.lineTo(sx + r, sy);
    ctx.moveTo(sx, sy - r); ctx.lineTo(sx, sy + r);
    ctx.stroke();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
}

// the lobby panel proper, fed by a plain view object so the couch lobby (live
// players[]) and the online lobby (server snapshot, js/net.js) share pixels.
// view: { joinLine, slots: [{label, color, hint, hintBright}], readyLine,
//         readyColor, controlsLine }
export function drawLobbyPanel(view) {
  ctx.fillStyle = 'rgba(12,8,18,0.72)';
  ctx.fillRect(W / 2 - 430, 55, 860, 265);
  ctx.textAlign = 'center';
  drawArcadeLogo(W / 2, 132, 60, performance.now());
  ctx.font = '16px Georgia';
  ctx.fillStyle = '#9c8ab8';
  ctx.fillText(view.joinLine, W / 2, 162);
  const slots = view.slots;
  const slotW = Math.min(200, 840 / slots.length);
  for (let i = 0; i < slots.length; i++) {
    const x = W / 2 + (i - (slots.length - 1) / 2) * slotW;
    const s = slots[i];
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - slotW / 2 + 6, 185, slotW - 12, 60);
    ctx.font = 'bold 20px Georgia';
    ctx.fillStyle = s.color;
    ctx.fillText(s.label, x, 218);
    ctx.font = '11px Georgia';
    ctx.fillStyle = s.hintBright ? '#e8d5ff' : '#675a7d';
    ctx.fillText(s.hint, x, 238);
  }
  ctx.font = 'bold 20px Georgia';
  ctx.fillStyle = view.readyColor;
  ctx.fillText(view.readyLine, W / 2, 288);
  ctx.font = '13px Georgia';
  ctx.fillStyle = '#675a7d';
  ctx.fillText(view.controlsLine, W / 2, 310);
}

function baseDrawLobby() { // couch adapter: build the view from live local state
  const count = Math.max(4, Math.min(MAX_PLAYERS, players.length + 1));
  const slots = [];
  for (let i = 0; i < count; i++) {
    const p = players[i];
    const editing = nameEdit && p && nameEdit.p === p;
    const padEditing = editing && nameEdit.pad != null;
    let label;
    if (padEditing) {
      const blink = Math.floor(performance.now() / 350) % 2;
      label = `${nameEdit.buffer}${blink ? `[${PAD_ALPHABET[nameEdit.letter]}]` : '   '}`;
    } else if (editing) {
      label = (nameEdit.buffer || '') + (Math.floor(performance.now() / 400) % 2 ? '_' : ' ');
    } else {
      label = p ? p.name + ' ✦' : 'JOIN';
    }
    slots.push({
      label,
      color: p ? p.color : '#4a3f5e',
      hintBright: !!editing,
      hint: padEditing ? '◀▶ letter · A add · B del · START ✓'
        : editing ? 'TYPE NAME · ENTER ✓'
        : p ? controllerHint(p) : 'E · ENTER · PAD',
    });
  }
  const wave = game.mode === 'wave';
  const ready = players.length >= minPlayers();
  drawLobbyPanel({
    joinLine: 'press E · ENTER · or any gamepad button to join — B / BACK adds a bot',
    slots,
    readyColor: ready ? (wave ? '#ffd166' : '#7bd88f') : '#675a7d',
    readyLine: !ready ? (wave ? 'NEED AT LEAST 1 WIZARD' : 'NEED AT LEAST 2 WIZARDS')
      : wave ? `SPACE / START — WAVE SURVIVAL${game.bestWave ? `  (BEST: WAVE ${game.bestWave})` : ''}`
      : `SPACE / START TO FIGHT — FIRST TO ${game.winsNeeded} WINS`,
    controlsLine: wave
      ? 'M / pad-X switches back to VERSUS · co-op: everyone fights the waves together · Y names your wizard'
      : `M / pad-X = WAVE SURVIVAL · 1–9 or d-pad ↑↓ sets win target (${game.winsNeeded}) · Y names your wizard`,
  });
}

// shot.html?clean swaps the join panel out for beauty shots; the classic build
// did it by reassigning the global.
export let drawLobby = baseDrawLobby;
export function setDrawLobby(fn) { drawLobby = fn || baseDrawLobby; }
