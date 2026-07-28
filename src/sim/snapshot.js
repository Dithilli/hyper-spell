// snapshot.js — serialize the live sim into a plain-object snapshot.
//
// It lives in sim/ rather than net/ because it is inside the sim's own call
// graph: the killcam records one every third tick from stepSim. The wire
// framing around it (the {t:'snap'} envelope, the replay swap) belongs to
// src/net/server-bridge.js, and rendering a snapshot back to the canvas to
// src/render/draw-snapshot.js.
import { allBodies, allJoints, jointEnds } from './phys/facade.js';
import { GAME_VERSION } from '../version.js';
import { game, currentMap } from './match.js';
import { players, gibs } from './player/lifecycle.js';
import { tomes, hats } from './pickups.js';
import { projectiles, summons, activeEffects, effectiveCooldown } from './spells/core.js';
import { BotController } from './ai/bot.js';
import { simNow } from './time.js';

// No `now` parameter: every deadline compared below (frozenUntil, casts[],
// lastCast, …) is written on simNow(), so the serializer reads the same clock.
// It used to be handed the host's wall clock by src/net/server-bridge.js, which
// after this task would have reported every status flag false and every
// cooldown ready.
export function serializeSnapshot() {
  const now = simNow();
  // status flags ride the wire only when SET — readers treat a missing field
  // as falsy, and most wizards most frames are not frozen/floaty/piggy/etc.
  const flag = (k, on) => (on ? { [k]: 1 } : {});
  const ps = players.map(p => ({
    s: p.slot, n: p.name, c: p.color, h: p.hat,
    x: Math.round(p.body.position.x), y: Math.round(p.body.position.y),
    vx: +p.body.velocity.x.toFixed(1), vy: +p.body.velocity.y.toFixed(1),
    an: +(p.body.angle * 0.35).toFixed(2),
    f: p.facing, wp: +p.walkPhase.toFixed(2),
    hp: Math.round(p.hp), al: p.alive ? 1 : 0, sc: +p.sizeScale.toFixed(2),
    ...flag('fz', now < p.frozenUntil), ...flag('fl', now < (p.floatyUntil || 0)),
    ...flag('iv', now < (p.invulnUntil || 0)), ...flag('rf', now < (p.reflectUntil || 0)),
    ...flag('pg', now < (p.pigUntil || 0)), ...flag('hu', now < (p.hurtUntil || 0)),
    ...(p.ghost && !p.alive ? { gx: Math.round(p.ghost.x), gy: Math.round(p.ghost.y) } : {}),
    // C4: rd/c0/c1 report the cooldown the cast gate ENFORCES, not the one
    // the spell declares. Same wire shape, corrected values — a client that
    // drew Fireball's bar full at 450ms was drawing a lie.
    sp: p.spellId, ...flag('rd', p.spellId && now - p.lastCast > effectiveCooldown(p.spellId)),
    // both spell slots + per-slot cooldown fraction for the two-slot HUD
    s0: p.slots[0], s1: p.slots[1],
    h0: p.slotCharges?.[0] ?? undefined, h1: p.slotCharges?.[1] ?? undefined, // fusion charges left
    c0: p.slots[0] ? +Math.min(1, (now - p.casts[0]) / effectiveCooldown(p.slots[0])).toFixed(2) : 0,
    c1: p.slots[1] ? +Math.min(1, (now - p.casts[1]) / effectiveCooldown(p.slots[1])).toFixed(2) : 0,
    ...(p.megaCasts ? { mc: p.megaCasts } : {}),
    ...(p.roundWins ? { w: p.roundWins } : {}),
    ...flag('b', typeof BotController !== 'undefined' && p.controller instanceof BotController),
    ...flag('off', !!p.offline), // online: seat's connection dropped (server sets it)
  }));

  const bodies = [];
  // shape descriptor instead of a vertex dump: geometry never changes frame to
  // frame, so a crate is {w,h}, a rock is {n,r}, a ball is {r} — the client
  // rebuilds the outline from descriptor + angle. Bodies that don't classify
  // (none today) fall back to the old vertex list. Cuts the payload ~30%.
  const pushGhost = (b, label, color, extra) => {
    const e = { id: b.id, l: label, c: color, a: +b.angle.toFixed(3), ...extra };
    e.x = Math.round(b.position.x); e.y = Math.round(b.position.y);
    const v = b.vertices;
    if (b.circleRadius) {
      e.r = Math.round(b.circleRadius);
    } else if (v.length === 4) {
      e.w = Math.round(Math.hypot(v[1].x - v[0].x, v[1].y - v[0].y));
      e.h = Math.round(Math.hypot(v[2].x - v[1].x, v[2].y - v[1].y));
    } else if (v.length >= 3 && v.length <= 12) {
      e.n = v.length;
      e.r = Math.round(Math.hypot(v[0].x - b.position.x, v[0].y - b.position.y));
    } else {
      e.v = v.flatMap(pt => [Math.round(pt.x), Math.round(pt.y)]);
    }
    bodies.push(e);
  };
  for (const fb of projectiles) pushGhost(fb, 'projectile', fb.color);
  for (const s of summons) {
    const extra = {};
    if (s.critter) extra.cd = s.critter.dir;
    if (s.decoyOf) extra.dc = [s.decoyOf.color, s.decoyOf.hat];
    if (s.bossType) extra.bt = s.bossType;
    pushGhost(s, s.label, s.render.fillStyle, extra);
  }
  // gibs are confetti — during real mayhem nobody counts them. Cap what rides
  // the wire; the host keeps the full physics spectacle locally.
  let gibsSent = 0;
  for (const g of gibs) { if (++gibsSent > 14) break; pushGhost(g, 'gib', g.color); }
  for (const t of tomes) bodies.push({ id: t.id, l: 'tome', x: Math.round(t.position.x), y: Math.round(t.position.y), a: +t.angle.toFixed(3), sp: t.spell });
  for (const h of hats) bodies.push({ id: h.id, l: 'hat', x: Math.round(h.position.x), y: Math.round(h.position.y), a: +h.angle.toFixed(3) });
  for (const b of allBodies(currentMap.composite)) {
    if (b.label === 'lava') continue;
    if (!b.isStatic) pushGhost(b, b.label, b.render.fillStyle);
    else if (b.spin || b.phantom || b.kinematic) {
      pushGhost(b, b.label, b.render.fillStyle, {
        ...(b.phantom ? { ph: b.phantomSolid === false ? 0 : 1 } : {}),
        ...(b.spin ? { spn: 1 } : {}),
      });
    }
  }

  const segs = [];
  for (const c of allJoints(currentMap.composite)) {
    if (c.label !== 'breakable' && c.label !== 'chain') continue;
    const [a, b] = jointEnds(c);
    segs.push([c.label === 'chain' ? 1 : 0, Math.round(a.x), Math.round(a.y), Math.round(b.x), Math.round(b.y)]);
  }

  const fxLite = activeEffects.filter(e => e.net).map(e => e.net);

  return {
    v: GAME_VERSION,
    st: game.state, mi: game.mapIndex, wn: game.winsNeeded,
    ...(game.mode !== 'versus' ? { md: game.mode } : {}), // lobby needs the mode line
    ...(game.mode === 'wave' && game.bestWave ? { bw: game.bestWave } : {}),
    msd: game.mapSeed, // seed for deterministic map extras (client regenerates statics)
    rn: game.totalRounds || 0, // increments every round start — the "re-plan now" signal
    lv: currentMap.data.lavaY != null ? Math.round(currentMap.data.lavaY) : null,
    // winner only while a round/match is actually resolving — it must not linger
    // into the next round (headless clients use wr==null as their reset signal)
    wr: (game.state === 'ROUND_END' || game.state === 'VICTORY') && game.winner ? game.winner.slot : null,
    ev: game.envEvent?.announced ? game.envEvent.def.id : null,
    bd: currentMap.data.broken && currentMap.data.broken.length ? currentMap.data.broken : undefined, // broken destructibles for LAN mirroring

    bs: game.boss?.announced ? { n: game.boss.title || game.boss.def.name, c: game.boss.enraged ? '#ff4d4d' : game.boss.def.color, hp: Math.max(0, Math.round(game.boss.hp)), mhp: game.boss.maxHp } : null,
    aw: game.state === 'VICTORY' ? game.awards || null : null,
    sr: game.state === 'VICTORY' ? game.spellReport || null : null,
    ps, bodies, segs, fxLite,
  };
}
