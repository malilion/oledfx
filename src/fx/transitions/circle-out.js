import { defineEffect } from '../../core/draw.js';
import { paintTransition } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('transitions/circle-out', 'Circle Out',
  (d, p, opts, fb) => paintTransition('circle-out', d, p, opts, fb));
