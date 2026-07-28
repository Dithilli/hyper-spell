// sim-purity.test.js — the boundary between simulation and picture, enforced in
// both directions. It is the sibling of test/module-boundaries.test.js: that
// file bans the imports, this one bans the *reaching* that survives an import
// graph which already looks clean.
//
// Direction one: sim/ owns no picture. No particle array, no canvas context.
// A cosmetic leaves the sim as an event (src/sim/emit.js) or as a plain data
// descriptor the renderer interprets — never as a draw call, because a draw
// call inside the sim is a draw call the server has to fake and the client can
// never see.
//
// Direction two: render/ writes no sim state. The draw path runs at monitor
// rate, so anything it mutates becomes a function of the viewer's refresh rate.
// That is defect D1, and it was real: draw closures in the spell book pushed
// particles using the *seeded round stream*, so a 144Hz couch player and a
// 60Hz one rolled different numbers for the rest of the round.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.js')) out.push(p);
  }
  return out;
}

function scan(dir, banned) {
  const offenders = [];
  for (const file of walk(dir)) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (banned.test(line) && !line.trimStart().startsWith('//')) offenders.push(`${file}:${i + 1}  ${line.trim()}`);
    });
  }
  return offenders;
}

test('sim/ never touches the particle array or the canvas', () => {
  const banned = /\bparticles\s*\.\s*(push|length)|\bctx\b/;
  const offenders = scan('src/sim', banned);
  assert.deepEqual(offenders, [], `cosmetics must be emitted, not called:\n${offenders.join('\n')}`);
});

test('render/ never writes sim state', () => {
  const banned = /\b(damagePlayer|killPlayer|explode|Body\.set|phys\.(set|add|apply))/;
  const offenders = scan('src/render', banned);
  assert.deepEqual(offenders, [], `render must be read-only:\n${offenders.join('\n')}`);
});

// The two tests above are file scans, so the thing most likely to go wrong with
// them is that they scan nothing — a renamed directory, a walk() that returns
// [], a regex that never matches anything at all. Each of those failures looks
// exactly like success. These three pin the scanner itself.
test('the purity scanner actually reads the trees it guards', () => {
  assert.ok(walk('src/sim').length > 20, 'src/sim went missing from the scan');
  assert.ok(walk('src/render').length > 5, 'src/render went missing from the scan');
});

test('the sim ban would fire on a canvas call', () => {
  // src/render/draw-world.js is real code full of `ctx` — if the sim regex were
  // dead, this would come back empty.
  const hits = scan('src/render', /\bparticles\s*\.\s*(push|length)|\bctx\b/);
  assert.ok(hits.length > 0, 'the sim-purity regex matches nothing anywhere — it is dead');
});

test('the render ban would fire on a sim write', () => {
  const hits = scan('src/sim', /\b(damagePlayer|killPlayer|explode|Body\.set|phys\.(set|add|apply))/);
  assert.ok(hits.length > 0, 'the render-purity regex matches nothing anywhere — it is dead');
});
