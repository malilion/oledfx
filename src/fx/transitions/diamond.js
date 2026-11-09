import { defineEffect } from '../../core/draw.js';
import { paintTransition } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('transitions/diamond', 'Diamond',
  (d, p, opts, fb) => paintTransition('diamond', d, p, opts, fb));
