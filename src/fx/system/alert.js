import { defineEffect } from '../../core/draw.js';
import { paintSystem } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('system/alert', 'Alert',
  (d, p, opts, fb) => paintSystem('alert', d, p, opts, fb));
