import { defineEffect } from '../../core/draw.js';
import { paintDesk } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('pomodoro/checklist', 'Checklist',
  (d, p, opts, fb) => paintDesk('checklist', d, p, opts, fb));
