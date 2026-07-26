// fx.js — drawing the particle field. The particles themselves are spawned and
// stepped in src/sim/fx.js, because their randomness is part of the sim stream.
import { ctx } from './canvas.js';
import { drawStoryParticles } from './artkit.js';
import { particles } from '../sim/fx.js';

export function drawParticles() {
  drawStoryParticles(ctx, particles); // storybook embers/motes/sigil rings (render/artkit.js)
}
