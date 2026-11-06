import { defineEffect } from '../../core/draw.js';
import { paintDesk } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('pomodoro/nap', 'Power Nap',
  (d, p, opts, fb) => paintDesk('nap', d, p, opts, fb));
