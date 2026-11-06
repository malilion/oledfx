import { defineEffect } from '../../core/draw.js';
import { paintTransition } from '../_shared/packs.js';

// Pure, deterministic two-second loop; create() adds the step/draw interface.
export const { meta, draw, create } = defineEffect('transitions/radar', 'Radar',
  (d, p, opts, fb) => paintTransition('radar', d, p, opts, fb));
