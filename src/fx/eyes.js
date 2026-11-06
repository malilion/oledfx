import { clear, setPixel } from '../core/framebuffer.js';
import { mulberry32 } from '../core/prng.js';

export const meta = Object.freeze({ id: 'eyes', name: 'Curious eyes', duration: 2, width: 128, height: 64 });

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
      for (const center of [43, 85]) {
        for (let y = 0; y < fb.height; y++) for (let x = 0; x < fb.width; x++) {
          const dx = Math.max(0, Math.abs(x - center - cx) - 7);
          const dy = Math.max(0, Math.abs(y - 31 - cy) - Math.max(0, halfHeight - 8));
          const radius = Math.min(8, halfHeight);
          if (Math.abs(x - center - cx) <= 15 && Math.abs(y - 31 - cy) <= halfHeight && dx * dx + dy * dy <= radius * radius) setPixel(fb, x, y);
        }
      }
    }
  };
}
