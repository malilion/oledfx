import { defineEffect } from '../../core/draw.js';
import { paintSystem } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('system/lock', 'Lock',
  (d, p, opts, fb) => paintSystem('lock', d, p, opts, fb));
