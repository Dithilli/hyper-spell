// 03-lobby — sitting down, setting up, and getting out of the lobby.
//
// Every key here is a documented control from the README ("Press E, Enter, or
// any gamepad button to join; B adds an AI bot; Space to fight; 1-9 sets the win
// target"), so a break in this file is a break in the instructions the game
// ships with.
import { test, expect } from '../support/fixtures.js';

test.describe('seating wizards', () => {
  test('E seats a wizard at the first keyboard', async ({ game }) => {
    expect(await game.playerCount()).toBe(0);
    await game.seatKeyboardPlayer(0);
    expect(await game.playerCount()).toBe(1);
    const p = await game.player(0);
    expect(p.name).toBeTruthy();
    expect(p.hp).toBe(150); // MAX_HP
    expect(p.alive).toBe(true);
  });

  test('both keyboard seats can be taken', async ({ game }) => {
    await game.seatKeyboardPlayer(0);
    await game.seatKeyboardPlayer(1);
    expect(await game.playerCount()).toBe(2);
    const [a, b] = await game.players();
    expect(a.color).not.toBe(b.color); // slot identity, and it must be visible
  });

  test('one keyboard seat cannot be taken twice', async ({ game }) => {
    await game.seatKeyboardPlayer(0);
    await game.press('KeyE');
    await game.press('KeyE');
    expect(await game.playerCount()).toBe(1);
  });

  test('sitting down opens that wizard a name editor', async ({ game }) => {
    await game.seatKeyboardPlayer(0, { confirmName: false });
    expect(await game.nameEditOpen()).toBe(true);
  });
});

test.describe('naming a wizard', () => {
  test('typed letters land in the name and are remembered', async ({ game }) => {
    await game.seatKeyboardPlayer(0, { confirmName: false });
    await game.type('MERLIN');
    expect(await game.nameEditBuffer()).toBe('MERLIN');
    await game.press('Enter');
    await game.waitFor(() => !globalThis.HS.nameEdit, { label: 'the editor to close' });
    expect((await game.player(0)).name).toBe('MERLIN');
    expect(await game.read(() => localStorage.getItem('hs-name-0'))).toBe('MERLIN');
  });

  test('backspace deletes and escape abandons the edit', async ({ game }) => {
    await game.seatKeyboardPlayer(0, { confirmName: false });
    await game.type('MERLINX');
    await game.press('Backspace');
    expect(await game.nameEditBuffer()).toBe('MERLIN');
    await game.press('Escape');
    expect(await game.nameEditOpen()).toBe(false);
  });

  test('a name stops at 12 characters', async ({ game }) => {
    await game.seatKeyboardPlayer(0, { confirmName: false });
    await game.type('ABCDEFGHIJKLMNOPQRST');
    expect((await game.nameEditBuffer()).length).toBe(12);
  });

  test('the lobby shortcuts are deaf while a name is being typed', async ({ game }) => {
    await game.seatKeyboardPlayer(0, { confirmName: false });
    const wins = (await game.state()).winsNeeded;
    await game.type('B3M'); // add-bot, win-target, mode-toggle if they leaked
    expect(await game.playerCount()).toBe(1);
    expect((await game.state()).winsNeeded).toBe(wins);
    expect((await game.state()).mode).toBe('versus');
    expect(await game.nameEditBuffer()).toBe('B3M');
  });
});

test.describe('bots', () => {
  test('B adds a bot with a name of its own', async ({ game }) => {
    await game.addBot();
    expect(await game.playerCount()).toBe(1);
    expect((await game.player(0)).name).toBeTruthy();
  });

  test('bots fill up to the eight-wizard cap and stop', async ({ game }) => {
    await game.addBot(8);
    expect(await game.playerCount()).toBe(8); // MAX_PLAYERS
    await game.press('KeyB');
    await game.press('KeyB');
    expect(await game.playerCount()).toBe(8);
  });

  test('every wizard at the table has a distinct name and colour', async ({ game }) => {
    await game.addBot(8);
    const players = await game.players();
    expect(new Set(players.map(p => p.name)).size).toBe(8);
    expect(new Set(players.map(p => p.color)).size).toBe(8);
  });
});

test.describe('match settings', () => {
  test('1-9 set the win target', async ({ game }) => {
    for (const n of [1, 3, 7, 9]) {
      await game.setWins(n);
      expect((await game.state()).winsNeeded).toBe(n);
    }
  });

  test('+ and - nudge the win target and stop at the ends', async ({ game }) => {
    await game.setWins(1);
    await game.press('Minus');
    expect((await game.state()).winsNeeded, 'the win target must never fall below 1').toBe(1);

    await game.setWins(9);
    for (let i = 0; i < 15; i++) await game.press('Equal');
    expect((await game.state()).winsNeeded, 'the win target is capped at 20').toBe(20);
  });

  test('M toggles wave survival and back', async ({ game }) => {
    expect((await game.state()).mode).toBe('versus');
    await game.toggleMode();
    expect((await game.state()).mode).toBe('wave');
    await game.toggleMode();
    expect((await game.state()).mode).toBe('versus');
  });
});

test.describe('starting a match', () => {
  test('SPACE does nothing with an empty lobby', async ({ game }) => {
    await game.press('Space');
    await game.advance(500);
    expect((await game.state()).state).toBe('LOBBY');
  });

  test('versus needs two wizards', async ({ game }) => {
    await game.addBot(1);
    await game.press('Space');
    await game.advance(500);
    expect((await game.state()).state, 'one wizard cannot fight a versus round').toBe('LOBBY');

    await game.addBot(1);
    await game.startMatch();
    expect((await game.state()).state).toBe('PLAY');
  });

  test('wave survival starts with a single wizard', async ({ game }) => {
    await game.toggleMode();
    await game.addBot(1);
    await game.startMatch();
    expect((await game.state()).state).toBe('PLAY');
    expect((await game.state()).mode).toBe('wave');
  });

  test('R returns a live match to the lobby with the scores wiped', async ({ game }) => {
    await game.startRoundWithBots(2);
    await game.advanceSim(60);
    await game.read(() => { globalThis.HS.players[0].roundWins = 3; });
    await game.reset();
    expect((await game.state()).state).toBe('LOBBY');
    expect((await game.players()).every(p => p.roundWins === 0)).toBe(true);
    expect(await game.playerCount(), 'a reset keeps the wizards, it only clears the match').toBe(2);
  });

  test('the mode cannot be changed mid-match', async ({ game }) => {
    await game.startRoundWithBots(2);
    await game.press('KeyM');
    await game.advance(200);
    expect((await game.state()).mode).toBe('versus');
  });
});
