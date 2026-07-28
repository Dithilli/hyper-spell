// cast-kind.js — what SHAPE is this spell?
//
// A tome tells you a spell's name and its colour. It never told you the one
// thing you need before you commit a cast: where the magic actually comes out.
// A ray fires the instant you click and needs line of sight; a mortar has to be
// arced; a sky-drop lands on a spot regardless of what's between you and it.
// Learning that per spell meant casting it once and watching — across 100+
// spells, most of which you see for ten seconds in a round you're losing.
//
// So every spell gets an ARCHETYPE, and the archetype gets one mark that is
// drawn identically on the tome, on pickup, and at the cursor. Read the mark,
// know the delivery.
//
// Tagging 100+ spells by hand would rot the moment someone adds another, so the
// archetype is INFERRED from the cast function's own source: the spell helpers
// (dropProjectile, summon, boomBolt, makeZone...) already encode delivery.
// Overrides below cover the handful that use a helper in an unusual way.
//
// Honest note on the ray rule: upstream's rationale was "a spell that calls
// zapRay is a ray whether or not anyone remembered to say so". On this branch
// every zapRay and raycastHit caller also carries `beam: true`, which
// short-circuits above the rules — so those two clauses currently decide
// nothing, and the rule earns its keep entirely through boltVisual. Same for
// statusBolt under 'bolt', which is always accompanied by boomBolt or shoot().
// They are kept as the insurance they were written to be (a spell that loses
// its flag still classifies correctly), but nobody should read a green suite as
// evidence that they work. The decisiveness test in test/cast-kind.test.js
// checks rules, not clauses, precisely because a clause may legitimately be
// dormant while a dead RULE never may.
//
// Ported from upstream js/spellcast.js (c1ee936). The rules read HELPER
// VOCABULARY, and this refactor changed the vocabulary — so a faithful copy is
// a broken copy. A rule that matches nothing fails SILENTLY: the spells it
// should have caught take the 'bolt' default and the label lies. What changed:
//
//   Bodies.rectangle(x, -40, …)  ->  createBox(x, -40, …)
//     spells build bodies through the phys facade now, so the namespace call
//     the drop rule keyed on survives only in src/sim/phys/matter-backend.js.
//     Unretargeted, anvil/piano/cratedrop/boulder all read as 'place'.
//   Body.setVelocity(p.body, …)  ->  removed
//     dead upstream too: the strip pass below removes `setVelocity(…)` before
//     the rules run, leaving a bare `Body.` the rule cannot match.
//   p.sizeScale =  ->  removed
//     dead in both trees. No spell writes it; the writers are pickups.js and
//     player/lifecycle.js. An earlier revision of this comment asserted it was
//     live, which is the same defect this file exists to prevent.
//   addVelocity(…) is now stripped alongside setVelocity
//     both are impulse verbs. Updraft shoves bodies UPWARD with
//     `addVelocity(b, { x: 0, y: -18 * m })`, and unstripped that `y: -18` read
//     as a spawn height — labelling the game's clearest anti-gravity spell
//     "Falls from above". sandstorm and earthquake were one digit away from
//     the same fate.
//
// And three clauses are NEW, for delivery shapes this branch expresses with
// verbs upstream did not have: makeZone (place), pushGravity/healPlayer (self),
// allBodies (nova — a spell that moves every body in the world is one where aim
// cannot matter).
//
// test/cast-kind.test.js pins a spell per archetype AND asserts every rule is
// decisive — that disabling it changes at least one verdict. The latter matters
// because four of the six archetypes are held non-empty by the beam/selfMove
// flags, the overrides and the default, so "every archetype is populated" can
// be true while half the rules are dead.
import { SPELLS } from './registry.js';

export const CAST_KINDS = {
  // ordered most-specific first; the first rule that matches wins
  drop:  { label: 'Falls from above', hint: 'lands on the spot you aim at' },
  ray:   { label: 'Instant ray',      hint: 'fires in a straight line, right now' },
  nova:  { label: 'Bursts from you',  hint: 'radiates outward — aim does not matter' },
  place: { label: 'Places something', hint: 'leaves a thing at the spot' },
  self:  { label: 'Self',             hint: 'changes you, not them' },
  bolt:  { label: 'Thrown bolt',      hint: 'travels and arcs — lead your target' },
};

// Spells whose source reads like one thing but plays like another. Upstream's
// four, plus six this branch needs because the spell's headline verb is not the
// one that decides how you use it. Each was checked by reading the cast.
const CAST_OVERRIDES = {
  chain: 'ray',        // draws bolt visuals rather than a ray, but it is hitscan
  boomerang: 'bolt',   // comes back to you; on the way out it is still a thrown bolt
  gust: 'nova',        // a cone off your own hands, not an aimed projectile
  shove: 'nova',       // a short shunt at contact range; nothing leaves your hands
  // --- this branch ---
  teslacoil: 'place',  // boltVisual zaps are the payload; the static coil you leave behind is the spell
  beehive: 'place',    // shoot() sends the bees, but what you cast is a hive at a spot
  midas: 'ray',        // nearestEnemy(p, 320) + freeze: instant, at range, no travel time.
                       // A `nearestEnemy` RULE is not available — Homing Wisp calls it
                       // every tick in its update and is the most ordinary bolt there is.
  soulharvest: 'nova', // drains every enemy within 420px of you; the tethers are cosmetic
  voodoo: 'nova',      // same shape at 440px
  boobytrap: 'place',  // arms a charge at the nearest enemy's feet — placed, not thrown
};

// Order matters, and the order IS the reasoning:
//
//  - a hand-authored flag beats any inference (beam/selfMove predate this file)
//  - falling-from-above wins over everything: what you aim at is a spot on the
//    ground, and that changes how you use it more than what the payload is
//  - a ray is next because "fires instantly in a line" is the other delivery you
//    must know before you commit
//  - THEN thrown bolts, before place/nova/self. The order IS load-bearing, but
//    not for the reason upstream's comment gives: it names Fireball and Homing
//    Wisp, and neither matches the nova or self regexes at all, so neither
//    would move. Measured by demoting the bolt rule below place/nova/self, the
//    spells that actually change are sandstorm and inferno (-> nova) and
//    beehive (-> place). That is what this ordering protects.
//  - place/nova/self mop up the rest; anything unrecognised is called a bolt,
//    which is both the commonest shape and the least misleading thing to imply
export const CAST_RULES = [
  // a body constructed above the top of the screen, or far above its target, is
  // being dropped — this is what separates Anvil and Rain of Frogs (drop) from
  // Black Cat and Rubber Duck (place), all four of which are summons
  // Two guards here are load-bearing, both learned the hard way:
  //   [^A-Za-z]y:  — a bare /y:\s*-\d/ also matches the `vy: -6` in every
  //                  ordinary shoot() call, which called half the game rain
  //   -\d{2,}      — spawn heights are -30 and up; single digits are impulses
  // (setVelocity is stripped from the source before this runs, for the same reason)
  // the body-constructor alternation is spelled out in full rather than as
  // `create(?:Box|…)` because test/no-undefined-identifiers.test.js reads the
  // shape `name(` as a call and does not strip regex literals — the short form
  // makes this file look like it calls an undeclared create()
  ['drop',  /dropProjectile|skyBolt|(?:createBox|createCircle|createPolygon)\s*\([^,]*,\s*-\d|[^A-Za-z]y:\s*-\d{2,}|position\.y\s*-\s*(?:2[0-9]{2}|[3-9][0-9]{2})/],
  ['ray',   /zapRay|raycastHit|boltVisual/],
  ['bolt',  /boomBolt|statusBolt|shoot\s*\(/],
  // makeZone is this branch's verb for "a patch of ground that does something".
  // Only an EXPLICITLY positioned one is a placement — `makeZone({ x: pos.x`,
  // where pos came from frontPos (Blizzard, Flame Wall). A zone opened with
  // shorthand `{ x, y,` is centred on whatever the caster already is, and that
  // is a nova; see the clause below. (Napalm also opens a shorthand zone, at
  // its fireball's impact point, but the bolt rule above claims it first — it
  // is a thrown bolt that happens to leave a fire behind.)
  ['place', /summonCritter|summon\s*\(|makeZone\s*\(\s*\{\s*x:/],
  // allBodies() is the whole-world shape: if a spell moves every body there is,
  // there is nothing to aim at. Likewise a zone centred on you (Repulsor Field).
  ['nova',  /enemiesOf\s*\(\s*p\s*\)|explode\s*\(\s*p\.body\.position|allBodies\s*\(|makeZone\s*\(\s*\{\s*x,/],
  // pushGravity changes the world you both stand in; healPlayer(p) changes you
  ['self',  /p\.\w+Until\s*=|pushGravity\s*\(|healPlayer\s*\(\s*p\b/],
];

// `rules` is injectable so test/cast-kind.test.js can disable one rule at a
// time and assert it was decisive for at least one spell. A rule nobody's
// verdict depends on is indistinguishable from a rule that has gone dead.
export function classifyCast(id, def, rules = CAST_RULES) {
  if (CAST_OVERRIDES[id]) return CAST_OVERRIDES[id];
  if (def.beam) return 'ray';
  if (def.selfMove) return 'self';
  // Strip the impulse verbs first: `setVelocity(b, { x: .., y: -5 })` and
  // `addVelocity(b, { x: 0, y: -18 })` are launches, and must not be read as
  // "this body is constructed above the screen".
  const src = (typeof def.cast === 'function' ? String(def.cast) : '')
    .replace(/(?:set|add)Velocity\s*\([^)]*\)/g, '');
  for (const [kind, re] of rules) if (re.test(src)) return kind;
  return 'bolt';
}

// Resolved once at load and cached on the def, so the reticle isn't re-running
// regexes over function source every frame.
export function castKind(id) {
  const def = id && SPELLS[id];
  if (!def) return null;
  if (!def._cast) def._cast = classifyCast(id, def);
  return def._cast;
}

export function classifyAllCasts() {
  const out = {};
  for (const id of Object.keys(SPELLS)) out[id] = castKind(id);
  return out;
}
