export const DEFAULT_PROFILE = 'ssd1306-128x64';

// pageBytes is one horizontal page of eight vertical pixels.
// RGB565 profiles expose their 16-bit hardware frameBytes (w * h * 2) while
// sharing the 1-bit page-packed drawing buffer for procedural authoring.
export const profiles = Object.freeze({
  'ssd1306-128x64': Object.freeze({ w: 128, h: 64, depth: 1, pageBytes: 128, frameBytes: 1024 }),
  'ssd1306-128x32': Object.freeze({ w: 128, h: 32, depth: 1, pageBytes: 128, frameBytes: 512 }),
  'led-matrix-64x32': Object.freeze({ w: 64, h: 32, depth: 16, pageBytes: 64, frameBytes: 4096 }),
  'st7789-128x128': Object.freeze({ w: 128, h: 128, depth: 16, pageBytes: 128, frameBytes: 32768 })
});

export function getProfile(id = DEFAULT_PROFILE) {
  if (!Object.hasOwn(profiles, id)) throw new RangeError(`Unknown display profile: ${id}`);
  return profiles[id];
}
