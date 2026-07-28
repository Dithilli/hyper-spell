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
import { classifyAllCasts } from './spells/cast-kind.js';
import './spells/tiers.js';
import './maps/book.js'; // defineMap pushes into MAPS as this evaluates

Object.assign(SPELLS, STARTERS, BOOK_SPELLS, HYBRID_SPELLS);

// Resolve every spell's cast archetype now the book is complete. Doing it here
// rather than lazily on first use keeps it a load-time property of the content:
// a lazy first call lands in whatever code happens to touch a spell first, and
// when that was the draw path it meant the renderer writing `_cast` onto a
// sim-owned SPELLS entry — the exact direction the render/sim boundary forbids,
// and one the purity scanner's fixed identifier list would not have caught.
classifyAllCasts();
