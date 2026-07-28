// 05-match-flow — a whole match, from the first round to the winner's screen.
//
// "Last wizard standing wins the round, first to N rounds wins the match" is the
// game's entire premise (README:3). This spec is that sentence, executed.
import { test, expect } from '../support/fixtures.js';

test.describe('a round', () => {
  test('starts with every wizard alive, whole, and apart', async ({ game }) => {
    await game.startRoundWithBots(4);
    const players = await game.players();
    expect(players).toHaveLength(4);
    expect(players.every(p => p.alive)).toBe(true);
    expect(players.every(p => p.hp === 150)).toBe(true);
    // Spawning four wizards on one point would make round one a pile-up.
    expect(new Set(players.map(p => Math.round(p.x))).size).toBeGreaterThan(1);
  });

  test('opens on a named map with a banner announcing it', async ({ game }) => {
    await game.addBot(2);
    await game.press('Space');
    await game.waitFor(() => globalThis.HS.game.state === 'PLAY', { label: 'the round' });
    const mapName = await game.read(() => globalThis.HS.currentMap.def.name);
    expect((await game.banner()).text).toBe(mapName);
  });

  test('holds casting until the FIGHT countdown elapses', async ({ game }) => {
    // A real hand on a real key: p.input is rewritten from the controller poll
    // every tick, so setting it directly would be overwritten before it is read.
    await game.seatKeyboardPlayer(0);
    await game.addBot(1);
    await game.press('Space');
    await game.waitFor(() => globalThis.HS.game.state === 'PLAY', { label: 'the round' });
    await game.grantSpell('fireball', { slot: 0, playerIndex: 0 });

    const before = await game.lastCastAt(0);
    await game.page.keyboard.down('KeyE');
    await game.advanceSim(10); // still inside the 1.1s countdown
    expect(await game.lastCastAt(0), 'a spell must not fire before FIGHT').toBe(before);

    await game.awaitFight();
    await game.advanceSim(4);
    await game.page.keyboard.up('KeyE');
    expect(await game.lastCastAt(0), 'the spell should fire once FIGHT lands').toBeGreaterThan(before);
  });

  test('ends when one wizard is left, and credits the survivor', async ({ game }) => {
    await game.startRoundWithBots(2);
    expect((await game.players()).every(p => p.roundWins === 0)).toBe(true);

    await game.kill(0);
    await game.waitFor(() => globalThis.HS.game.state === 'ROUND_END', { label: 'the round to end' });

    const players = await game.players();
    expect(players[0].alive).toBe(false);
    expect(players[1].roundWins, 'the last wizard standing takes the round').toBe(1);
    expect(await game.read(() => globalThis.HS.game.winner?.name)).toBe(players[1].name);
    expect((await game.banner()).text).toContain(players[1].name);
  });

  test('a mutual wipe is a draw, and nobody scores', async ({ game }) => {
    await game.startRoundWithBots(2);
    await game.kill(0);
    await game.kill(1);
    await game.waitFor(() => globalThis.HS.game.state === 'ROUND_END', { label: 'the round to end' });
    expect(await game.read(() => globalThis.HS.game.winner)).toBe(null);
    expect((await game.players()).every(p => p.roundWins === 0)).toBe(true);
    expect((await game.banner()).text).toBe('DRAW');
  });

  test('a wizard with three others still alive does not end the round', async ({ game }) => {
    await game.startRoundWithBots(4);
    await game.kill(0);
    await game.advanceSim(120); // well past the 650ms checkRoundEnd delay
    expect((await game.state()).state).toBe('PLAY');
  });

  test('the next round starts on a different map with everyone revived', async ({ game }) => {
    await game.setWins(5);
    await game.startRoundWithBots(2);
    const firstMap = (await game.state()).mapIndex;

    await game.kill(0);
    await game.waitFor(() => globalThis.HS.game.state === 'ROUND_END', { label: 'the round to end' });
    await game.waitFor(() => globalThis.HS.game.state === 'PLAY', { timeoutMs: 40_000, label: 'the next round' });

    expect((await game.state()).mapIndex, 'the same map twice running is a bug').not.toBe(firstMap);
    expect((await game.players()).every(p => p.alive && p.hp === 150)).toBe(true);
    expect((await game.state()).totalRounds).toBe(2);
  });

  test('a fresh round hands out fresh spell slots', async ({ game }) => {
    await game.setWins(5);
    await game.startRoundWithBots(2);
    await game.grantSpell('fireball', { slot: 0, playerIndex: 0 });
    await game.kill(1);
    // The round is ALREADY 'PLAY', so wait for it to end before waiting for the
    // next one — otherwise this passes instantly on the round it meant to leave.
    await game.waitFor(() => globalThis.HS.game.state === 'ROUND_END', { label: 'this round to end' });
    await game.waitFor(() => globalThis.HS.game.state === 'PLAY', { timeoutMs: 40_000, label: 'the next round' });
    // startRound clears every wizard's spells; carrying a tome across rounds
    // would compound an early lead into an unloseable one.
    expect(await game.read(() => globalThis.HS.players[0].slots.filter(Boolean).length)).toBe(0);
  });
});

test.describe('a match', () => {
  test('ends in victory when a wizard reaches the win target', async ({ game }) => {
    await game.addBot(2);
    await game.setWins(1);
    await game.startMatch();

    await game.kill(0);
    await game.waitFor(() => globalThis.HS.game.state === 'VICTORY', { timeoutMs: 40_000, label: 'the victory screen' });
    const winner = await game.read(() => globalThis.HS.game.winner?.name);
    expect(winner).toBe((await game.players())[1].name);
    expect((await game.players())[1].roundWins).toBe(1);
  });

  test('is played to a target of three, round by round', async ({ game }) => {
    await game.addBot(2);
    await game.setWins(3);
    await game.startMatch();

    // The bot in seat 1 wins every round; the match must take exactly three.
    //
    // The kill lands the moment the round goes live, deliberately. Sitting
    // through the FIGHT countdown first leaves a window in which seat 0 can fall
    // in the lava on its own — the round then resolves without this test's kill,
    // and the tally it is trying to check drifts.
    for (let round = 1; round <= 3; round++) {
      await game.waitFor(() => globalThis.HS.game.state === 'PLAY', { timeoutMs: 40_000, label: `round ${round}` });
      await game.kill(0);
      await game.waitFor(() => globalThis.HS.game.state !== 'PLAY', { timeoutMs: 40_000, label: `round ${round} to resolve` });
      expect((await game.players())[1].roundWins).toBe(round);
      if (round < 3) expect((await game.state()).state).toBe('ROUND_END');
    }
    await game.waitFor(() => globalThis.HS.game.state === 'VICTORY', { timeoutMs: 40_000, label: 'the victory screen' });
    expect((await game.state()).totalRounds).toBe(3);
  });

  test('the victory screen has awards and a kill feed', async ({ game }) => {
    await game.addBot(2);
    await game.setWins(1);
    await game.startMatch();
    // Credited to seat 1, so the kill has a killer. Damage from nowhere is "the
    // arena did it": no kill stat, no killer in the feed, and no award to win.
    await game.damage(0, 200, { from: 1 });
    await game.waitFor(() => globalThis.HS.game.state === 'VICTORY', { timeoutMs: 40_000, label: 'the victory screen' });

    const awards = await game.read(() => globalThis.HS.computeAwards());
    expect(awards.length, 'a credited kill should win MOST DANGEROUS at least').toBeGreaterThan(0);
    expect(awards.map(a => a.t)).toContain('MOST DANGEROUS');
    expect(awards[0].n).toBe((await game.players())[1].name);
    expect(await game.read(() => globalThis.HS.killFeedLines.length)).toBeGreaterThan(0);
    expect(await game.read(() => Object.keys(globalThis.HS.matchStats).length)).toBeGreaterThan(0);
  });

  test('R from the victory screen returns everyone to the lobby', async ({ game }) => {
    await game.addBot(2);
    await game.setWins(1);
    await game.startMatch();
    await game.kill(0);
    await game.waitFor(() => globalThis.HS.game.state === 'VICTORY', { timeoutMs: 40_000, label: 'the victory screen' });

    await game.reset();
    expect((await game.state()).state).toBe('LOBBY');
    expect((await game.players()).every(p => p.roundWins === 0)).toBe(true);
    expect(await game.playerCount()).toBe(2);
  });

  test('bots left alone fight a real round without anyone touching them', async ({ game }) => {
    // No kill helper here: this is the honest version, and what it proves is
    // that the AI, the physics, the tome drops and the round flow all work
    // together unattended.
    await game.addBot(4);
    await game.setWins(1);
    await game.startMatch();

    await game.waitFor(() => globalThis.HS.players.some(p => p.hp < 150) || globalThis.HS.game.state !== 'PLAY',
      { timeoutMs: 90_000, stepMs: 250, label: 'bots to draw blood' });
    const hurt = (await game.players()).filter(p => p.hp < 150).length;
    expect(hurt, 'four bots in an arena should be hurting each other').toBeGreaterThan(0);
  });
});
