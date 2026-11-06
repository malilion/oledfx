import { defineEffect } from '../../core/draw.js';
import { paintSystem } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('system/unlock', 'Unlocked',
  (d, p, opts, fb) => paintSystem('unlock', d, p, opts, fb));
