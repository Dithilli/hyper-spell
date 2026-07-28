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

export default function globalSetup() {
  if (process.env.HS_E2E_SKIP_BUILD) {
    console.log('[e2e] HS_E2E_SKIP_BUILD set — testing dist/ as it stands');
    return;
  }
  for (const script of ['build', 'build:guide']) {
    execFileSync('npm', ['run', script], { cwd: REPO, stdio: 'pipe' });
  }
  for (const bundle of ['dist/hyperspell.js', 'dist/spell-guide.js']) {
    if (!existsSync(join(REPO, bundle))) throw new Error(`[e2e] build produced no ${bundle}`);
  }
  console.log('[e2e] bundles rebuilt from src/');
}
