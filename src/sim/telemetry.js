// telemetry.js — lightweight balance logging. Each round the host (or couch
// play) tallies per-spell activity, then hands one compact record to whatever
// sink the platform installed: the browser POSTs it to /telemetry, the server
// appends it to server/telemetry/rounds.jsonl. Clients never run the sim, so
// these hooks only fire where the match actually runs. Attribution is by the
// ATTACKER'S currently-equipped spell at the moment of the event — spells swap
// on tome pickup, so this is accurate to the round; a lingering projectile that
// lands after its caster grabbed a new tome is the rare exception, negligible
// for balance.
// The report card is drawn in src/render/hud.js.
import { onWorldReset } from './world.js';
import { GAME_VERSION } from '../version.js';
import { netMode } from './net-mode.js';
import { players } from './player/lifecycle.js';
import { BotController } from './ai/bot.js';
import { game, currentMap } from './match.js';
import { SPELLS } from './spells/registry.js';
import { spellTier } from './spells/tiers.js';

export const spellTally = {};      // per-ROUND, reset each round → the JSONL log
export const matchSpellTally = {}; // per-MATCH, reset each new match → the end-of-match report card
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
export function telPick(id)          { bump(id, 'picks', 1); }
export function telCast(id)          { bump(id, 'casts', 1); }
export function telDmg(id, amt)      { bump(id, 'dmg', amt); }
export function telBossDmg(id, amt)  { bump(id, 'bossDmg', amt); }
export function telKill(id)          { bump(id, 'kills', 1); }
export function telDeath(id)         { bump(id, 'deaths', 1); }

export function resetTelemetry() {
  for (const k of Object.keys(spellTally)) delete spellTally[k];
}
export function resetMatchTelemetry() {
  for (const k of Object.keys(matchSpellTally)) delete matchSpellTally[k];
}

// top spells of the whole match, ranked by kills then damage — powers the report
// card. Compact field names so it rides the snapshot to LAN clients cheaply.
export function computeSpellReport(limit = 5) {
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

// snapshot the round and ship it. Called from checkRoundEnd for every round
// (normal wins, draws, and boss outcomes alike). Never throws — a missing server
// or file:// load just means no logging.
export function flushRoundTelemetry() {
  if (netMode === 'online') return; // online, the server owns the sim and logs directly
  const spells = {};
  for (const [id, v] of Object.entries(spellTally)) spells[id] = { ...v };
  const rec = {
    // wall clock: log stamp, not sim state
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

// Where a finished round's record goes. Headless the server bridge points this
// at its own sink; in the browser src/net/telemetry-post.js POSTs it. The
// default swallows the record, which is what an unhosted sim wants.
export let postTelemetry = () => {};
export function setPostTelemetry(fn) { postTelemetry = fn || (() => {}); }

onWorldReset(() => {
  for (const k of Object.keys(spellTally)) delete spellTally[k];
  for (const k of Object.keys(matchSpellTally)) delete matchSpellTally[k];
});
