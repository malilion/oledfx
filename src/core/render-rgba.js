import { getPixel } from './framebuffer.js';

// Shared by the Node contact sheet and the browser canvas simulator.
export function renderRGBA(fb, { scale = 4, grid = true, glow = true, dualTone = false, split = 16, profile } = {}) {
  if (!Number.isInteger(scale) || scale < 1 || scale > 16) throw new RangeError('Scale must be 1..16');
  const width = fb.width * scale, height = fb.height * scale;
  const data = new Uint8ClampedArray(width * height * 4);
  const radius = Math.ceil(scale * 1.4), sigma = scale * 0.65;
  const light = new Float32Array(width * height);
  if (glow) {
    for (let y = 0; y < fb.height; y++) for (let x = 0; x < fb.width; x++) {
      if (!getPixel(fb, x, y)) continue;
      const cx = (x + 0.5) * scale - 0.5, cy = (y + 0.5) * scale - 0.5;
      for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
        const px = Math.round(cx + dx), py = Math.round(cy + dy);
        if (px >= 0 && py >= 0 && px < width && py < height)
          light[py * width + px] += 0.12 * Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
      }
    }
  }
  const matrix = profile === 'led-matrix-64x32';
  const tft = profile === 'st7789-128x128';
  for (let py = 0; py < height; py++) for (let px = 0; px < width; px++) {
    const x = Math.floor(px / scale), y = Math.floor(py / scale);
    const gap = grid && scale > 1 && (px % scale === scale - 1 || py % scale === scale - 1);
    const intensity = Math.min(1, (getPixel(fb, x, y) ? (gap ? 0.12 : 0.86) : 0) + light[py * width + px]);
    const color = matrix ? (dualTone && y < (split >> 1) ? [255, 110, 64] : [64, 245, 175])
      : tft ? (dualTone && y < split * 2 ? [255, 215, 85] : [110, 215, 255])
      : dualTone && y < split ? [255, 210, 65] : [75, 195, 255];
    const i = (py * width + px) * 4;
    for (let channel = 0; channel < 3; channel++) data[i + channel] = Math.round(3 + color[channel] * intensity * 0.98);
    data[i + 3] = 255;
  }
  return { width, height, data };
}
