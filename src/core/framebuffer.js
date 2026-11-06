import { DEFAULT_PROFILE, getProfile } from './profiles.js';

// SSD1306: byte index = page * width + x; bit 0 is the page's top row.
export function createFramebuffer(width = DEFAULT_PROFILE, height = 64) {
  if (typeof width === 'string') {
    const profile = getProfile(width);
    width = profile.w;
    height = profile.h;
  }
  if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 8 || height % 8) {
    throw new RangeError('Framebuffer needs a positive width and height divisible by 8');
  }
  const fb = { width, height, data: new Uint8Array(width * height / 8) };
  // The method form matches PRD screen.fillRoundRect(...), while standalone
  // functions also accept existing plain { width, height, data } framebuffers.
  for (const [name, draw] of Object.entries({ getPixel, setPixel, fill, clear, fillRect, clearRect, fillCircle, fillRoundRect })) {
    Object.defineProperty(fb, name, { value: (...args) => draw(fb, ...args) });
  }
  return fb;
}

export function getPixel(fb, x, y) {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= fb.width || y >= fb.height) return 0;
  return (fb.data[(y >> 3) * fb.width + x] >> (y & 7)) & 1;
}

export function setPixel(fb, x, y, on = 1) {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= fb.width || y >= fb.height) return;
  const index = (y >> 3) * fb.width + x, mask = 1 << (y & 7);
  if (on) fb.data[index] |= mask;
  else fb.data[index] &= ~mask;
}

export function fill(fb, on = 1) { fb.data.fill(on ? 255 : 0); return fb; }
export function clear(fb) { return fill(fb, 0); }

function geometry(...values) {
  if (!values.every(Number.isFinite)) throw new RangeError('Drawing geometry must be finite');
}

// Integer pixel centers; rectangles cover [x, x+w) × [y, y+h).
function paint(fb, x, y, w, h, on, contains = () => true) {
  for (let py = Math.max(0, Math.ceil(y)); py < Math.min(fb.height, Math.ceil(y + h)); py++) {
    for (let px = Math.max(0, Math.ceil(x)); px < Math.min(fb.width, Math.ceil(x + w)); px++) {
      if (contains(px, py)) setPixel(fb, px, py, on);
    }
  }
  return fb;
}

export function fillRect(fb, x, y, w, h, on = 1) {
  geometry(x, y, w, h);
  if (w <= 0 || h <= 0) return fb;
  return paint(fb, x, y, w, h, on);
}

export function clearRect(fb, x, y, w, h) { return fillRect(fb, x, y, w, h, 0); }

export function fillCircle(fb, cx, cy, radius, on = 1) {
  geometry(cx, cy, radius);
  if (radius < 0) throw new RangeError('Circle radius must be nonnegative');
  return paint(fb, cx - radius, cy - radius, 2 * radius + 1, 2 * radius + 1, on,
    (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2);
}

export function fillRoundRect(fb, x, y, w, h, radius, on = 1) {
  geometry(x, y, w, h, radius);
  if (radius < 0) throw new RangeError('Corner radius must be nonnegative');
  if (w <= 0 || h <= 0) return fb;
  const r = Math.min(radius, Math.max(0, (w - 1) / 2), Math.max(0, (h - 1) / 2));
  if (r === 0) return paint(fb, x, y, w, h, on);
  return paint(fb, x, y, w, h, on, (px, py) => {
    const dx = Math.max(x + r - px, 0, px - (x + w - 1 - r));
    const dy = Math.max(y + r - py, 0, py - (y + h - 1 - r));
    return dx * dx + dy * dy <= r * r;
  });
}

export function fillRate(fb) {
  let count = 0;
  for (let byte of fb.data) while (byte) { byte &= byte - 1; count++; }
  return count / (fb.width * fb.height);
}
