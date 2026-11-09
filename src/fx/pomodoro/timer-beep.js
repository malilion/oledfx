import { defineEffect } from '../../core/draw.js';
import { paintDesk } from '../_shared/packs.js';

export const { meta, draw, create } = defineEffect('pomodoro/timer-beep', 'Timer Beep',
  (d, p, opts, fb) => paintDesk('timer-beep', d, p, opts, fb));
