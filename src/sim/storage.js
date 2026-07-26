// storage.js — the simulation's only persistent read (wave mode's best score).
//
// The browser injects localStorage; headless there is nothing to persist to, so
// the default stand-in reads null and swallows writes — byte-for-byte what
// server/shims.js:55 faked. That a networked run therefore never remembers a
// best wave is a known defect (C7), fixed in Task 12, not here.
const NO_STORAGE = { getItem: () => null, setItem() {}, removeItem() {} };

export let storage = NO_STORAGE;

export function setStorage(s) { storage = s || NO_STORAGE; }
