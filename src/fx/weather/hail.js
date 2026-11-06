import { defineEffect } from '../../core/draw.js';
import { paintWeather } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('weather/hail', 'Hail',
  (d, p, opts, fb) => paintWeather('hail', d, p, opts, fb));
