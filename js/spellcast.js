// spellcast.js — what SHAPE is this spell?
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
// (zapRay, dropProjectile, summon, boomBolt...) already encode delivery, and a
// spell that calls zapRay is a ray whether or not anyone remembered to say so.
// Overrides below cover the handful that use a helper in an unusual way.

const CAST_KINDS = {
  // ordered most-specific first; the first rule that matches wins
  drop:  { label: 'Falls from above', hint: 'lands on the spot you aim at' },
  ray:   { label: 'Instant ray',      hint: 'fires in a straight line, right now' },
  nova:  { label: 'Bursts from you',  hint: 'radiates outward — aim does not matter' },
  place: { label: 'Places something', hint: 'leaves a thing at the spot' },
  self:  { label: 'Self',             hint: 'changes you, not them' },
  bolt:  { label: 'Thrown bolt',      hint: 'travels and arcs — lead your target' },
};

// spells whose source reads like one thing but plays like another
const CAST_OVERRIDES = {
  chain: 'ray',        // draws bolt visuals rather than a ray, but it is hitscan
  boomerang: 'bolt',   // comes back to you; on the way out it is still a thrown bolt
  gust: 'nova',        // a cone off your own hands, not an aimed projectile
  shove: 'nova',       // a short shunt at contact range; nothing leaves your hands
};

// Order matters, and the order IS the reasoning:
//
//  - a hand-authored flag beats any inference (beam/selfMove predate this file)
//  - falling-from-above wins over everything: what you aim at is a spot on the
//    ground, and that changes how you use it more than what the payload is
//  - a ray is next because "fires instantly in a line" is the other delivery you
//    must know before you commit
//  - THEN thrown bolts, before nova/self. This ordering matters: Fireball takes
//    recoil and Homing Wisp calls nearestEnemy in its update, so a self/nova rule
//    placed earlier swallows the two most ordinary bolts in the game
//  - place/nova/self mop up the rest; anything unrecognised is called a bolt,
//    which is both the commonest shape and the least misleading thing to imply
const CAST_RULES = [
  // a body constructed above the top of the screen, or far above its target, is
  // being dropped — this is what separates Anvil and Rain of Frogs (drop) from
  // Black Cat and Rubber Duck (place), all four of which are summons
  // Two guards here are load-bearing, both learned the hard way:
  //   [^A-Za-z]y:  — a bare /y:\s*-\d/ also matches the `vy: -6` in every
  //                  ordinary shoot() call, which called half the game rain
  //   -\d{2,}      — spawn heights are -30 and up; single digits are impulses
  // (setVelocity is stripped from the source before this runs, for the same reason)
  ['drop',  /dropProjectile|skyBolt|Bodies\.\w+\([^,]*,\s*-\d|[^A-Za-z]y:\s*-\d{2,}|position\.y\s*-\s*(?:2[0-9]{2}|[3-9][0-9]{2})/],
  ['ray',   /zapRay|raycastHit|boltVisual/],
  ['bolt',  /boomBolt|statusBolt|shoot\s*\(/],
  ['place', /summonCritter|summon\s*\(/],
  ['nova',  /enemiesOf\s*\(\s*p\s*\)|explode\s*\(\s*p\.body\.position/],
  ['self',  /p\.\w+Until\s*=|Body\.setVelocity\s*\(\s*p\.body|p\.sizeScale\s*=/],
];

function classifyCast(id, def) {
  if (CAST_OVERRIDES[id]) return CAST_OVERRIDES[id];
  if (def.beam) return 'ray';
  if (def.selfMove) return 'self';
  // strip velocity literals first: `setVelocity(b, { x: .., y: -5 })` is a launch
  // impulse and must not be read as "this body is constructed above the screen"
  const src = (typeof def.cast === 'function' ? String(def.cast) : '')
    .replace(/setVelocity\s*\([^)]*\)/g, '');
  for (const [kind, re] of CAST_RULES) if (re.test(src)) return kind;
  return 'bolt';
}

// Resolved once at load and cached on the def, so the reticle isn't re-running
// regexes over function source every frame.
function castKind(id) {
  const def = id && SPELLS[id];
  if (!def) return null;
  if (!def._cast) def._cast = classifyCast(id, def);
  return def._cast;
}

function classifyAllCasts() {
  for (const id of Object.keys(SPELLS)) castKind(id);
}
