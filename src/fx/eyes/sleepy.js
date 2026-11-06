import { defineEffect } from '../../core/draw.js';
import { paintEyes } from '../_shared/eyes.js';

// Pure, deterministic two-second loop; create() adds the step/draw interface.
export const { meta, draw, create } = defineEffect('eyes/sleepy', 'Sleepy',
  (d, p, opts, fb) => paintEyes('sleepy', d, p, opts, fb), { eyes: true });
