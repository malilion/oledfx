import { defineEffect } from '../../core/draw.js';
import { paintTransition } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('transitions/bars', 'Bar Wipe',
  (d, p, opts, fb) => paintTransition('bars', d, p, opts, fb));
