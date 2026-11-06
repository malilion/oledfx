import { defineEffect } from '../../core/draw.js';
import { paintSystem } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('system/bell', 'Bell',
  (d, p, opts, fb) => paintSystem('bell', d, p, opts, fb));
