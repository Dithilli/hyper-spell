// A call to a name the file never declares, imports, or inherits from the
// platform is a ReferenceError waiting for a player. myName() was exactly that
// for the whole life of the ESM refactor: src/net/client.js called it three
// times, nothing defined it, so ws.onopen threw before `hello` was ever sent
// and no browser could join an online match. Nothing caught it, because the
// server e2e builds its own WebSocket frames and never loads the client.
//
// It has since caught a second one of the same shape: 0bb95b8 moved
// spawnParticles to render/fx.js and dropped the name from src/net/client.js's
// import list while applyBrokenDestructibles kept calling it, so every online
// client threw the first time cover blew apart.
//
// Scope is deliberately flat — every declaration anywhere in a file counts as
// visible everywhere in it. That admits a false negative (a name declared
// inside one function and called from another) and admits no false positives,
// which is the only trade that makes a guard test worth keeping.
//
// WHAT IT CANNOT SEE. It is regex over text, not a resolver, and every entry
// below is a way a real missing name gets through. Read this before trusting a
// green run; none of it is hypothetical.
//
//   - Import names are never resolved against the target module. `import
//     { spwanParticles } from './fx.js'` declares the typo and passes here; the
//     bundle is where it fails. This guard proves a name is *bound*, never that
//     the export exists.
//   - declaredNames runs on RAW source while only call sites are prose-stripped,
//     so any comment or string can grant a name. A comment inside an import's
//     braces is the sharp edge: it can name away the very bug it describes, so
//     src/net/client.js keeps its spawnParticles note ABOVE the `import {`.
//   - Template literals are stripped wholesale from call sites, so a call inside
//     one — `${render(x)}` — is invisible. Stripping only ever hides a real
//     call, never invents one, which is the direction this test must err in.
//   - Object-literal and class method shorthand declares a name file-wide:
//     `hooks = { status() {} }` makes a bare `status()` anywhere in that file
//     look defined. Same for `catch (e)` bindings, which leak file-wide too.
//   - Only the shape `name(` counts as a call. `foo?.(x)`, `foo (x)` with a
//     space, a bare reference passed as a value (`onTick(missing)`), and any
//     indirection (`const fn = missing; fn()`) are all out of scope.
//   - The `const|let|var` rule still has the unanchored-window flaw that the
//     import rule above no longer has: `for (const q of players) {` has no `=`
//     on its line, so the capture runs forward to the next `=` and declares
//     everything it passes. That swallows 702 lines across 37 files here,
//     widest 38 lines in src/sim/tick.js. Anchoring it needs a companion rule
//     for `for (const x of …)` bindings or it starts reporting them, so it is
//     left as known debt rather than a rushed fix.
//   - It walks src/ ONLY. server/ is never read, so nothing here says anything
//     about the headless host.
//   - It is static: no test loads dist/hyperspell.js. This approximates the
//     exit criterion that actually found myName — a real browser against the
//     real server — and does not replace it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const GLOBALS = new Set([
  // language
  'Array', 'Boolean', 'Error', 'Function', 'JSON', 'Map', 'Math', 'Number',
  'Object', 'Promise', 'Set', 'String', 'Symbol', 'Date', 'RegExp', 'WeakMap',
  'WeakSet', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'structuredClone',
  'BigInt', 'Uint8Array', 'Float32Array', 'Float64Array', 'Int16Array', 'Int32Array', 'ArrayBuffer',
  'TextEncoder', 'TextDecoder', 'Proxy', 'Reflect', 'globalThis',
  // platform
  'console', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'requestAnimationFrame', 'cancelAnimationFrame', 'addEventListener',
  'removeEventListener', 'fetch', 'atob', 'btoa', 'alert', 'URL',
  'URLSearchParams', 'WebSocket', 'Image', 'Audio', 'AudioContext',
  'webkitAudioContext', 'Path2D', 'DOMMatrix', 'CustomEvent', 'Event',
  'queueMicrotask', 'encodeURIComponent', 'decodeURIComponent', 'require',
  'Blob', 'Response', 'Request', 'DecompressionStream', 'CompressionStream',
  // keyword forms the call-site regex cannot tell from a call
  'super', 'import', 'return', 'typeof', 'void', 'new', 'delete', 'await',
  'if', 'for', 'while', 'switch', 'catch', 'function', 'yield', 'do', 'else',
]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.js')) out.push(p);
  }
  return out;
}

// every name this file brings into scope: imports, declarations, parameters,
// destructuring targets, catch bindings, class methods
function declaredNames(src) {
  const names = new Set();
  const add = (s) => { for (const n of String(s).split(/[^\w$]+/)) if (n) names.add(n); };
  // Anchored to line start and stopped at the statement's `;`. Unanchored, the
  // word "import" anywhere — in a comment, or a side-effect `import './x.js';`
  // with no `from` — opened a capture that ran forward to the NEXT `from '` and
  // registered every word between as declared. Measured on this tree that was
  // 381 spurious names across 6 files (src/sim/world.js 158, phys/facade.js 123
  // from one comment saying "import each one directly", content.js 57). It made
  // src/platform/browser.js lines 3-5 a dead zone: a planted call to a name
  // defined nowhere went unreported there, in the browser entry point — the one
  // file no test loads, and the origin of the class of bug this guard exists for.
  for (const m of src.matchAll(/^\s*import\s+([^;]*?)\s+from\s*['"]/gm)) add(m[1]);
  for (const m of src.matchAll(/\b(?:function|class)\s*\*?\s*([\w$]+)/g)) names.add(m[1]);
  for (const m of src.matchAll(/\b(?:const|let|var)\s+([\s\S]*?)=/g)) add(m[1]);
  for (const m of src.matchAll(/\bcatch\s*\(([^)]*)\)/g)) add(m[1]);
  // parameter lists: `(a, b) =>`, `function f(a, b)`, method shorthand
  for (const m of src.matchAll(/\(([^()]*)\)\s*(?:=>|\{)/g)) add(m[1]);
  for (const m of src.matchAll(/([\w$]+)\s*=>/g)) names.add(m[1]);
  // class methods and object shorthand — `status(text) { … }` defines a name,
  // it does not call one, and both forms appear inline in this codebase
  // (`hooks = { status() {}, welcome() {} }`). The control-flow keywords this
  // also matches (`if (x) {`, `catch (e) {`) are in GLOBALS already.
  for (const m of src.matchAll(/([\w$]+)\s*\([^()]*\)\s*\{/g)) names.add(m[1]);
  return names;
}

// Comments and string literals are prose, and prose is full of "the content
// pack (secret avatars)" — which reads as a call to pack() to any regex. Strip
// both before looking for call sites. Template literals go too: a `hsl(${h})`
// inside one would otherwise report hsl as undefined. Stripping can only hide
// a real call, never invent one, which is the direction this test must err in.
function stripProse(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:\\])\/\/[^\n]*/g, '$1 ')
    .replace(/`(?:[^`\\]|\\.)*`/g, ' ')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, ' ')
    .replace(/"(?:[^"\\\n]|\\.)*"/g, ' ');
}

function calledNames(src) {
  const names = new Set();
  // a bare call: not preceded by `.` (a method), and glued to its paren the
  // way code is written — `foo (x)` is legal JS and nowhere in this codebase
  for (const m of stripProse(src).matchAll(/(^|[^.\w$])([a-zA-Z_$][\w$]*)\(/g)) names.add(m[2]);
  return names;
}

test('every function src/ calls is declared, imported, or a platform global', () => {
  const offenders = [];
  for (const file of walk('src')) {
    const src = readFileSync(file, 'utf8');
    const declared = declaredNames(src);
    for (const name of calledNames(src)) {
      if (declared.has(name) || GLOBALS.has(name)) continue;
      offenders.push(`${file} → ${name}()`);
    }
  }
  assert.deepEqual(offenders, [], `undefined at runtime:\n${offenders.join('\n')}`);
});
