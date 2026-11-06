import { defineEffect } from '../../core/draw.js';
import { paintTransition } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('transitions/pixels', 'Pixelate',
  (d, p, opts, fb) => paintTransition('pixels', d, p, opts, fb));
