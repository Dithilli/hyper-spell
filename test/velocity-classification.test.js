import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

// docs/superpowers/plans/velocity-classification.md is a deliverable that
// outlives this task: phase 2's planck swap is checked against it, and a wrong
// row there is a silent content rebalance rather than a broken build.
//
// scripts/classify-velocity.mjs asserts the whole table against the source —
// that every push really does derive from its own body's velocity, that every
// addVelocity row really is an addVelocity call, and that no file under
// src/sim writes a velocity without appearing in the table. That check was
// worth exactly nothing while the only thing that ran it was someone
// remembering to. This is what makes "self-checking" true.
test('the velocity classification still matches the code', () => {
  const before = readFileSync('docs/superpowers/plans/velocity-classification.md', 'utf8');
  let out;
  try {
    out = execFileSync(process.execPath, ['scripts/classify-velocity.mjs'], { encoding: 'utf8' });
  } catch (err) {
    assert.fail(`classification is stale or wrong — run node scripts/classify-velocity.mjs\n${err.stderr || err.message}`);
  }
  assert.match(out, /rows 107/, `expected 107 classified velocity writes, got: ${out.trim()}`);

  // Regenerating must be a no-op. If it is not, the committed document has
  // drifted from the code (line numbers move as files change) and the diff
  // belongs in the commit that moved them, not in someone's later surprise.
  const after = readFileSync('docs/superpowers/plans/velocity-classification.md', 'utf8');
  if (after !== before) {
    writeFileSync('docs/superpowers/plans/velocity-classification.md', before);
    assert.fail('velocity-classification.md is out of date — run node scripts/classify-velocity.mjs and commit the result');
  }
});

// The table's line numbers are generated, but the document's prose cites
// specific sites too (the misclassification the audit caught, the hat gib) and
// those are hand-written. "Re-runnable, so the line numbers stay true" was only
// true of the table; this makes it true of the document. A reference that no
// longer lands on a velocity write is a reader sent to the wrong line, which
// for this document is the whole failure mode.
test('every site the classification cites is still a velocity write', () => {
  const doc = readFileSync('docs/superpowers/plans/velocity-classification.md', 'utf8');
  const stale = [];
  let refs = 0;
  for (const [, file, line] of doc.matchAll(/`(src\/[^`:]+):(\d+)`/g)) {
    refs++;
    const text = readFileSync(file, 'utf8').split('\n')[Number(line) - 1] ?? '';
    if (!/setVelocity\(|addVelocity\(/.test(text)) stale.push(`${file}:${line}  ${text.trim()}`);
  }
  assert.ok(refs > 100, `expected the document to cite every site, saw ${refs} references`);
  assert.deepEqual(stale, [], `stale line references:\n${stale.join('\n')}`);
});
