import { defineEffect } from '../../core/draw.js';
import { paintSystem } from '../_shared/packs.js';

// Pure, deterministic two-second loop; create() adds the step/draw interface.
export const { meta, draw, create } = defineEffect('system/thermometer', 'Thermometer',
  (d, p, opts, fb) => paintSystem('thermometer', d, p, opts, fb));
