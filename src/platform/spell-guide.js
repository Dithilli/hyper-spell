// spell-guide.js — the entry for spell-guide.html, which wants the spell data
// and nothing else. The page's own inline script reads these off the global
// scope, exactly as it did when it loaded four classic scripts.
import '../sim/content.js';
import { SPELLS } from '../sim/spells/registry.js';
import { SPELL_TIERS, TIER_COLOR, TIER_RANK, spellTier } from '../sim/spells/tiers.js';

globalThis.SPELLS = SPELLS;
globalThis.SPELL_TIERS = SPELL_TIERS;
globalThis.TIER_COLOR = TIER_COLOR;
globalThis.TIER_RANK = TIER_RANK;
globalThis.spellTier = spellTier;
