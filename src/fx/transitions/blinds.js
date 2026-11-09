import { defineEffect } from '../../core/draw.js';
import { paintTransition } from '../_shared/packs.js';

// Pure, deterministic two-second loop; create() adds the step/draw interface.
export const { meta, draw, create } = defineEffect('transitions/blinds', 'Blinds',
  (d, p, opts, fb) => paintTransition('blinds', d, p, opts, fb));
