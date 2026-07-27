// debug-globals.js — a compatibility surface for the dev harness pages.
//
// controller-test.html, shot.html, smoke-test.html, wave-play.html and
// wave-test.html drive the game from an inline <script> that names functions
// directly — free, back when every file was a classic script sharing one global
// scope. The bundle has no such scope, so the entry publishes the surface those
// pages use. Nothing in src/ reads it: it is a dev affordance, not an API, and
// the pages are its only consumers.
import * as world from '../sim/world.js';
import * as time from '../sim/time.js';
import * as rng from '../sim/rng.js';
import * as fx from '../sim/fx.js';
import * as pace from '../sim/pace.js';
import * as sfxTable from '../sim/sfx.js';
import * as lobby from '../sim/lobby.js';
import * as awards from '../sim/awards.js';
import * as telemetry from '../sim/telemetry.js';
import * as match from '../sim/match.js';
import * as tick from '../sim/tick.js';
import * as snapshot from '../sim/snapshot.js';
import * as replay from '../sim/replay.js';
import * as events from '../sim/events.js';
import * as waves from '../sim/waves.js';
import * as pickups from '../sim/pickups.js';
import * as storage from '../sim/storage.js';
import * as lifecycle from '../sim/player/lifecycle.js';
import * as combat from '../sim/player/combat.js';
import * as status from '../sim/player/status.js';
import * as controllerMod from '../sim/player/controller.js';
import * as ghost from '../sim/player/ghost.js';
import * as spellCore from '../sim/spells/core.js';
import * as registry from '../sim/spells/registry.js';
import * as tiers from '../sim/spells/tiers.js';
import * as fusion from '../sim/spells/fusion.js';
import * as builders from '../sim/maps/builders.js';
import * as extras from '../sim/maps/extras.js';
import * as boss from '../sim/ai/boss.js';
import * as enemyAi from '../sim/ai/enemies.js';
import * as bot from '../sim/ai/bot.js';
import * as artkit from '../render/artkit.js';
import * as canvas from '../render/canvas.js';
import * as drawWorld from '../render/draw-world.js';
import * as hud from '../render/hud.js';
import * as drawWizard from '../render/draw-wizard.js';
import * as drawPickups from '../render/draw-pickups.js';
import * as drawEnv from '../render/draw-env.js';
import * as drawBoss from '../render/draw-boss.js';
import * as drawSnapshot from '../render/draw-snapshot.js';
import * as renderReplay from '../render/replay.js';
import * as audio from '../render/audio.js';
import * as keyboard from './input-keyboard.js';
import * as gamepad from './input-gamepad.js';
import * as join from './join.js';

const MODULES = [
  // time is published for the same reason the rest is: since simNow() became
  // the sim's only clock, a harness page that wants to move the game forward
  // has to advance the TICK. Mocking globalThis.performance.now no longer does
  // anything to sim state (wave-test.html and wave-play.html still do, and are
  // stale for it).
  world, time, rng, fx, pace, sfxTable, lobby, awards, telemetry, match, tick,
  snapshot, replay, events, waves, pickups, storage, lifecycle, combat, status,
  controllerMod, ghost, spellCore, registry, tiers, fusion, builders, extras,
  boss, enemyAi, bot, artkit, canvas, drawWorld, hud, drawWizard, drawPickups,
  drawEnv, drawBoss, drawSnapshot, renderReplay, audio, keyboard, gamepad, join,
];

export function installDebugGlobals() {
  const HS = {};
  for (const mod of MODULES) {
    for (const key of Object.keys(mod)) {
      // a live getter, so a page reading `game` or `currentMap` after a map
      // change sees the current value rather than a stale snapshot
      Object.defineProperty(HS, key, { get: () => mod[key], configurable: true, enumerable: true });
      if (!(key in globalThis)) {
        Object.defineProperty(globalThis, key, { get: () => mod[key], configurable: true });
      }
    }
  }
  globalThis.HS = HS;
}
