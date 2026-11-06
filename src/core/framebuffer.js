// SSD1306: byte index = page * width + x; bit 0 is the page's top row.
export function createFramebuffer(width = 128, height = 64) {
  if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 8 || height % 8) {
    throw new RangeError('Framebuffer needs a positive width and height divisible by 8');
  }
  return { width, height, data: new Uint8Array(width * height / 8) };
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
export function fillRate(fb) {
  let count = 0;
  for (let byte of fb.data) while (byte) { byte &= byte - 1; count++; }
  return count / (fb.width * fb.height);
}
