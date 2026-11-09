import { defineEffect } from '../../core/draw.js';
import { paintWeather } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('weather/comet', 'Comet',
  (d, p, opts, fb) => paintWeather('comet', d, p, opts, fb));
