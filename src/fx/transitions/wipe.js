import { defineEffect } from '../../core/draw.js';
import { paintTransition } from '../_shared/packs.js';

// Pure, deterministic two-second loop; create() adds the step/draw interface.
export const { meta, draw, create } = defineEffect('transitions/wipe', 'Wipe',
  (d, p, opts, fb) => paintTransition('wipe', d, p, opts, fb));
