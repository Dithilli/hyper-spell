// playwright.config.js — the browser E2E suite.
//
// `npm test` proves the sim is correct in Node. This proves the GAME works in a
// browser: that a key press seats a wizard, that all 142 spells cast, that all
// 110 maps draw, that two tabs can fight each other through the real server.
//
// Design: docs/superpowers/specs/2026-07-27-hyperspell-e2e-design.md
import { defineConfig, devices } from '@playwright/test';

// Deliberately not 8787. A dev server on the default port must not be adopted as
// the test server: the suite resets matches, spams telemetry and fills lobbies,
// and doing that to a live game someone is playing would be rude and would also
// make the run unreproducible.
// Overridable so a second checkout (a worktree, a parallel branch) can run the
// suite at the same time without the two fighting over one port.
export const TEST_PORT = Number(process.env.HS_TEST_PORT) || 8791;
export const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

// Which checkout serves the game. Defaults to this one, which is what you want
// almost always. Point it at a worktree to run today's suite against another
// revision — a release tag, a branch, or a known-good commit while the working
// tree is mid-refactor and does not boot.
export const GAME_DIR = process.env.HS_E2E_GAME_DIR || process.cwd();

export default defineConfig({
  testDir: './e2e/specs',
  // The content sweeps mean a "test" can be 142 casts or 110 map builds, so the
  // per-test ceiling is generous. Individual sweeps raise it further.
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0, // a flaky E2E that passes on retry is a bug being hidden
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],

  // dist/ is the artifact under test and this game changes every day. Building
  // first is what stops the whole suite quietly testing yesterday's bundle.
  globalSetup: './e2e/support/global-setup.js',

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    video: 'off',
    screenshot: 'only-on-failure',
    // 1280x720 is the canvas's native size — matching it keeps the CSS scale at
    // 1 so mouse coordinates in a spec are canvas coordinates.
    viewport: { width: 1280, height: 720 },
  },

  // One server for the static pages AND the authoritative sim, because
  // server/serve.js is both. Online specs ignore this one and spawn their own
  // isolated instances (e2e/support/server.js) so parallel workers cannot fight
  // over a single shared lobby.
  webServer: {
    command: `node server/serve.js`,
    cwd: GAME_DIR,
    env: { PORT: String(TEST_PORT) },
    url: BASE_URL,
    reuseExistingServer: false,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Firefox and WebKit run the boot and paint specs only. Tripling a suite
    // that exhaustively sweeps 252 pieces of content buys far less than it
    // costs; what these two catch is engine-specific canvas or WebSocket
    // breakage, and @engine marks exactly the specs that would show it.
    //
    // Opt-in, because they need system libraries Chromium does not:
    //
    //     npx playwright install --with-deps firefox webkit   (needs sudo)
    //     HS_E2E_ENGINES=1 npm run e2e
    //
    // Left on by default they would paint the board red on every machine that
    // has not run that command, which teaches everyone to ignore a red board.
    ...(process.env.HS_E2E_ENGINES ? [
      { name: 'firefox', grep: /@engine/, use: { ...devices['Desktop Firefox'] } },
      { name: 'webkit', grep: /@engine/, use: { ...devices['Desktop Safari'] } },
    ] : []),
  ],
});
