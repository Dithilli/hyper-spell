// bot.js — dumb-but-fun AI wizards for solo play and testing.
// Press B in the lobby to add one. A BotController is a drop-in controller:
// it polls like a keyboard/gamepad, so bots work in couch and host modes
// and look like ordinary players to LAN clients.
const BOT_NAMES = ['BOTLIN', 'CLANKY', 'SPARKY', 'RUSTY', 'GIZMO', 'WIZ-E', 'COGSWORTH', 'BLIP'];

class BotController {
  constructor() {
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
  fallDanger(me, dir) {
    const aheadX = Math.max(20, Math.min(W - 20, me.x + dir * 42));
    const gAhead = groundYAt(aheadX);
    const lava = currentMap.data.lavaY;
    if (lava != null && gAhead > lava - 24) return true; // ground ahead sits under lava → you'd land in it
    if (gAhead >= H - 31) return true;                   // no platform ahead at all → open void
    return gAhead - me.y > 300;                          // a long drop onto real ground
  }

  think(p, now) {
    const me = p.body.position;
    // target: the boss during boss rounds, otherwise the nearest wizard
    let tpos = null, tbody = null, vsBoss = false;
    if (game.boss?.announced) { tbody = game.boss.body; tpos = tbody.position; vsBoss = true; }
    else {
      const t = nearestEnemy(p);
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
    }

    let move = 0;
    if (goal) {
      const dx = goal.x - me.x;
      if (Math.abs(dx) > 46) move = Math.sign(dx);
      else if (goal === tpos && Math.random() < 0.15) move = -Math.sign(dx || 1); // occasionally keep some distance
    } else if (Math.random() < 0.12) {
      move = pick([-1, 0, 1]);
    }
    if (me.x < 80) move = 1;
    if (me.x > W - 80) move = -1;

    const grounded = now - (p.lastGround || 0) < 220;
    let jump = false;
    if (currentMap.data.lavaY != null && me.y > currentMap.data.lavaY - 60) jump = true; // feet warm — bail off the lava

    // LEDGE SAFETY: don't stroll off a cliff into lava or a pit. If the goal is
    // that way, only leap when a safe landing is within jump range; else hold up.
    if (move && this.fallDanger(me, move)) {
      const landX = Math.max(24, Math.min(W - 24, me.x + move * 135));
      const gLand = groundYAt(landX);
      const lava = currentMap.data.lavaY;
      const safeLanding = (lava == null || gLand < lava - 24) && gLand - me.y < 240 && gLand - me.y > -140;
      if (safeLanding && grounded) jump = true; // clear the gap on purpose
      else move = 0;                            // otherwise refuse to step off
    }

    if (goal && goal.y < me.y - 70 && grounded && Math.random() < 0.4) jump = true;                       // goal is above → hop up
    if (move && Math.abs(p.body.velocity.x) < 0.5 && grounded && Math.random() < 0.3) jump = true;         // wedged against a wall

    let cast = false, cast2 = false, aim = null;
    if (tpos && (p.slots[0] || p.slots[1])) {
      const d = Math.hypot(tpos.x - me.x, tpos.y - me.y);
      if (d < 620) {
        // deliberate cadence: a bot lands a single aimed shot at a time, only
        // occasionally comboing both slots — no machine-gun spray.
        if (now - (this.lastShot || 0) > 520) {
          const r0 = p.slots[0] && now - p.casts[0] > (SPELLS[p.slots[0]].cooldown || 0);
          const r1 = p.slots[1] && now - p.casts[1] > (SPELLS[p.slots[1]].cooldown || 0);
          if (r0 && r1 && Math.random() < 0.22) { cast = true; cast2 = true; }   // rare two-slot combo
          else if (r0 && (!r1 || Math.random() < 0.6)) cast = true;              // usually one measured shot
          else if (r1) cast2 = true;
        }
        // human-ish aim: wobblier at range and against fast movers — and much
        // wobblier with hitscan beams, which land the instant they fire. Bots
        // were zap snipers; now a beam is a hopeful crackle, not a laser scalpel.
        const firingId = cast ? p.slots[0] : cast2 ? p.slots[1] : (p.slots[0] || p.slots[1]);
        const beam = !!(firingId && SPELLS[firingId]?.beam);
        const tspd = tbody ? Math.hypot(tbody.velocity.x, tbody.velocity.y) : 0;
        let err = 0.07 + d * 0.00012 + tspd * 0.014;
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
        if (d < 150 && (fb.velocity.x * dx + fb.velocity.y * dy) / (d || 1) > 5 && Math.random() < 0.3) { block = true; break; }
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

function addBot() {
  if (players.length >= MAX_PLAYERS) return;
  const used = new Set(players.map(p => p.name));
  const name = BOT_NAMES.find(n => !used.has(n)) || `BOT ${players.length + 1}`;
  joinPlayer(new BotController(), name);
}
