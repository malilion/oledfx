import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { effects, categories } from '../src/fx/index.js';
import { createFramebuffer } from '../src/core/framebuffer.js';
import { renderRGBA } from '../src/core/render-rgba.js';

test('gallery catalog filters all 53 FX, paints only visible cards and selects a preview', async () => {
  let nextFrame, observerCallback, draws = 0, selected = 0, scrolled = 0;
  function element() {
    const handlers = new Map();
    return {
      children: [], attributes: {}, hidden: false, value: '',
      append(...nodes) { this.children.push(...nodes); },
      setAttribute(key, value) { this.attributes[key] = value; },
      addEventListener(type, handler) { handlers.set(type, handler); },
      dispatchEvent(event) { handlers.get(event.type)?.(event); },
      getContext() { return { putImageData() { draws++; } }; },
      scrollIntoView() { scrolled++; }
    };
  }
  const nodes = Object.fromEntries(['#catalog', '#categories', '#search', '#empty', '#fx-picker', '.workspace'].map(id => [id, element()]));
  nodes['#fx-picker'].addEventListener('change', () => selected++);
  const source = (await readFile(new URL('../gallery/catalog.js', import.meta.url), 'utf8')).replace(/^import .*;\n/gm, '');
  runInNewContext(source, {
    effects, categories, createFramebuffer, renderRGBA,
    document: { querySelector: id => nodes[id], createElement: element },
    IntersectionObserver: class { constructor(callback) { observerCallback = callback; } observe() {} },
    ImageData: class { constructor(data, width, height) { Object.assign(this, { data, width, height }); } },
    Event: class { constructor(type) { this.type = type; } },
    requestAnimationFrame(callback) { nextFrame = callback; }
  });
  const cards = nodes['#catalog'].children;
  assert.equal(cards.length, 53);
  assert.equal(nodes['#categories'].children.length, 6);
  nextFrame(0); assert.equal(draws, 0);
  observerCallback([{ target: cards[0], isIntersecting: true }, { target: cards[25], isIntersecting: true }]);
  nextFrame(16); assert.equal(draws, 2);
  nodes['#categories'].children[2].dispatchEvent({ type: 'click' });
  assert.equal(cards.filter(card => !card.hidden).length, 8);
  nextFrame(32); assert.equal(draws, 3);
  nodes['#search'].value = 'rain'; nodes['#search'].dispatchEvent({ type: 'input' });
  assert.equal(cards.filter(card => !card.hidden).length, 1);
  cards[27].dispatchEvent({ type: 'click' });
  assert.equal(nodes['#fx-picker'].value, 'weather/rain');
  assert.equal(selected, 1); assert.equal(scrolled, 1);
  nodes['#search'].value = 'no such fx'; nodes['#search'].dispatchEvent({ type: 'input' });
  assert.equal(nodes['#empty'].hidden, false);
  observerCallback([{ target: cards[0], isIntersecting: false }, { target: cards[25], isIntersecting: false }]);
  nextFrame(48); assert.equal(draws, 3);
});
