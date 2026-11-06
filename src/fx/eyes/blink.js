import { clear, fillRoundRect } from '../../core/framebuffer.js';
import { mulberry32 } from '../../core/prng.js';

export const meta = Object.freeze({ id: 'eyes/blink', name: 'Curious eyes', duration: 2, loop: true, width: 128, height: 64 });

export function create(opts = {}) {
  let t = 0;
  const phase = mulberry32(opts.seed ?? 1)() * Math.PI * 2;
  const params = { lookX: opts.lookX ?? 0, lookY: opts.lookY ?? 0, blink: opts.blink ?? null };
  return {
    params,
    get t() { return t; },
    step(dt) {
      if (!Number.isFinite(dt) || dt < 0) throw new RangeError('dt must be finite and nonnegative');
      t += dt;
    },
    draw(fb) {
      clear(fb);
      const blink = Math.max(0, Math.min(1, params.blink ?? Math.max(0, 1 - Math.abs((t % 2) - 1.3) / 0.12)));
      const gazeX = Math.max(-1, Math.min(1, params.lookX));
      const gazeY = Math.max(-1, Math.min(1, params.lookY));
      const cx = Math.round(6 * gazeX + 1.5 * Math.sin(t * Math.PI + phase));
      const cy = Math.round(4 * gazeY + Math.sin(t * Math.PI * 2));
      const halfHeight = Math.max(1, Math.round(17 * (1 - blink)));
      const scale = Math.min(fb.width / 128, fb.height / 64);
      for (const center of [43, 85]) {
        fillRoundRect(fb, Math.round(fb.width / 2 + (center - 64 + cx - 15) * scale),
          Math.round(fb.height / 2 + (-1 + cy - halfHeight) * scale),
          Math.max(1, Math.round(31 * scale)), Math.max(1, Math.round((2 * halfHeight + 1) * scale)),
          Math.min(8, halfHeight) * scale, 1);
      }
    }
  };
}
