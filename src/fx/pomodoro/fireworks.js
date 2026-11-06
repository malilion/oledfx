import { defineEffect } from '../../core/draw.js';
import { paintDesk } from '../_shared/packs.js';

// Pure, deterministic two-second loop; create() adds the step/draw interface.
export const { meta, draw, create } = defineEffect('pomodoro/fireworks', 'Fireworks',
  (d, p, opts, fb) => paintDesk('fireworks', d, p, opts, fb));
