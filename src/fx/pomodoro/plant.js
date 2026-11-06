import { defineEffect } from '../../core/draw.js';
import { paintDesk } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('pomodoro/plant', 'Desk Plant',
  (d, p, opts, fb) => paintDesk('plant', d, p, opts, fb));
