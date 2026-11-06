import { defineEffect } from '../../core/draw.js';
import { paintWeather } from '../_shared/packs.js';

// Pure, deterministic two-second loop; create() adds the step/draw interface.
export const { meta, draw, create } = defineEffect('weather/moon', 'Moon',
  (d, p, opts, fb) => paintWeather('moon', d, p, opts, fb));
