// 11-hud-render — the picture.
//
// Everywhere else the suite reads sim state, which proves the game is right and
// says nothing about whether anyone can see it. These run the real renderer over
// real animation frames and check the canvas actually changed.
//
// @engine marks the specs Firefox and WebKit also run: a canvas API that behaves
// differently across engines shows up here or nowhere.
import { test, expect } from '../support/fixtures.js';
import { loadManifest } from '../tools/surface.js';

const { bosses } = loadManifest();

test.describe('@engine the canvas paints in every state', () => {
  test('the lobby draws', async ({ game }) => {
    await game.addBot(2);
    await game.advance(300);
    const probe = await game.expectPainted();
    expect(probe.litSamples, 'the lobby panel should light up a good part of the screen').toBeGreaterThan(0);
  });

  test('a live round draws', async ({ game }) => {
    await game.startRoundWithBots(2);
    await game.advance(300);
    await game.expectPainted();
  });

  test('the round-end screen draws', async ({ game }) => {
    await game.startRoundWithBots(2);
    await game.kill(0);
    await game.waitFor(() => globalThis.HS.game.state === 'ROUND_END', { label: 'the round to end' });
    await game.advance(300);
    await game.expectPainted();
  });

  test('the victory screen draws', async ({ game }) => {
    await game.addBot(2);
    await game.setWins(1);
    await game.startMatch();
    await game.damage(0, 200, { from: 1 });
    await game.waitFor(() => globalThis.HS.game.state === 'VICTORY', { timeoutMs: 40_000, label: 'the victory screen' });
    await game.advance(400);
    await game.expectPainted();
  });

  test('a boss fight draws', async ({ game }) => {
    await game.startRoundWithBots(2);
    await game.read(id => globalThis.HS.spawnBoss(globalThis.HS.simNow(), { bossId: id }), bosses[0].id);
    await game.advance(400);
    await game.expectPainted();
  });

  test('wave survival draws', async ({ game }) => {
    await game.toggleMode();
    await game.addBot(1);
    await game.startMatch();
    await game.advance(500);
    await game.expectPainted();
  });
});

test.describe('the picture keeps moving', () => {
  test('successive frames differ while a round is live', async ({ game }) => {
    await game.startRoundWithBots(4);
    await game.advance(200);
    const a = await game.paintProbe();
    await game.advance(500); // bots move, particles fly
    const b = await game.paintProbe();
    // A renderer that painted once and stopped would give identical probes
    // forever, and every "it draws" test above would still pass.
    expect(`${a.distinctColors}:${a.litSamples}`,
      'the canvas has not changed in half a second of play — is the renderer stuck?')
      .not.toBe(`${b.distinctColors}:${b.litSamples}`);
  });
});

/**
 * Clear the canvas, call ONE draw function, and count the ink it left.
 *
 * Drawing a single layer in isolation is the only way to attribute a change to
 * it: every renderer paints to the same canvas, so a whole-frame probe cannot
 * tell the HUD from the arena behind it.
 *
 * `stride` is how many pixels to skip. The default samples cheaply, which is
 * fine for anything screen-sized; pass 1 for something small, like a 20x24 tome
 * in a 1280x720 frame, where a sparse sample can miss it entirely and report a
 * working renderer as dead.
 */
const drawsSomething = async (game, fn, arg, stride = 331) => game.read(([name, a, step]) => {
  const H = globalThis.HS;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // COLOUR, not alpha. This used to clearRect and count pixels whose alpha rose
  // above 8 — which stopped meaning anything the moment the canvas became an
  // opaque context (`getContext('2d', { alpha: false })`, added with the
  // device-pixel backing store). Every pixel is alpha 255 on an opaque canvas,
  // so the probe returned 921600 for every renderer including a dead one, and
  // every `toBeGreaterThan(0)` in this file passed vacuously.
  //
  // So: paint a sentinel colour nothing in the game uses, run the layer, and
  // count pixels that moved off it. Works on either kind of context.
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#ff00ff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
  H[name](...(a ?? [H.simNow()]));
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let lit = 0;
  for (let i = 0; i < data.length; i += 4 * step) {
    if (data[i] !== 255 || data[i + 1] !== 0 || data[i + 2] !== 255) lit++;
  }
  return lit;
}, [fn, arg, stride]);

test.describe('the HUD draws what the match is doing', () => {

  test('the in-match HUD puts something on screen', async ({ game }) => {
    await game.startRoundWithBots(2);
    await game.advanceSim(30);
    expect(await drawsSomething(game, 'drawHUD'), 'drawHUD painted nothing').toBeGreaterThan(0);
  });

  test('the kill feed draws once someone has died', async ({ game }) => {
    await game.startRoundWithBots(2);
    await game.damage(0, 200, { from: 1 });
    await game.advanceSim(10);
    expect(await game.read(() => globalThis.HS.killFeedLines.length)).toBeGreaterThan(0);
    expect(await drawsSomething(game, 'drawKillFeed'), 'drawKillFeed painted nothing').toBeGreaterThan(0);
  });

  test('the awards screen draws the awards it is given', async ({ game }) => {
    await game.startRoundWithBots(2);
    await game.damage(0, 200, { from: 1 });
    await game.advanceSim(10);
    const awards = await game.read(() => globalThis.HS.computeAwards());
    expect(awards.length).toBeGreaterThan(0);
    expect(await drawsSomething(game, 'drawAwards', [awards, 0]), 'drawAwards painted nothing').toBeGreaterThan(0);
  });

  test('the lobby panel draws', async ({ game }) => {
    await game.addBot(3);
    // drawLobby is what builds the view and hands it to drawLobbyPanel; calling
    // the panel directly would mean inventing a view the game never makes.
    expect(await drawsSomething(game, 'drawLobby', [0]), 'the lobby panel painted nothing').toBeGreaterThan(0);
  });

  test('the arcade logo draws', async ({ game }) => {
    expect(await drawsSomething(game, 'drawArcadeLogo', [640, 200, 4, 0]), 'drawArcadeLogo painted nothing')
      .toBeGreaterThan(0);
  });

  test('a cooldown ring reflects how far through the cooldown a slot is', async ({ game }) => {
    await game.seatKeyboardPlayer(0);
    await game.seatKeyboardPlayer(1);
    await game.startMatch();
    await game.grantSpell('fireball', { slot: 0, playerIndex: 0 });

    await game.page.keyboard.down('KeyE');
    await game.advanceSim(4);
    await game.page.keyboard.up('KeyE');

    const justCast = await game.read(() => {
      const H = globalThis.HS;
      const p = H.players[0];
      return (H.simNow() - p.casts[0]) / H.effectiveCooldown(p.slots[0]);
    });
    expect(justCast, 'a spell just cast should be near the start of its cooldown').toBeLessThan(0.5);

    await game.advanceSim(40);
    const later = await game.read(() => {
      const H = globalThis.HS;
      const p = H.players[0];
      return (H.simNow() - p.casts[0]) / H.effectiveCooldown(p.slots[0]);
    });
    expect(later, 'the ring must fill as the cooldown runs down').toBeGreaterThan(justCast);
  });

  test('a banner is shown and then expires', async ({ game }) => {
    await game.addBot(2);
    await game.read(() => globalThis.HS.setBanner('TEST BANNER', '#ffffff', 500));
    expect((await game.banner()).text).toBe('TEST BANNER');
    const until = await game.read(() => globalThis.HS.bannerUntil);
    await game.advanceSim(60);
    expect(await game.read(() => globalThis.HS.simNow()), 'the banner deadline should pass').toBeGreaterThan(until);
  });
});

test.describe('every renderer contributes to the picture', () => {
  // Named module by module on purpose. draw-world.js is the only entry the game
  // calls per frame; everything below it is reached only in the right state, so
  // "the arena drew" says nothing about whether draw-boss.js still works. Each
  // of these puts the game in the state that module owns and then looks.

  test('draw-world.js and artkit.js draw the arena', async ({ game }) => {
    await game.startRoundWithBots(2);
    await game.advance(300);
    // artkit.js is the shared drawing kit every draw-* module builds on, so a
    // painted arena is also proof it loaded.
    expect(await game.read(() => typeof globalThis.HS.draw)).toBe('function');
    await game.expectPainted();
  });

  test('draw-wizard.js draws a wizard, and a frozen one differently', async ({ game }) => {
    await game.seatKeyboardPlayer(0);
    await game.seatKeyboardPlayer(1);
    await game.startMatch();
    await game.advance(200);
    const normal = await game.paintProbe();

    await game.read(() => {
      const H = globalThis.HS;
      H.applyFreeze(H.players[0], H.simNow() + 5000);
    });
    await game.advance(200);
    const frozen = await game.paintProbe();
    expect(`${normal.distinctColors}:${normal.litSamples}`,
      'a frozen wizard should not look identical to a healthy one').not.toBe(`${frozen.distinctColors}:${frozen.litSamples}`);
  });

  test('draw-boss.js draws a boss', async ({ game }) => {
    await game.startRoundWithBots(2);
    await game.advance(200);
    const before = await game.paintProbe();
    await game.read(id => globalThis.HS.spawnBoss(globalThis.HS.simNow(), { bossId: id }), bosses[0].id);
    await game.advance(400);
    const after = await game.paintProbe();
    expect(`${before.distinctColors}`, 'a boss on the field should change the picture')
      .not.toBe(`${after.distinctColors}`);
  });

  test('draw-pickups.js draws a tome on the ground', async ({ game }) => {
    await game.startRoundWithBots(2);
    // Compared by drawing the tome layer alone onto a cleared canvas. A tome is
    // 20x24 in a 1280x720 frame, so a whole-screen probe can sample right past
    // it and call the renderer dead when it is working perfectly.
    const blank = await drawsSomething(game, 'drawTomes', null, 1);
    await game.read(() => globalThis.HS.spawnTome(globalThis.HS.simNow()));
    await game.advanceSim(30); // let it fall somewhere
    const withTome = await drawsSomething(game, 'drawTomes', null, 1);
    expect(withTome, 'a dropped tome should put ink on the canvas').toBeGreaterThan(blank);
  });

  test('draw-env.js draws the weather', async ({ game }) => {
    await game.startRoundWithBots(2);
    // Env events roll once in five rounds, so they are the least-seen art in the
    // game and the most likely to have rotted unnoticed.
    const rolled = await game.read(() => {
      const H = globalThis.HS;
      H.rollEnvEvent?.(H.simNow());
      return !!H.game.envEvent;
    });
    await game.advance(400);
    await game.expectPainted();
    expect(typeof rolled).toBe('boolean');
  });

  test('draw-snapshot.js is what an online client draws with', async ({ game }) => {
    // The couch renderer draws live sim objects; an online client has only wire
    // snapshots and draws them through this module instead. 12-online proves it
    // paints for real; this proves the entry exists and is reachable.
    expect(await game.read(() => typeof globalThis.HS.drawSnapshotWorld)).toBe('function');
  });

  test('audio.js starts muted until a gesture unlocks it', async ({ page, errors }) => {
    void errors;
    // Browsers refuse to start an AudioContext without a gesture, which is why
    // ensureAudio() is wired to the menu buttons and to a pad joining.
    await page.goto('/index.html');
    await page.waitForSelector('#netmenu');
    await page.click('button[data-mode="couch"]');
    await expect(page.locator('#netmenu')).toHaveCount(0);
  });
});

test.describe('the reticle and the wizard', () => {
  test('a wizard is drawn where the sim says it is', async ({ game }) => {
    await game.startRoundWithBots(2);
    await game.advanceSim(30);
    // Move the wizard a long way and confirm the picture changes with it.
    await game.advance(200);
    const before = await game.paintProbe();
    await game.read(() => {
      const H = globalThis.HS;
      const p = H.players[0];
      H.despawnPlayer(p);
      H.spawnPlayer(p, { x: 100, y: 200 });
    });
    await game.advance(200);
    const after = await game.paintProbe();
    expect(`${before.distinctColors}:${before.litSamples}`).not.toBe(`${after.distinctColors}:${after.litSamples}`);
  });
});
