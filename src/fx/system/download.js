import { defineEffect } from '../../core/draw.js';
import { paintSystem } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('system/download', 'Download',
  (d, p, opts, fb) => paintSystem('download', d, p, opts, fb));
