import test from 'node:test';
import assert from 'node:assert/strict';
import { effects } from '../src/fx/index.js';
import { createFramebuffer, fillRate, getPixel } from '../src/core/framebuffer.js';
import { sampleEffect } from '../tools/sequence.mjs';

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
  effects['happy-squint'].create().draw(fb);
  assert.equal(getPixel(fb, 43, 16), 1);
  assert.equal(getPixel(fb, 43, 34), 0);
});
