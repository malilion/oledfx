import { defineEffect } from '../../core/draw.js';
import { paintTransition } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('transitions/slide-up', 'Slide Up',
  (d, p, opts, fb) => paintTransition('slide-up', d, p, opts, fb));
