// spell-guide.js — the entry for spell-guide.html, which wants the spell data
// and nothing else. The page's own inline script reads these off the global
// scope, exactly as it did when it loaded four classic scripts, so every name
// it references has to be published here: a missing one is a ReferenceError on
// the first statement, which aborts the script and leaves the page blank below
// the static prose.
import '../sim/content.js';
import { SPELLS } from '../sim/spells/registry.js';
import { CAST_FLOOR } from '../sim/spells/core.js';
import {
  SPELL_TIERS, TIER_COLOR, TIER_RANK, TIER_WEIGHT, spellTier,
} from '../sim/spells/tiers.js';
import {
  FUSIONS, F_FIRE, F_ICE, F_ZAP, F_AIR, F_EARTH, F_VOID, F_LIFE, F_TRICK,
} from '../sim/spells/fusion.js';
import { CAST_KINDS, castKind, classifyAllCasts } from '../sim/spells/cast-kind.js';

Object.assign(globalThis, {
  SPELLS,
  CAST_FLOOR,
  SPELL_TIERS, TIER_COLOR, TIER_RANK, TIER_WEIGHT, spellTier,
  FUSIONS, F_FIRE, F_ICE, F_ZAP, F_AIR, F_EARTH, F_VOID, F_LIFE, F_TRICK,
  CAST_KINDS, castKind, classifyAllCasts,
});
