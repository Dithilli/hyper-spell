// bot.js — dumb-but-fun AI wizards for solo play and testing.
// Press B in the lobby to add one. A BotController is a drop-in controller:
// it polls like a keyboard/gamepad, so bots work in couch and host modes
// and look like ordinary players to LAN clients.
//
// Every bot shares one brain (think below) but gets a TEMPERAMENT that bends
// it: who they target, how close they fight, how fast they pull the trigger,
// and whether a fusion tome outranks a fistfight. addBot() deals temperaments
// round-robin so any bot lobby has real variety.
//
// `nerve` is deliberate fallibility: the odds, per ledge decision, that a bot
// commits to a step it should have refused. A bot that NEVER misjudges a gap
// reads as a machine and robs the table of the best moment in the game — the
// one where someone confidently sprints into the void. A bot that misjudges
// constantly is just broken. This keeps falls as an occasional, in-character
// blunder: the trickster does it most, the alchemist almost never.
const BOT_PERSONAS = {
  // the classic all-rounder — today's bot, unchanged
  balanced: {
    names: ['BOTLIN', 'CLANKY', 'SPARKY', 'RUSTY', 'GIZMO', 'WIZ-E', 'COGSWORTH', 'BLIP'],
    cadence: 1, combo: 0.22, keepDist: 0.15, standoff: 0, blockOdds: 0.3, aimMult: 1, tomeLust: false, fleeHp: 0, bully: false, chaos: false, nerve: 0.030,
  },
  // wants your face: picks on the weakest wizard, presses in, fires fast, rarely blocks
  berserker: {
    names: ['CRUSHER', 'MAULBOT', 'RAMPAGE', 'SMASHY', 'GRIMBOLT'],
    cadence: 0.6, combo: 0.4, keepDist: 0, standoff: 0, blockOdds: 0.15, aimMult: 1.15, tomeLust: false, fleeHp: 0, bully: true, chaos: false, nerve: 0.055,
  },
  // fights at arm's length: kites to a standoff range, parries well, runs when hurt
  skirmisher: {
    names: ['SKITTER', 'DODGEREL', 'ZOOMBOT', 'FLICKER', 'WISPY'],
    cadence: 1.1, combo: 0.15, keepDist: 0.3, standoff: 340, blockOdds: 0.45, aimMult: 0.95, tomeLust: false, fleeHp: 55, bully: false, chaos: false, nerve: 0.020,
  },
  // plays the long game: a tome that completes a fusion outranks any fight
  alchemist: {
    names: ['BREWBOT', 'FUSEY', 'MIXTRON', 'CAULDRON', 'ALEMBIC'],
    cadence: 1.15, combo: 0.3, keepDist: 0.3, standoff: 0, blockOdds: 0.3, aimMult: 1, tomeLust: true, fleeHp: 45, bully: false, chaos: false, nerve: 0.015,
  },
  // nobody knows what it wants, including itself — wild aim, wandering feet
  trickster: {
    names: ['JESTER', 'WOBBLES', 'GLITCHY', 'HOOPLA', 'KAZOO'],
    cadence: 0.85, combo: 0.3, keepDist: 0.25, standoff: 0, blockOdds: 0.25, aimMult: 1.3, tomeLust: false, fleeHp: 0, bully: false, chaos: true, nerve: 0.075,
  },
};
const PERSONA_ORDER = ['berserker', 'skirmisher', 'alchemist', 'trickster', 'balanced'];
let nextPersona = 0;

// ---------- navigation ground query ----------
// Bots used to ask groundYAt() (spells.js) what was underfoot. That helper scans
// a column from y=0 DOWNWARD and returns the topmost solid it finds, which is
// the right answer for "where does a meteor land" and the wrong answer for
// "what will I stand on" — any platform ABOVE the bot wins the scan. Measured on
// live matches, ~30% of ledge checks were reasoning about a ceiling, and falls
// were two thirds of all bot deaths.
//
// navGroundY answers the question the bot actually has: the highest surface at
// column x that is at or below fromY. Returns null when there is nothing to
// land on at all. AABB-based, so it's also far cheaper than the 60 Query.point
// calls groundYAt costs — which matters, because good ledge logic needs to ask
// several times per think.
// Anything you can stand on counts — NOT just static terrain. Crates and
// destructible blocks are dynamic bodies, and on a map like CRATE MOUNTAIN
// almost all the footing is made of them; a static-only query reports "no floor
// anywhere" and the bots freeze in place rather than fall. Excluded: things you
// can't stand on (projectiles, gibs), things that kill you (lava, spikes), and
// other wizards — a bot shouldn't path across someone's head.
const NAV_SKIP = new Set(['lava', 'spikes', 'projectile', 'gib', 'player', 'boss', 'enemy', 'tome', 'hat']);
let _navBodies = null, _navBodiesAt = 0;
function navCandidates() {
  const now = performance.now();
  if (!_navBodies || now - _navBodiesAt > 200) {
    // only the LIST is cached; bounds are read live at query time, so moving
    // platforms and tumbling crates still report their real position
    _navBodies = Composite.allBodies(world).filter(b => !b.isSensor && !NAV_SKIP.has(b.label));
    _navBodiesAt = now;
  }
  return _navBodies;
}

function navGroundY(x, fromY) {
  let best = null;
  for (const b of navCandidates()) {
    // mask is re-checked per query, not cached: phantom platforms blink solid
    // and non-solid on a timer, and standing on one that just vanished is a
    // death the bot should see coming
    if (b.collisionFilter.mask === 0) continue;
    if (x < b.bounds.min.x + 4 || x > b.bounds.max.x - 4) continue;
    if (b.bounds.min.y < fromY - 8) continue; // above the bot — a ceiling, not a floor
    if (best == null || b.bounds.min.y < best) best = b.bounds.min.y;
  }
  return best;
}

class BotController {
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
  // The lookahead has to cover everything the bot will traverse before its next
  // think (up to 280ms), so it scales with speed — and it samples ACROSS that
  // span rather than only at the far end, because a narrow gap between here and
  // there is still a hole to fall into.
  fallDanger(me, dir, vx = 0) {
    const look = Math.max(46, 42 + Math.abs(vx) * 14);
    const lava = currentMap.data.lavaY;
    // Two samples, not three: a gap narrower than the wizard is walked straight
    // over, so sampling too densely just makes the bot flinch at every seam
    // between two crates. 0.7 catches a real hole opening up mid-stride; 1.0 is
    // where the foot actually lands.
    for (const frac of [0.7, 1]) {
      const aheadX = Math.max(20, Math.min(W - 20, me.x + dir * look * frac));
      const g = navGroundY(aheadX, me.y);
      if (g == null) return true;                        // nothing to land on → open void
      if (lava != null && g > lava - 24) return true;    // the floor there sits under lava
      if (g - me.y > 300) return true;                   // a long drop onto real ground
    }
    return false;
  }

  // How far this wizard can actually carry a jump right now, level to level.
  // Measured in-engine: a running jump clears ~274px, a running jump followed by
  // the air jump ~424px, and a STANDING jump covers zero ground — distance comes
  // entirely from the speed you take off with. Bots used to commit to a gap on
  // geometry alone, so a bot ambling toward a 195px gap at walking pace jumped
  // and dropped straight in. (Caught one doing exactly that at takeoff speed 3.1.)
  jumpReach(p, vx) {
    const base = Math.abs(vx) * 36;
    return p.airJumps > 0 ? base * 1.5 : base; // the second jump buys ~55% more
  }

  // nearest direction with real footing within reach (used mid-air over death)
  safeGroundDir(me, lavaY) {
    for (let d = 60; d <= 380; d += 48) {
      for (const dir of [-1, 1]) {
        const x = me.x + dir * d;
        if (x < 30 || x > W - 30) continue;
        const g = navGroundY(x, me.y);
        if (g != null && (lavaY == null || g < lavaY - 24) && g - me.y < 300) return dir;
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
      const gBelow = navGroundY(me.x, me.y);
      if (gBelow == null || (lavaY != null && gBelow > lavaY - 24)) {
        const dir = this.safeGroundDir(me, lavaY) || (me.x > W / 2 ? -1 : 1);
        this.plan = { move: dir, jump: p.body.velocity.y > 2 && p.airJumps > 0, cast: false, cast2: false, aim: null, block: false };
        this.nextThink = now + 70; // panic reflexes
        return;
      }
    }
    // a ghost's wail rattles the circuits: drop the plan and scurry for a beat
    if (now < (p.spookedUntil || 0)) {
      this.plan = { move: pick([-1, 1]), jump: Math.random() < 0.3, cast: false, cast2: false, aim: null, block: false };
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
      if (tpos && Math.random() < 0.5) {
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
    // STALEMATE BREAKER: if nothing has taken damage in a while and the round
    // is still going, temperament stops mattering — everyone closes. Without
    // this a round can simply never end, which is worse than any bad fight.
    const stale = game.lastDamageAt != null && now - game.lastDamageAt > 7000;

    // RETREAT IS A MOVE, NOT A PERSONALITY.
    // Fleeing used to be a pure state test — below fleeHp, run away, forever.
    // Two wounded flee-capable bots therefore ran to opposite walls and stayed
    // there: measured at 1316px average separation (wider than the arena
    // itself), out of every spell's range 77% of the time, round never
    // resolving. Two fixes: you can only flee from a threat that's actually
    // near you, and a retreat is time-boxed and followed by a window where you
    // have to come back and fight.
    const FLEE_NEAR = 420;      // beyond this there is nothing to run from
    const REENGAGE_MS = 2800;   // after a retreat, no fleeing for this long
    let fleeing = false;
    if (!stale && m.fleeHp && tpos && goal === tpos && p.hp < m.fleeHp) {
      const dThreat = Math.hypot(tpos.x - me.x, tpos.y - me.y);
      if (now < (this.fleeUntil || 0)) fleeing = true;               // mid-retreat
      else if (now < (this.reengageUntil || 0)) fleeing = false;     // owe them a fight
      else if (dThreat < FLEE_NEAR) {                                // threat is real → break off
        this.fleeUntil = now + rand(900, 1700);
        this.reengageUntil = this.fleeUntil + REENGAGE_MS;
        fleeing = true;
      }
    }
    // a kiting standoff has the same failure mode, so it yields to staleness too
    const standoff = stale ? 0 : m.standoff;

    let move = 0;
    if (goal) {
      const dx = goal.x - me.x;
      const d = goal === tpos ? Math.hypot(tpos.x - me.x, tpos.y - me.y) : 1e9;
      if (fleeing) move = -Math.sign(dx || 1);
      else if (goal === tpos && standoff && d < standoff - 60) move = -Math.sign(dx || 1); // kite back out
      else if (Math.abs(dx) > 46 && !(goal === tpos && standoff && d < standoff + 60)) move = Math.sign(dx);
      else if (goal === tpos && !stale && Math.random() < m.keepDist) move = -Math.sign(dx || 1); // occasionally keep some distance
    } else if (Math.random() < 0.12) {
      move = pick([-1, 0, 1]);
    }
    if (m.chaos && Math.random() < 0.2) move = pick([-1, 0, 1]); // wandering feet
    if (me.x < 80) move = 1;
    if (me.x > W - 80) move = -1;

    const grounded = now - (p.lastGround || 0) < 220;
    let jump = false;

    // THE SECOND JUMP. Bots knew this game had a double jump only in the sense
    // that the lava-panic branch spent one while already plummeting. On a
    // deliberate gap leap they never used it, which capped them at ~274px of a
    // real ~424px range and left them dropping into gaps they could have
    // cleared. Now: if we're mid-leap, falling, and there's still nothing under
    // us, spend it — exactly when a player would.
    if (!grounded && now < (this.gapJumpUntil || 0) && p.airJumps > 0 && p.body.velocity.y > 1) {
      const dir = Math.sign(p.body.velocity.x) || p.facing || 1;
      const ahead = navGroundY(me.x + dir * 40, me.y);
      if (ahead == null || ahead - me.y > 130) jump = true;
    }
    if (currentMap.data.lavaY != null && me.y > currentMap.data.lavaY - 60) jump = true; // feet warm — bail off the lava

    // LEDGE SAFETY: don't stroll off a cliff into lava or a pit. If the goal is
    // that way, only leap when a safe landing is within jump range; else hold up.
    const vx = p.body.velocity.x;
    const lava = currentMap.data.lavaY;
    let vetoed = false;

    // NERVE: the roll happens at the moment of the veto — the instant the bot
    // has spotted the edge and is deciding whether to respect it. Rolling here
    // rather than once per think is what makes the rate tunable: `nerve` is
    // literally "odds of going anyway when you know better", instead of a
    // compound probability that in practice never fired.
    //
    // A blunder then COMMITS for ~half a second. A one-frame lapse achieves
    // nothing — the next think is 70ms later and the bot simply catches itself,
    // which is not a fall, it's a stutter. Staying committed is what carries it
    // over the lip.
    const blundering = now < (this.blunderUntil || 0);

    if (move && !blundering && this.fallDanger(me, move, vx)) {
      // is there a real landing across the gap? scan a spread of jump distances
      // instead of one fixed 135px guess — most gaps aren't exactly that wide
      // ...but only as far as this wizard can actually throw itself right now
      const reach = this.jumpReach(p, vx) * 0.85; // margin: land ON it, not at its lip
      let landDir = 0;
      for (const dist of [110, 135, 165, 195, 240, 300, 360]) {
        if (dist > reach) break;                  // ascending, so nothing further fits
        const landX = Math.max(24, Math.min(W - 24, me.x + move * dist));
        const gLand = navGroundY(landX, me.y);
        if (gLand == null) continue;
        if (lava != null && gLand > lava - 24) continue;
        if (gLand - me.y < 240 && gLand - me.y > -140) { landDir = move; break; }
      }
      const nerveOdds = (m.nerve ?? 0.03) * (fleeing ? 2.5 : 1);
      if (landDir && grounded) {                            // clear the gap on purpose
        jump = true;
        this.gapJumpUntil = now + 1100;                     // remember we're mid-leap
      }
      else if (Math.abs(vx) > 1.6 && Math.random() < nerveOdds) {
        this.blunderUntil = now + 520;                      // ...went for it anyway
      } else { move = 0; vetoed = true; }                   // refuse to step off
    }

    // BRAKING: refusing to walk off an edge does nothing about the speed already
    // carrying you there. A wizard at full tilt slides well past the lip after
    // its input drops to zero, which is how a bot that "decided not to" still
    // ends up in the lava. Counter-steer instead of coasting.
    // A bot mid-blunder doesn't catch itself either — that's what makes it a
    // blunder rather than a stumble.
    if (Math.abs(vx) > 1.2 && !blundering) {
      const slideDir = Math.sign(vx);
      // only brake if we aren't already steering away from the danger
      if (this.fallDanger(me, slideDir, vx) && (move === 0 || move === slideDir)) {
        move = -slideDir;
        vetoed = true;
      }
    }

    // and re-think sooner than the usual 130-280ms when standing next to death:
    // a slow tick is exactly how a bot walks off a ledge it already spotted
    if (vetoed) this.nextThink = now + 70;

    if (goal && goal.y < me.y - 70 && grounded && Math.random() < 0.4) jump = true;                       // goal is above → hop up
    if (move && Math.abs(p.body.velocity.x) < 0.5 && grounded && Math.random() < 0.3) jump = true;         // wedged against a wall
    if (m.chaos && grounded && Math.random() < 0.15) jump = true;                                          // hops for no reason

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
          if (r0 && r1 && Math.random() < m.combo) { cast = true; cast2 = true; } // two-slot combo
          else if (r0 && (!r1 || Math.random() < 0.6)) cast = true;               // usually one measured shot
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
          if ((cast || cast2) && now - (this.lastBeam || 0) < 950) { cast = cast2 = false; }        // beams on a measured cadence
          else if ((cast || cast2) && tspd > 6 && Math.random() < 0.4) { cast = cast2 = false; }    // hesitate at a fast mover
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
        if (d < 150 && (fb.velocity.x * dx + fb.velocity.y * dy) / (d || 1) > 5 && Math.random() < m.blockOdds) { block = true; break; }
      }
    }
    this.plan = { move, jump, cast, cast2, aim, block };
  }

  poll() {
    const now = performance.now();
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

function addBot(persona) {
  if (players.length >= MAX_PLAYERS) return;
  const bc = new BotController(persona);
  const used = new Set(players.map(p => p.name));
  const name = BOT_PERSONAS[bc.persona].names.find(n => !used.has(n))
    || BOT_PERSONAS.balanced.names.find(n => !used.has(n))
    || `BOT ${players.length + 1}`;
  joinPlayer(bc, name);
}
