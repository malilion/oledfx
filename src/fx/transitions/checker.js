import { defineEffect } from '../../core/draw.js';
import { paintTransition } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('transitions/checker', 'Checker',
  (d, p, opts, fb) => paintTransition('checker', d, p, opts, fb));
