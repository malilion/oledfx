import { defineEffect } from '../../core/draw.js';
import { paintSystem } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('system/speaker', 'Speaker',
  (d, p, opts, fb) => paintSystem('speaker', d, p, opts, fb));
