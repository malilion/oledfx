import { defineEffect } from '../../core/draw.js';
import { paintEyes } from '../_shared/eyes.js';

// Pure, deterministic two-second loop; create() adds the step/draw interface.
export const { meta, draw, create } = defineEffect('eyes/sparkle', 'Sparkle',
  (d, p, opts, fb) => paintEyes('sparkle', d, p, opts, fb), { eyes: true });
