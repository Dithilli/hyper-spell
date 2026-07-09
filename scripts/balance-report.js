#!/usr/bin/env node
// balance-report.js — aggregate the per-round telemetry the server collects into a
// per-spell balance table. Run after some playtests:
//
//   node scripts/balance-report.js                     # all rounds
//   node scripts/balance-report.js --no-bots           # ignore bot-held spells in win rate
//   node scripts/balance-report.js path/to/rounds.jsonl
//
// Reads server/telemetry/rounds.jsonl (one JSON record per round).
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const noBots = args.includes('--no-bots');
const fileArg = args.find(a => !a.startsWith('--'));
const FILE = fileArg
  ? path.resolve(fileArg)
  : path.join(__dirname, '..', 'server', 'telemetry', 'rounds.jsonl');

if (!fs.existsSync(FILE)) {
  console.error(`No telemetry yet at ${FILE}\nPlay a few rounds via the server, then re-run.`);
  process.exit(1);
}

const rounds = fs.readFileSync(FILE, 'utf8')
  .split('\n').filter(Boolean)
  .map(l => { try { return JSON.parse(l); } catch { return null; } })
  .filter(Boolean);

// per-spell totals across every round
const agg = {}; // spell -> { picks, casts, dmg, bossDmg, kills, deaths, held, wins }
const spell = (id) => agg[id] ??= { picks: 0, casts: 0, dmg: 0, bossDmg: 0, kills: 0, deaths: 0, held: 0, wins: 0 };

for (const r of rounds) {
  for (const [id, s] of Object.entries(r.spells || {})) {
    const a = spell(id);
    a.picks += s.picks || 0; a.casts += s.casts || 0; a.dmg += s.dmg || 0;
    a.bossDmg += s.bossDmg || 0; a.kills += s.kills || 0; a.deaths += s.deaths || 0;
  }
  // win correlation: what was each wizard holding at round end?
  for (const p of r.roster || []) {
    if (!p.spell) continue;
    if (noBots && p.bot) continue;
    const a = spell(p.spell);
    a.held++;
    if (p.won) a.wins++;
  }
}

const rows = Object.entries(agg).sort((x, y) => y[1].casts - x[1].casts);
const num = (n, d = 0) => Number.isFinite(n) ? n.toFixed(d) : '–';
const pad = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);

console.log(`\nHyperSpell balance — ${rounds.length} rounds logged${noBots ? ' (bots excluded from win rate)' : ''}\n`);
const H = ['spell', 'picks', 'casts', 'kills', 'k/cast', 'dmg', 'dmg/cast', 'bossDmg', 'deaths', 'winRate'];
console.log(pad(H[0], 16) + H.slice(1).map(h => padL(h, 9)).join(''));
console.log('-'.repeat(16 + 9 * (H.length - 1)));
for (const [id, a] of rows) {
  console.log(
    pad(id, 16) +
    padL(a.picks, 9) +
    padL(a.casts, 9) +
    padL(a.kills, 9) +
    padL(a.casts ? num(a.kills / a.casts, 2) : '–', 9) +
    padL(a.dmg, 9) +
    padL(a.casts ? num(a.dmg / a.casts, 1) : '–', 9) +
    padL(a.bossDmg, 9) +
    padL(a.deaths, 9) +
    padL(a.held ? num(100 * a.wins / a.held, 0) + '%' : '–', 9)
  );
}
console.log('\nk/cast & dmg/cast measure raw power per use; winRate is how often a wizard');
console.log('holding that spell won the round. Low picks → treat its rates as noisy.\n');
