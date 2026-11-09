import { defineEffect } from '../../core/draw.js';
import { paintTransition } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('transitions/fade-center', 'Fade Center',
  (d, p, opts, fb) => paintTransition('fade-center', d, p, opts, fb));
