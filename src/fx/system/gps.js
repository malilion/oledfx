import { defineEffect } from '../../core/draw.js';
import { paintSystem } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('system/gps', 'GPS',
  (d, p, opts, fb) => paintSystem('gps', d, p, opts, fb));
