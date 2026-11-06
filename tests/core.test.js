import test from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import { createFramebuffer, setPixel, getPixel, clear, fill, fillRate } from '../src/core/framebuffer.js';
import { threshold, bayer4x4, checker, dither, modes } from '../src/core/dither.js';
import { mulberry32 } from '../src/core/prng.js';
import { encode, decode, encodeSequence } from '../src/core/xor-rle.js';
import { renderRGBA } from '../src/core/render-rgba.js';
import { encodePNG, crc32 } from '../src/core/png.js';

test('SSD1306 vertical pages map x and y to known hardware bytes', () => {
  const fb = createFramebuffer();
  assert.equal(fb.data.length, 1024);
  setPixel(fb, 0, 0); setPixel(fb, 127, 7); setPixel(fb, 3, 8); setPixel(fb, 127, 63);
  assert.equal(fb.data[0], 1); assert.equal(fb.data[127], 128);
  assert.equal(fb.data[131], 1); assert.equal(fb.data[1023], 128);
  assert.equal(fillRate(fb), 4 / 8192);
  assert.equal(getPixel(fb, 127, 63), 1);
  setPixel(fb, 127, 63, 0); assert.equal(getPixel(fb, 127, 63), 0);
  const snapshot = fb.data.slice();
  for (const point of [[-1, 0], [128, 0], [0, 64], [0.5, 0]]) { setPixel(fb, ...point); assert.equal(getPixel(fb, ...point), 0); }
  assert.deepEqual(fb.data, snapshot);
  fill(fb); assert.equal(fillRate(fb), 1);
  clear(fb); assert.equal(fillRate(fb), 0);
  for (const dimensions of [[0, 64], [128, 63], [1.5, 8]]) assert.throws(() => createFramebuffer(...dimensions));
});

test('dither modes are deterministic, saturated, and spatially anchored', () => {
  for (const mode of Object.keys(modes)) {
    const a = createFramebuffer(16, 8), b = createFramebuffer(16, 8);
    dither(a, (x, y) => (x + y) / 22, mode);
    dither(b, (x, y) => (x + y) / 22, mode);
    assert.deepEqual(a.data, b.data);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 16; x++) {
      assert.equal(modes[mode](-1, x, y), 0);
      assert.equal(modes[mode](2, x, y), 1);
    }
  }
  assert.equal(threshold(0.49), 0); assert.equal(threshold(0.5), 1);
  for (let level = 0; level <= 16; level++) {
    let count = 0;
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) count += bayer4x4(level / 16, x, y);
    assert.equal(count, level);
  }
  assert.deepEqual([checker(0.5, 0, 0), checker(0.5, 1, 0), checker(0.5, 0, 1)], [1, 0, 0]);
  assert.throws(() => dither(createFramebuffer(), [], 'diffusion'));
  assert.throws(() => dither(createFramebuffer(), []));
});

test('mulberry32 has stable known output and independent seeded streams', () => {
  const a = mulberry32(1), b = mulberry32(1);
  assert.equal(a(), 0.6270739405881613);
  b();
  for (let i = 0; i < 100; i++) { const value = a(); assert.equal(value, b()); assert.ok(value >= 0 && value < 1); }
  assert.notEqual(mulberry32(1)(), mulberry32(2)());
});

test('XOR-RLE known tokens, boundary runs and seeded random roundtrips', () => {
  assert.deepEqual(encode(Uint8Array.of(0, 0, 3, 4, 0)), Uint8Array.of(1, 129, 3, 4, 0));
  assert.deepEqual(encode(new Uint8Array(129)), Uint8Array.of(127, 0));
  const random = mulberry32(42);
  for (const size of [0, 1, 127, 128, 129, 1024]) {
    let previous = new Uint8Array(size);
    for (let frame = 0; frame < 20; frame++) {
      const current = previous.map(byte => random() > 0.2 ? byte : Math.floor(random() * 256));
      const saved = previous.slice();
      assert.deepEqual(decode(encode(current, previous), previous), current);
      assert.deepEqual(previous, saved, 'decode must not mutate previous');
      previous = current;
    }
  }
  const solid = new Uint8Array(1024).fill(255);
  assert.deepEqual(decode(encode(solid), new Uint8Array(1024)), solid);
  assert.throws(() => encode(new Uint8Array(1), new Uint8Array(2)));
  assert.throws(() => encodeSequence([]));
});

test('XOR-RLE rejects truncated, overlong and incomplete streams', () => {
  for (const data of [[], [128], [127], [0], [128, 1, 128], [2, 0]]) {
    const previous = Uint8Array.of(3, 5, 8);
    assert.throws(() => decode(Uint8Array.from(data), previous));
    assert.deepEqual(previous, Uint8Array.of(3, 5, 8));
  }
});

test('OLED renderer exposes grid, glow and top-yellow/bottom-blue split', () => {
  const fb = createFramebuffer(8, 24);
  setPixel(fb, 2, 2); setPixel(fb, 2, 18);
  const plain = renderRGBA(fb, { scale: 3, glow: false, grid: false, dualTone: true });
  const at = (x, y, image = plain) => image.data.subarray((y * image.width + x) * 4, (y * image.width + x) * 4 + 4);
  assert.ok(at(6, 6)[0] > at(6, 6)[2]);
  assert.ok(at(6, 54)[2] > at(6, 54)[0]);
  const grid = renderRGBA(fb, { scale: 3, grid: true, glow: false });
  assert.ok(at(6, 6, grid)[2] > at(8, 6, grid)[2]);
  const glowing = renderRGBA(fb, { scale: 3, glow: true, grid: false });
  assert.ok(at(5, 6, glowing)[2] > at(5, 6)[2]);
  assert.throws(() => renderRGBA(fb, { scale: 0 }));
});

test('zero-dep PNG has valid CRCs, RGBA header and reversible scanlines', () => {
  const image = renderRGBA(createFramebuffer(8, 8), { scale: 1 });
  const png = encodePNG({ w: image.width, h: image.height, data: image.data });
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16), 8); assert.equal(png.readUInt32BE(20), 8);
  const chunks = [];
  for (let pos = 8; pos < png.length;) {
    const length = png.readUInt32BE(pos), type = png.toString('ascii', pos + 4, pos + 8);
    assert.equal(png.readUInt32BE(pos + 8 + length), crc32(png.subarray(pos + 4, pos + 8 + length)));
    if (type === 'IDAT') chunks.push(png.subarray(pos + 8, pos + 8 + length));
    pos += length + 12;
  }
  const rows = inflateSync(Buffer.concat(chunks));
  for (let y = 0; y < 8; y++) {
    assert.equal(rows[y * 33], 0);
    assert.deepEqual(rows.subarray(y * 33 + 1, y * 33 + 33), Buffer.from(image.data.subarray(y * 32, y * 32 + 32)));
  }
  assert.throws(() => encodePNG({ w: 8, h: 8, data: new Uint8Array(1) }));
});
