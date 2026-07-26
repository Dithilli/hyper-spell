// content.js — load the game's content and put it in the order the classic
// build did.
//
// index.html guaranteed registration order by script order. ES module
// evaluation order follows the import graph instead, and the sim's graph is one
// large cycle, so it cannot be relied on: each spell module fills its own table
// and the merge below is what fixes the order. That order is load-bearing —
// Object.keys(SPELLS) is the tome pool, and weightedSpellPick walks it — so a
// change here changes what every seeded run draws.
//
// Importing this module is what makes SPELLS and MAPS non-empty. Both entry
// points do it first.
import { SPELLS } from './spells/registry.js';
import { STARTERS } from './spells/starters.js';
import { BOOK_SPELLS } from './spells/book.js';
import { HYBRID_SPELLS } from './spells/fusion.js';
import './spells/tiers.js';
import './maps/book.js'; // defineMap pushes into MAPS as this evaluates

Object.assign(SPELLS, STARTERS, BOOK_SPELLS, HYBRID_SPELLS);
