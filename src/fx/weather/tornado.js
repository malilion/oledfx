import { defineEffect } from '../../core/draw.js';
import { paintWeather } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('weather/tornado', 'Tornado',
  (d, p, opts, fb) => paintWeather('tornado', d, p, opts, fb));
