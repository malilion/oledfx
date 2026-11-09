import { clear, fillRoundRect, fillCircle } from '../../core/framebuffer.js';

export const meta = Object.freeze({ id: 'eyes/happy-squint', name: 'Happy squint', duration: 2, loop: true, width: 128, height: 64 });
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

// Reference proof of concept: a quick blink, then an eased smile cut from rounded eyes.
export function draw(screen, t, opts = {}) {
  clear(screen);
  const time = ((t % meta.duration) + meta.duration) % meta.duration;
  const autoBlink = time > 0.15 && time < 0.35 ? Math.sin((time - 0.15) / 0.2 * Math.PI) : 0;
  const blink = clamp(opts.blink ?? autoBlink, 0, 1);
  const smileArc = time > 0.5 && time < 1.6
    ? Math.sin(Math.min(1, (time - 0.5) / 0.25) * Math.PI / 2) * (time > 1.35 ? (1.6 - time) / 0.25 : 1)
    : 0;
  const scale = Math.min(screen.width / 128, screen.height / 64);
  const lookX = clamp(opts.lookX ?? 0, -1, 1) * 10;
  const lookY = clamp(opts.lookY ?? 0, -1, 1) * 6;
  const eyeW = 26, eyeH = Math.max(3, Math.round(28 * (1 - blink * 0.92)));
  const cy = Math.round(screen.height / 2 + (lookY - smileArc * 4) * scale);
  for (const center of [-24, 24]) {
    const cx = Math.round(screen.width / 2 + (center + lookX) * scale);
    fillRoundRect(screen, Math.round(cx - eyeW * scale / 2), Math.round(cy - eyeH * scale / 2),
      Math.max(1, Math.round(eyeW * scale)), Math.max(1, Math.round(eyeH * scale)), 6 * scale, 1.0);
    if (smileArc > 0.05) {
      const cutOffset = Math.round(eyeH * (1.15 - smileArc * 0.55) * scale);
      fillCircle(screen, cx, cy + cutOffset, eyeW * 0.68 * scale, 0.0);
    }
  }
}

export function create(opts = {}) {
  let t = 0;
  const params = { lookX: opts.lookX ?? 0, lookY: opts.lookY ?? 0, blink: opts.blink ?? null };
  return {
    params,
    get t() { return t; },
    step(dt) {
      if (!Number.isFinite(dt) || dt < 0) throw new RangeError('dt must be finite and nonnegative');
      t += dt;
    },
    draw(screen) { draw(screen, t, params); }
  };
}
