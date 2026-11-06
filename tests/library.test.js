import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { effects, catalog, categories } from '../src/index.js';
import { createFramebuffer } from '../src/core/framebuffer.js';
import { sampleEffect } from '../tools/sequence.mjs';
import { checkSequence } from '../tools/check.mjs';

test('every category module is registered exactly once, with immutable public metadata', async () => {
  assert.deepEqual(categories, ['eyes', 'weather', 'system', 'pomodoro', 'transitions']);
  const counts = {};
  for (const category of categories) {
    const files = (await readdir(new URL(`../src/fx/${category}/`, import.meta.url))).filter(name => name.endsWith('.js'));
    counts[category] = files.length;
    for (const file of files) assert.ok(Object.hasOwn(effects, `${category}/${file.slice(0, -3)}`));
  }
  assert.deepEqual(counts, {"eyes":25,"weather":18,"system":22,"pomodoro":20,"transitions":15});
  assert.equal(catalog.length, 100);
  assert.ok(Object.isFrozen(catalog) && Object.isFrozen(effects));
  assert.ok(catalog.every(meta => Object.isFrozen(meta)));
});

for (const profile of ['ssd1306-128x64', 'ssd1306-128x32']) {
  test(`all 100 FX pass check (determinism, shimmer, budgets, actual header roundtrip): ${profile}`, async () => {
    for (const fx of Object.keys(effects)) {
      const result = await checkSequence(() => sampleEffect({ fx, profile }));
      assert.equal(result.pass, true, JSON.stringify({ profile, ...result }));
    }
  });
}

test('pure effects loop exactly, draw without time mutation, and support out-of-order seeking', () => {
  for (const [id, module] of Object.entries(effects)) {
    if (!module.draw) continue; // Original curious blink exposes the create interface.
    const fb = createFramebuffer();
    module.draw(fb, 0.25, { seed: 42 }); const first = fb.data.slice();
    module.draw(fb, 1.8, { seed: 42 });
    module.draw(fb, 0.25, { seed: 42 }); assert.deepEqual(fb.data, first, id);
    module.draw(fb, 0.25 + module.meta.duration, { seed: 42 }); assert.deepEqual(fb.data, first, id);
  }
});

test('every catalog FX has a distinct animated sequence', () => {
  const seen = new Map();
  for (const fx of Object.keys(effects)) {
    const signature = Buffer.concat(sampleEffect({ fx }).frames.map(frame => Buffer.from(frame))).toString('base64');
    assert.ok(!seen.has(signature), `${fx} duplicates ${seen.get(signature)}`);
    seen.set(signature, fx);
  }
});

test('seeded dissolves reproduce and differ across seeds; UI progress seeks endpoints', () => {
  const fb = createFramebuffer(), dissolve = effects['transitions/dissolve'];
  dissolve.draw(fb, 0.65, { seed: 1 }); const a = fb.data.slice();
  dissolve.draw(fb, 0.65, { seed: 2 }); assert.notDeepEqual(fb.data, a);
  for (const id of ['transitions/dissolve', 'transitions/blinds', 'transitions/wipe', 'transitions/iris']) {
    effects[id].draw(fb, 0, { progress: 0 }); assert.ok(fb.data.every(b => b === 0), id);
    effects[id].draw(fb, 0, { progress: 1 }); assert.ok(fb.data.every(b => b === 255), id);
  }
});

