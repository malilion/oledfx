import { defineEffect } from '../../core/draw.js';
import { paintWeather } from '../_shared/packs.js';

// Pure, deterministic two-second loop; create() adds the step/draw interface.
export const { meta, draw, create } = defineEffect('weather/snow', 'Snow',
  (d, p, opts, fb) => paintWeather('snow', d, p, opts, fb));
