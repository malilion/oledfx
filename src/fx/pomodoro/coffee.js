import { defineEffect } from '../../core/draw.js';
import { paintDesk } from '../_shared/packs.js';

// Pure, deterministic two-second loop; create() adds the step/draw interface.
export const { meta, draw, create } = defineEffect('pomodoro/coffee', 'Coffee',
  (d, p, opts, fb) => paintDesk('coffee', d, p, opts, fb));
