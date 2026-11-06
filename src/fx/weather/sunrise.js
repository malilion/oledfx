import { defineEffect } from '../../core/draw.js';
import { paintWeather } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('weather/sunrise', 'Sunrise',
  (d, p, opts, fb) => paintWeather('sunrise', d, p, opts, fb));
