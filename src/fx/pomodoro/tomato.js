import { defineEffect } from '../../core/draw.js';
import { paintDesk } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('pomodoro/tomato', 'Tomato Timer',
  (d, p, opts, fb) => paintDesk('tomato', d, p, opts, fb));
