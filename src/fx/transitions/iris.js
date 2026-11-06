import { defineEffect } from '../../core/draw.js';
import { paintTransition } from '../_shared/packs.js';

// Pure, deterministic two-second loop; create() adds the step/draw interface.
export const { meta, draw, create } = defineEffect('transitions/iris', 'Iris',
  (d, p, opts, fb) => paintTransition('iris', d, p, opts, fb));
