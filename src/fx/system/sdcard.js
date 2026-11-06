import { defineEffect } from '../../core/draw.js';
import { paintSystem } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('system/sdcard', 'SD Card',
  (d, p, opts, fb) => paintSystem('sdcard', d, p, opts, fb));
