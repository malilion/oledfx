import { defineEffect } from '../../core/draw.js';
import { paintWeather } from '../_shared/packs.js';

// Pure, deterministic two-second loop; create() adds the step/draw interface.
export const { meta, draw, create } = defineEffect('weather/wind', 'Wind',
  (d, p, opts, fb) => paintWeather('wind', d, p, opts, fb));
