import { defineEffect } from '../../core/draw.js';
import { paintDesk } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('pomodoro/letter', 'Letter',
  (d, p, opts, fb) => paintDesk('letter', d, p, opts, fb));
