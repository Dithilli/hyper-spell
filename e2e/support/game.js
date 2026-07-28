// game.js — the page object every spec drives the game through.
//
// Two rules keep this honest:
//
//   1. INPUT IS ALWAYS REAL. Seating a wizard, adding a bot, moving, casting and
//      starting a match all happen by dispatching real keyboard and mouse events
//      at the page. The suite never calls addBot() to add a bot.
//   2. HS IS READ-ONLY. window.HS (installed by ?nomenu) is for *asserting*, not
//      for driving. The one declared exception is grantSpell(), because waiting
//      for 142 specific tome drops is a lottery, not a test.
import { expect } from '@playwright/test';

// The game's own fixed step, mirrored from src/sim/time.js so a spec can ask for
// ticks instead of guessing at milliseconds.
export const TICK_MS = 1000 / 60;

export class GamePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.frozen = false;
  }

  // ---------------------------------------------------------------- booting

  // The instrumented page: the real bundle, the real listeners, the real rAF
  // loop. ?nomenu skips mountMenu() and publishes window.HS
  // (src/platform/browser.js:36 tests location.search, not just the script src).
  //
  // clock: true freezes time so nothing advances unless a spec says so. Online
  // specs pass false — their server runs on a real clock and pinning only one
  // side of that conversation produces nonsense.
  async boot({ clock = true, query = 'nomenu', path = '/index.html' } = {}) {
    if (clock) {
      await this.page.clock.install();
      this.frozen = true;
    }
    await this.page.goto(query ? `${path}?${query}` : path);
    await this.page.waitForFunction(() => !!globalThis.HS, null, { timeout: 15_000 });
    return this;
  }

  // ------------------------------------------------------------------- time

  // Advance through the REAL frame path: rAF fires, the tick loop pumps, draw()
  // runs. Slower (~9ms of wall time per 16.7ms of game) because it renders.
  // Use when the thing under test is the loop or the picture.
  async advance(ms) {
    if (!this.frozen) { await this.page.waitForTimeout(ms); return; }
    await this.page.clock.runFor(ms);
  }

  // Advance by stepping the sim directly, no rAF and no draw. ~40x faster
  // (0.23ms/tick vs 9ms), which is what makes exhaustive content sweeps
  // affordable. It is still the sim's own entry point — what it skips is the
  // renderer, which spec 11 covers on its own.
  async advanceSim(ticks) {
    await this.page.evaluate(n => { for (let i = 0; i < n; i++) globalThis.HS.stepSim(); }, ticks);
  }

  async advanceSimMs(ms) { return this.advanceSim(Math.ceil(ms / TICK_MS)); }

  // Poll a page-side predicate, advancing the game between checks.
  //
  // waitForFunction cannot be used under a frozen clock: its default polling is
  // requestAnimationFrame, which a frozen clock never fires, so it would hang
  // for the full timeout every time. Waiting has to be what moves the game
  // forward — which also makes every wait deterministic and instant.
  async waitFor(predicate, { timeoutMs = 20_000, stepMs = 100, arg = undefined, label = 'condition' } = {}) {
    const deadline = Date.now() + timeoutMs;
    let virtual = 0;
    for (;;) {
      if (await this.page.evaluate(predicate, arg)) return;
      if (virtual >= timeoutMs || Date.now() > deadline) {
        throw new Error(`timed out waiting for ${label} after ${virtual}ms of game time`);
      }
      await this.advance(stepMs);
      virtual += stepMs;
    }
  }

  // ------------------------------------------------------------------ input

  /**
   * Press a key and hold it long enough for the game to notice.
   *
   * Lobby shortcuts (B, R, M, the digits) act on the keydown edge and would be
   * satisfied by an instant tap. Seating a wizard is not: scanJoins() polls
   * `keys[...]` once per animation frame and edge-detects it (input-keyboard.js:39).
   * Under a frozen clock an instant press goes down and up between frames, so
   * the poll never sees it and the wizard never sits down. Holding across two
   * frames is what makes both kinds of key work through one method.
   */
  async press(code, { holdFrames = 2, advanceMs = 0 } = {}) {
    await this.page.keyboard.down(code);
    await this.advance(Math.ceil(TICK_MS * holdFrames));
    await this.page.keyboard.up(code);
    await this.advance(Math.ceil(TICK_MS));
    if (advanceMs) await this.advance(advanceMs);
  }

  /** A key that must NOT be held across a frame — for testing edge behaviour. */
  async tap(code) { await this.page.keyboard.press(code); }

  // Hold a key across real sim ticks — the only way to test movement, which is
  // polled inside stepSim rather than handled on the keydown edge.
  async hold(code, ticks) {
    await this.page.keyboard.down(code);
    await this.advanceSim(ticks);
    await this.page.keyboard.up(code);
  }

  async type(text) { await this.page.keyboard.type(text); }

  async aimAt(x, y) { await this.page.mouse.move(x, y); }

  async clickAt(x, y, button = 'left') {
    await this.page.mouse.move(x, y);
    await this.page.mouse.down({ button });
    await this.advanceSim(3);
    await this.page.mouse.up({ button });
  }

  // ------------------------------------------------------------ lobby verbs

  /**
   * Seat a keyboard wizard the way a human does: press that keymap's cast key.
   *
   * Seating in the lobby immediately opens the name editor for that wizard
   * (join.js:87), and while it is open every other shortcut is swallowed
   * (join.js:170). Confirming it is part of sitting down, not an extra step, so
   * it happens here — pass confirmName: false to leave the editor open and test
   * it directly.
   */
  async seatKeyboardPlayer(which = 0, { confirmName = true } = {}) {
    const before = await this.playerCount();
    await this.press(which === 0 ? 'KeyE' : 'Enter');
    await this.waitFor(n => globalThis.HS.players.length > n, { arg: before, label: 'a wizard to take a seat' });
    if (confirmName && await this.nameEditOpen()) {
      await this.press('Escape');
      await this.waitFor(() => !globalThis.HS.nameEdit, { label: 'the name editor to close' });
      // join.js sets a 350ms lockout after a name edit so the confirming
      // keypress is not re-read as a join or a start.
      await this.advance(400);
    }
  }

  async nameEditOpen() { return this.read(() => !!globalThis.HS.nameEdit); }
  async nameEditBuffer() { return this.read(() => globalThis.HS.nameEdit?.buffer ?? null); }

  async addBot(count = 1) {
    for (let i = 0; i < count; i++) {
      const before = await this.playerCount();
      await this.press('KeyB');
      await this.waitFor(n => globalThis.HS.players.length > n, { arg: before, label: 'a bot to join' });
    }
  }

  async setWins(n) {
    await this.press(`Digit${n}`);
    await this.waitFor(w => globalThis.HS.game.winsNeeded === w, { arg: n, label: `winsNeeded === ${n}` });
  }

  async toggleMode() {
    const before = await this.read(() => globalThis.HS.game.mode);
    await this.press('KeyM');
    await this.waitFor(m => globalThis.HS.game.mode !== m, { arg: before, label: 'the mode to flip' });
  }

  async reset() {
    await this.press('KeyR');
    await this.waitFor(() => globalThis.HS.game.state === 'LOBBY', { label: 'the lobby' });
  }

  /**
   * SPACE out of the lobby, then wait for the round to actually be fightable.
   *
   * A round opens with a countdown: startRound sets game.fightAt to 1.1s ahead
   * and controller.js:144 refuses to cast until sim time passes it. A spec that
   * starts a round and immediately casts is testing the countdown, not the
   * spell — so waiting it out belongs here, once, rather than in every caller.
   */
  async startMatch({ awaitFight = true } = {}) {
    await this.press('Space');
    await this.waitFor(() => globalThis.HS.game.state === 'PLAY', { label: 'the round to start' });
    if (awaitFight) await this.awaitFight();
  }

  /** Burn through the FIGHT countdown so casting and dashing are legal. */
  async awaitFight() {
    for (let i = 0; i < 200; i++) {
      const ready = await this.read(() => globalThis.HS.simNow() > (globalThis.HS.game.fightAt || 0));
      if (ready) return;
      await this.advanceSim(10);
    }
    throw new Error('the FIGHT countdown never elapsed');
  }

  /** The common opener: N bots seated in the lobby, one round live and fightable. */
  async startRoundWithBots(bots = 2) {
    await this.addBot(bots);
    await this.startMatch();
    return this;
  }

  // ------------------------------------------------------------- assertions

  /** Run a function in the page. HS is a global there; keep these read-only. */
  async read(fn, arg) { return this.page.evaluate(fn, arg); }

  async state() { return this.read(() => JSON.parse(JSON.stringify(globalThis.HS.game))); }
  async playerCount() { return this.read(() => globalThis.HS.players.length); }

  async players() {
    return this.read(() => globalThis.HS.players.map(p => ({
      name: p.name, hp: p.hp, alive: p.alive, roundWins: p.roundWins, ghost: !!p.ghost,
      slots: [...(p.slots || [])], mega: !!p.mega, color: p.color,
      x: p.body?.position?.x ?? null, y: p.body?.position?.y ?? null,
      vx: p.body?.velocity?.x ?? null, vy: p.body?.velocity?.y ?? null,
    })));
  }

  async player(i = 0) { return (await this.players())[i]; }

  /** Everything the world is currently simulating, for effect assertions. */
  async worldCounts() {
    return this.read(() => {
      const H = globalThis.HS;
      const count = v => (v == null ? 0 : (v.size ?? v.length ?? 0));
      return {
        players: H.players.length,
        effects: count(H.activeEffects),
        projectiles: count(H.projectiles),
        tomes: count(H.tomes),
        hats: count(H.hats),
        enemies: count(H.enemies),
        bodies: H.engine ? H.Composite.allBodies(H.engine.world).length : null,
        boss: H.game.boss ? H.game.boss.name ?? true : null,
      };
    });
  }

  /**
   * Proof the renderer painted, not merely that it did not throw. A blank or
   * flat-filled canvas has almost no distinct colours; a drawn arena has
   * hundreds. Sampling with a prime stride avoids aliasing against tile grids.
   */
  async paintProbe() {
    return this.read(() => {
      const canvas = document.getElementById('game');
      const ctx = canvas.getContext('2d');
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const seen = new Set();
      let lit = 0;
      for (let i = 0; i < data.length; i += 4 * 997) {
        seen.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
        if (data[i] + data[i + 1] + data[i + 2] > 90) lit++;
      }
      return { distinctColors: seen.size, litSamples: lit };
    });
  }

  async expectPainted(minColors = 12) {
    const probe = await this.paintProbe();
    expect(probe.distinctColors,
      `the canvas looks blank (${probe.distinctColors} distinct colours sampled)`).toBeGreaterThanOrEqual(minColors);
    return probe;
  }

  // --------------------------------------------------------------- the hook

  /**
   * The one write into sim state the suite allows, and only for spec 06.
   * Tomes drop on a schedule from a weighted pool; casting a *named* spell means
   * putting it in the slot directly. Everything after this — the cast, the
   * cooldown, the effect — is the real code path.
   */
  async grantSpell(spellId, { slot = 0, playerIndex = 0 } = {}) {
    return this.read(([id, slotIndex, pi]) => {
      const p = globalThis.HS.players[pi];
      if (!p) throw new Error(`no player at index ${pi}`);
      p.slots[slotIndex] = id;
      // Cooldowns are keyed by SLOT, not by spell id (spells/core.js:372) —
      // putting a fresh spell in a slot must not inherit the last one's timer.
      p.casts[slotIndex] = -1e9;
      p.slotFilledAt = globalThis.HS.simNow();
      return p.slots[slotIndex];
    }, [spellId, slot, playerIndex]);
  }

  /** When slot `slot` of player `playerIndex` last cast. Slot-keyed, see above. */
  async lastCastAt(slot = 0, playerIndex = 0) {
    return this.read(([s, pi]) => globalThis.HS.players[pi].casts[s] ?? null, [slot, playerIndex]);
  }
}
