import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { exportMCU } from '../tools/export-mcu.mjs';
import { decoderSource } from '../tools/mcu-format.mjs';
import { checkSequence, headerRoundtrip } from '../tools/check.mjs';
import { loadSequence, sampleEffect, parseArgs } from '../tools/sequence.mjs';
import { contactSheet } from '../tools/render.mjs';
import { handleGalleryRequest } from '../gallery/serve.mjs';

async function temporary(fn) {
  const directory = await mkdtemp(join(tmpdir(), 'oledfx-'));
  try { return await fn(directory); } finally { await rm(directory, { recursive: true, force: true }); }
}
test('export writes PROGMEM header symbols/macros, tables and matching decoder', async () => temporary(async dir => {
  const sequence = sampleEffect({ fx: 'eyes' });
  const out = join(dir, 'nested', 'eyes.h'), decoderPath = join(dir, 'firmware', 'decoder.c');
  const result = await exportMCU(sequence, { out, decoderPath, symbol: 'eyes' });
  const header = await readFile(out, 'utf8');
  for (const line of ['#define EYES_FRAME_COUNT 32', '#define EYES_WIDTH 128', '#define EYES_HEIGHT 64', '#define EYES_PAGE_COUNT 8', '#define EYES_FRAME_BYTES 1024', 'uint8_t eyes_data[] PROGMEM', 'uint32_t eyes_offsets[] PROGMEM', 'uint32_t eyes_sizes[] PROGMEM']) assert.ok(header.includes(line), line);
  assert.equal(headerRoundtrip(header, sequence, 'eyes'), true);
  assert.equal(result.storageBytes, result.data.length + 4 * (32 + 33));
  assert.equal(await readFile(decoderPath, 'utf8'), decoderSource);
  assert.equal(await readFile(new URL('../firmware/ssd1306_xor_rle_decoder.c', import.meta.url), 'utf8'), decoderSource);
  await assert.rejects(exportMCU(sequence, { out, decoderPath, symbol: 'bad-name' }));
  await assert.rejects(exportMCU(sequence, { out, decoderPath: out }));
}));

test('JSON page-packed fixture and CLI export roundtrip, invalid inputs rejected', async () => temporary(async dir => {
  const fixture = join(dir, 'fixture.json'), out = join(dir, 'fixture.h');
  const source = { width: 3, height: 8, fps: 12, frames: [[0, 128, 255], [1, 128, 0], [0, 128, 255]] };
  await writeFile(fixture, JSON.stringify(source));
  const sequence = await loadSequence({ fixture });
  const run = spawnSync(process.execPath, ['tools/export-mcu.mjs', '--fixture', fixture, '--out', out, '--decoder', join(dir, 'decoder.c')], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(headerRoundtrip(await readFile(out, 'utf8'), sequence), true);
  assert.throws(() => parseArgs(['--bogus'])); assert.throws(() => parseArgs(['--frames']));
  assert.throws(() => sampleEffect({ frames: 1.5 })); assert.throws(() => sampleEffect({ fps: 0 }));
  await assert.rejects(loadSequence({ fixture, fx: 'eyes' }));
  for (const frames of [[[0]], [[-1, 0, 0]], [[0, 256, 0]], [[1.1, 0, 0]]]) {
    await writeFile(fixture, JSON.stringify({ ...source, frames }));
    await assert.rejects(loadSequence({ fixture }));
  }
}));

test('check passes both examples with exact exported-header roundtrip', async () => {
  for (const fx of ['eyes', 'happy-squint']) {
    const result = await checkSequence(() => sampleEffect({ fx }));
    assert.equal(result.pass, true, JSON.stringify(result));
    assert.ok(result.storageBytes <= 3584, '32 KB examples meet 3.5 KiB target including tables');
  }
});

test('profile CLI exports both canonical effects with correct SSD1306 layout and roundtrip', async () => temporary(async dir => {
  for (const fx of ['eyes/blink', 'eyes/happy-squint']) for (const [profile, height] of [['ssd1306-128x64', 64], ['ssd1306-128x32', 32]]) {
    const out = join(dir, 'profile.h');
    const args = ['--fx', fx, '--profile', profile, '--frames', '32', '--fps', '16'];
    const sequence = await loadSequence(parseArgs(args));
    assert.equal(sequence.width, 128); assert.equal(sequence.height, height);
    assert.ok(sequence.frames.every(frame => frame.length === 128 * height / 8));
    const run = spawnSync(process.execPath, ['tools/export-mcu.mjs', ...args, '--out', out, '--decoder', join(dir, 'decoder.c')], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    const header = await readFile(out, 'utf8');
    for (const line of [`#define OLEDFX_ANIMATION_HEIGHT ${height}`, `#define OLEDFX_ANIMATION_PAGE_COUNT ${height / 8}`, `#define OLEDFX_ANIMATION_FRAME_BYTES ${128 * height / 8}`]) assert.ok(header.includes(line), line);
    assert.equal(headerRoundtrip(header, sequence), true);
    const result = await checkSequence(() => sampleEffect({ fx, profile }));
    assert.equal(result.pass, true, JSON.stringify(result));
    assert.ok(result.storageBytes <= 3584);
  }
  for (const profile of ['missing', 'toString']) {
    const run = spawnSync(process.execPath, ['tools/export-mcu.mjs', '--profile', profile, '--out', join(dir, 'invalid.h')], { encoding: 'utf8' });
    assert.equal(run.status, 1);
    await assert.rejects(loadSequence({ profile }), /Unknown display profile/);
  }
  assert.throws(() => sampleEffect({ fx: 'toString' }), /Unknown effect/);
  await assert.rejects(loadSequence({ fixture: 'unused.json', profile: 'ssd1306-128x32' }), /cannot be combined/);
}));

test('check detects nondeterminism, forbidden random, flicker and exceeded budgets', async () => {
  let n = 0;
  const result = await checkSequence(() => ({ width: 1, height: 8, frames: [Uint8Array.of(n++)] }));
  assert.equal(result.checks[0].pass, false);
  const random = Math.random;
  await assert.rejects(checkSequence(() => { Math.random(); }), /Math.random/);
  assert.equal(Math.random, random);
  const frames = [new Uint8Array(16), new Uint8Array(16), new Uint8Array(16)];
  for (let x = 1; x < 16; x += 3) frames[1][x] = 2;
  const flicker = await checkSequence(() => ({ width: 16, height: 8, frames }));
  assert.equal(flicker.checks[1].pass, false); assert.ok(flicker.flicker.reversals > 0);
  const large = await checkSequence(() => sampleEffect(), { budget: 1, headerBudget: 1 });
  assert.equal(large.checks[2].pass, false);
});

test('contact sheet composes grid, annotations and multiple frame samples', () => {
  const image = contactSheet(sampleEffect(), { scale: 2, columns: 2, samples: 4, dualTone: true });
  assert.equal(image.width, 584); assert.equal(image.height, 428);
  assert.equal(image.data.length, image.width * image.height * 4);
  assert.throws(() => contactSheet(sampleEffect(), { columns: 0 }));
});

test('gallery routes local simulator and ES modules without exposing repository files', async () => {
  const request = async (url, method = 'GET') => {
    const response = { writeHead(status, headers) { this.status = status; this.headers = headers; }, end(body) { this.body = body; } };
    await handleGalleryRequest({ url, method }, response);
    return response;
  };
  for (const path of ['/', '/gallery/style.css', '/gallery/simulator.js', '/src/core/framebuffer.js', '/src/core/profiles.js', '/src/fx/eyes.js', '/src/fx/happy-squint.js', '/src/fx/eyes/blink.js', '/src/fx/eyes/happy-squint.js']) {
    const response = await request(path); assert.equal(response.status, 200, path);
    assert.ok(response.body.length > 0);
  }
  for (const path of ['/package.json', '/docs/PRD.md', '/.git/config', '/src/../../package.json', '/src/core/png.js%00']) {
    const response = await request(path); assert.equal(response.status, 404, path);
  }
  const response = await request('/', 'POST'); assert.equal(response.status, 405);
  const head = await request('/', 'HEAD'); assert.equal(head.status, 200); assert.equal(head.body, undefined);
});

const compiler = spawnSync('cc', ['--version'], { encoding: 'utf8' });
test('zero-malloc C decoder exactly restores all exported frames, rejects malformed input atomically', { skip: compiler.status !== 0 ? 'Optional host C compiler unavailable' : false }, async () => temporary(async dir => {
  for (const fx of ['eyes', 'happy-squint']) for (const profile of ['ssd1306-128x64', 'ssd1306-128x32']) {
    const sequence = sampleEffect({ fx, profile });
    await exportMCU(sequence, { out: join(dir, 'animation.h'), decoderPath: join(dir, 'decoder.c') });
    await writeFile(join(dir, 'expected.bin'), Buffer.concat(sequence.frames.map(frame => Buffer.from(frame))));
    await writeFile(join(dir, 'verify.c'), `#include <stdio.h>
#include <string.h>
#include "animation.h"
#include "decoder.c"
int main(int argc, char **argv) {
  uint8_t frame[OLEDFX_ANIMATION_FRAME_BYTES] = {0}, expected[OLEDFX_ANIMATION_FRAME_BYTES];
  uint8_t malformed[] = {0x80, 0xff, 0x80}, overflow[] = {0x7f}, incomplete[] = {0};
  FILE *input;
  if (argc != 2 || !(input = fopen(argv[1], "rb"))) return 1;
  for (unsigned i = 0; i < OLEDFX_ANIMATION_FRAME_COUNT; ++i) {
    if (!oledfx_xor_rle_decode(frame, sizeof(frame), oledfx_animation_data + oledfx_animation_offsets[i], oledfx_animation_sizes[i])) return 2;
    if (fread(expected, 1, sizeof(expected), input) != sizeof(expected) || memcmp(frame, expected, sizeof(frame))) return 3;
  }
  fclose(input);
  if (oledfx_xor_rle_decode(frame, sizeof(frame), malformed, sizeof(malformed))) return 4;
  if (memcmp(frame, expected, sizeof(frame))) return 5;
  if (oledfx_xor_rle_decode(frame, 3, overflow, sizeof(overflow))) return 6;
  if (oledfx_xor_rle_decode(frame, sizeof(frame), incomplete, sizeof(incomplete))) return 7;
  return 0;
}
`);
    const binary = join(dir, 'verify');
    const build = spawnSync('cc', ['-std=c99', '-Wall', '-Wextra', '-Werror', join(dir, 'verify.c'), '-o', binary], { encoding: 'utf8' });
    assert.equal(build.status, 0, build.stderr);
    const verify = spawnSync(binary, [join(dir, 'expected.bin')], { encoding: 'utf8' });
    assert.equal(verify.status, 0, `${fx}: exit ${verify.status} ${verify.stderr}`);
  }
}));
