// fixtures.js — what every browser test gets for free.
//
// The console guard is the highest-value assertion in the suite: it makes all
// 252 content sweeps double as crash detection. A spell that throws while
// casting still "casts" as far as a state assertion is concerned — the thrown
// error is the only evidence, and without this it would scroll past unread.
import { test as base, expect } from '@playwright/test';
import { GamePage } from './game.js';

// Errors the browser raises that are not the game's fault. Kept short and
// justified: every entry here is a hole in the guard.
const IGNORED = [
  // Chromium blocks autoplay until a gesture; ensureAudio() handles it, but the
  // refusal is logged before any test can click.
  /The AudioContext was not allowed to start/i,
  /play\(\) failed because the user didn't interact/i,
  // Playwright's own navigation teardown, not page code.
  /Execution context was destroyed/i,
];

class ErrorGuard {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.allowed = [...IGNORED];
  }

  // Opt out of the guard for a test that *provokes* an error on purpose — the
  // failed-connect status path, the badVersion path. Always pass the narrowest
  // pattern that covers it.
  allow(pattern) { this.allowed.push(pattern); return this; }

  watch(page) {
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') this.errors.push(`console.error: ${text}`);
      else if (msg.type() === 'warning') this.warnings.push(text);
    });
    page.on('pageerror', err => this.errors.push(`pageerror: ${err.message}`));
    return page;
  }

  unexpected() {
    return this.errors.filter(e => !this.allowed.some(p => p.test(e)));
  }
}

export const test = base.extend({
  // Attaches to every page the test opens, including ones made from new
  // contexts, so the online specs are covered without extra wiring.
  errors: async ({ context }, use) => {
    const guard = new ErrorGuard();
    context.on('page', page => guard.watch(page));
    for (const page of context.pages()) guard.watch(page);
    await use(guard);
    const unexpected = guard.unexpected();
    expect(unexpected, `the page logged ${unexpected.length} error(s):\n  ${unexpected.join('\n  ')}`).toEqual([]);
  },

  // A booted, instrumented game page sitting in the lobby with a frozen clock.
  // Most specs want exactly this and should not repeat the boot dance.
  game: async ({ page, errors }, use) => {
    void errors; // ordering: the guard must be listening before the page loads
    const game = new GamePage(page);
    await game.boot();
    await use(game);
  },
});

export { expect };
