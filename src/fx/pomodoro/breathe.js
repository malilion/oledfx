import { defineEffect } from '../../core/draw.js';
import { paintDesk } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('pomodoro/breathe', 'Breathe',
  (d, p, opts, fb) => paintDesk('breathe', d, p, opts, fb));
