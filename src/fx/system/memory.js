import { defineEffect } from '../../core/draw.js';
import { paintSystem } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('system/memory', 'Memory',
  (d, p, opts, fb) => paintSystem('memory', d, p, opts, fb));
