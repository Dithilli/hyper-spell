// awards.js — kill attribution, per-match stats, and the end-of-match awards
// ceremony. Stats live per slot and reset when a fresh match starts (first round
// out of the lobby). The kill feed and the awards panel are drawn in
// src/render/hud.js; what is here is the ledger behind them.
import { simNow } from './time.js';
import { emit } from './emit.js';
import { onWorldReset } from './world.js';
import { players } from './player/lifecycle.js';
import { telDeath, telKill } from './telemetry.js';

export const matchStats = {};
export const killFeedLines = []; // { a, ac, b, bc, self, at }

export function statFor(p) {
  return matchStats[p.slot] ??= {
    kills: 0, deaths: 0, selfKills: 0, hatsLost: 0, procs: 0,
    fallDmg: 0, slips: 0, bossDmg: 0, tomes: 0,
  };
}

export function resetMatchStats() {
  for (const k of Object.keys(matchStats)) delete matchStats[k];
  killFeedLines.length = 0;
}

// Dual path, like setBanner: the feed is a local ledger src/render/hud.js reads
// straight off this module, AND it is narration a LAN client can only learn
// about from an event. Emit first, then record, matching the order the old
// server-side wrapper used.
//
// The trailing slots aren't rendered — they let headless clients (Alinea)
// attribute kills exactly instead of guessing by proximity.
export function addKillFeed(...a) {
  emit('addKillFeed', ...a);
  const [aName, aColor, bName, bColor, self] = a;
  killFeedLines.push({ a: aName, ac: aColor, b: bName, bc: bColor, self, at: simNow() });
  if (killFeedLines.length > 5) killFeedLines.shift();
}

// called from killPlayer — resolves who gets the credit
export function creditKill(victim) {
  statFor(victim).deaths++;
  telDeath(victim.spellId); // balance: which spell the victim was holding when they died
  const hit = victim.lastHitBy;
  const killer = hit && simNow() - hit.at < 4000 ? hit.player : null;
  if (killer === victim) {
    statFor(victim).selfKills++;
    addKillFeed(victim.name, victim.color, null, null, true, victim.slot, victim.slot);
  } else if (killer) {
    statFor(killer).kills++;
    telKill(killer.spellId); // balance: kill credited to the killer's spell
    addKillFeed(killer.name, killer.color, victim.name, victim.color, false, killer.slot, victim.slot);
  } else {
    addKillFeed(null, null, victim.name, victim.color, false, null, victim.slot); // the arena did it
  }
}

// pick the funniest earned superlatives (max 5, only if someone actually did the thing)
export function computeAwards() {
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

onWorldReset(() => {
  for (const k of Object.keys(matchStats)) delete matchStats[k];
  killFeedLines.length = 0;
});
