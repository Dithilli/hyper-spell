// session-code.js — the shareable code that gates one match.
//
// Six characters from a 32-symbol alphabet with no I, O, 0 or 1, because these
// get read aloud across a desk more often than they get pasted. That is ~1.07e9
// combinations, which is beside the point (when the room is exposed at all it
// is GAME_KEY-gated as well), and readable at a glance, which is the point.
'use strict';
const crypto = require('crypto');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LEN = 6;
const MAX_TYPED = 16; // bound the work a hostile client can ask for on compare

function mintCode() {
  let out = '';
  for (let i = 0; i < CODE_LEN; i++) out += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return out;
}

// what a player typed → what we compare. Case, spaces and the dash we print are
// all noise. The four excluded glyphs are simply not valid: a misread I or O
// fails the compare rather than silently opening somebody else's match.
function normalizeCode(s) {
  return String(s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, MAX_TYPED);
}

function formatCode(code) {
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

module.exports = { mintCode, normalizeCode, formatCode, ALPHABET, CODE_LEN };
