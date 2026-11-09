import { defineEffect } from '../../core/draw.js';
import { paintSystem } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('system/usb', 'USB',
  (d, p, opts, fb) => paintSystem('usb', d, p, opts, fb));
