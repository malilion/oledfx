import { defineEffect } from '../../core/draw.js';
import { paintSystem } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('system/mic', 'Microphone',
  (d, p, opts, fb) => paintSystem('mic', d, p, opts, fb));
