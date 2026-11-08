import { setPixel } from './framebuffer.js';

const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const clamp = value => Math.max(0, Math.min(1, value));
export const threshold = (value) => clamp(value) >= 0.5 ? 1 : 0;
// Quantize to 0..16 occupied cells: exactly 17 spatially stable levels.
export const bayer4x4 = (value, x = 0, y = 0) =>
  bayer[((y & 3) << 2) | (x & 3)] < Math.round(clamp(value) * 16) ? 1 : 0;
export const checker = (value, x = 0, y = 0) =>
  (((x + y) & 1) < Math.round(clamp(value) * 2)) ? 1 : 0;
export const atkinson = (value) => clamp(value) >= 0.5 ? 1 : 0;
export const modes = Object.freeze({ threshold, bayer4x4, checker, atkinson });

const atkinsonOffsets = [[1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2]];

export function dither(fb, values, mode = 'threshold') {
  if (!Object.hasOwn(modes, mode)) throw new Error(`Unknown dither mode: ${mode}`);
  if (typeof values !== 'function' && values.length !== fb.width * fb.height) throw new RangeError('Grayscale size mismatch');
  if (mode === 'atkinson') {
    const buffer = new Float32Array(fb.width * fb.height);
    for (let y = 0; y < fb.height; y++) for (let x = 0; x < fb.width; x++) {
      const value = typeof values === 'function' ? values(x, y) : values[y * fb.width + x];
      buffer[y * fb.width + x] = clamp(value);
    }
    for (let y = 0; y < fb.height; y++) for (let x = 0; x < fb.width; x++) {
      const i = y * fb.width + x, current = buffer[i], bit = current >= 0.5 ? 1 : 0;
      setPixel(fb, x, y, bit);
      const err = (current - bit) / 8;
      for (const [dx, dy] of atkinsonOffsets) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < fb.width && ny >= 0 && ny < fb.height) buffer[ny * fb.width + nx] += err;
      }
    }
    return fb;
  }
  for (let y = 0; y < fb.height; y++) for (let x = 0; x < fb.width; x++) {
    const value = typeof values === 'function' ? values(x, y) : values[y * fb.width + x];
    setPixel(fb, x, y, modes[mode](value, x, y));
  }
  return fb;
}
