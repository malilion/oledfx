import { defineEffect } from '../../core/draw.js';
import { paintWeather } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('weather/aurora', 'Aurora',
  (d, p, opts, fb) => paintWeather('aurora', d, p, opts, fb));
