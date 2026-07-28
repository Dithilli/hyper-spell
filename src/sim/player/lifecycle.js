// player/lifecycle.js — the roster: who exists, how they are built, where they
// spawn, and which spells they hold.
import { W, onWorldReset } from '../world.js';
import {
  addBody, createCircle, newCollisionGroup, removeBody, scaleBody,
  setAngle, setAngularVelocity, setFrictionAir, setPosition, setVelocity,
} from '../phys/facade.js';
import { simNow } from '../time.js';
import { spawnParticles, spawnText } from '../fx.js';
import { IDLE_INPUT } from '../input-contract.js';
import { currentMap } from '../match.js';
import { safeSpawnPoint } from '../maps/reach.js';
import { BASE_FRICTION_AIR, clearStatuses } from './status.js';

export const MAX_PLAYERS = 8;
export const FALL_SAFE_DROP = 440; // px of safe fall — a double jump drops ~350 from its apex
export const PLAYER_DEFS = [
  { name: 'P1', color: '#4ecdc4', hat: '#2a9d94' },
  { name: 'P2', color: '#ff6b81', hat: '#c44558' },
  { name: 'P3', color: '#ffd166', hat: '#d4a52f' },
  { name: 'P4', color: '#a55eea', hat: '#7d3fc4' },
  { name: 'P5', color: '#ff9f43', hat: '#c67a2e' },
  { name: 'P6', color: '#9acd32', hat: '#6b9023' },
  { name: 'P7', color: '#e8e8f0', hat: '#a8a8c0' },
  { name: 'P8', color: '#7f9cf5', hat: '#5a6fc2' },
];

export function spawnPointFor(p) {
  const spawns = currentMap.def.spawns;
  const base = spawns[p.slot % spawns.length];
  const jitter = p.slot >= spawns.length ? (p.slot - spawns.length + 1) * 26 * (p.slot % 2 ? 1 : -1) : 0;
  // The guarantee: never open a round somewhere you can't get out of. The
  // authored spot stands unless the drop is buried in geometry, falls straight
  // into the lava, or lands in a pocket walled off from the arena — see the
  // escape analysis in src/sim/maps/reach.js, which nudges or relocates as
  // little as it can, and keeps clear of the wizards already standing there.
  //
  // This replaces a groundInColumn() check that only asked "is there anything
  // solid below this x". That answers nothing about whether the wizard can
  // LEAVE where it lands, and nothing about what it hits on the way down.
  const busy = players.filter(q => q !== p && q.alive && q.body)
    .map(q => ({ x: q.body.position.x, y: q.body.position.y }));
  return safeSpawnPoint(currentMap, Math.max(40, Math.min(W - 40, base.x + jitter)), base.y, busy);
}

export const players = [];
export const gibs = new Set();

// wizards are beefier than the classic 100 so rounds run long enough to grab a
// few tomes, land a fusion, and actually SEE the rare spells before someone dies
export const MAX_HP = 150;

export function createPlayer(slot, controller) {
  const def = PLAYER_DEFS[slot];
  const p = {
    ...def, slot, controller,
    group: newCollisionGroup(),
    roundWins: 0, hp: MAX_HP,
    alive: false, facing: slot % 2 === 0 ? 1 : -1,
    walkPhase: 0, lastGround: 0, airJumps: 1,
    sizeScale: 1, megaCasts: 0, megaUntil: 0,
    frozenUntil: 0, wasFrozen: false, input: { ...IDLE_INPUT },
    // two spell slots (A, B), each with its own last-cast time; lastCastSlot is
    // the one most recently fired (drives the spellId/lastCast accessors below)
    slots: [null, null], casts: [0, 0], slotFilledAt: [0, 0], lastCastSlot: 0,
    slotCharges: [null, null], // hybrid fusion charges; null = a normal, limitless spell
  };
  // spellId/lastCast are accessors over the "primary" slot so the many existing
  // single-spell read-sites (telemetry attribution, HUD glow, mirrorcast, bots)
  // keep working. Writing spellId = null clears BOTH slots (disarm, round reset).
  Object.defineProperties(p, {
    spellId: {
      enumerable: true, configurable: true,
      get() { return p.slots[p.lastCastSlot] ?? p.slots[0] ?? p.slots[1] ?? null; },
      set(v) { if (v == null) { p.slots[0] = p.slots[1] = null; p.slotCharges[0] = p.slotCharges[1] = null; } else { p.slots[0] = v; p.slotCharges[0] = null; } },
    },
    lastCast: {
      enumerable: true, configurable: true,
      get() { return p.casts[p.lastCastSlot] ?? 0; },
      set(v) { p.casts[p.lastCastSlot] = v; },
    },
  });
  p.body = createCircle(0, -100, 15, {
    density: 0.004, friction: 0.05, frictionAir: 0.02, restitution: 0.2,
    label: 'player', collisionFilter: { group: p.group },
  });
  p.body.player = p;
  players.push(p);
  return p;
}

export function setPlayerScale(p, target) {
  const ratio = target / p.sizeScale;
  if (Math.abs(ratio - 1) < 0.01) return;
  scaleBody(p.body, ratio, ratio);
  p.sizeScale = target;
  spawnParticles(p.body.position.x, p.body.position.y, '#e8d5ff', 6, 3);
}

export function spawnPlayer(p, pos) {
  if (!p.alive) addBody(p.body);
  p.alive = true;
  p.hp = MAX_HP;
  p.airJumps = 1;
  p.fallPeak = 0;
  p.gravityLockUntil = 0;
  p.ghost = null;
  p.lastHitBy = null;
  clearStatuses(p);
  setPlayerScale(p, 1);
  setFrictionAir(p.body, BASE_FRICTION_AIR);
  setPosition(p.body, pos);
  setVelocity(p.body, { x: 0, y: 0 });
  setAngularVelocity(p.body, 0);
  setAngle(p.body, 0);
  spawnParticles(pos.x, pos.y, '#e8d5ff', 12, 5);
}

export function despawnPlayer(p) {
  if (!p.alive) return;
  removeBody(p.body);
  p.alive = false;
}

export function healPlayer(p, amt) {
  if (!p.alive) return;
  p.hp = Math.min(MAX_HP, p.hp + amt);
  spawnText(p.body.position.x, p.body.position.y - 34, `+${Math.round(amt)}`, '#7bd88f');
}

// put a picked-up spell into a slot: fill an empty one, else replace the oldest.
// Returns the slot index used (-1 if nothing could be replaced). Fusion (Phase 4b)
// hooks off the resulting pair.
export function addSpell(p, id) {
  const now = simNow();
  // a charged fusion is precious — a stray tome grab must never overwrite it.
  // Route the new spell to the other hand; the slot frees itself at burnout.
  const locked = s => p.slots[s] != null && p.slotCharges[s] > 0;
  let i = p.slots[0] == null ? 0 : p.slots[1] == null ? 1
    : (p.slotFilledAt[0] <= p.slotFilledAt[1] ? 0 : 1);
  if (locked(i)) i = 1 - i;
  if (locked(i)) { // both hands hold charged fusions — the tome fizzles
    spawnText(p.body.position.x, p.body.position.y - 48, 'HANDS FULL!', '#ff4df0');
    return -1;
  }
  p.slots[i] = id;
  p.casts[i] = 0;          // ready to cast immediately
  p.slotCharges[i] = null; // tome spells are limitless; only fusion sets charges
  p.slotFilledAt[i] = now;
  return i;
}

// C11. BUTTERFINGERS DESTROYS A CHARGED FUSION, AND THAT IS THE POINT.
//
// Butterfingers is legendary (drop weight 4) and costs 4.5 seconds of cooldown.
// Annihilating the fusion someone spent two tomes and a pickup window charging
// is the payoff for landing it. The behaviour used to be a side effect of the
// spellId setter above — `q.spellId = null` happened to clear both slots and
// both charge counts — which read like an accessor leaking rather than a rule.
// It is a rule. See spec §6 C11.
export function disarmPlayer(q) {
  q.slots[0] = q.slots[1] = null;
  q.slotCharges[0] = q.slotCharges[1] = null;
  q.casts[0] = q.casts[1] = 0;
  q.slotFilledAt[0] = q.slotFilledAt[1] = 0;
}

export function clearSpells(p) {
  p.slots[0] = p.slots[1] = null;
  p.casts[0] = p.casts[1] = 0;
  p.slotCharges[0] = p.slotCharges[1] = null;
  p.slotFilledAt[0] = p.slotFilledAt[1] = 0;
  p.lastCastSlot = 0;
}

onWorldReset(() => {
  players.length = 0;
  gibs.clear();
});
