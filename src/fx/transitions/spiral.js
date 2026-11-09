import { defineEffect } from '../../core/draw.js';
import { paintTransition } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('transitions/spiral', 'Spiral',
  (d, p, opts, fb) => paintTransition('spiral', d, p, opts, fb));
