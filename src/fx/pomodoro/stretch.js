import { defineEffect } from '../../core/draw.js';
import { paintDesk } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('pomodoro/stretch', 'Stretch Break',
  (d, p, opts, fb) => paintDesk('stretch', d, p, opts, fb));
