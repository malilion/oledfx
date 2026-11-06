import { defineEffect } from '../../core/draw.js';
import { paintDesk } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('pomodoro/notebook', 'Notebook',
  (d, p, opts, fb) => paintDesk('notebook', d, p, opts, fb));
