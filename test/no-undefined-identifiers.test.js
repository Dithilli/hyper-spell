// A call to a name the file never declares, imports, or inherits from the
// platform is a ReferenceError waiting for a player. myName() was exactly that
// for the whole life of the ESM refactor: src/net/client.js called it three
// times, nothing defined it, so ws.onopen threw before `hello` was ever sent
// and no browser could join an online match. Nothing caught it, because the
// server e2e builds its own WebSocket frames and never loads the client.
//
// Scope is deliberately flat — every declaration anywhere in a file counts as
// visible everywhere in it. That admits a false negative (a name declared
// inside one function and called from another) and admits no false positives,
// which is the only trade that makes a guard test worth keeping.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const GLOBALS = new Set([
  // language
  'Array', 'Boolean', 'Error', 'Function', 'JSON', 'Map', 'Math', 'Number',
  'Object', 'Promise', 'Set', 'String', 'Symbol', 'Date', 'RegExp', 'WeakMap',
  'WeakSet', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'structuredClone',
  'BigInt', 'Uint8Array', 'Float32Array', 'Int32Array', 'ArrayBuffer',
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
  for (const m of src.matchAll(/import\s+([\s\S]*?)\s+from\s*['"]/g)) add(m[1]);
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
