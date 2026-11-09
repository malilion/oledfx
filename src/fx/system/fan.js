import { defineEffect } from '../../core/draw.js';
import { paintSystem } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('system/fan', 'Cooling Fan',
  (d, p, opts, fb) => paintSystem('fan', d, p, opts, fb));
