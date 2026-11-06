import { defineEffect } from '../../core/draw.js';
import { paintSystem } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('system/signal', 'Signal Bars',
  (d, p, opts, fb) => paintSystem('signal', d, p, opts, fb));
