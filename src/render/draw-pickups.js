// draw-pickups.js — storybook grimoire, mega hat and catalyst, all from artkit.
import { ctx } from './canvas.js';
import { drawStoryCatalyst, drawStoryHat, drawStoryTome } from './artkit.js';
import { tomes, hats } from '../sim/pickups.js';
import { SPELLS } from '../sim/spells/registry.js';
import { TIER_COLOR, TIER_RANK, spellTier } from '../sim/spells/tiers.js';

// storybook grimoire, mega hat and catalyst all render from artkit.js
export function drawTomeAt(x, y, angle, spellColor, now, tier) {
  const rank = TIER_RANK[tier] || 0;
  drawStoryTome(ctx, { x, y, angle, now, color: spellColor, rank, rarityColor: TIER_COLOR[tier] });
}

export function drawCatalystAt(x, y, angle, now) {
  drawStoryCatalyst(ctx, { x, y, angle, now });
}

export function drawHatAt(x, y, angle, now) {
  drawStoryHat(ctx, { x, y, angle, now });
}

export function drawTomes(now) {
  for (const t of tomes) {
    if (t.catalyst) drawCatalystAt(t.position.x, t.position.y, t.angle, now);
    else drawTomeAt(t.position.x, t.position.y, t.angle, SPELLS[t.spell].color, now, spellTier(t.spell));
  }
  for (const h of hats) drawHatAt(h.position.x, h.position.y, h.angle, now);
}
