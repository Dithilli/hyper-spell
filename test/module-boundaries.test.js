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

// The physics facade is only a seam if nothing reaches around it. Phase 2 swaps
// matter-js for planck.js by writing a second backend beside the first and
// changing one import in src/sim/phys/facade.js; every file that names a Matter
// namespace directly is a file that swap would silently miss. This started at
// 332 call sites across 20 files and is now zero.
test('only src/sim/phys/* imports matter-js', () => {
  const offenders = [];
  for (const file of walk('src/sim')) {
    if (file.includes(join('sim', 'phys'))) continue;
    if (/from\s+['"]matter-js['"]|require\(\s*['"]matter-js['"]\s*\)/.test(readFileSync(file, 'utf8'))) {
      offenders.push(file);
    }
  }
  assert.deepEqual(offenders, [], `only src/sim/phys/* may import matter-js:\n${offenders.join('\n')}`);
});

// Importing the module is one way round the facade; naming a Matter namespace
// that some other module re-exported is the other, and it is the one this
// codebase actually had — src/sim/world.js used to destructure matter-js and
// hand `Bodies`, `Body`, `Composite`, `Query`, `Constraint`, `Events`, `Engine`,
// `Vector` and `Common` to twenty files. The facade cannot be swapped while a
// single one of those survives, so the gate is on the call shape, not just the
// import.
test('nothing outside src/sim/phys calls a Matter namespace', () => {
  const MATTER_CALL = /\b(Bodies|Body|Composite|Constraint|Events|Engine|Query|Vector|Common)\.[A-Za-z_]/;
  const offenders = [];
  for (const dir of ['src', 'test']) {
    for (const file of walk(dir)) {
      if (file.includes(join('sim', 'phys'))) continue;
      readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        if (MATTER_CALL.test(line) && !line.trimStart().startsWith('//')) {
          offenders.push(`${file}:${i + 1}  ${line.trim()}`);
        }
      });
    }
  }
  assert.deepEqual(offenders, [], `use src/sim/phys/facade.js:\n${offenders.join('\n')}`);
});

// THE ONE EXEMPTION. src/sim/pace.js measures its hitstop on the env clock, and
// it has to: `ms` at all 14 slowMo call sites is a real-world duration, and
// simNow() is the clock the hitstop itself slows. Measuring the deadline on sim
// time makes the beat last ms/scale and feed back on itself — a 90ms freeze
// held the sim for 2000ms when it was tried. Pace is a real-time concern by
// definition; it is the thing that MAKES sim time diverge from real time, so it
// is the one thing that cannot be measured on sim time. See the comment at the
// top of src/sim/pace.js and the guard in test/fixed-timestep.test.js.
//
// The exemption is deliberately narrow: one file, one token. pace.js is still
// banned from every browser global, and no other file is exempt from anything.
const CLOCK_EXEMPT = 'src/sim/pace.js';
const CLOCK_READ = /performance\.now\(/;

// setTimeout/setInterval join the list for the same reason performance.now() is
// on it: they are a clock the simulation does not control. Round flow used to
// hang off bare setTimeouts, which made "1900ms later" a promise from the host
// rather than a property of the sim — unpausable, unreplayable, and measured on
// a different clock from the sim deadlines it was coordinating with. It is all
// on the tick scheduler now (src/sim/schedule.js), src/sim is at zero live
// timers, and this is what keeps it there.
test('src/sim touches no browser or wall-clock globals', () => {
  const banned = /\b(document|window|localStorage|navigator|requestAnimationFrame|setTimeout|setInterval)\b|performance\.now\(/;
  const offenders = [];
  let exemptedSites = 0;
  for (const file of walk('src/sim')) {
    const exempt = join(file) === join(CLOCK_EXEMPT);
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (!banned.test(line) || line.trimStart().startsWith('//')) return;
      // the exemption covers the clock read ONLY, and only where nothing else
      // on the line is banned
      if (exempt && CLOCK_READ.test(line) && !banned.test(line.replace(CLOCK_READ, ''))) {
        exemptedSites++;
        return;
      }
      offenders.push(`${file}:${i + 1}  ${line.trim()}`);
    });
  }
  assert.deepEqual(offenders, [], `sim must be platform-free:\n${offenders.join('\n')}`);
  // An exemption nobody uses is an exemption nobody notices going stale. If
  // pace.js ever stops reading the env clock, delete the carve-out above rather
  // than leaving a hole in the gate.
  assert.ok(exemptedSites > 0, `${CLOCK_EXEMPT} no longer reads the env clock — drop the exemption`);
});

// No exemption here, not even for pace.js: the clock carve-out above is about
// real time, and randomness has nothing to do with real time. A single
// Math.random anywhere under src/sim is entropy the round seed cannot reach, so
// the round stops being replayable. src/render/** keeps Math.random on purpose —
// cosmetic draw-code randomness is legal and desirable, and out of scope here.
test('src/sim uses the seeded RNG, never Math.random', () => {
  const offenders = [];
  for (const file of walk('src/sim')) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (/Math\.random\s*\(/.test(line) && !line.trimStart().startsWith('//')) {
        offenders.push(`${file}:${i + 1}  ${line.trim()}`);
      }
    });
  }
  assert.deepEqual(offenders, [], `use simRandom():\n${offenders.join('\n')}`);
});

// The injection point is gone, and staying gone is the point of the task: a
// `random` option on createSim would let a caller hand the sim a stream the sim
// does not control, which is exactly the process-global swap this replaced.
test('src/sim/env.js injects a clock and nothing else', () => {
  const src = readFileSync('src/sim/env.js', 'utf8');
  const exported = [...src.matchAll(/^export (?:let|const|function) (\w+)/gm)].map((m) => m[1]);
  assert.deepEqual(exported.sort(), ['performance', 'setClock']);
});
