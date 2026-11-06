import { defineEffect } from '../../core/draw.js';
import { paintDesk } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('pomodoro/desk-lamp', 'Desk Lamp',
  (d, p, opts, fb) => paintDesk('desk-lamp', d, p, opts, fb));
