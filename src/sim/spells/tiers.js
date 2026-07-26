// spells/tiers.js — rarity tiers + weighted tome draw. Every spell maps to a tier
// so the tome pool can be weighted: powerful spells drop rarely and finding one
// feels like a jackpot. This also makes per-spell balance telemetry tractable — a
// flat 1/106 pool needed thousands of rounds per spell for signal. Any id NOT in
// the table defaults to 'common', so a newly added spell always appears rather
// than silently vanishing from the pool.
import { SPELLS } from './registry.js';

export const TIER_WEIGHT = { common: 100, uncommon: 45, rare: 12, legendary: 4, hybrid: 0 };
export const TIER_COLOR  = { common: '#c9c9d6', uncommon: '#7bd88f', rare: '#4ecdff', legendary: '#ffd166', hybrid: '#ff4df0' };
export const TIER_RANK   = { common: 0, uncommon: 1, rare: 2, legendary: 3, hybrid: 4 };

export const SPELL_TIERS = {
  // ---- core starters (js/spells.js) ----
  fireball: 'common', gust: 'common', lightning: 'common', frost: 'uncommon', blackhole: 'rare', meteor: 'legendary',

  // ---- bolts & bombs ----
  ember: 'common', twinfire: 'common', trishot: 'common', scatter: 'common', wobble: 'common',
  mortar: 'uncommon', bouncer: 'uncommon', homing: 'uncommon', boomerang: 'uncommon', skullrocket: 'uncommon',
  landmine: 'uncommon', sticky: 'uncommon', shard: 'uncommon', firecrackers: 'uncommon', dragonbreath: 'uncommon',
  cannonball: 'uncommon', bowling: 'uncommon', starfall: 'uncommon',
  sunburst: 'rare', cluster: 'rare',

  // ---- hitscan & beams (no travel time — priced up a tier) ----
  zapspell: 'uncommon', skysmite: 'uncommon', sweep: 'uncommon',
  thunderlance: 'rare', chain: 'rare', disintegrate: 'rare', stormcall: 'rare', railgun: 'rare',

  // ---- push, pull & air ----
  shove: 'common', updraft: 'common',
  cyclone: 'uncommon', vortexpull: 'uncommon', slam: 'uncommon', magnetpalm: 'uncommon',
  repulsor: 'rare', tornado: 'rare',

  // ---- ice & control ----
  iceshard: 'common', snowball: 'common',
  icicledrop: 'uncommon', coldsnap: 'uncommon',
  glacier: 'rare', blizzard: 'rare', flashfreeze: 'rare', frostnova: 'rare', brainfreeze: 'rare', permafrost: 'rare',

  // ---- fire & status ----
  ignite: 'common',
  phoenixdash: 'uncommon',
  flamewall: 'rare', napalm: 'rare', volcanospell: 'rare', fireflies: 'rare',

  // ---- movement & self ----
  blink: 'uncommon', rocketleap: 'uncommon', smokebomb: 'uncommon', springheel: 'uncommon', featherfall: 'uncommon',
  ghostwalk: 'rare', swaphex: 'rare', timeskip: 'rare', secondwind: 'rare', aegis: 'rare',

  // ---- summons ----
  rubberduck: 'common',
  cratedrop: 'uncommon', anvil: 'uncommon', bouncycastle: 'uncommon', stonewall: 'uncommon', trampoline: 'uncommon',
  decoy: 'uncommon', boulder: 'uncommon', sawblade: 'uncommon', blackcat: 'uncommon',
  piano: 'rare', beehive: 'rare',

  // ---- chaos & global (aimless, high-impact — mostly rare/legendary) ----
  confetti: 'common',
  roulette: 'uncommon',
  moongrav: 'rare', earthquake: 'rare', poltergeist: 'rare', frograin: 'rare', midas: 'rare',
  gravflip: 'legendary', disarm: 'legendary', chaostheory: 'legendary', bigbang: 'legendary', kingsdecree: 'legendary',

  // ---- weird & outlandish ----
  banana: 'common',
  balloonhex: 'uncommon', anchorhex: 'uncommon', shrinkray: 'uncommon', growthspurt: 'uncommon',
  mirrorcast: 'uncommon', vampirebolt: 'uncommon', kitchensink: 'uncommon',
  yoink: 'rare', unoreverse: 'rare', lightningrod: 'rare', teslacoil: 'rare',
  lifeswap: 'legendary', pigmorph: 'legendary',
};

export function spellTier(id) {
  if (typeof SPELLS !== 'undefined' && SPELLS[id] && SPELLS[id].hybrid) return 'hybrid';
  return SPELL_TIERS[id] || 'common';
}
export function tierColor(id) { return TIER_COLOR[spellTier(id)]; }

// weighted random spell id from a list (defaults to every registered spell).
// Higher tiers are rarer per TIER_WEIGHT above.
export function weightedSpellPick(ids) {
  ids = ids || Object.keys(SPELLS);
  if (!ids.length) return null;
  let total = 0;
  for (const id of ids) total += TIER_WEIGHT[spellTier(id)] || 1;
  let r = Math.random() * total;
  for (const id of ids) {
    r -= TIER_WEIGHT[spellTier(id)] || 1;
    if (r <= 0) return id;
  }
  return ids[ids.length - 1];
}
