import { defineEffect } from '../../core/draw.js';
import { paintWeather } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('weather/rainbow', 'Rainbow',
  (d, p, opts, fb) => paintWeather('rainbow', d, p, opts, fb));
