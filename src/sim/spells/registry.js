// spells/registry.js — the one table every spell lands in.
//
// A true leaf: it imports nothing, so SPELLS is guaranteed to exist before any
// other module's body runs. Its key order is load-bearing (the tome pool
// iterates it, and weightedSpellPick walks that order), and ES module
// evaluation order is decided by the import graph rather than by us — so the
// three content modules each fill their own table and src/sim/content.js merges
// them in the classic script order. Nothing else may write to SPELLS.
export const SPELLS = {};
