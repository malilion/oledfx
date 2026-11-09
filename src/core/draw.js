import { clear, fillRect, fillCircle, fillRoundRect, getPixel, setPixel } from './framebuffer.js';

export const TAU = Math.PI * 2;
export const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
export const phase = (t, duration = 2) => ((t % duration) + duration) % duration / duration;

// A 128x64 design space, centered and uniformly scaled on either SSD1306.
export function drawing(fb) {
  const s = Math.min(fb.width / 128, fb.height / 64);
  const x = v => Math.round(fb.width / 2 + (v - 64) * s);
  const y = v => Math.round(fb.height / 2 + (v - 32) * s);
  const size = v => Math.max(1, Math.round(v * s));
  const rect = (a, b, w, h, on = 1) => { if (w > 0 && h > 0) fillRect(fb, x(a), y(b), size(w), size(h), on); };
  const circle = (a, b, r, on = 1) => fillCircle(fb, x(a), y(b), Math.max(0, Math.round(r * s)), on);
  const round = (a, b, w, h, r = 3, on = 1) => fillRoundRect(fb, x(a), y(b), size(w), size(h), r * s, on);
  const line = (a, b, c, d, thick = 2, on = 1) => {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(c - a), Math.abs(d - b))));
    for (let i = 0; i <= n; i++) rect(a + (c - a) * i / n, b + (d - b) * i / n, thick, thick, on);
  };
  const arc = (a, b, r, start, end, thick = 2, on = 1) => {
    const n = Math.max(1, Math.ceil(Math.abs(end - start) * r));
    for (let i = 0; i <= n; i++) {
      const angle = start + (end - start) * i / n;
      rect(a + Math.cos(angle) * r, b + Math.sin(angle) * r, thick, thick, on);
    }
  };
  const polygon = (points, on = 1) => {
    const scaled = points.map(([a, b]) => [x(a), y(b)]);
    const minY = Math.max(0, Math.min(...scaled.map(p => p[1]))), maxY = Math.min(fb.height - 1, Math.max(...scaled.map(p => p[1])));
    for (let py = minY; py <= maxY; py++) {
      const intersections = [];
      for (let i = 0, j = scaled.length - 1; i < scaled.length; j = i++) {
        const [ax, ay] = scaled[i], [bx, by] = scaled[j];
        if ((ay > py) !== (by > py)) intersections.push(ax + (py - ay) * (bx - ax) / (by - ay));
      }
      intersections.sort((a, b) => a - b);
      for (let i = 0; i + 1 < intersections.length; i += 2)
        for (let px = Math.max(0, Math.ceil(intersections[i])); px <= Math.min(fb.width - 1, Math.floor(intersections[i + 1])); px++) setPixel(fb, px, py, on);
    }
  };
  return { rect, circle, round, line, arc, polygon };
}

// Pure time sampling: seeking and repeated draws never depend on frame history.
export function defineEffect(id, name, paint, { duration = 2, loop = true, eyes = false } = {}) {
  const meta = Object.freeze({ id, name, duration, loop, width: 128, height: 64 });
  const draw = (fb, t, opts = {}) => {
    clear(fb);
    paint(drawing(fb), phase(t, duration), opts, fb);
    // Two-pixel cells keep thin moving curves legible and prevent singleton
    // flicker on a physical OLED. Both profiles retain the same pixel pitch.
    for (let y = 0; y < fb.height; y += 2) for (let x = 0; x < fb.width; x += 2) {
      const on = getPixel(fb, x, y);
      const w = !id.startsWith('transitions/') && fb.width < 128 && x + 2 >= fb.width ? 1 : 2;
      const h = !id.startsWith('transitions/') && fb.height < 64 && y + 2 >= fb.height ? 1 : 2;
      fillRect(fb, x, y, w, h, on);
    }
  };
  const create = (opts = {}) => {
    let t = 0;
    const params = { seed: 1, ...opts };
    if (eyes) Object.assign(params, { lookX: opts.lookX ?? 0, lookY: opts.lookY ?? 0, blink: opts.blink ?? null });
    return { params, get t() { return t; }, step(dt) {
      if (!Number.isFinite(dt) || dt < 0) throw new RangeError('dt must be finite and nonnegative');
      t += dt;
    }, draw(fb) { draw(fb, t, params); } };
  };
  return { meta, draw, create };
}
