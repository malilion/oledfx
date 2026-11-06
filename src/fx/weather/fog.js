import { defineEffect } from '../../core/draw.js';
import { paintWeather } from '../_shared/packs.js';

// Pure, deterministic two-second loop; create() adds the step/draw interface.
export const { meta, draw, create } = defineEffect('weather/fog', 'Fog',
  (d, p, opts, fb) => paintWeather('fog', d, p, opts, fb));
