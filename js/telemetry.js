// telemetry.js — lightweight balance logging. Each round the host (or couch
// play) tallies per-spell activity, then POSTs one compact record to the server,
// which appends it as a line to server/telemetry/rounds.jsonl for offline
// balance analysis. Clients never run the sim, so these hooks only fire where the
// match actually runs. Attribution is by the ATTACKER'S currently-equipped spell
// at the moment of the event — spells swap on tome pickup, so this is accurate to
// the round; a lingering projectile that lands after its caster grabbed a new tome
// is the rare exception, negligible for balance.
const spellTally = {};      // per-ROUND, reset each round → the JSONL log
const matchSpellTally = {}; // per-MATCH, reset each new match → the end-of-match report card
const blank = () => ({ picks: 0, casts: 0, dmg: 0, bossDmg: 0, kills: 0, deaths: 0 });

// every hook feeds both the round tally (for logging) and the match tally (for the report card)
function telSpell(id) {
  if (!id) return null;
  matchSpellTally[id] ??= blank();
  return spellTally[id] ??= blank();
}
function bump(id, key, n) {
  const s = telSpell(id);
  if (!s) return;
  s[key] += n;
  matchSpellTally[id][key] += n;
}
function telPick(id)          { bump(id, 'picks', 1); }
function telCast(id)          { bump(id, 'casts', 1); }
function telDmg(id, amt)      { bump(id, 'dmg', amt); }
function telBossDmg(id, amt)  { bump(id, 'bossDmg', amt); }
function telKill(id)          { bump(id, 'kills', 1); }
function telDeath(id)         { bump(id, 'deaths', 1); }

function resetTelemetry() {
  for (const k of Object.keys(spellTally)) delete spellTally[k];
}
function resetMatchTelemetry() {
  for (const k of Object.keys(matchSpellTally)) delete matchSpellTally[k];
}

// top spells of the whole match, ranked by kills then damage — powers the report
// card. Compact field names so it rides the snapshot to LAN clients cheaply.
function computeSpellReport(limit = 5) {
  const rows = [];
  for (const [id, s] of Object.entries(matchSpellTally)) {
    const dmg = Math.round(s.dmg + s.bossDmg);
    if (!s.kills && !dmg && !s.casts) continue;
    const def = (typeof SPELLS !== 'undefined' && SPELLS[id]) || null;
    rows.push({
      id,
      n: def ? def.name : id,
      c: def ? def.color : '#e8d5ff',
      t: typeof spellTier === 'function' ? spellTier(id) : 'common',
      k: s.kills, d: dmg, ca: s.casts,
    });
  }
  rows.sort((a, b) => (b.k - a.k) || (b.d - a.d) || (b.ca - a.ca));
  return rows.slice(0, limit);
}

// shared by the host victory screen and the LAN client (from snap.sr), like drawAwards
function drawSpellReport(report, now) {
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

// snapshot the round and ship it. Called from checkRoundEnd for every round
// (normal wins, draws, and boss outcomes alike). Never throws — a missing server
// or file:// load just means no logging.
function flushRoundTelemetry() {
  if (netMode === 'client') return; // clients don't own the sim
  const spells = {};
  for (const [id, v] of Object.entries(spellTally)) spells[id] = { ...v };
  const rec = {
    ts: Date.now(),
    ver: GAME_VERSION,
    round: game.totalRounds || 0,
    map: currentMap?.def?.name ?? null,
    boss: game.boss ? game.boss.def.id : null,
    winner: game.winner ? game.winner.name : null,
    players: players.length,
    bots: players.filter(p => p.controller instanceof BotController).length,
    // what each wizard was holding when the round ended — correlate spell → outcome
    roster: players.map(p => ({
      name: p.name,
      spell: p.spellId || null,
      alive: !!p.alive,
      bot: p.controller instanceof BotController,
      won: game.winner === p,
    })),
    spells,
  };
  postTelemetry(rec);
}

function postTelemetry(rec) {
  try {
    if (!/^https?:$/.test(location.protocol)) return; // file:// couch mode: nowhere to POST
    fetch('/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rec),
      keepalive: true, // survive a page unload mid-flush
    }).catch(() => {});
  } catch { /* logging must never break the game */ }
}
