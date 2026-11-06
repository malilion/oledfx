import { defineEffect } from '../../core/draw.js';
import { paintDesk } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('pomodoro/candle', 'Candle',
  (d, p, opts, fb) => paintDesk('candle', d, p, opts, fb));
