import { defineEffect } from '../../core/draw.js';
import { paintWeather } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('weather/frost', 'Frost',
  (d, p, opts, fb) => paintWeather('frost', d, p, opts, fb));
