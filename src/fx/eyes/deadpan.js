import { defineEffect } from '../../core/draw.js';
import { paintEyes } from '../_shared/eyes.js';

// Pure, deterministic two-second loop; create() adds the step/draw interface.
export const { meta, draw, create } = defineEffect('eyes/deadpan', 'Deadpan',
  (d, p, opts, fb) => paintEyes('deadpan', d, p, opts, fb), { eyes: true });
