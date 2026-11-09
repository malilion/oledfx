import { defineEffect } from '../../core/draw.js';
import { paintDesk } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('pomodoro/pencil', 'Pencil',
  (d, p, opts, fb) => paintDesk('pencil', d, p, opts, fb));
