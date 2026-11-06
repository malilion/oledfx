import { defineEffect } from '../../core/draw.js';
import { paintWeather } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('weather/sandstorm', 'Sandstorm',
  (d, p, opts, fb) => paintWeather('sandstorm', d, p, opts, fb));
