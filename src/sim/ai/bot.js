// ai/bot.js — dumb-but-fun AI wizards for solo play and testing.
// Press B in the lobby to add one. A BotController is a drop-in controller:
// it polls like a keyboard/gamepad, so bots work in couch and host modes
// and look like ordinary players to LAN clients.
//
// Every bot shares one brain (think below) but gets a TEMPERAMENT that bends
// it: who they target, how close they fight, how fast they pull the trigger,
// and whether a fusion tome outranks a fistfight. addBot() deals temperaments
// round-robin so any bot lobby has real variety.
import { W, H, onWorldReset } from '../world.js';
import { simNow } from '../time.js';
import { simRandom, rand, pick } from '../rng.js';
import { game, currentMap, joinPlayer } from '../match.js';
import { players, MAX_PLAYERS } from '../player/lifecycle.js';
import { tomes } from '../pickups.js';
import { SPELLS } from '../spells/registry.js';
import { hybridFor } from '../spells/fusion.js';
import {
  projectiles, summons, enemiesOf, nearestEnemy, groundYAt,
} from '../spells/core.js';

export const BOT_PERSONAS = {
  // the classic all-rounder — today's bot, unchanged
  balanced: {
    names: ['BOTLIN', 'CLANKY', 'SPARKY', 'RUSTY', 'GIZMO', 'WIZ-E', 'COGSWORTH', 'BLIP'],
    cadence: 1, combo: 0.22, keepDist: 0.15, standoff: 0, blockOdds: 0.3, aimMult: 1, tomeLust: false, fleeHp: 0, bully: false, chaos: false,
  },
  // wants your face: picks on the weakest wizard, presses in, fires fast, rarely blocks
  berserker: {
    names: ['CRUSHER', 'MAULBOT', 'RAMPAGE', 'SMASHY', 'GRIMBOLT'],
    cadence: 0.6, combo: 0.4, keepDist: 0, standoff: 0, blockOdds: 0.15, aimMult: 1.15, tomeLust: false, fleeHp: 0, bully: true, chaos: false,
  },
  // fights at arm's length: kites to a standoff range, parries well, runs when hurt
  skirmisher: {
    names: ['SKITTER', 'DODGEREL', 'ZOOMBOT', 'FLICKER', 'WISPY'],
    cadence: 1.1, combo: 0.15, keepDist: 0.3, standoff: 340, blockOdds: 0.45, aimMult: 0.95, tomeLust: false, fleeHp: 55, bully: false, chaos: false,
  },
  // plays the long game: a tome that completes a fusion outranks any fight
  alchemist: {
    names: ['BREWBOT', 'FUSEY', 'MIXTRON', 'CAULDRON', 'ALEMBIC'],
    cadence: 1.15, combo: 0.3, keepDist: 0.3, standoff: 0, blockOdds: 0.3, aimMult: 1, tomeLust: true, fleeHp: 45, bully: false, chaos: false,
  },
  // nobody knows what it wants, including itself — wild aim, wandering feet
  trickster: {
    names: ['JESTER', 'WOBBLES', 'GLITCHY', 'HOOPLA', 'KAZOO'],
    cadence: 0.85, combo: 0.3, keepDist: 0.25, standoff: 0, blockOdds: 0.25, aimMult: 1.3, tomeLust: false, fleeHp: 0, bully: false, chaos: true,
  },
};
const PERSONA_ORDER = ['berserker', 'skirmisher', 'alchemist', 'trickster', 'balanced'];
let nextPersona = 0;

export class BotController {
  constructor(persona) {
    this.persona = persona && BOT_PERSONAS[persona] ? persona : PERSONA_ORDER[nextPersona++ % PERSONA_ORDER.length];
    this.mood = BOT_PERSONAS[this.persona];
    this.prevJump = false;
    this.prevCast = false;
    this.nextThink = 0;
    this.plan = { move: 0, jump: false, cast: false, aim: null };
  }

  idle() {
    this.prevJump = false;
    this.prevCast = false;
    this.prevCast2 = false;
    return { move: 0, jump: false, cast: false, cast2: false, block: false, jumpPressed: false, castPressed: false, cast2Pressed: false, blockPressed: false, startPressed: false, aimPoint: null, aimVec: null, aimAngle: null };
  }

  // is stepping one pace in `dir` a walk into lava or off into a deep pit?
  // lookahead scales with current speed — a sprinting bot needs to brake sooner
  fallDanger(me, dir, vx = 0) {
    const aheadX = Math.max(20, Math.min(W - 20, me.x + dir * (42 + Math.abs(vx) * 10)));
    const gAhead = groundYAt(aheadX);
    const lava = currentMap.data.lavaY;
    if (lava != null && gAhead > lava - 24) return true; // ground ahead sits under lava → you'd land in it
    if (gAhead >= H - 31) return true;                   // no platform ahead at all → open void
    return gAhead - me.y > 300;                          // a long drop onto real ground
  }

  // nearest direction with real footing within reach (used mid-air over death)
  safeGroundDir(me, lavaY) {
    for (let d = 60; d <= 380; d += 64) {
      for (const dir of [-1, 1]) {
        const x = me.x + dir * d;
        if (x < 30 || x > W - 30) continue;
        const g = groundYAt(x);
        if (g < H - 31 && (lavaY == null || g < lavaY - 24) && g - me.y < 300) return dir;
      }
    }
    return 0;
  }

  think(p, now) {
    const me = p.body.position;
    // LAVA PANIC: airborne over certain death (lava or open void below) — drop
    // the plan, steer hard for the nearest safe column, burn the air jump while
    // sinking, and re-think fast. Bots used to sail into the soup with no
    // recovery at all between their slow think ticks.
    const lavaY = currentMap.data.lavaY;
    if (now - (p.lastGround || 0) >= 220) {
      const gBelow = groundYAt(me.x);
      if ((lavaY != null && gBelow > lavaY - 24) || gBelow >= H - 31) {
        const dir = this.safeGroundDir(me, lavaY) || (me.x > W / 2 ? -1 : 1);
        this.plan = { move: dir, jump: p.body.velocity.y > 2 && p.airJumps > 0, cast: false, cast2: false, aim: null, block: false };
        this.nextThink = now + 70; // panic reflexes
        return;
      }
    }
    // a ghost's wail rattles the circuits: drop the plan and scurry for a beat
    if (now < (p.spookedUntil || 0)) {
      this.plan = { move: pick([-1, 1]), jump: simRandom() < 0.3, cast: false, cast2: false, aim: null, block: false };
      this.nextThink = now + 130;
      return;
    }
    const m = this.mood;
    // target: the boss during boss rounds; otherwise temperament decides —
    // a berserker picks on the weakest wizard, everyone else takes the nearest
    let tpos = null, tbody = null, vsBoss = false;
    if (game.boss?.announced) { tbody = game.boss.body; tpos = tbody.position; vsBoss = true; }
    else {
      let t = nearestEnemy(p);
      if (m.bully) {
        let weakest = null;
        for (const q of enemiesOf(p)) if (q.alive && (!weakest || q.hp < weakest.hp)) weakest = q;
        if (weakest) t = weakest;
      }
      if (t) { tbody = t.body; tpos = tbody.position; }
      // a mirror image fools a bot half the time
      if (tpos && simRandom() < 0.5) {
        for (const s of summons) {
          if (s.label === 'decoy' && s.decoyOf !== p && Math.hypot(s.position.x - tpos.x, s.position.y - tpos.y) < 260) { tbody = s; tpos = { x: s.position.x, y: s.position.y }; break; }
        }
      }
    }
    // unarmed → chase the nearest tome instead
    let goal = tpos;
    if (!p.spellId) {
      let best = null, bd = 1e9;
      for (const t of tomes) {
        const d = Math.hypot(t.position.x - me.x, t.position.y - me.y);
        if (d < bd) { bd = d; best = t; }
      }
      if (best) goal = best.position;
    } else if (m.tomeLust && goal === tpos) {
      // the alchemist's eye: a catalyst, or a tome that fuses with what's in
      // hand, beats a fight — unless someone is right on top of them
      const enemyClose = tpos && Math.hypot(tpos.x - me.x, tpos.y - me.y) < 170;
      if (!enemyClose) {
        let best = null, bd = 1e9;
        for (const t of tomes) {
          const fuses = t.catalyst || (p.slots[0] && !p.slots[1] && hybridFor(p.slots[0], t.spell));
          if (!fuses) continue;
          const d = Math.hypot(t.position.x - me.x, t.position.y - me.y);
          if (d < 700 && d < bd) { bd = d; best = t; }
        }
        if (best) goal = best.position;
      }
    }
    // the hurt ones run: below the flee threshold, away beats toward
    const fleeing = m.fleeHp && p.hp < m.fleeHp && goal === tpos && tpos;

    let move = 0;
    if (goal) {
      const dx = goal.x - me.x;
      const d = goal === tpos ? Math.hypot(tpos.x - me.x, tpos.y - me.y) : 1e9;
      if (fleeing) move = -Math.sign(dx || 1);
      else if (goal === tpos && m.standoff && d < m.standoff - 60) move = -Math.sign(dx || 1); // kite back out
      else if (Math.abs(dx) > 46 && !(goal === tpos && m.standoff && d < m.standoff + 60)) move = Math.sign(dx);
      else if (goal === tpos && simRandom() < m.keepDist) move = -Math.sign(dx || 1); // occasionally keep some distance
    } else if (simRandom() < 0.12) {
      move = pick([-1, 0, 1]);
    }
    if (m.chaos && simRandom() < 0.2) move = pick([-1, 0, 1]); // wandering feet
    if (me.x < 80) move = 1;
    if (me.x > W - 80) move = -1;

    const grounded = now - (p.lastGround || 0) < 220;
    let jump = false;
    if (currentMap.data.lavaY != null && me.y > currentMap.data.lavaY - 60) jump = true; // feet warm — bail off the lava

    // LEDGE SAFETY: don't stroll off a cliff into lava or a pit. If the goal is
    // that way, only leap when a safe landing is within jump range; else hold up.
    if (move && this.fallDanger(me, move, p.body.velocity.x)) {
      const landX = Math.max(24, Math.min(W - 24, me.x + move * 135));
      const gLand = groundYAt(landX);
      const lava = currentMap.data.lavaY;
      const safeLanding = (lava == null || gLand < lava - 24) && gLand - me.y < 240 && gLand - me.y > -140;
      if (safeLanding && grounded) jump = true; // clear the gap on purpose
      else move = 0;                            // otherwise refuse to step off
    }

    if (goal && goal.y < me.y - 70 && grounded && simRandom() < 0.4) jump = true;                // goal is above → hop up
    if (move && Math.abs(p.body.velocity.x) < 0.5 && grounded && simRandom() < 0.3) jump = true; // wedged against a wall
    if (m.chaos && grounded && simRandom() < 0.15) jump = true;                                  // hops for no reason

    let cast = false, cast2 = false, aim = null;
    if (tpos && (p.slots[0] || p.slots[1])) {
      const d = Math.hypot(tpos.x - me.x, tpos.y - me.y);
      if (d < 620) {
        // deliberate cadence: a bot lands a single aimed shot at a time, only
        // occasionally comboing both slots — no machine-gun spray. Temperament
        // sets the tempo: a berserker fires ~40% faster, an alchemist slower.
        if (now - (this.lastShot || 0) > 520 * m.cadence) {
          // self-movement spells (dash/leap/blink) hurl the caster toward the
          // aim — over lava that's a suicide button, so bots shelve them there
          const risky = id => currentMap.data.lavaY != null && SPELLS[id]?.selfMove;
          const r0 = p.slots[0] && !risky(p.slots[0]) && now - p.casts[0] > (SPELLS[p.slots[0]].cooldown || 0);
          const r1 = p.slots[1] && !risky(p.slots[1]) && now - p.casts[1] > (SPELLS[p.slots[1]].cooldown || 0);
          if (r0 && r1 && simRandom() < m.combo) { cast = true; cast2 = true; } // two-slot combo
          else if (r0 && (!r1 || simRandom() < 0.6)) cast = true;               // usually one measured shot
          else if (r1) cast2 = true;
        }
        // human-ish aim: wobblier at range and against fast movers — and much
        // wobblier with hitscan beams, which land the instant they fire. Bots
        // were zap snipers; now a beam is a hopeful crackle, not a laser scalpel.
        const firingId = cast ? p.slots[0] : cast2 ? p.slots[1] : (p.slots[0] || p.slots[1]);
        const beam = !!(firingId && SPELLS[firingId]?.beam);
        const tspd = tbody ? Math.hypot(tbody.velocity.x, tbody.velocity.y) : 0;
        let err = (0.07 + d * 0.00012 + tspd * 0.014) * m.aimMult;
        if (beam) {
          err = err * 1.7 + 0.09;
          if ((cast || cast2) && now - (this.lastBeam || 0) < 950) { cast = cast2 = false; }   // beams on a measured cadence
          else if ((cast || cast2) && tspd > 6 && simRandom() < 0.4) { cast = cast2 = false; } // hesitate at a fast mover
          if (cast || cast2) this.lastBeam = now;
        }
        if (vsBoss) err *= 0.45; // the boss is a barn door
        aim = Math.atan2(tpos.y - me.y, tpos.x - me.x) + rand(-Math.min(err, 0.45), Math.min(err, 0.45));
        if (cast || cast2) this.lastShot = now;
      }
    }
    // parry an incoming projectile sometimes — bots respect the new skill move
    let block = false;
    if (!vsBoss) {
      for (const fb of projectiles) {
        if (fb.owner === p) continue;
        const dx = me.x - fb.position.x, dy = me.y - fb.position.y;
        const d = Math.hypot(dx, dy);
        if (d < 150 && (fb.velocity.x * dx + fb.velocity.y * dy) / (d || 1) > 5 && simRandom() < m.blockOdds) { block = true; break; }
      }
    }
    this.plan = { move, jump, cast, cast2, aim, block };
  }

  poll() {
    const now = simNow();
    const p = this.player ??= players.find(q => q.controller === this);
    if (!p || !p.alive || (game.state !== 'PLAY' && game.state !== 'LOBBY')) return this.idle();
    if (now > this.nextThink) {
      this.nextThink = now + rand(130, 280);
      this.think(p, now);
    }
    const { move, jump, cast, cast2, aim, block } = this.plan;
    const s = {
      move, jump, cast, cast2, block,
      jumpPressed: jump && !this.prevJump,
      castPressed: cast && !this.prevCast,
      cast2Pressed: cast2 && !this.prevCast2,
      blockPressed: block && !this.prevBlock,
      startPressed: false,
      aimPoint: null, aimVec: null,
      aimAngle: aim,
    };
    this.prevJump = jump;
    this.prevCast = cast;
    this.prevCast2 = cast2;
    this.prevBlock = block;
    return s;
  }
}

export function addBot(persona) {
  if (players.length >= MAX_PLAYERS) return;
  const bc = new BotController(persona);
  const used = new Set(players.map(p => p.name));
  const name = BOT_PERSONAS[bc.persona].names.find(n => !used.has(n))
    || BOT_PERSONAS.balanced.names.find(n => !used.has(n))
    || `BOT ${players.length + 1}`;
  joinPlayer(bc, name);
}

onWorldReset(() => { nextPersona = 0; });
