import { defineEffect } from '../../core/draw.js';
import { paintDesk } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('pomodoro/water', 'Water Glass',
  (d, p, opts, fb) => paintDesk('water', d, p, opts, fb));
