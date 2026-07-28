// join.js — joining and lobby input: keyboard/gamepad seat claiming, the
// on-screen name wheel, the lobby shortcuts, and the two demo secret-boss keys.
//
// js/game.js registered these listeners at script load; attachLobbyKeys() is now
// an explicit call the browser entry makes. The name-edit state itself lives in
// src/sim/lobby.js, because stepSim and the lobby panel both read it.
// simNow(), not the wall clock: everything this file timestamps is SIM state
// read back inside stepSim — nameEditEndAt (src/sim/tick.js:122), game.fightAt,
// the tome schedule and the boss's own beat. Sim time runs at paceScale() x
// real time, so a wall-clock stamp here would sit (1 - 0.85) x uptime in the
// sim's future and the lockout/banner would never expire.
import { simNow } from '../sim/time.js';
import { pick } from '../sim/rng.js';
import { netMode } from '../sim/net-mode.js';
import {
  nameEdit, setNameEdit, nameEditEndAt, setNameEditEndAt, cleanName, PAD_ALPHABET,
} from '../sim/lobby.js';
import { ensureAudio } from '../render/audio.js';
import { sfx } from '../sim/sfx.js';
import {
  game, setBanner, minPlayers, loadMap, setWins, toggleMode, resetMatch,
  beginFromLobby, joinPlayer, currentMap,
} from '../sim/match.js';
import { MAPS } from '../sim/maps/builders.js';
import {
  players, MAX_PLAYERS, clearSpells, despawnPlayer, spawnPlayer, spawnPointFor,
} from '../sim/player/lifecycle.js';
import { resetMatchStats } from '../sim/awards.js';
import { resetMatchTelemetry, resetTelemetry } from '../sim/telemetry.js';
import { clearReplay } from '../sim/replay.js';
import { scheduleTomes } from '../sim/pickups.js';
import { spawnBoss } from '../sim/ai/boss.js';
import { addBot } from '../sim/ai/bot.js';
import { kbControllers } from './input-keyboard.js';
import { GamepadController } from './input-gamepad.js';

export const assignedPads = new Set();
export const padPrev = {};
export const padBtnPrev = {}; // padIndex -> Set of button indices held last frame (lobby nav edges)

export function beginNameEdit(p, storeKey) {
  const saved = cleanName(localStorage.getItem(storeKey) || '');
  // the opening net menu already asked player 1 for a name — don't reopen a live
  // edit session in the lobby, where stray keypresses silently append letters
  if (storeKey === 'hs-name-0' && globalThis.nameSetViaMenu) {
    if (saved) p.name = saved;
    return;
  }
  setNameEdit({ p, storeKey, buffer: saved });
  if (nameEdit.buffer) p.name = nameEdit.buffer; // saved name applies even if they skip
}

export function beginPadNameEdit(p, padIndex) {
  const storeKey = `hs-name-pad-${padIndex}`;
  const saved = cleanName(localStorage.getItem(storeKey) || '');
  setNameEdit({ p, storeKey, buffer: saved, pad: padIndex, letter: 0 });
}
// drive the letter ribbon from a joined pad's edge-triggered buttons
export function padWheelInput(edge) {
  if (edge(14)) nameEdit.letter = (nameEdit.letter + PAD_ALPHABET.length - 1) % PAD_ALPHABET.length; // ◀
  if (edge(15)) nameEdit.letter = (nameEdit.letter + 1) % PAD_ALPHABET.length;                       // ▶
  if (edge(0) && nameEdit.buffer.length < 12) nameEdit.buffer = cleanName(nameEdit.buffer + PAD_ALPHABET[nameEdit.letter]); // A: append
  if (edge(1)) nameEdit.buffer = nameEdit.buffer.slice(0, -1); // B: backspace
  if (edge(9) || edge(3)) { // START / Y: confirm
    if (nameEdit.buffer) { nameEdit.p.name = nameEdit.buffer; localStorage.setItem(nameEdit.storeKey, nameEdit.buffer); }
    setNameEdit(null);
    setNameEditEndAt(simNow()); // brief lockout so the confirm press isn't reused to start
  }
}

// DEMO: drop straight into a solo fight against a named secret boss (T = THE
// RIZARD, Y = MANU). Made for showing Conor & Manu — joins you if the lobby's empty.
export function fightSecretBoss(id) {
  if (netMode === 'online') return;
  setNameEdit(null);
  if (players.length === 0) { kbControllers[0].assigned = true; joinPlayer(kbControllers[0]); } // WASD + mouse
  game.mode = 'versus';
  game.totalRounds = 0;
  clearReplay();
  resetMatchStats(); resetMatchTelemetry(); resetTelemetry();
  for (const p of players) p.roundWins = 0;
  let idx = 0, tries = 0;
  do { idx = Math.floor(Math.random() * MAPS.length); } while (MAPS[idx].cozy && ++tries < 60); // open arena
  loadMap(idx);
  for (const p of players) { clearSpells(p); despawnPlayer(p); spawnPlayer(p, spawnPointFor(p)); }
  game.state = 'PLAY';
  game.fightAt = simNow() + 900;
  game.fightShown = false;
  scheduleTomes(simNow());
  const bs = spawnBoss(simNow(), { bossId: id });
  setBanner('⚔  ' + (bs && bs.def ? bs.def.name : 'SECRET BOSS') + '  ⚔', bs && bs.def ? bs.def.color : '#ffd166', 1500, true);
}

export function scanJoins() {
  if (game.state === 'VICTORY' || game.state === 'RUN_OVER' || players.length >= MAX_PLAYERS) return;
  if (nameEdit || simNow() < nameEditEndAt + 350) return; // typing a name, not joining
  for (const kc of kbControllers) {
    if (kc.assigned) continue;
    if (kc.poll().castPressed) {
      kc.assigned = true;
      joinPlayer(kc);
      if (game.state === 'LOBBY') beginNameEdit(players[players.length - 1], `hs-name-${kc === kbControllers[0] ? 0 : 1}`);
    }
  }
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const pad of pads) {
    if (!pad || assignedPads.has(pad.index)) continue;
    const pressed = pad.buttons.some(b => b.pressed);
    const prev = padPrev[pad.index] || false;
    padPrev[pad.index] = pressed;
    if (pressed && !prev) {
      ensureAudio();
      assignedPads.add(pad.index);
      // seed the button-edge memory with the joining press so it isn't re-read
      // this frame as a lobby action (add-bot, name, etc.)
      padBtnPrev[pad.index] = new Set(pad.buttons.flatMap((b, i) => b.pressed ? [i] : []));
      joinPlayer(new GamepadController(pad.index));
    }
  }
}

// lobby navigation for already-joined pads, so a controller-only couch never
// needs the keyboard: Y names your wizard, BACK adds a bot, d-pad ± the win target.
export function scanLobbyPads() {
  if (game.state !== 'LOBBY') return;
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const pad of pads) {
    if (!pad || !assignedPads.has(pad.index)) continue; // only joined pads navigate
    const prev = padBtnPrev[pad.index] || new Set();
    const edge = b => !!pad.buttons[b]?.pressed && !prev.has(b);
    if (nameEdit && nameEdit.pad === pad.index) {
      padWheelInput(edge);
    } else if (!nameEdit) { // one name editor at a time; other pads wait their turn
      const owner = players.find(p => p.controller instanceof GamepadController && p.controller.index === pad.index);
      if (edge(3) && owner) beginPadNameEdit(owner, pad.index); // Y → name your wizard
      if (edge(8)) addBot();                                    // BACK → add a bot
      if (edge(2)) toggleMode();                                // X → versus / wave survival
      if (edge(12)) setWins(game.winsNeeded + 1);               // d-pad up → win target +
      if (edge(13)) setWins(game.winsNeeded - 1);               // d-pad down → win target -
    }
    padBtnPrev[pad.index] = new Set(pad.buttons.flatMap((b, i) => b.pressed ? [i] : []));
  }
}

// The two capture-phase keydown handlers js/game.js:220 and :280 installed at
// load. attachLobbyKeys() is what the browser entry calls instead.
export function attachLobbyKeys() {
  addEventListener('keydown', e => {
    if (!nameEdit) return;
    if (game.state !== 'LOBBY') { setNameEdit(null); return; }
    e.preventDefault();
    if (e.code === 'Enter' || e.code === 'NumpadEnter') {
      if (nameEdit.buffer) {
        nameEdit.p.name = nameEdit.buffer;
        localStorage.setItem(nameEdit.storeKey, nameEdit.buffer);
      }
      setNameEdit(null);
      setNameEditEndAt(simNow()); // brief join/start lockout so this keypress isn't reused
    } else if (e.code === 'Escape') {
      setNameEdit(null);
      setNameEditEndAt(simNow());
    } else if (e.code === 'Backspace') {
      nameEdit.buffer = nameEdit.buffer.slice(0, -1);
    } else if (e.key.length === 1 && nameEdit.buffer.length < 12) {
      nameEdit.buffer = cleanName(nameEdit.buffer + e.key);
    }
  }, true); // capture: swallow keys before the game shortcuts below see them

  addEventListener('keydown', e => {
    if (netMode === 'online' || nameEdit) return; // online, these become messages to the server
    if (e.code === 'KeyT') { fightSecretBoss('rizard'); return; } // demo: instant THE RIZARD fight
    if (e.code === 'KeyN') { fightSecretBoss('manu'); return; }   // demo: instant MANU fight (Y is reserved for naming)
    if (e.code === 'Space' && game.state === 'LOBBY' && players.length >= minPlayers()) beginFromLobby();
    if (e.code === 'KeyB' && game.state === 'LOBBY') addBot();
    if (e.code === 'KeyM' && game.state === 'LOBBY') toggleMode();
    if (e.code === 'KeyR') resetMatch();
    if (game.state === 'LOBBY' && /^Digit[1-9]$/.test(e.code)) setWins(+e.code.slice(5));
    if (game.state === 'LOBBY' && (e.code === 'Equal' || e.code === 'Minus')) setWins(game.winsNeeded + (e.code === 'Equal' ? 1 : -1));
  });
}
