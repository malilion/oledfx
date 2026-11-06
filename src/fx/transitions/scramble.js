import { defineEffect } from '../../core/draw.js';
import { paintTransition } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('transitions/scramble', 'Scramble',
  (d, p, opts, fb) => paintTransition('scramble', d, p, opts, fb));
