// awards.js — kill attribution, per-match stats, the kill feed, and the
// end-of-match awards ceremony. Stats live per slot and reset when a fresh
// match starts (first round out of the lobby).
const matchStats = {};
const killFeedLines = []; // { a, ac, b, bc, self, at }

function statFor(p) {
  return matchStats[p.slot] ??= {
    kills: 0, deaths: 0, selfKills: 0, hatsLost: 0, procs: 0,
    fallDmg: 0, slips: 0, bossDmg: 0, tomes: 0,
  };
}

function resetMatchStats() {
  for (const k of Object.keys(matchStats)) delete matchStats[k];
  killFeedLines.length = 0;
}

// fx-wrapped like setBanner, so LAN clients replay the feed automatically.
// The trailing slots aren't rendered — they let headless clients (Alinea)
// attribute kills exactly instead of guessing by proximity.
function addKillFeed(aName, aColor, bName, bColor, self, aSlot, bSlot) {
  killFeedLines.push({ a: aName, ac: aColor, b: bName, bc: bColor, self, at: performance.now() });
  if (killFeedLines.length > 5) killFeedLines.shift();
}

// called from killPlayer — resolves who gets the credit
function creditKill(victim) {
  statFor(victim).deaths++;
  const hit = victim.lastHitBy;
  const killer = hit && performance.now() - hit.at < 4000 ? hit.player : null;
  if (killer === victim) {
    statFor(victim).selfKills++;
    addKillFeed(victim.name, victim.color, null, null, true, victim.slot, victim.slot);
  } else if (killer) {
    statFor(killer).kills++;
    addKillFeed(killer.name, killer.color, victim.name, victim.color, false, killer.slot, victim.slot);
  } else {
    addKillFeed(null, null, victim.name, victim.color, false, null, victim.slot); // the arena did it
  }
}

function drawKillFeed(now) {
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

// pick the funniest earned superlatives (max 5, only if someone actually did the thing)
function computeAwards() {
  const AWARD_DEFS = [
    ['MOST SHAMED', 'hatsLost', 'hats lost'],
    ['MOST DANGEROUS', 'kills', 'kills'],
    ['SELF-OWN CHAMPION', 'selfKills', 'self-KOs'],
    ["GRAVITY'S FAVORITE", 'fallDmg', 'fall damage'],
    ['HYPER LUCKY', 'procs', 'HYPERSPELLs'],
    ['BANANA MAGNET', 'slips', 'slips'],
    ['TOME GOBLIN', 'tomes', 'tomes grabbed'],
    ['BOSSBANE', 'bossDmg', 'boss damage'],
  ];
  const out = [];
  for (const [title, key, unit] of AWARD_DEFS) {
    let best = null, bestV = 0;
    for (const p of players) {
      const v = statFor(p)[key];
      if (v > bestV) { bestV = v; best = p; }
    }
    if (best) out.push({ t: title, n: best.name, c: best.color, v: `${Math.round(bestV)} ${unit}` });
  }
  return out.slice(0, 5);
}

// shared by the host victory screen and the LAN client (from snap.aw)
function drawAwards(awards, now) {
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
