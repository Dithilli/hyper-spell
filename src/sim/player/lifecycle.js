// player/lifecycle.js — the roster: who exists, how they are built, where they
// spawn, and which spells they hold.
import { W, onWorldReset } from '../world.js';
import {
  addBody, allBodies, createCircle, newCollisionGroup, removeBody, scaleBody,
  setAngle, setAngularVelocity, setPosition, setVelocity,
} from '../phys/facade.js';
import { simNow } from '../time.js';
import { spawnParticles, spawnText } from '../fx.js';
import { IDLE_INPUT } from '../input-contract.js';
import { currentMap } from '../match.js';
import { platformSpots } from '../events.js';
import { clearStatuses } from './status.js';

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

// is there anything solid in the column at x to land on?
export function groundInColumn(x) {
  return allBodies(currentMap.composite).some(b =>
    b.isStatic && !b.isSensor && b.label !== 'lava' && b.collisionFilter.mask !== 0 &&
    x > b.bounds.min.x + 6 && x < b.bounds.max.x - 6 && b.bounds.min.y > 100);
}

export function spawnPointFor(p) {
  const spawns = currentMap.def.spawns;
  const base = spawns[p.slot % spawns.length];
  const jitter = p.slot >= spawns.length ? (p.slot - spawns.length + 1) * 26 * (p.slot % 2 ? 1 : -1) : 0;
  // safety net: a spawn over a straight drop gets moved onto a real platform
  if (!groundInColumn(base.x + jitter)) {
    const spot = platformSpots(currentMap, 3).find(s => groundInColumn(s.x));
    if (spot) return { x: spot.x, y: Math.max(80, spot.y - 150) };
  }
  return { x: Math.max(40, Math.min(W - 40, base.x + jitter)), y: base.y };
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
  p.body.frictionAir = 0.02;
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
