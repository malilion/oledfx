import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createFramebuffer, getPixel } from '../src/core/framebuffer.js';
import { buildBitmapHeader, buildRGB565Header, packBitmap, packRGB565, rgb565 } from '../src/core/mcu.js';
import { playerSource } from '../src/core/mcu-player.js';
import { sampleEffect } from '../tools/sequence.mjs';
import { exportMCU } from '../tools/export-mcu.mjs';

test('known asymmetric bitmap verifies Mode B bit order, row stride and zero padding', () => {
  const fb = createFramebuffer(9, 8);
  fb.setPixel(0, 0); fb.setPixel(2, 0); fb.setPixel(8, 0); fb.setPixel(7, 1); fb.setPixel(0, 7);
  assert.deepEqual(Array.from(packBitmap(fb.data, 9, 8, 'u8g2')), [5, 1, 128, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]);
  assert.deepEqual(Array.from(packBitmap(fb.data, 9, 8, 'adafruit')), [160, 128, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128, 0]);
});

test('both bitmap formats preserve every sampled pixel on both SSD1306 profiles', () => {
  for (const format of ['u8g2', 'adafruit']) for (const profile of ['ssd1306-128x64', 'ssd1306-128x32']) {
    const sequence = sampleEffect({ fx: 'eyes/heart', profile });
    const { header, data, storageBytes } = buildBitmapHeader(sequence, 'heart', format);
    const body = header.match(/heart_data\[\] PROGMEM = \{([^}]+)\}/s)[1];
    assert.deepEqual(Uint8Array.from(body.split(',').map(v => Number(v.trim()))), data);
    assert.equal(storageBytes, sequence.frames.length * sequence.width * sequence.height / 8);
    const stride = Math.ceil(sequence.width / 8), size = stride * sequence.height;
    sequence.frames.forEach((frame, i) => {
      for (let y = 0; y < sequence.height; y++) for (let x = 0; x < sequence.width; x++) {
        const bit = format === 'u8g2' ? x & 7 : 7 - (x & 7);
        assert.equal((data[i * size + y * stride + (x >> 3)] >> bit) & 1, getPixel({ ...sequence, data: frame }, x, y));
      }
    });
  }
  assert.throws(() => buildBitmapHeader(sampleEffect(), 'bad-name'));
  assert.throws(() => buildBitmapHeader(sampleEffect(), 'valid', 'unknown'));
});

test('RGB565 packing and header export match 16-bit HUB75 and ST7789 frame sizes', () => {
  assert.equal(rgb565(255, 255, 255), 0xffff);
  assert.equal(rgb565(0, 0, 0), 0x0000);
  for (const [profile, expectedFrameBytes] of [['led-matrix-64x32', 4096], ['st7789-128x128', 32768]]) {
    const sequence = sampleEffect({ fx: 'eyes/blink', profile, frames: 4, fps: 8 });
    const { header, data, storageBytes } = buildRGB565Header(sequence, 'tft_anim', { dualTone: true });
    assert.equal(data.length, sequence.frames.length * sequence.width * sequence.height);
    assert.equal(storageBytes, sequence.frames.length * expectedFrameBytes);
    assert.match(header, new RegExp(`#define TFT_ANIM_FRAME_BYTES ${expectedFrameBytes}`));
    assert.match(header, /static const uint16_t tft_anim_data\[\] PROGMEM/);
    const words = packRGB565(sequence.frames[0], sequence.width, sequence.height);
    for (let y = 0; y < sequence.height; y++) for (let x = 0; x < sequence.width; x++) {
      assert.equal(words[y * sequence.width + x] !== 0, getPixel({ ...sequence, data: sequence.frames[0] }, x, y) === 1);
    }
  }
});

test('CLI exports Mode B independently, positional FX ID accepted, invalid formats rejected', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'oledfx-bitmap-'));
  try {
    for (const format of ['u8g2', 'adafruit']) {
      const out = join(dir, format + '.h');
      const run = spawnSync(process.execPath, ['tools/export-mcu.mjs', 'weather/rain', '--format', format, '--out', out], { encoding: 'utf8' });
      assert.equal(run.status, 0, run.stderr);
      assert.match(await readFile(out, 'utf8'), /horizontal rows/);
    }
    await assert.rejects(readFile(join(dir, 'oledfx_player.h')));
    await assert.rejects(exportMCU(sampleEffect(), { out: join(dir, 'invalid.h'), format: 'raw' }), /Unknown format/);
    await assert.rejects(readFile(join(dir, 'invalid.h')));
  } finally { await rm(dir, { recursive: true, force: true }); }
});

const compiler = spawnSync('cc', ['--version']);
test('header-only C player replays two loops byte-exact, checks index and rejects invalid input atomically', { skip: compiler.status !== 0 }, async () => {
  assert.equal(await readFile(new URL('../firmware/oledfx_player.h', import.meta.url), 'utf8'), playerSource);
  const dir = await mkdtemp(join(tmpdir(), 'oledfx-player-'));
  try {
    for (const profile of ['ssd1306-128x64', 'ssd1306-128x32']) {
      const sequence = sampleEffect({ fx: 'weather/rain', profile });
      await exportMCU(sequence, { out: join(dir, 'animation.h'), symbol: 'animation', decoderPath: join(dir, 'decoder.c') });
      await writeFile(join(dir, 'expected.bin'), Buffer.concat(sequence.frames.map(f => Buffer.from(f))));
      await writeFile(join(dir, 'test.c'), `#include <stdio.h>
#include <string.h>
#include "animation.h"
int main(void) {
  uint8_t fb[ANIMATION_FRAME_BYTES], expected[ANIMATION_FRAME_BYTES];
  uint8_t invalid[] = {128};
  memset(fb, 123, sizeof fb);
  for (int loop = 0; loop < 2; loop++) {
    FILE *input = fopen("expected.bin", "rb");
    if (!input) return 1;
    for (unsigned i = 0; i < ANIMATION_FRAME_COUNT; i++) {
      if (!animation_step_frame(fb, i)) return 2;
      if (fread(expected, 1, sizeof expected, input) != sizeof expected || memcmp(fb, expected, sizeof fb)) return 3;
    }
    fclose(input);
  }
  if (animation_step_frame(fb, ANIMATION_FRAME_COUNT)) return 4;
  if (oledfx_step_frame(fb, sizeof fb, invalid, 0, sizeof invalid, 0)) return 5;
  if (memcmp(fb, expected, sizeof fb)) return 6;
  return 0;
}
`);
      const cpp = spawnSync('cc', ['-x', 'c++', '-E', '-'], { input: '', encoding: 'utf8' });
      for (const language of cpp.status === 0 ? ['c', 'c++'] : ['c']) {
        const run = spawnSync('cc', ['-x', language, language === 'c' ? '-std=c99' : '-std=c++11', '-Wall', '-Wextra', '-Werror', 'test.c', '-o', 'verify'], { cwd: dir, encoding: 'utf8' });
        assert.equal(run.status, 0, run.stderr);
        const verify = spawnSync('./verify', [], { cwd: dir, encoding: 'utf8' });
        assert.equal(verify.status, 0, verify.stderr);
      }
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});
