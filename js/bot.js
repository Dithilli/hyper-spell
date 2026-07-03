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
    return { move: 0, jump: false, cast: false, jumpPressed: false, castPressed: false, startPressed: false, aimPoint: null, aimVec: null, aimAngle: null };
  }

  think(p, now) {
    const me = p.body.position;
    // target: the boss during boss rounds, otherwise the nearest wizard
    let tpos = null;
    if (game.boss?.announced) tpos = game.boss.body.position;
    else {
      const t = nearestEnemy(p);
      if (t) tpos = t.body.position;
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
      if (Math.abs(dx) > 40) move = Math.sign(dx);
      else if (goal === tpos && Math.random() < 0.4) move = -Math.sign(dx || 1); // back off a little
    } else if (Math.random() < 0.3) {
      move = pick([-1, 0, 1]);
    }
    if (me.x < 70) move = 1;
    if (me.x > W - 70) move = -1;

    let jump = false;
    if (currentMap.data.lavaY != null && me.y > currentMap.data.lavaY - 55) jump = true; // feet getting warm
    if (move && Math.abs(p.body.velocity.x) < 0.6 && Math.random() < 0.5) jump = true;  // probably stuck on a wall
    if (goal && goal.y < me.y - 60 && Math.random() < 0.35) jump = true;                // goal is above
    if (Math.random() < 0.06) jump = true;                                              // nervous hop

    let cast = false, aim = null;
    if (p.spellId && tpos) {
      const d = Math.hypot(tpos.x - me.x, tpos.y - me.y);
      const ready = now - p.lastCast > (SPELLS[p.spellId].cooldown || 0);
      if (ready && d < 640 && Math.random() < 0.75) {
        cast = true;
        aim = Math.atan2(tpos.y - me.y, tpos.x - me.x) + rand(-0.14, 0.14); // wobbly aim on purpose
      }
    }
    this.plan = { move, jump, cast, aim };
  }

  poll() {
    const now = performance.now();
    const p = this.player ??= players.find(q => q.controller === this);
    if (!p || !p.alive || (game.state !== 'PLAY' && game.state !== 'LOBBY')) return this.idle();
    if (now > this.nextThink) {
      this.nextThink = now + rand(130, 280);
      this.think(p, now);
    }
    const { move, jump, cast, aim } = this.plan;
    const s = {
      move, jump, cast,
      jumpPressed: jump && !this.prevJump,
      castPressed: cast && !this.prevCast,
      startPressed: false,
      aimPoint: null, aimVec: null,
      aimAngle: aim,
    };
    this.prevJump = jump;
    this.prevCast = cast;
    return s;
  }
}

function addBot() {
  if (players.length >= MAX_PLAYERS) return;
  const used = new Set(players.map(p => p.name));
  const name = BOT_NAMES.find(n => !used.has(n)) || `BOT ${players.length + 1}`;
  joinPlayer(new BotController(), name);
}
