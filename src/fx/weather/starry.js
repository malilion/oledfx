import { defineEffect } from '../../core/draw.js';
import { paintWeather } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('weather/starry', 'Starry Night',
  (d, p, opts, fb) => paintWeather('starry', d, p, opts, fb));
