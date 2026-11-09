import { defineEffect } from '../../core/draw.js';
import { paintSystem } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('system/sync', 'Sync Arrows',
  (d, p, opts, fb) => paintSystem('sync', d, p, opts, fb));
