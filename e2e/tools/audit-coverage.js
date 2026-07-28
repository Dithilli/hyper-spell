#!/usr/bin/env node
// audit-coverage.js — `npm run e2e:audit`.
//
// The manifest solves half of a game that changes daily: content. New spells,
// maps and bosses are enumerable, so the sweeps pick them up for free.
//
// The other half is not enumerable. A new keybinding, a new game state, a new
// server message, a new button — these exist only as code, and nothing about
// adding one makes a test appear. This is the ratchet for those: it reads the
// game's controls out of src/ and fails if no spec so much as mentions them.
//
// It is a heuristic and is meant to be read as one. A spec that names a key in a
// comment satisfies it, so it cannot prove a control is TESTED — only that it is
// not completely forgotten. That is a low bar deliberately: a strict version
// would be gamed or switched off, and this one costs nothing to keep honest.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { listFiles, sourceSurface, REPO } from './surface.js';

const allowlist = JSON.parse(readFileSync(join(REPO, 'e2e/tools/coverage-allowlist.json'), 'utf8'));

const specText = (() => {
  const files = [
    ...listFiles(join(REPO, 'e2e/specs')),
    ...listFiles(join(REPO, 'e2e/support')),
  ];
  return files.map(f => readFileSync(f, 'utf8')).join('\n');
})();

const allowed = (group, key) => Object.prototype.hasOwnProperty.call(allowlist[group] ?? {}, key);

/**
 * @param {string} group     which allowlist bucket applies
 * @param {string} label     what to call these in the report
 * @param {string[]} items   the surfaces found in src/
 * @param {(item: string) => boolean} isCovered
 */
function check(group, label, items, isCovered) {
  const missing = [];
  const skipped = [];
  for (const item of items) {
    if (allowed(group, item)) { skipped.push(item); continue; }
    if (!isCovered(item)) missing.push(item);
  }
  return { group, label, missing, skipped, checked: items.length - skipped.length };
}

const source = sourceSurface();
const mentions = needle => specText.includes(needle);

const results = [
  check('keyCodes', 'keybindings', source.keyCodes, key => mentions(`'${key}'`) || mentions(`"${key}"`)),
  check('gameStates', 'game states', source.gameStates, state => mentions(`'${state}'`)),
  check('netMessages', 'server messages the client handles', source.netMessages,
    msg => mentions(`'${msg}'`) || mentions(`"${msg}"`)),
  check('menuModes', 'menu buttons', source.menuModes ?? [], mode => mentions(`data-mode="${mode}"`) || mentions(`'${mode}'`)),
  check('storageKeys', 'storage keys', source.storageKeys, key => mentions(key)),
  // A new file under these two is a new user-facing surface by definition: one
  // is how the game is driven, the other is everything the player sees.
  check('platformFiles', 'platform modules', source.platformFiles, path => {
    const base = path.split('/').pop().replace(/\.js$/, '');
    return mentions(base) || mentions(path);
  }),
  check('renderFiles', 'render modules', source.renderFiles, path => {
    const base = path.split('/').pop().replace(/\.js$/, '');
    return mentions(base) || mentions(path);
  }),
];

let failed = 0;
console.log('coverage audit — every control in src/ should be named by some spec\n');
for (const { label, missing, skipped, checked } of results) {
  const skipNote = skipped.length ? `, ${skipped.length} allowlisted` : '';
  if (missing.length === 0) {
    console.log(`  ok    ${label} (${checked} checked${skipNote})`);
  } else {
    failed += missing.length;
    console.log(`  MISS  ${label} (${checked} checked${skipNote}) — no spec mentions:`);
    for (const item of missing) console.log(`          ${item}`);
  }
}

if (failed) {
  console.log(`\n${failed} user-facing surface(s) are not referenced by any spec.`);
  console.log('Either cover them, or add them to e2e/tools/coverage-allowlist.json with a reason.');
  process.exit(1);
}
console.log('\nevery user-facing surface in src/ is named by at least one spec.');
