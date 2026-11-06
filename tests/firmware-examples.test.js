import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { exportMCU } from '../tools/export-mcu.mjs';
import { sampleEffect } from '../tools/sequence.mjs';
import { validateSketch } from '../tools/check-firmware-examples.mjs';

test('firmware checklist rejects missing includes, wrong export modes and stale symbols', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'oledfx-firmware-test-'));
  try {
    const path = join(directory, 'example.ino');
    const sketch = await readFile(new URL('../firmware/examples/u8g2-bitmap/u8g2-bitmap.ino', import.meta.url), 'utf8');
    const options = { format: 'u8g2', library: 'U8g2lib.h' };
    await exportMCU(sampleEffect(), { format: 'u8g2', symbol: 'animation', out: join(directory, 'animation.h') });
    await writeFile(path, sketch);
    assert.ok((await validateSketch(path, options)).symbols.includes('animation_frame'));
    await writeFile(path, sketch.replace('animation_frame(', 'animation_missing('));
    await assert.rejects(validateSketch(path, options), /Missing exported symbol: animation_missing/);
    await writeFile(path, sketch + '\n#include "missing.h"\n');
    await assert.rejects(validateSketch(path, options), /ENOENT/);
    await writeFile(path, sketch);
    await writeFile(join(directory, 'animation.h'), (await readFile(join(directory, 'animation.h'), 'utf8')) + '\n#include "missing.h"\n');
    await assert.rejects(validateSketch(path, options), /ENOENT/);
    await exportMCU(sampleEffect(), { format: 'adafruit', symbol: 'animation', out: join(directory, 'animation.h') });
    await writeFile(path, sketch);
    await assert.rejects(validateSketch(path, options), /Wrong bitmap format/);
    await writeFile(path, sketch.replace('#include "animation.h"', ''));
    await assert.rejects(validateSketch(path, options), /must include animation.h/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
