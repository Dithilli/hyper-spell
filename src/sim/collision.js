// collision.js — every contact rule in the game, in one Matter handler.
// Registered against each freshly built engine, so a rebuilt world starts with
// exactly one listener (js/game.js:358 attached it at script load).
import { onWorldReset } from './world.js';
import { onContact, removeBody, setAngularVelocity, setVelocity } from './phys/facade.js';
import { simNow } from './time.js';
import { pick } from './rng.js';
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

function onCollisionStart(pairs) {
  const now = simNow();
  for (const { bodyA, bodyB } of pairs) {
    for (const [a, b] of [[bodyA, bodyB], [bodyB, bodyA]]) {
      if (a.label === 'projectile' && b.label !== 'lava' && projectiles.has(a)) {
        if (b.label === 'vine') killVine(b);
        if (b.label === 'boss' && a.owner) damageBoss(22, a.position, a.owner);
        if (b.label === 'enemy' && a.owner && a.owner !== 'boss') damageEnemy(b.enemy, 22, a.position, a.owner);
        if (b.label === 'decoy') { spawnParticles(b.position.x, b.position.y, '#e8d5ff', 16, 5); removeSummon(b); } // a mirror image soaks the shot, then bursts
        if (b.label === 'destructible') damageDestructible(b, 12); // bolts chip cover, not just explosions
        if (b.label === 'player' && now < (b.player.reflectUntil || 0)) {
          setVelocity(a, { x: -a.velocity.x * 1.1, y: -Math.abs(a.velocity.y) * 0.5 - 2 });
          a.collisionFilter.group = b.player.group;
          a.owner = b.player;
          spawnParticles(a.position.x, a.position.y, '#4ecdff', 8, 4);
        } else if (!a.noContactBoom) {
          if (!a.keepOnHit) projectiles.delete(a);
          a.onHit?.(a, b);
          if (!a.keepOnHit) removeBody(a);
        }
      }
      if (a.contactDamage && b.label === 'player' && b.player !== a.owner) {
        const relSpeed = Math.hypot(a.velocity.x - b.velocity.x, a.velocity.y - b.velocity.y);
        if (relSpeed > 3 && now > (a._cdAt || 0)) {
          a._cdAt = now + 400;
          damagePlayer(b.player, a.contactDamage * Math.min(1, relSpeed / 10), a.owner);
        }
      }
      if (a.contactExplode && b.label === 'player' && b.player !== a.owner) {
        const ce = a.contactExplode;
        const pos = { ...a.position };
        removeSummon(a);
        projectiles.delete(a);
        explode(pos.x, pos.y, ce.radius, ce.power, ce.dmg, a.owner);
      }
      if (a.label === 'banana' && b.label === 'player' && summons.has(a) && now > (a.armAt || 0)) {
        const q = b.player;
        statFor(q).slips++;
        q.slipUntil = now + 1000;
        setAngularVelocity(q.body, pick([-1, 1]) * 0.8);
        setVelocity(q.body, { x: q.body.velocity.x * 1.5, y: q.body.velocity.y - 4 });
        spawnText(q.body.position.x, q.body.position.y - 40, 'SLIP!', '#ffe135');
        removeSummon(a);
        sfx.squeak();
      }
      // STOMP: a grown wizard coming down onto a smaller one crushes them
      if (a.label === 'player' && b.label === 'player') {
        const big = a.player, small = b.player;
        if ((big.sizeScale || 1) >= 1.6 && (big.sizeScale || 1) > (small.sizeScale || 1) + 0.3
          && big.body.position.y < small.body.position.y - 6 && big.body.velocity.y > 2
          && small.alive && now > (small._stompAt || 0)) {
          small._stompAt = now + 600;
          damagePlayer(small, 12 + Math.round(((big.sizeScale || 1) - 1) * 22), big);
          setVelocity(small.body, { x: small.body.velocity.x, y: 7 });
          setVelocity(big.body, { x: big.body.velocity.x, y: -9 }); // bounce off the landing
          addShake(6); sfx.thud?.();
          spawnParticles(small.body.position.x, small.body.position.y - 10, '#a7e88f', 14, 6);
          spawnText(small.body.position.x, small.body.position.y - 44, 'STOMP!', '#a7e88f');
        }
      }
      if (a.label === 'tramp' && b.label === 'player') {
        // actively fling anyone who touches it — passive restitution alone felt dead
        setVelocity(b, { x: b.velocity.x, y: -20 });
        b.player.airJumps = 1; // refund a mid-air jump so it feels springy
        spawnParticles(b.position.x, b.position.y + 14, '#ff8fc7', 10, 5);
        addShake(3);
        sfx.boing?.();
      }
      if (a.label === 'tome' && b.label === 'player') pickupTome(a, b.player);
      if (a.label === 'hat' && b.label === 'player') pickupHat(a, b.player);
      if (a.label === 'icicle' && !a.isStatic && b.label === 'player' && !a.dmgDone) {
        a.dmgDone = true;
        damagePlayer(b.player, 60);
        addShake(6);
      }
      if (a.label === 'spikes' && b.label === 'player') {
        const q = b.player;
        if (now > (q.lastSpikeAt || 0)) {
          q.lastSpikeAt = now + 600;
          damagePlayer(q, 20);
          setVelocity(q.body, { x: q.body.velocity.x, y: -9 });
        }
      }
      if (b.label === 'lava') {
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
      }
    }
  }
}

onWorldReset(() => { onContact(onCollisionStart); });
