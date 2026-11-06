export const DEFAULT_PROFILE = 'ssd1306-128x64';

// pageBytes is one horizontal page of eight vertical pixels.
export const profiles = Object.freeze({
  'ssd1306-128x64': Object.freeze({ w: 128, h: 64, depth: 1, pageBytes: 128, frameBytes: 1024 }),
  'ssd1306-128x32': Object.freeze({ w: 128, h: 32, depth: 1, pageBytes: 128, frameBytes: 512 })
});

export function getProfile(id = DEFAULT_PROFILE) {
  if (!Object.hasOwn(profiles, id)) throw new RangeError(`Unknown display profile: ${id}`);
  return profiles[id];
}
