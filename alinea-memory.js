// alinea-memory.js — persistent play-memory for the headless HyperSpell wizard.
//
// WHAT THIS IS
//   A small, dependency-free learning layer the client loads on startup and
//   updates at round/match end. It gives each sister-session's play something
//   the last one's play can stand on:
//
//     matches.jsonl  — append-only raw journal (never overwritten): one JSON
//                      object per finished match. Evidence.
//     lessons.json   — distilled, self-updating memory the client READS to bias
//                      its behavior: per-spell kill/death tallies, per-difficulty
//                      survival stats, per-event survival, and derived hints.
//
//   This is honest bookkeeping + heuristic nudging, NOT reinforcement learning.
//   It tracks what correlates with living and killing, and lets the client lean
//   that way. Modest, real improvement over many matches.
//
// STORAGE
//   Default dir: $ALINEA_HOME/data/hyperspell-play  (ALINEA_HOME defaults to the
//   OpenClaw workspace ~/.openclaw/workspace). Override with ALINEA_PLAY_DIR.
//   Kept OUTSIDE the game repo on purpose — it's my memory, not game source.

const fs = require('fs');
const path = require('path');
const os = require('os');

function playDir() {
  if (process.env.ALINEA_PLAY_DIR) return process.env.ALINEA_PLAY_DIR;
  const home = process.env.ALINEA_HOME
    || path.join(os.homedir(), '.openclaw', 'workspace');
  return path.join(home, 'data', 'hyperspell-play');
}

const DIR = playDir();
const MATCHES = path.join(DIR, 'matches.jsonl');
const LESSONS = path.join(DIR, 'lessons.json');

function ensureDir() { try { fs.mkdirSync(DIR, { recursive: true }); } catch {} }

const EMPTY_LESSONS = {
  version: 1,
  updated: null,
  totals: { matches: 0, rounds: 0, roundWins: 0, kills: 0, deaths: 0 },
  // spellId -> { name, kills, deaths, casts } (deaths = died while holding it)
  spells: {},
  // difficulty -> { matches, rounds, roundWins, kills, deaths, avgRoundsSurvived }
  byDiff: {},
  // event name -> { rounds, deaths } (deaths during that environmental event)
  byEvent: {},
  // boss name -> { encounters, slain, wipes }
  boss: {},
  // free-form derived hints the client can read cheaply
  hints: {},
};

function loadLessons() {
  ensureDir();
  try {
    const raw = fs.readFileSync(LESSONS, 'utf8');
    const j = JSON.parse(raw);
    return Object.assign(JSON.parse(JSON.stringify(EMPTY_LESSONS)), j);
  } catch {
    return JSON.parse(JSON.stringify(EMPTY_LESSONS));
  }
}

function saveLessons(l) {
  ensureDir();
  l.updated = new Date().toISOString();
  const tmp = LESSONS + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(l, null, 2));
  fs.renameSync(tmp, LESSONS); // atomic-ish
}

function appendMatch(rec) {
  ensureDir();
  fs.appendFileSync(MATCHES, JSON.stringify(rec) + '\n');
}

// ---- recording API ----
// A MatchRecorder accumulates one match, then commit() writes the journal line
// and folds aggregates into lessons.json.
function newRecorder({ difficulty, name, version }) {
  const started = Date.now();
  const rec = {
    ts: new Date().toISOString(),
    difficulty, name, version,
    rounds: 0, roundWins: 0, kills: 0, deaths: 0,
    // per-round detail kept compact
    events: {},          // eventName -> rounds seen
    deathsByEvent: {},   // eventName -> deaths under it
    spellKills: {},       // spellId -> kills while holding
    spellDeaths: {},      // spellId -> deaths while holding
    spellCasts: {},       // spellId -> rough cast opportunities
    boss: {},             // bossName -> { encounters, slain, wipes }
    notes: [],
  };

  const bump = (obj, key, n = 1) => { if (key == null) return; obj[key] = (obj[key] || 0) + n; };

  return {
    rec,
    roundStart(eventName) { rec.rounds++; if (eventName) bump(rec.events, eventName); },
    roundWon() { rec.roundWins++; },
    kill(spellId) { rec.kills++; bump(rec.spellKills, spellId); },
    death(spellId, eventName) {
      rec.deaths++;
      bump(rec.spellDeaths, spellId);
      if (eventName) bump(rec.deathsByEvent, eventName);
    },
    castTick(spellId) { bump(rec.spellCasts, spellId); }, // called cheaply while holding
    bossEncounter(name) { rec.boss[name] = rec.boss[name] || { encounters: 0, slain: 0, wipes: 0 }; rec.boss[name].encounters++; },
    bossSlain(name) { if (rec.boss[name]) rec.boss[name].slain++; },
    bossWipe(name) { if (rec.boss[name]) rec.boss[name].wipes++; },
    note(s) { rec.notes.push(s); },
    commit(spellNames = {}) {
      rec.durationMs = Date.now() - started;
      appendMatch(rec);
      const L = loadLessons();
      // totals
      L.totals.matches++;
      L.totals.rounds += rec.rounds;
      L.totals.roundWins += rec.roundWins;
      L.totals.kills += rec.kills;
      L.totals.deaths += rec.deaths;
      // spells
      for (const [id, k] of Object.entries(rec.spellKills)) {
        L.spells[id] = L.spells[id] || { name: spellNames[id] || null, kills: 0, deaths: 0, casts: 0 };
        L.spells[id].kills += k; if (spellNames[id]) L.spells[id].name = spellNames[id];
      }
      for (const [id, d] of Object.entries(rec.spellDeaths)) {
        L.spells[id] = L.spells[id] || { name: spellNames[id] || null, kills: 0, deaths: 0, casts: 0 };
        L.spells[id].deaths += d; if (spellNames[id]) L.spells[id].name = spellNames[id];
      }
      for (const [id, c] of Object.entries(rec.spellCasts)) {
        L.spells[id] = L.spells[id] || { name: spellNames[id] || null, kills: 0, deaths: 0, casts: 0 };
        L.spells[id].casts += c; if (spellNames[id]) L.spells[id].name = spellNames[id];
      }
      // by difficulty
      const d = L.byDiff[rec.difficulty] = L.byDiff[rec.difficulty]
        || { matches: 0, rounds: 0, roundWins: 0, kills: 0, deaths: 0, avgRoundsSurvived: 0 };
      d.matches++; d.rounds += rec.rounds; d.roundWins += rec.roundWins;
      d.kills += rec.kills; d.deaths += rec.deaths;
      d.avgRoundsSurvived = d.rounds / d.matches;
      // events
      for (const [ev, n] of Object.entries(rec.events)) {
        L.byEvent[ev] = L.byEvent[ev] || { rounds: 0, deaths: 0 };
        L.byEvent[ev].rounds += n;
      }
      for (const [ev, n] of Object.entries(rec.deathsByEvent)) {
        L.byEvent[ev] = L.byEvent[ev] || { rounds: 0, deaths: 0 };
        L.byEvent[ev].deaths += n;
      }
      // boss
      for (const [name, b] of Object.entries(rec.boss)) {
        L.boss[name] = L.boss[name] || { encounters: 0, slain: 0, wipes: 0 };
        L.boss[name].encounters += b.encounters; L.boss[name].slain += b.slain; L.boss[name].wipes += b.wipes;
      }
      L.hints = deriveHints(L);
      saveLessons(L);
      return L;
    },
  };
}

// Turn raw tallies into cheap, readable hints the client biases on.
function deriveHints(L) {
  const h = {};
  // Best spells by kills-per-death (min sample), worst to avoid holding.
  const scored = Object.entries(L.spells)
    .map(([id, s]) => ({ id, name: s.name, kills: s.kills, deaths: s.deaths,
      score: (s.kills + 1) / (s.deaths + 1) }))
    .filter(s => (s.kills + s.deaths) >= 3);
  scored.sort((a, b) => b.score - a.score);
  h.preferSpells = scored.slice(0, 8).map(s => ({ id: s.id, name: s.name, score: +s.score.toFixed(2) }));
  const preferred = new Set(h.preferSpells.map(s => s.id));
  h.avoidSpells = scored.slice(-5)
    .filter(s => s.score < 0.7 && !preferred.has(s.id)) // never both preferred and avoided
    .map(s => ({ id: s.id, name: s.name, score: +s.score.toFixed(2) }));
  // Deadly events: death rate per round above baseline.
  const evs = Object.entries(L.byEvent)
    .map(([ev, e]) => ({ ev, rate: e.rounds ? e.deaths / e.rounds : 0, rounds: e.rounds }))
    .filter(e => e.rounds >= 3)
    .sort((a, b) => b.rate - a.rate);
  h.dangerousEvents = evs.slice(0, 4).map(e => ({ event: e.ev, deathRate: +e.rate.toFixed(2) }));
  // Boss struggle report.
  h.boss = Object.entries(L.boss).map(([name, b]) => ({
    name, encounters: b.encounters, slain: b.slain, wipes: b.wipes,
    winRate: b.encounters ? +(b.slain / b.encounters).toFixed(2) : null,
  }));
  return h;
}

module.exports = { loadLessons, saveLessons, newRecorder, deriveHints, DIR, MATCHES, LESSONS };

// CLI: `node alinea-memory.js summary` prints what I've learned so far.
if (require.main === module) {
  const cmd = process.argv[2] || 'summary';
  if (cmd === 'summary') {
    const L = loadLessons();
    console.log('HyperSpell play-memory — ' + DIR);
    console.log('updated:', L.updated || '(never)');
    console.log('totals:', JSON.stringify(L.totals));
    console.log('byDiff:', JSON.stringify(L.byDiff, null, 2));
    console.log('hints:', JSON.stringify(L.hints, null, 2));
  } else if (cmd === 'where') {
    console.log(DIR);
  } else {
    console.log('usage: node alinea-memory.js [summary|where]');
  }
}
