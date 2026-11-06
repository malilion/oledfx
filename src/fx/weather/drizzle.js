import { defineEffect } from '../../core/draw.js';
import { paintWeather } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('weather/drizzle', 'Drizzle',
  (d, p, opts, fb) => paintWeather('drizzle', d, p, opts, fb));
