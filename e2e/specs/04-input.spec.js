// 04-input — a wizard does what the player tells it to.
//
// Movement, jumping and blocking are polled inside stepSim, not handled on a
// keydown edge, so every one of these holds a key across real sim ticks rather
// than tapping it.
import { test, expect } from '../support/fixtures.js';
import { GamePage } from '../support/game.js';
import { installFakeGamepads, padPress, padHold } from '../support/gamepad.js';
import { loadManifest } from '../tools/surface.js';

const manifest = loadManifest();
const [KEYS_A, KEYS_B] = manifest.source.keymaps;

test.describe('keyboard control', () => {
  // Both keymaps get the same treatment from the manifest, so a keymap edited in
  // src/platform/input-keyboard.js is exercised here without touching this file.
  for (const [label, map, seat] of [['wizard 1 (WASD)', KEYS_A, 0], ['wizard 2 (arrows)', KEYS_B, 1]]) {
    test(`${label} walks left and right`, async ({ game }) => {
      // Two wizards so a versus round is legal, then drive the one under test.
      await game.seatKeyboardPlayer(0);
      await game.seatKeyboardPlayer(1);
      await game.startMatch();
      await game.advanceSim(30);

      const start = (await game.player(seat)).x;
      await game.hold(map.right, 40);
      const right = (await game.player(seat)).x;
      expect(right, `${label} should move right while ${map.right} is held`).toBeGreaterThan(start);

      await game.hold(map.left, 60);
      expect((await game.player(seat)).x, `${label} should move left while ${map.left} is held`).toBeLessThan(right);
    });

    test(`${label} jumps`, async ({ game }) => {
      await game.seatKeyboardPlayer(0);
      await game.seatKeyboardPlayer(1);
      await game.startMatch();
      await game.advanceSim(60); // settle on the ground first

      const grounded = (await game.player(seat)).y;
      await game.page.keyboard.down(map.jump);
      await game.advanceSim(12);
      const airborne = (await game.player(seat)).y;
      await game.page.keyboard.up(map.jump);
      // Canvas y grows downward, so up is a smaller y.
      expect(airborne, `${label} should leave the ground when ${map.jump} is held`).toBeLessThan(grounded);
    });

    test(`${label} blocks`, async ({ game }) => {
      await game.seatKeyboardPlayer(0);
      await game.seatKeyboardPlayer(1);
      await game.startMatch();
      await game.advanceSim(30);

      await game.page.keyboard.down(map.block);
      await game.advanceSim(6);
      const blocking = await game.read(i => {
        const p = globalThis.HS.players[i];
        return { blocking: !!(p.input?.block), blockCdUntil: p.blockCdUntil };
      }, seat);
      await game.page.keyboard.up(map.block);
      expect(blocking.blocking, `${label} should register a block while ${map.block} is held`).toBe(true);
    });
  }

  test('losing focus drops every held key', async ({ game }) => {
    await game.seatKeyboardPlayer(0);
    await game.seatKeyboardPlayer(1);
    await game.startMatch();
    await game.page.keyboard.down(KEYS_A.right);
    await game.advanceSim(10);
    // A wizard that keeps walking after you alt-tab walks into the lava.
    await game.read(() => dispatchEvent(new Event('blur')));
    await game.advanceSim(2);
    expect(await game.read(() => globalThis.HS.keys[Object.keys(globalThis.HS.keys)[0]] === true &&
      Object.values(globalThis.HS.keys).some(Boolean))).toBe(false);
    await game.page.keyboard.up(KEYS_A.right);
  });
});

test.describe('mouse control', () => {
  test('moving the mouse aims wizard 1', async ({ game }) => {
    await game.seatKeyboardPlayer(0);
    await game.addBot(1);
    await game.startMatch();
    await game.advanceSim(20);

    await game.aimAt(200, 200);
    await game.advanceSim(4);
    const up = (await game.player(0)).y !== null ? await game.read(() => globalThis.HS.players[0].aimAngle) : null;
    await game.aimAt(1100, 650);
    await game.advanceSim(4);
    const down = await game.read(() => globalThis.HS.players[0].aimAngle);
    expect(up).not.toBe(down);
    expect(await game.read(() => globalThis.HS.mouse.present)).toBe(true);
  });

  test('a left click casts wizard 1s first slot', async ({ game }) => {
    await game.seatKeyboardPlayer(0);
    await game.addBot(1);
    await game.startMatch();
    await game.advanceSim(30);
    await game.grantSpell('fireball', { slot: 0, playerIndex: 0 });

    await game.aimAt(900, 400);
    await game.advanceSim(2);
    const before = await game.lastCastAt(0);
    await game.page.mouse.down();
    await game.advanceSim(4);
    await game.page.mouse.up();
    expect(await game.lastCastAt(0), 'a left click should have cast the slot-A spell').toBeGreaterThan(before);
  });

  test('a right click casts wizard 1s second slot', async ({ game }) => {
    await game.seatKeyboardPlayer(0);
    await game.addBot(1);
    await game.startMatch();
    await game.grantSpell('fireball', { slot: 1, playerIndex: 0 });

    await game.aimAt(900, 400);
    await game.advanceSim(2);
    const before = await game.lastCastAt(1);
    await game.page.mouse.down({ button: 'right' });
    await game.advanceSim(4);
    await game.page.mouse.up({ button: 'right' });
    expect(await game.lastCastAt(1), 'a right click should have cast the slot-B spell').toBeGreaterThan(before);
  });
});

test.describe('gamepad control', () => {
  test('any button on a fresh pad seats a wizard', async ({ page, errors }) => {
    void errors;
    await installFakeGamepads(page);
    const game = new GamePage(page);
    await game.boot();

    expect(await game.playerCount()).toBe(0);
    await game.read(() => globalThis.__pad.plug(0));
    await padPress(game, [0]);
    await game.waitFor(() => globalThis.HS.players.length === 1, { label: 'the pad wizard to sit down' });
    expect(await game.read(() => globalThis.HS.players[0].controller.index)).toBe(0);
  });

  test('a joined pad runs the lobby without a keyboard', async ({ page, errors }) => {
    void errors;
    await installFakeGamepads(page);
    const game = new GamePage(page);
    await game.boot();
    await game.read(() => globalThis.__pad.plug(0));
    await padPress(game, [0]);
    await game.waitFor(() => globalThis.HS.players.length === 1, { label: 'the pad wizard' });

    await padPress(game, [8]); // BACK — add a bot
    await game.waitFor(() => globalThis.HS.players.length === 2, { label: 'the bot the pad asked for' });

    const wins = (await game.state()).winsNeeded;
    await padPress(game, [12]); // d-pad up — win target +
    expect((await game.state()).winsNeeded).toBe(wins + 1);
    await padPress(game, [13]); // d-pad down — win target -
    expect((await game.state()).winsNeeded).toBe(wins);

    await padPress(game, [2]); // X — versus / wave survival
    expect((await game.state()).mode).toBe('wave');
  });

  test('Y opens the letter ribbon and the pad spells out a name', async ({ page, errors }) => {
    void errors;
    await installFakeGamepads(page);
    const game = new GamePage(page);
    await game.boot();
    await game.read(() => globalThis.__pad.plug(0));
    await padPress(game, [0]);
    await game.waitFor(() => globalThis.HS.players.length === 1, { label: 'the pad wizard' });

    await padPress(game, [3]); // Y — name your wizard
    await game.waitFor(() => !!globalThis.HS.nameEdit, { label: 'the letter ribbon' });
    expect(await game.read(() => globalThis.HS.nameEdit.pad)).toBe(0);

    const alphabet = manifest.constants.PAD_ALPHABET;
    await padPress(game, [15]);           // ▶ — next letter
    await padPress(game, [0]);            // A — append it
    expect(await game.nameEditBuffer()).toBe(alphabet[1]);
    await padPress(game, [1]);            // B — backspace
    expect(await game.nameEditBuffer()).toBe('');

    await padPress(game, [0]);            // append the first letter again
    await padPress(game, [9]);            // START — confirm
    await game.waitFor(() => !globalThis.HS.nameEdit, { label: 'the ribbon to close' });
    expect((await game.player(0)).name).toBe(alphabet[1]);
  });

  test('the left stick and d-pad both walk a pad wizard', async ({ page, errors }) => {
    void errors;
    await installFakeGamepads(page);
    const game = new GamePage(page);
    await game.boot();
    await game.read(() => globalThis.__pad.plug(0));
    await padPress(game, [0]);
    await game.waitFor(() => globalThis.HS.players.length === 1, { label: 'the pad wizard' });
    await padPress(game, [8]); // a bot to fight
    await game.waitFor(() => globalThis.HS.players.length === 2, { label: 'the bot' });
    await game.startMatch();
    await game.advanceSim(30);

    const start = (await game.player(0)).x;
    await padHold(game, { axes: [1, 0, 0, 0], ticks: 40 }); // stick right
    const stick = (await game.player(0)).x;
    expect(stick, 'the left stick should walk the wizard right').toBeGreaterThan(start);

    await padHold(game, { buttons: [14], ticks: 50 });      // d-pad left
    expect((await game.player(0)).x, 'the d-pad should walk the wizard left').toBeLessThan(stick);
  });

  test('unplugging a pad mid-match does not crash the game', async ({ page, errors }) => {
    void errors;
    await installFakeGamepads(page);
    const game = new GamePage(page);
    await game.boot();
    await game.read(() => globalThis.__pad.plug(0));
    await padPress(game, [0]);
    await game.waitFor(() => globalThis.HS.players.length === 1, { label: 'the pad wizard' });
    await padPress(game, [8]);
    await game.waitFor(() => globalThis.HS.players.length === 2, { label: 'the bot' });
    await game.startMatch();

    await game.read(() => globalThis.__pad.unplug(0));
    await game.advanceSim(120);
    expect((await game.state()).state).not.toBe(undefined);
  });
});
