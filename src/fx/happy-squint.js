import { clear, setPixel } from '../core/framebuffer.js';
import { mulberry32 } from '../core/prng.js';

export const meta = Object.freeze({ id: 'happy-squint', name: 'Happy squint', duration: 2, width: 128, height: 64 });

export function create(opts = {}) {
  let t = 0;
  const phase = mulberry32(opts.seed ?? 1)() * Math.PI * 2;
  const params = { lookX: opts.lookX ?? 0, lookY: opts.lookY ?? 0 };
  return {
    params,
    get t() { return t; },
    step(dt) {
      if (!Number.isFinite(dt) || dt < 0) throw new RangeError('dt must be finite and nonnegative');
      t += dt;
    },
    draw(fb) {
      clear(fb);
      const dx = Math.round(6 * Math.max(-1, Math.min(1, params.lookX)) + Math.sin(t * Math.PI + phase));
      const dy = Math.round(4 * Math.max(-1, Math.min(1, params.lookY)) + 2 * Math.sin(t * Math.PI * 2));
      const carveY = 37 + dy + Math.round(Math.sin(t * Math.PI * 2 + phase));
      for (const center of [43 + dx, 85 + dx]) {
        for (let y = 0; y < fb.height; y++) for (let x = 0; x < fb.width; x++) {
          const rx = Math.max(0, Math.abs(x - center) - 7);
          const ry = Math.max(0, Math.abs(y - 31 - dy) - 8);
          const rounded = rx * rx + ry * ry <= 64;
          // A lower black circle cuts the rounded eye into a smiling crescent.
          const carved = (x - center) ** 2 + (y - carveY) ** 2 <= 17 ** 2;
          if (rounded && !carved) setPixel(fb, x, y);
        }
      }
    }
  };
}
