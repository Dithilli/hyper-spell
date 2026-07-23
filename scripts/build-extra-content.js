#!/usr/bin/env node
'use strict';

// Builds the optional browser content pack without putting its plaintext source,
// aliases, or image assets in the tracked tree. Uses only Node built-ins.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, '.content-src');
const LOADER_OUTPUT = path.join(ROOT, 'js', 'extra-content.js');
const PAYLOAD_OUTPUT = path.join(ROOT, 'js', 'extra-content.pack.js');
// One-time async lookup cost: ~44 ms on the development machine. This makes
// low-entropy offline name dictionaries materially more expensive without
// blocking rendering or delaying ordinary frames after the first lookup.
const ITERATIONS = 600000;

function normalize(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function b64(value) {
  return segmentCiphertext(Buffer.from(value).toString('base64'));
}

function derive(seed, label) {
  return crypto.createHmac('sha256', seed).update(label).digest();
}

function encrypt(key, plaintext, iv) {
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return { iv: b64(iv), data: b64(Buffer.concat([body, cipher.getAuthTag()])) };
}

function containsProtectedTerm(value, terms) {
  const text = String(value).toLowerCase();
  return terms.some(term => text.includes(term));
}

function segmentCiphertext(value) {
  return String(value).match(/.{1,3}/g).join('.');
}

function embedAssets(source) {
  const assetPattern = /(['"])(assets\/[A-Za-z0-9_./-]+\.(?:png|jpe?g|webp))\1/g;
  const embedded = new Map();
  const assetRoot = fs.realpathSync(path.join(SOURCE_DIR, 'assets'));
  return source.replace(assetPattern, (literal, quote, ref) => {
    if (embedded.has(ref)) return quote + embedded.get(ref) + quote;
    const requested = path.resolve(SOURCE_DIR, ref);
    if (!fs.existsSync(requested)) throw new Error(`Missing private asset: ${ref}`);
    const file = fs.realpathSync(requested);
    const relative = path.relative(assetRoot, file);
    if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) {
      throw new Error(`Private asset escapes the asset directory: ${ref}`);
    }
    const ext = path.extname(file).slice(1).replace('jpg', 'jpeg');
    const dataUrl = `data:image/${ext};base64,${fs.readFileSync(file).toString('base64')}`;
    embedded.set(ref, dataUrl);
    return quote + dataUrl + quote;
  });
}

function assembleSource() {
  const extras = fs.readFileSync(path.join(SOURCE_DIR, 'artkit-extras.source.js'), 'utf8');
  const avatars = fs.readFileSync(path.join(SOURCE_DIR, 'avatars.source.js'), 'utf8');
  return embedAssets(extras + '\n' + avatars);
}

function build() {
  const manifest = JSON.parse(fs.readFileSync(path.join(SOURCE_DIR, 'manifest.json'), 'utf8'));
  if (!Array.isArray(manifest.aliases) || !manifest.aliases.length) {
    throw new Error('Private manifest must contain at least one alias');
  }
  const aliases = manifest.aliases.map(normalize);
  if (aliases.some(alias => !alias)) throw new Error('Private manifest aliases must not normalize to an empty string');
  if (new Set(aliases).size !== aliases.length) throw new Error('Private manifest contains duplicate normalized aliases');
  const source = assembleSource();
  // Compile without executing so a malformed private source never produces a pack.
  new Function(source);

  if (!/^[0-9a-f]{64}$/i.test(manifest.buildSecret || '')) {
    throw new Error('Private manifest must contain a 32-byte hexadecimal buildSecret');
  }
  const seed = Buffer.from(manifest.buildSecret, 'hex');
  const sourceHash = crypto.createHash('sha256').update(source).digest('hex');
  const contentKey = derive(seed, `content-key:${sourceHash}`);
  const packVersion = derive(seed, `pack-version:${sourceHash}`).subarray(0, 8).toString('hex');
  const protectedTerms = aliases.filter(alias => alias.length >= 4);
  const compressed = zlib.gzipSync(Buffer.from(source), { level: 9, mtime: 0 });
  const payloadIv = derive(seed, `payload-iv:${sourceHash}`).subarray(0, 12);
  const payload = encrypt(contentKey, compressed, payloadIv);
  payload.v = packVersion;
  // All public binary strings are segmented by b64() so random Base64 cannot
  // accidentally spell a meaningful alias. The runtime strips the dots.
  const indexSalt = derive(seed, 'alias-index-salt').subarray(0, 16);
  const keys = Object.create(null);
  for (const alias of aliases) {
    const material = crypto.pbkdf2Sync(alias, indexSalt, ITERATIONS, 32, 'sha256');
    const fingerprint = derive(material, 'lookup').toString('hex');
    const wrappingKey = derive(material, 'wrap');
    const wrapIv = derive(seed, `wrap-iv:${sourceHash}:${alias}`).subarray(0, 12);
    const wrapped = encrypt(wrappingKey, contentKey, wrapIv);
    keys[fingerprint] = { i: wrapped.iv, d: wrapped.data };
  }

  const data = JSON.stringify({ n: ITERATIONS, s: b64(indexSalt), v: packVersion, k: keys });
  const output = `// Generated optional-content loader. Rebuild with scripts/build-extra-content.js.\n` +
`(function installContentPack(){\n` +
`  'use strict';\n` +
`  const pack=${data};\n` +
`  const baseVariant=avatarVariant;\n` +
`  const attempts=new Map();\n` +
`  let installing=null;\n` +
`  let payloadPromise=null;\n` +
`  const enc=new TextEncoder();\n` +
`  const dec=new TextDecoder();\n` +
`  const norm=v=>String(v||'').trim().toLowerCase().replace(/\\s+/g,' ');\n` +
`  const bytes=v=>Uint8Array.from(atob(v.replace(/\\./g,'')),c=>c.charCodeAt(0));\n` +
`  const hex=v=>Array.from(new Uint8Array(v),b=>b.toString(16).padStart(2,'0')).join('');\n` +
`  const subtle=globalThis.crypto?.subtle;\n` +
`  const payloadUrl=(()=>{const here=typeof location!=='undefined'?location.href:'http://localhost/';const base=typeof document!=='undefined'&&document.currentScript?.src?new URL('extra-content.pack.js',document.currentScript.src):new URL('js/extra-content.pack.js',here);base.searchParams.set('v',pack.v);return base.href;})();\n` +
`  function takePayload(){const value=globalThis.__hsPackData;delete globalThis.__hsPackData;return value?.v===pack.v?value:null;}\n` +
`  function loadPayload(){\n` +
`    if(payloadPromise)return payloadPromise;\n` +
`    const present=takePayload();\n` +
`    if(present)return payloadPromise=Promise.resolve(present);\n` +
`    if(typeof document==='undefined')return Promise.reject(new Error('Optional content payload is unavailable.'));\n` +
`    payloadPromise=new Promise((resolve,reject)=>{\n` +
`      const script=document.createElement('script');\n` +
`      script.src=payloadUrl;script.async=true;\n` +
`      script.onload=()=>{const value=takePayload();script.remove();value?resolve(value):reject(new Error('Optional content payload was empty.'));};\n` +
`      script.onerror=()=>{script.remove();reject(new Error('Optional content payload could not be fetched.'));};\n` +
`      document.head.appendChild(script);\n` +
`    }).catch(error=>{payloadPromise=null;throw error;});\n` +
`    return payloadPromise;\n` +
`  }\n` +
`  async function open(record,wrapping){\n` +
`    const [rawKey,payload]=await Promise.all([subtle.decrypt({name:'AES-GCM',iv:bytes(record.i)},wrapping,bytes(record.d)),loadPayload()]);\n` +
`    const contentKey=await subtle.importKey('raw',rawKey,{name:'AES-GCM'},false,['decrypt']);\n` +
`    const compressed=await subtle.decrypt({name:'AES-GCM',iv:bytes(payload.iv)},contentKey,bytes(payload.data));\n` +
`    const stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));\n` +
`    const plaintext=await new Response(stream).arrayBuffer();\n` +
`    const code=dec.decode(plaintext);\n` +
`    new Function(code)();\n` +
`    try{globalThis.__hsContentSource=code;globalThis.__hsContentInstalled&&globalThis.__hsContentInstalled(code);}catch(e){}\n` +
`  }\n` +
`  async function probe(name){\n` +
`    if(!subtle||typeof DecompressionStream==='undefined')return;\n` +
`    let active=null;\n` +
`    try{\n` +
`      const input=await subtle.importKey('raw',enc.encode(name),'PBKDF2',false,['deriveBits']);\n` +
`      const rawMaterial=await subtle.deriveBits({name:'PBKDF2',salt:bytes(pack.s),iterations:pack.n,hash:'SHA-256'},input,256);\n` +
`      const material=await subtle.importKey('raw',rawMaterial,{name:'HMAC',hash:'SHA-256'},false,['sign']);\n` +
`      const [rawFingerprint,rawWrapping]=await Promise.all([subtle.sign('HMAC',material,enc.encode('lookup')),subtle.sign('HMAC',material,enc.encode('wrap'))]);\n` +
`      const fingerprint=hex(rawFingerprint);\n` +
`      const record=pack.k[fingerprint];\n` +
`      if(!record)return;\n` +
`      const wrapping=await subtle.importKey('raw',rawWrapping,{name:'AES-GCM'},false,['decrypt']);\n` +
`      if(!installing)installing=open(record,wrapping);\n` +
`      active=installing;\n` +
`      await active;\n` +
`    }catch(error){\n` +
`      attempts.delete(name);\n` +
`      if(active&&installing===active){installing=null;payloadPromise=null;console.warn('Optional content could not be loaded.',error);}\n` +
`      else if(!active)console.warn('Optional content lookup failed.',error);\n` +
`    }\n` +
`  }\n` +
`  avatarVariant=function contentPackVariant(name){\n` +
`    const normalized=norm(name);\n` +
`    if(normalized&&!attempts.has(normalized)){\n` +
`      const attempt=Promise.resolve().then(()=>probe(normalized));\n` +
`      attempts.set(normalized,attempt);\n` +
`    }\n` +
`    return baseVariant(name);\n` +
`  };\n` +
`})();\n`;

  const payloadOutput = `// Generated optional-content payload.\nglobalThis.__hsPackData=${JSON.stringify(payload)};\n`;
  if (containsProtectedTerm(output + payloadOutput, protectedTerms)) {
    throw new Error('Generated loader accidentally contains a protected plaintext term; rotate the private build seed');
  }
  fs.writeFileSync(LOADER_OUTPUT, output);
  fs.writeFileSync(PAYLOAD_OUTPUT, payloadOutput);
  console.log(`Wrote ${path.relative(ROOT, LOADER_OUTPUT)} (${aliases.length} alias fingerprints, ${output.length} bytes)`);
  console.log(`Wrote ${path.relative(ROOT, PAYLOAD_OUTPUT)} (${payloadOutput.length} bytes, loaded on demand)`);
}

build();
