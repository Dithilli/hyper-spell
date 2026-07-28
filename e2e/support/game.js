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
      // install() alone does NOT stop the page: it swaps in fake timers that
      // still follow the wall clock, and the game went right on simulating
      // 850ms per real second (paceScale x 1s) between two adjacent evaluate
      // calls. pauseAt() is what actually holds time still, and holding it still
      // is the difference between a sweep that measures the spell and one that
      // measures how loaded the machine was.
      await this.page.clock.install();
      await this.page.clock.pauseAt(Date.now());
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

  /**
   * Press a key until it takes, the way a player does when nothing happens.
   *
   * Polled controls are edge-triggered, so a press made while the game is
   * ignoring input is not queued — it is gone. Joining is locked out for the
   * first 350ms of sim time and for 350ms after any name edit (join.js:98), and
   * whether a given press lands inside one of those windows depends on how many
   * catch-up ticks the first animation frame ran. Waiting cannot recover a lost
   * edge; only pressing again can.
   */
  async pressUntil(code, predicate, { attempts = 25, arg = undefined, label = 'the key to take' } = {}) {
    for (let i = 0; i < attempts; i++) {
      if (await this.page.evaluate(predicate, arg)) return;
      await this.press(code);
      if (await this.page.evaluate(predicate, arg)) return;
      await this.advance(100);
    }
    throw new Error(`pressed ${code} ${attempts} times waiting for ${label}`);
  }

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
    await this.pressUntil(which === 0 ? 'KeyE' : 'Enter',
      n => globalThis.HS.players.length > n, { arg: before, label: 'a wizard to take a seat' });
    if (confirmName && await this.nameEditOpen()) {
      await this.press('Escape');
      await this.waitFor(() => !globalThis.HS.nameEdit, { label: 'the name editor to close' });
      // join.js:98 locks joining for 350ms of SIM time after a name edit, so the
      // confirming keypress is not re-read as a join or a start.
      //
      // Waited on as a condition, not slept through. Sim time advances at
      // paceScale x wall time (0.85), so advancing 400ms of clock buys only
      // ~340ms of sim — a hair under the lockout, and the next seat silently
      // fails to take maybe one run in five.
      await this.waitFor(() => globalThis.HS.simNow() > globalThis.HS.nameEditEndAt + 360,
        { label: 'the post-naming join lockout to lapse' });
    }
  }

  async nameEditOpen() { return this.read(() => !!globalThis.HS.nameEdit); }
  async nameEditBuffer() { return this.read(() => globalThis.HS.nameEdit?.buffer ?? null); }

  async addBot(count = 1) {
    for (let i = 0; i < count; i++) {
      const before = await this.playerCount();
      await this.pressUntil('KeyB', n => globalThis.HS.players.length > n, { arg: before, label: 'a bot to join' });
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

  /**
   * The match state as plain data.
   *
   * Picked field by field rather than stringified: once a round resolves,
   * game.winner holds a live player, whose body holds the physics world, which
   * holds the player again — JSON.stringify throws on the cycle. The winner is
   * reported here as a name.
   */
  async state() {
    return this.read(() => {
      const g = globalThis.HS.game;
      return {
        state: g.state, mode: g.mode, winsNeeded: g.winsNeeded, mapIndex: g.mapIndex,
        wave: g.wave, waveState: g.waveState, totalRounds: g.totalRounds ?? 0,
        baseGravity: g.baseGravity, mapSeed: g.mapSeed ?? null,
        fightAt: g.fightAt ?? 0, fightShown: !!g.fightShown,
        winner: g.winner ? g.winner.name : null,
        boss: g.boss ? (g.boss.def?.name ?? true) : null,
        envEvent: g.envEvent ? (g.envEvent.name ?? g.envEvent.id ?? true) : null,
      };
    });
  }
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

  /**
   * Kill a wizard through the game's own killPlayer — the same function the
   * lava, the spikes and every lethal spell call.
   *
   * Round flow needs a death to test, and waiting for two bots to land a killing
   * blow is a stopwatch, not an assertion: the outcome is a coin flip and the
   * duration is unbounded. Triggering the real death path keeps everything after
   * it — onDeath, the 650ms delay, checkRoundEnd, the banner, the replay, the
   * win tally — exactly the code a real kill runs.
   */
  async kill(playerIndex = 0) {
    await this.read(i => globalThis.HS.killPlayer(globalThis.HS.players[i]), playerIndex);
  }

  /**
   * Damage through the real combat path.
   *
   * `from` matters: killPlayer credits the kill to whoever last hit the victim
   * within 4s (awards.js:36). Damage with no source is "the arena did it" — no
   * kill, no award, no killer in the feed.
   */
  async damage(playerIndex, amount, { from = null } = {}) {
    await this.read(([i, amt, src]) => {
      const H = globalThis.HS;
      H.damagePlayer(H.players[i], amt, src == null ? undefined : H.players[src]);
    }, [playerIndex, amount, from]);
  }

  async banner() {
    return this.read(() => ({ text: globalThis.HS.banner, color: globalThis.HS.bannerColor }));
  }

  /**
   * Every body in the current arena, nested composites included.
   *
   * smoke-test.html called Matter's Composite.allBodies, which the classic build
   * had as a global. The bundle has no such global and the debug surface does
   * not publish the physics facade, so the walk is done here — it is four lines
   * and it keeps the suite off Matter's API entirely.
   */
  async mapBodies() {
    return this.read(() => {
      const walk = c => [...(c.bodies || []), ...(c.composites || []).flatMap(walk)];
      return walk(globalThis.HS.currentMap.composite).map(b => ({
        label: b.label, isStatic: b.isStatic, isSensor: b.isSensor,
        mask: b.collisionFilter?.mask,
        min: { x: b.bounds.min.x, y: b.bounds.min.y },
        max: { x: b.bounds.max.x, y: b.bounds.max.y },
        x: b.position.x, y: b.position.y,
      }));
    });
  }

  /**
   * Rebuild the round on a given map through the game's own startRound — the
   * same call the round-end scheduler makes.
   *
   * The content sweeps need a clean arena 142 and 110 times over. Playing each
   * one out through the lobby would take the suite from minutes to an hour and
   * would not test anything the lobby specs do not already cover.
   */
  async restartRound(mapIndex = 0, { awaitFight = true } = {}) {
    await this.read(i => globalThis.HS.startRound(i), mapIndex);
    await this.waitFor(() => globalThis.HS.game.state === 'PLAY', { label: 'the rebuilt round' });
    if (awaitFight) await this.awaitFight();
  }

  /**
   * Stand two wizards within arm's reach of each other.
   *
   * Spawn points are spread across the arena so round one is not a pile-up, but
   * that leaves targeted spells with nothing to target: Shove looks for an enemy
   * within 130px and does nothing at all without one. A sweep that judges those
   * spells from across the map would call them broken.
   */
  async huddle(gap = 55) {
    await this.read(g => {
      const H = globalThis.HS;
      const [a, b] = H.players;
      if (!a || !b) throw new Error('huddle needs two wizards');
      const at = { x: a.body.position.x + g, y: a.body.position.y };
      H.despawnPlayer(b);
      H.spawnPlayer(b, at);
    }, gap);
  }

  /**
   * Everything a spell could plausibly disturb, in one comparable object.
   *
   * Used with two idle keyboard wizards, so the world is still: nothing here
   * moves on its own except particles and shake, which only ever DECAY. That
   * asymmetry is what lets a sweep tell "the spell did something" from "0.4s
   * passed" — an increase is evidence, a decrease is just time.
   */
  async fingerprint() {
    return this.read(() => {
      const H = globalThis.HS;
      const n = v => (v == null ? 0 : (v.size ?? v.length ?? 0));
      const timers = p => Object.keys(p).filter(k => k.endsWith('Until')).map(k => Math.round(p[k] || 0)).join(',');
      return {
        effects: n(H.activeEffects),
        projectiles: n(H.projectiles),
        summons: n(H.summons),
        particles: n(H.particles),
        enemies: n(H.enemies),
        shake: Math.round((H.shake || 0) * 100),
        hp: H.players.map(p => Math.round(p.hp)).join(','),
        timers: H.players.map(timers).join('|'),
        sizes: H.players.map(p => (p.sizeScale ?? 1).toFixed(3)).join(','),
        mega: H.players.map(p => p.mega ?? 1).join(','),
        hats: H.players.map(p => p.hat ?? '-').join(','),
        pos: H.players.map(p => `${Math.round(p.body.position.x)}:${Math.round(p.body.position.y)}`).join(','),
        vel: H.players.map(p => `${p.body.velocity.x.toFixed(2)}:${p.body.velocity.y.toFixed(2)}`).join(','),
        gravity: H.engine?.gravity ? `${H.engine.gravity.x}:${H.engine.gravity.y}` : null,
      };
    });
  }
}
