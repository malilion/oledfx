import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { createFramebuffer } from '../src/core/framebuffer.js';
import { renderRGBA } from '../src/core/render-rgba.js';
import { effects } from '../src/fx/index.js';
import { buildHeader, buildBitmapHeader } from '../src/core/mcu.js';

test('gallery controls switch effects and profiles, keep pointer gaze, pause and display toggles', async () => {
  // Run the actual simulator with a small DOM harness; no browser dependency.
  function element(value = '0') {
    const classes = new Set(), listeners = new Map();
    return {
      value, checked: true, disabled: false, style: {}, dataset: {}, attributes: {},
      classList: { toggle(name, on) { if (on) classes.add(name); else classes.delete(name); }, contains(name) { return classes.has(name); } },
      addEventListener(name, handler) { listeners.set(name, handler); },
      fire(name, event = {}) { listeners.get(name)?.(event); },
      setAttribute(name, value) { this.attributes[name] = value; }
    };
  }
  const selectors = ['canvas', '#look-x', '#look-y', '#blink', '#position', '#blink-label', '#profile', '#board-size', '.intro .eyebrow', '#dual-tone', '#glow', '#grid', '.board', '#reset', '#pause', '#clock', '#fx-picker', '#fx-count', '#fx-name', '#export-format', '#download-header', '#download-png', '#export-status'];
  const nodes = Object.fromEntries(selectors.map(selector => [selector, element()]));
  const ranges = ['#look-x', '#look-y', '#blink'].map(selector => nodes[selector]);
  const buttons = Object.keys(effects).map(fx => Object.assign(element(), { dataset: { fx } }));
  const canvas = nodes.canvas;
  let image, options, nextFrame, downloaded, filename;
  canvas.width = 640; canvas.height = 320;
  canvas.getContext = () => ({ putImageData(value) { image = value; } });
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 640, height: 320 });
  const document = {
    querySelector: selector => nodes[selector],
    querySelectorAll: selector => selector === '.effect' ? buttons : ranges,
    createElement: () => ({ click() { filename = this.download; } })
  };
  const source = (await readFile(new URL('../gallery/simulator.js', import.meta.url), 'utf8')).replace(/^import .*;\n/gm, '');
  runInNewContext(source, {
    document, createFramebuffer, effects, buildHeader, buildBitmapHeader, Blob,
    URL: { createObjectURL(blob) { downloaded = blob; return 'blob:test'; }, revokeObjectURL() {} },
    setTimeout() {},
    renderRGBA(fb, opts) { options = opts; return renderRGBA(fb, opts); },
    ImageData: class { constructor(data, width, height) { Object.assign(this, { data, width, height }); } },
    requestAnimationFrame(callback) { nextFrame = callback; }
  });
  const frame = timestamp => nextFrame(timestamp);
  frame(0);
  assert.equal((nodes['#fx-picker'].innerHTML.match(/<option /g) ?? []).length, Object.keys(effects).length);
  assert.equal(image.width, 640); assert.equal(image.height, 320);
  assert.equal(options.dualTone, true); assert.equal(options.grid, true); assert.equal(options.glow, true);
  const centered = image.data.slice();
  canvas.fire('pointermove', { clientX: 640, clientY: 0 }); frame(16);
  assert.equal(nodes['#look-x'].value, 1); assert.equal(nodes['#look-y'].value, -1);
  assert.match(nodes['#position'].textContent, /X 1.00.*Y -1.00/);
  assert.notDeepEqual(image.data, centered);
  buttons[1].fire('click'); frame(32);
  assert.equal(buttons[1].attributes['aria-pressed'], 'true');
  assert.equal(buttons[0].attributes['aria-pressed'], 'false');
  assert.equal(nodes['#blink-label'].hidden, false);
  nodes['#blink'].value = '1'; nodes['#blink'].fire('input'); frame(48);
  const closed = image.data.slice();
  nodes['#reset'].fire('click'); frame(64);
  assert.ok(ranges.every(input => input.value === 0));
  assert.notDeepEqual(image.data, closed);
  nodes['#pause'].fire('click'); frame(80);
  const clock = nodes['#clock'].textContent;
  frame(180); assert.equal(nodes['#clock'].textContent, clock);
  assert.equal(nodes['#pause'].textContent, 'Resume');
  nodes['#pause'].fire('click'); frame(280);
  assert.notEqual(nodes['#clock'].textContent, clock);
  nodes['#profile'].value = 'ssd1306-128x32'; nodes['#profile'].fire('change'); frame(296);
  assert.equal(canvas.height, 160); assert.equal(image.height, 160);
  assert.equal(canvas.style.aspectRatio, '128 / 32');
  assert.equal(nodes['#board-size'].textContent, '128×32 / I²C');
  assert.equal(nodes['#dual-tone'].disabled, true); assert.equal(options.dualTone, false);
  nodes['#profile'].value = 'ssd1306-128x64'; nodes['#profile'].fire('change'); frame(312);
  assert.equal(canvas.height, 320); assert.equal(image.height, 320);
  assert.equal(nodes['#dual-tone'].disabled, false); assert.equal(options.dualTone, true);
  nodes['#dual-tone'].checked = false; nodes['#grid'].checked = false;
  nodes['#glow'].checked = false; nodes['#glow'].fire('change'); frame(328);
  assert.equal(options.dualTone, false); assert.equal(options.grid, false); assert.equal(options.glow, false);
  assert.equal(nodes['.board'].classList.contains('glowing'), false);
  nodes['#glow'].checked = true; nodes['#glow'].fire('change');
  assert.equal(nodes['.board'].classList.contains('glowing'), true);
  for (const fx of Object.keys(effects)) {
    nodes['#fx-picker'].value = fx; nodes['#fx-picker'].fire('change'); frame(344);
    assert.equal(nodes['#fx-name'].textContent, effects[fx].meta.name);
    assert.equal(nodes['#blink-label'].hidden, !fx.startsWith('eyes/'));
  }
  for (const format of ['xor-rle', 'u8g2', 'adafruit']) {
    nodes['#export-format'].value = format;
    nodes['#download-header'].fire('click');
    const header = await downloaded.text();
    assert.match(header, /#define OLEDFX_ANIMATION_FRAME_COUNT 32/);
    assert.ok(filename.endsWith(`-${format}.h`));
    if (format === 'xor-rle') assert.match(header, /static inline int oledfx_step_frame/);
    else assert.match(header, /horizontal rows/);
  }
});
