import { defineEffect } from '../../core/draw.js';
import { paintDesk } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('pomodoro/tea', 'Tea Steam',
  (d, p, opts, fb) => paintDesk('tea', d, p, opts, fb));
