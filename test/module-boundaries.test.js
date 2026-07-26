import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.js')) out.push(p);
  }
  return out;
}

test('src/sim never imports render, net, or platform', () => {
  const offenders = [];
  for (const file of walk('src/sim')) {
    const src = readFileSync(file, 'utf8');
    // Both import forms: `… from 'x'` and the bare side-effect `import 'x';`.
    // sim/ genuinely uses the bare form (content.js, tick.js), so matching only
    // the `from` clause would leave a live hole in the layering gate.
    const specifiers = [
      ...[...src.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]),
      ...[...src.matchAll(/^\s*import\s+['"]([^'"]+)['"]/gm)].map((m) => m[1]),
    ];
    for (const spec of specifiers) {
      if (/(^|\/)(render|net|platform)\//.test(spec)) offenders.push(`${file} → ${spec}`);
    }
  }
  assert.deepEqual(offenders, [], `sim must not depend on outer layers:\n${offenders.join('\n')}`);
});

// unskipped by Task 4 (simNow)
test.skip('src/sim touches no browser or wall-clock globals', () => {
  const banned = /\b(document|window|localStorage|navigator|requestAnimationFrame)\b|performance\.now\(/;
  const offenders = [];
  for (const file of walk('src/sim')) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (banned.test(line) && !line.trimStart().startsWith('//')) offenders.push(`${file}:${i + 1}  ${line.trim()}`);
    });
  }
  assert.deepEqual(offenders, [], `sim must be platform-free:\n${offenders.join('\n')}`);
});
