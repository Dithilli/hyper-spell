// The code is the whole access control for an online match, and it is also
// something one person reads aloud while another types it. These tests pin both
// halves: what may be minted, and what a player may type and still get in.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mintCode, normalizeCode, formatCode } from '../server/session-code.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

test('a minted code is six characters from the unambiguous alphabet', () => {
  for (let i = 0; i < 200; i++) {
    const code = mintCode();
    assert.equal(code.length, 6);
    for (const ch of code) assert.ok(ALPHABET.includes(ch), `${ch} is not in the alphabet`);
  }
});

test('the alphabet excludes the four glyphs people misread', () => {
  const minted = Array.from({ length: 400 }, mintCode).join('');
  for (const ch of 'IO01') assert.ok(!minted.includes(ch), `${ch} must never be minted`);
});

test('two codes in a row differ', () => {
  const codes = new Set(Array.from({ length: 50 }, mintCode));
  assert.ok(codes.size > 45, `minting is not random enough: ${codes.size}/50 unique`);
});

test('normalize accepts however a player typed it', () => {
  for (const typed of ['ABC-DEF', 'abc-def', ' abc def ', 'AbC.dEf', 'ABCDEF']) {
    assert.equal(normalizeCode(typed), 'ABCDEF', `failed on ${JSON.stringify(typed)}`);
  }
});

test('normalize survives hostile input', () => {
  assert.equal(normalizeCode(null), '');
  assert.equal(normalizeCode(undefined), '');
  assert.equal(normalizeCode({}), 'OBJECTOBJECT'); // stringified, then stripped
  assert.equal(normalizeCode('x'.repeat(5000)).length, 16);
});

test('format groups a code for reading aloud', () => {
  assert.equal(formatCode('ABCDEF'), 'ABC-DEF');
});
