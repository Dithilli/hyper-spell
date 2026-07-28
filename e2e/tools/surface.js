// surface.js — everything the suite knows about the game's shape.
//
// Two sources, because no single one sees the whole surface:
//
//   liveSurface(page)  the CONTENT, read out of a running browser. Spells, maps
//                      and bosses are registered at runtime by modules that push
//                      into tables, so the only trustworthy census is the game
//                      itself, loaded from the same bundle a player loads.
//
//   sourceSurface()    the CONTROLS, read out of src/. Keybindings, game states,
//                      net message arms and menu buttons exist only as code —
//                      there is no table to enumerate at runtime.
//
// generate-manifest.js freezes both into e2e/manifest.json; 14-manifest-drift
// compares them back; audit-coverage.js checks the specs mention the controls.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

// Two roots, and the difference matters when running against another checkout:
// REPO is where this suite and its manifest live, SRC_ROOT is the game being
// read. They are the same directory unless HS_E2E_GAME_DIR says otherwise.
export const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SRC_ROOT = process.env.HS_E2E_GAME_DIR || REPO;

export function listFiles(dir, ext = '.js') {
  let out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out = out.concat(listFiles(full, ext));
    else if (entry.name.endsWith(ext)) out.push(full);
  }
  return out.sort();
}

const readSrc = () => listFiles(join(SRC_ROOT, 'src')).map(f => ({
  path: relative(SRC_ROOT, f).split('\\').join('/'),
  text: readFileSync(f, 'utf8'),
}));

const uniqSorted = xs => [...new Set(xs)].sort();

/** Pull every distinct capture-group-1 match of `re` across the given files. */
function scan(files, re) {
  const out = [];
  for (const { text } of files) for (const m of text.matchAll(re)) out.push(m[1]);
  return uniqSorted(out);
}

/**
 * Keys bound through a character class rather than an equality test —
 * `/^Digit[1-9]$/.test(e.code)` in join.js binds nine keys in one line.
 * Expanded here so the win-target shortcuts are not a blind spot.
 */
function expandCharClassKeys(files) {
  const out = [];
  for (const { text } of files) {
    for (const m of text.matchAll(/\/\^([A-Za-z]+)\[(\w)-(\w)\]\$\//g)) {
      const [, prefix, from, to] = m;
      for (let c = from.charCodeAt(0); c <= to.charCodeAt(0); c++) out.push(prefix + String.fromCharCode(c));
    }
  }
  return uniqSorted(out);
}

/**
 * The game's controls, as they exist in source.
 * Read by the drift spec and the coverage auditor, never by a browser.
 */
export function sourceSurface() {
  const files = readSrc();
  const platform = files.filter(f => f.path.startsWith('src/platform/'));
  const netClient = files.filter(f => f.path === 'src/net/client.js');

  return {
    // Every key the platform layer reacts to. This is the list a new keybinding
    // lands in, and the reason the auditor exists.
    //
    // Three spellings, because the code uses three: an equality test, a polled
    // `keys[...]` lookup, and a character-class regex for the win-target digits.
    // Missing the third would leave 1-9 as a silent blind spot in the auditor.
    keyCodes: uniqSorted([
      ...scan(platform, /e\.code === '([A-Za-z0-9]+)'/g),
      ...scan(platform, /keys\['([A-Za-z0-9]+)'\]/g),
      ...expandCharClassKeys(platform),
    ]),
    // The keymaps that seat and drive wizard 1 and wizard 2.
    keymaps: (() => {
      const text = files.find(f => f.path === 'src/platform/input-keyboard.js').text;
      return [...text.matchAll(/\{\s*left:\s*'([^']+)',\s*right:\s*'([^']+)',\s*jump:\s*'([^']+)',\s*cast:\s*'([^']+)',\s*cast2:\s*'([^']+)',\s*block:\s*'([^']+)'/g)]
        .map(m => ({ left: m[1], right: m[2], jump: m[3], cast: m[4], cast2: m[5], block: m[6] }));
    })(),
    // Every value game.state is ever assigned.
    gameStates: scan(files, /game\.state = '([A-Z_]+)'/g),
    // Every server message the client has an arm for.
    netMessages: scan(netClient, /case '([a-zA-Z]+)':/g),
    // Every button the opening menu offers.
    menuModes: scan(files.filter(f => f.path === 'src/platform/menu.js'), /data-mode="([a-z]+)"/g),
    // Every localStorage key the game reads or writes.
    storageKeys: uniqSorted([
      ...scan(files, /localStorage\.(?:get|set)Item\('([^']+)'/g),
      ...scan(files, /storeKey === '([^']+)'/g),
      ...scan(files, /`(hs-[a-z-]+)-\$\{/g),
    ]),
    // The user-facing layers. A new file here is a new surface.
    platformFiles: platform.map(f => f.path),
    renderFiles: files.filter(f => f.path.startsWith('src/render/')).map(f => f.path),
  };
}

/**
 * The game's content, read out of a live instrumented page.
 * @param {import('@playwright/test').Page} page — already booted with ?nomenu
 */
export function liveSurface(page) {
  return page.evaluate(() => {
    const H = globalThis.HS;
    const spells = {};
    for (const id of Object.keys(H.SPELLS)) {
      const s = H.SPELLS[id];
      spells[id] = {
        name: s.name ?? null,
        color: s.color ?? null,
        cooldown: s.cooldown ?? null,
        castable: typeof s.cast === 'function',
      };
    }
    return {
      spells,
      maps: H.MAPS.map(m => ({
        name: m.name,
        gravity: m.gravity ?? 2,
        wrap: !!m.wrap,
        icy: !!m.icy,
        muddy: !!m.muddy,
        cozy: !!m.cozy,
        cover: !!m.cover,
        stars: !!m.stars,
        spawns: Array.isArray(m.spawns) ? m.spawns.length : 0,
        buildable: typeof m.build === 'function',
        updates: typeof m.update === 'function',
      })),
      // id as well as name: spawnBoss(now, { bossId }) is keyed by id, so a
      // sweep that only knew the names could not summon what it wants to test.
      bosses: H.BOSSES.map(b => ({ id: b.id, name: b.name, color: b.color ?? null })),
      secretBosses: H.SECRET_BOSSES.map(b => ({ id: b.id, name: b.name, color: b.color ?? null })),
      enemyTypes: Object.keys(H.ENEMY_TYPES ?? {}),
      constants: {
        MAX_HP: H.MAX_HP ?? null,
        WAVE_ENEMY_CAP: H.WAVE_ENEMY_CAP ?? null,
        BOSS_EVERY: H.BOSS_EVERY ?? null,
        TICK_MS: H.TICK_MS ?? null,
        PAD_ALPHABET: H.PAD_ALPHABET ?? null,
      },
    };
  });
}

export function loadManifest() {
  return JSON.parse(readFileSync(join(REPO, 'e2e/manifest.json'), 'utf8'));
}

export const manifestPath = join(REPO, 'e2e/manifest.json');
export { statSync };
