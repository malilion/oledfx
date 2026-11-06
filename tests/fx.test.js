import test from 'node:test';
import assert from 'node:assert/strict';
import { effects } from '../src/fx/index.js';
import { createFramebuffer, fillRate, getPixel } from '../src/core/framebuffer.js';
import { sampleEffect } from '../tools/sequence.mjs';
import * as blink from '../src/fx/eyes/blink.js';
import * as happy from '../src/fx/eyes/happy-squint.js';
import * as oldEyes from '../src/fx/eyes.js';
import * as oldHappy from '../src/fx/happy-squint.js';

for (const [id, module] of Object.entries(effects)) {
  test(`${id}: N frames animate deterministically, stay bounded, honor look params`, () => {
    const a = sampleEffect({ fx: id, frames: 64, fps: 32, seed: 7 });
    assert.deepEqual(a, sampleEffect({ fx: id, frames: 64, fps: 32, seed: 7 }));
    assert.ok(new Set(a.frames.map(frame => Buffer.from(frame).toString('hex'))).size > 8);
    assert.equal(module.meta.id, id);
    for (const data of a.frames) {
      const fb = { width: 128, height: 64, data };
      assert.ok(fillRate(fb) > 0 && fillRate(fb) < 0.5);
      for (let x = 0; x < 128; x++) assert.equal(getPixel(fb, x, 0) + getPixel(fb, x, 63), 0);
      for (let y = 0; y < 64; y++) assert.equal(getPixel(fb, 0, y) + getPixel(fb, 127, y), 0);
    }
    const effect = module.create({ lookX: -1, lookY: -1 }), fb = createFramebuffer();
    effect.draw(fb); const initial = fb.data.slice();
    effect.params.lookX = 1; effect.params.lookY = 1; effect.draw(fb);
    assert.notDeepEqual(fb.data, initial);
    effect.step(0.25); assert.equal(effect.t, 0.25);
    effect.draw(fb); const stable = fb.data.slice(); effect.draw(fb); assert.deepEqual(fb.data, stable);
    assert.throws(() => effect.step(-1)); assert.throws(() => effect.step(NaN));
  });
}
test('eyes blink closes eye area; lower-circle carving leaves crescent tops', () => {
  const fb = createFramebuffer(), eye = effects.eyes.create({ blink: 0 });
  eye.draw(fb); const open = fillRate(fb);
  eye.params.blink = 1; eye.draw(fb); assert.ok(fillRate(fb) < open / 8);
  const smile = effects['happy-squint'].create(); smile.step(0.9); smile.draw(fb);
  assert.equal(getPixel(fb, 40, 16), 1);
  assert.equal(getPixel(fb, 40, 34), 0);
});

test('canonical eye paths enumerate once and old imports and IDs preserve output', () => {
  assert.deepEqual(Object.keys(effects), ['eyes/blink', 'eyes/happy-squint']);
  assert.equal(blink.meta.id, 'eyes/blink'); assert.equal(happy.meta.id, 'eyes/happy-squint');
  assert.equal(oldEyes.create, blink.create); assert.equal(oldHappy.create, happy.create);
  assert.equal(oldHappy.draw, happy.draw);
  for (const [oldId, id] of [['eyes', 'eyes/blink'], ['happy-squint', 'eyes/happy-squint']]) {
    assert.deepEqual(sampleEffect({ fx: oldId }).frames, sampleEffect({ fx: id }).frames);
    assert.equal(effects[oldId].meta.id, oldId);
  }
});

test('happy-squint follows PoC blink and smile curves, loops and supports manual blink', () => {
  const fb = createFramebuffer();
  happy.draw(fb, 0); const open = fillRate(fb), first = fb.data.slice();
  happy.draw(fb, 0.25); assert.ok(fillRate(fb) < open / 8);
  happy.draw(fb, 0.5); assert.deepEqual(fb.data, first);
  happy.draw(fb, 0.75); const smile = fb.data.slice();
  assert.ok(fillRate(fb) < open * 0.65);
  assert.equal(getPixel(fb, 40, 16), 1); assert.equal(getPixel(fb, 40, 34), 0);
  happy.draw(fb, 1.35); assert.deepEqual(fb.data, smile);
  happy.draw(fb, 1.6); assert.deepEqual(fb.data, first);
  happy.draw(fb, 2); assert.deepEqual(fb.data, first);
  happy.draw(fb, 0.25, { blink: 0 }); assert.deepEqual(fb.data, first);
  happy.draw(fb, 0, { blink: 1 }); assert.ok(fillRate(fb) < open / 8);
});

test('both eye animations fit both profiles at gaze extremes throughout the loop', () => {
  for (const profile of ['ssd1306-128x64', 'ssd1306-128x32']) for (const fx of Object.keys(effects)) {
    const fb = createFramebuffer(profile);
    for (const lookX of [-1, 1]) for (const lookY of [-1, 1]) {
      const effect = effects[fx].create({ lookX, lookY });
      for (let i = 0; i < 64; i++) {
        effect.draw(fb);
        assert.ok(fillRate(fb) > 0 && fillRate(fb) < 0.5, `${fx} ${profile} frame ${i}`);
        for (let x = 0; x < fb.width; x++) assert.equal(getPixel(fb, x, 0) + getPixel(fb, x, fb.height - 1), 0);
        for (let y = 0; y < fb.height; y++) assert.equal(getPixel(fb, 0, y) + getPixel(fb, fb.width - 1, y), 0);
        effect.step(1 / 32);
      }
    }
  }
});
