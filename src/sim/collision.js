// collision.js — every contact rule in the game, as a label-pair dispatch table.
//
// This was one 98-line handler with eleven `if` blocks, re-tested from the top
// for both orientations of every contact the engine reported. The blocks are
// now rules registered against the labels they care about, so a contact only
// runs the rules whose labels match it, and a new interaction is a `rule(...)`
// line rather than another branch in the middle of the pile.
//
// THE ORDER IS PART OF THE BEHAVIOUR. Several rules touch the same body — the
// projectile rule deletes the projectile the contactDamage rule would read, the
// lava rule removes the body every other rule is about — so the rules for a
// given pair must run in the order the old blocks did. They are registered
// below in exactly that order and resolved in registration order; see the
// per-pair assertions in test/collision-dispatch.test.js.
//
// Registered against each freshly built engine, so a rebuilt world starts with
// exactly one listener.
import { onWorldReset } from './world.js';
import { onContact, removeBody, setAngularVelocity, setFilter, setVelocity } from './phys/facade.js';
import { simNow } from './time.js';
import { pick } from './rng.js';
import { pairCooldown } from './cooldown.js';
import { spawnParticles, spawnText, addShake } from './fx.js';
import { sfx } from './sfx.js';
import { statFor } from './awards.js';
import { currentMap } from './match.js';
import { gibs } from './player/lifecycle.js';
import { damagePlayer, killPlayer } from './player/combat.js';
import { tomes, hats, pickupTome, pickupHat } from './pickups.js';
import { projectiles, summons, removeSummon, explode } from './spells/core.js';
import { killVine } from './events.js';
import { damageBoss } from './ai/boss.js';
import { damageEnemy } from './ai/enemies.js';
import { damageDestructible } from './maps/builders.js';

// The gate the contact rules share with ai/boss.js and ai/enemies.js. Re-exported
// so "what can hit me, and how often" reads as one module from the outside.
export { pairCooldown };

// ---------------------------------------------------------------- the table
//
// A rule matches an ORDERED pair of labels: `rule('tome', 'player', …)` fires
// for the tome as `a` and the wizard as `b`, and never the other way round.
// Every contact is dispatched in both orientations, which is what lets the
// player↔player stomp rule see each wizard as the potential stomper in turn.
const ANY = '*';

const registered = []; // in registration order — the order rules run in
const resolved = new Map(); // "labelA|labelB" → the matching rule fns, in order

export function rule(labelA, labelB, fn) {
  registered.push({ labelA, labelB, fn });
  resolved.clear(); // a late registration must not miss a memoised pair
}

// The rules that match this ordered label pair, in registration order.
//
// Memoised, and the memo needs no reset hook: it is a pure function of the rule
// table, which is filled once at module load and never changes, so an entry can
// never go stale. It is bounded by the label vocabulary, which is authored in
// content and finite — `player`, `projectile`, `lava`, `tome`, `hat`, `banana`,
// `tramp`, `spikes`, `icicle`, `boss`, `enemy`, `vine`, `decoy`, `destructible`,
// `saw`, `mine`, and the handful of unlabelled map bodies — so it settles within
// the first seconds of a round and never allocates again.
//
// FROZEN because it is the live dispatch list, not a copy: this is called for
// every contact in both orientations, so returning a defensive copy would
// allocate on the hottest path in the sim. Freezing costs nothing per call and
// makes an exported accessor unable to corrupt dispatch — a caller that pushes
// onto the result gets a TypeError instead of a permanently wrong game.
export function rulesFor(a, b) {
  const key = `${a}|${b}`;
  let list = resolved.get(key);
  if (!list) {
    list = Object.freeze(registered
      .filter((r) => (r.labelA === ANY || r.labelA === a) && (r.labelB === ANY || r.labelB === b))
      .map((r) => r.fn));
    resolved.set(key, list);
  }
  return list;
}

function applyRules(a, b) {
  const fns = rulesFor(a.label, b.label);
  for (let i = 0; i < fns.length; i++) fns[i](a, b);
}

// Both orientations of one contact.
//
// The old handler built `[[bodyA, bodyB], [bodyB, bodyA]]` here — two arrays
// and two pairs allocated per contact per tick, on the hottest path in the sim.
// Calling the loop twice allocates nothing at all. It is also why there is no
// reused scratch array to reason about: a module-level scratch would be correct
// only while no rule re-enters dispatchContact, and this form does not need
// that invariant to hold. (It does hold — physStep is called from exactly one
// place, src/sim/tick.js, and no rule is async — but an invariant you don't
// depend on is one that cannot be broken by a later rule.)
export function dispatchContact(bodyA, bodyB) {
  applyRules(bodyA, bodyB);
  applyRules(bodyB, bodyA);
}

// ---------------------------------------------------------------- the rules

// 1. a bolt hits something. Lava is handled by the lava rule below and the
// projectile must not also boom there, which is what the old `b.label !== 'lava'`
// guard bought.
rule('projectile', ANY, function projectileHit(a, b) {
  if (b.label === 'lava' || !projectiles.has(a)) return;
  if (b.label === 'vine') killVine(b);
  if (b.label === 'boss' && a.owner) damageBoss(22, a.position, a.owner);
  if (b.label === 'enemy' && a.owner && a.owner !== 'boss') damageEnemy(b.enemy, 22, a.position, a.owner);
  if (b.label === 'decoy') { spawnParticles(b.position.x, b.position.y, '#e8d5ff', 16, 5); removeSummon(b); } // a mirror image soaks the shot, then bursts
  if (b.label === 'destructible') damageDestructible(b, 12); // bolts chip cover, not just explosions
  if (b.label === 'player' && simNow() < (b.player.reflectUntil || 0)) {
    setVelocity(a, { x: -a.velocity.x * 1.1, y: -Math.abs(a.velocity.y) * 0.5 - 2 });
    setFilter(a, { group: b.player.group });
    a.owner = b.player;
    spawnParticles(a.position.x, a.position.y, '#4ecdff', 8, 4);
  } else if (!a.noContactBoom) {
    if (!a.keepOnHit) projectiles.delete(a);
    a.onHit?.(a, b);
    if (!a.keepOnHit) removeBody(a);
  }
});

// 2. anything heavy enough to hurt on impact — anvils, pianos, crates, rocks.
// The 400ms gate is scoped to the falling body, not to the pair: one anvil, one
// wizard per window, whichever wizard it reaches first.
rule(ANY, 'player', function contactDamage(a, b) {
  if (!a.contactDamage || b.player === a.owner) return;
  const relSpeed = Math.hypot(a.velocity.x - b.velocity.x, a.velocity.y - b.velocity.y);
  if (relSpeed > 3 && pairCooldown.readySelf(a, 400, 'contact-damage')) {
    damagePlayer(b.player, a.contactDamage * Math.min(1, relSpeed / 10), a.owner);
  }
});

// 3. …and the ones that go off instead of bruising
rule(ANY, 'player', function contactExplode(a, b) {
  if (!a.contactExplode || b.player === a.owner) return;
  const ce = a.contactExplode;
  const pos = { ...a.position };
  removeSummon(a);
  projectiles.delete(a);
  explode(pos.x, pos.y, ce.radius, ce.power, ce.dmg, a.owner);
});

rule('banana', 'player', function bananaSlip(a, b) {
  const now = simNow();
  if (!summons.has(a) || now <= (a.armAt || 0)) return;
  const q = b.player;
  statFor(q).slips++;
  q.slipUntil = now + 1000;
  setAngularVelocity(q.body, pick([-1, 1]) * 0.8);
  setVelocity(q.body, { x: q.body.velocity.x * 1.5, y: q.body.velocity.y - 4 });
  spawnText(q.body.position.x, q.body.position.y - 40, 'SLIP!', '#ffe135');
  removeSummon(a);
  sfx.squeak();
});

// STOMP: a grown wizard coming down onto a smaller one crushes them. The 600ms
// gate is on the VICTIM — being stomped once puts you out of reach of every
// stomper for the window, not just the one who landed on you.
rule('player', 'player', function stomp(a, b) {
  const big = a.player, small = b.player;
  if ((big.sizeScale || 1) >= 1.6 && (big.sizeScale || 1) > (small.sizeScale || 1) + 0.3
    && big.body.position.y < small.body.position.y - 6 && big.body.velocity.y > 2
    && small.alive && pairCooldown.readySelf(small.body, 600, 'stomp')) {
    damagePlayer(small, 12 + Math.round(((big.sizeScale || 1) - 1) * 22), big);
    setVelocity(small.body, { x: small.body.velocity.x, y: 7 });
    setVelocity(big.body, { x: big.body.velocity.x, y: -9 }); // bounce off the landing
    addShake(6); sfx.thud?.();
    spawnParticles(small.body.position.x, small.body.position.y - 10, '#a7e88f', 14, 6);
    spawnText(small.body.position.x, small.body.position.y - 44, 'STOMP!', '#a7e88f');
  }
});

rule('tramp', 'player', function trampoline(a, b) {
  // actively fling anyone who touches it — passive restitution alone felt dead
  setVelocity(b, { x: b.velocity.x, y: -20 });
  b.player.airJumps = 1; // refund a mid-air jump so it feels springy
  spawnParticles(b.position.x, b.position.y + 14, '#ff8fc7', 10, 5);
  addShake(3);
  sfx.boing?.();
});

rule('tome', 'player', function tomePickup(a, b) { pickupTome(a, b.player); });
rule('hat', 'player', function hatPickup(a, b) { pickupHat(a, b.player); });

rule('icicle', 'player', function icicleFall(a, b) {
  if (a.isStatic || a.dmgDone) return;
  a.dmgDone = true;
  damagePlayer(b.player, 60);
  addShake(6);
});

// the 600ms gate is on the wizard, so a strip built from several spike bodies
// still costs 20 once
rule('spikes', 'player', function spikes(a, b) {
  const q = b.player;
  if (pairCooldown.readySelf(q.body, 600, 'spikes')) {
    damagePlayer(q, 20);
    setVelocity(q.body, { x: q.body.velocity.x, y: -9 });
  }
});

rule(ANY, 'lava', function lava(a, b) {
  if (a.label === 'player') killPlayer(a.player);
  else if (a.label === 'boss') { if (!a.isStatic) setVelocity(a, { x: a.velocity.x, y: -14 }); } // bosses shrug off lava
  else if (!a.isStatic) {
    spawnParticles(a.position.x, a.position.y, currentMap.data.acid ? '#9be15d' : '#ff5e57', 8, 4);
    projectiles.delete(a);
    tomes.delete(a);
    hats.delete(a);
    gibs.delete(a);
    summons.delete(a);
    removeBody(a, true);
  }
});

onWorldReset(() => {
  onContact((pairs) => {
    for (const { bodyA, bodyB } of pairs) dispatchContact(bodyA, bodyB);
  });
});
