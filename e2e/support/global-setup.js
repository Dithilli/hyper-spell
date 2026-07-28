// global-setup.js — build the bundles before anything loads a page.
//
// The suite tests dist/, not src/. This repo's game changes daily, so without
// this step a run can pass against a bundle built days ago and report a green
// board for code nobody has executed.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
// The checkout under test — see GAME_DIR in playwright.config.js.
const GAME_DIR = process.env.HS_E2E_GAME_DIR || REPO;

export default function globalSetup() {
  if (process.env.HS_E2E_SKIP_BUILD) {
    console.log('[e2e] HS_E2E_SKIP_BUILD set — testing dist/ as it stands');
    return;
  }
  for (const script of ['build', 'build:guide']) {
    try {
      execFileSync('npm', ['run', script], { cwd: GAME_DIR, stdio: 'pipe' });
    } catch (err) {
      // esbuild reports unresolved imports and syntax errors on stderr. Passing
      // it through matters: "the suite would not start" is useless next to
      // "builders.js imports particles, which fx.js no longer exports".
      const detail = (err.stderr?.toString() || err.stdout?.toString() || err.message).trim();
      throw new Error(`[e2e] \`npm run ${script}\` failed in ${GAME_DIR} — the game does not build:\n\n${detail}\n`);
    }
  }
  for (const bundle of ['dist/hyperspell.js', 'dist/spell-guide.js']) {
    if (!existsSync(join(GAME_DIR, bundle))) throw new Error(`[e2e] build produced no ${bundle}`);
  }
  console.log(`[e2e] bundles rebuilt from ${GAME_DIR}/src`);
}
