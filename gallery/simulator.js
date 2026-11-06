import { createFramebuffer } from '../src/core/framebuffer.js';
import { renderRGBA } from '../src/core/render-rgba.js';
import { effects } from '../src/fx/index.js';

const $ = selector => document.querySelector(selector);
const canvas = $('canvas'), context = canvas.getContext('2d');
const fb = createFramebuffer();
let effect = effects.eyes.create({ seed: 1 }), paused = false, previous;
function gaze() {
  effect.params.lookX = Number($('#look-x').value);
  effect.params.lookY = Number($('#look-y').value);
  if ('blink' in effect.params) effect.params.blink = Number($('#blink').value) || null;
  $('#position').textContent = `X ${effect.params.lookX.toFixed(2)}   Y ${effect.params.lookY.toFixed(2)}`;
}
for (const control of document.querySelectorAll('input[type=range]')) control.addEventListener('input', gaze);
canvas.addEventListener('pointermove', event => {
  const rect = canvas.getBoundingClientRect();
  $('#look-x').value = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
  $('#look-y').value = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
  gaze();
});
for (const button of document.querySelectorAll('.effect')) button.addEventListener('click', () => {
  effect = effects[button.dataset.fx].create({ seed: 1 });
  for (const other of document.querySelectorAll('.effect')) {
    other.classList.toggle('active', other === button);
    other.setAttribute('aria-pressed', String(other === button));
  }
  $('#blink-label').hidden = !('blink' in effect.params);
  gaze();
});
$('#reset').addEventListener('click', () => {
  for (const input of document.querySelectorAll('input[type=range]')) input.value = 0;
  gaze();
});
$('#pause').addEventListener('click', () => { paused = !paused; $('#pause').textContent = paused ? 'Resume' : 'Pause'; });
function animate(timestamp) {
  if (previous !== undefined && !paused) effect.step(Math.min((timestamp - previous) / 1000, 0.1));
  previous = timestamp;
  effect.draw(fb);
  const image = renderRGBA(fb, { scale: 5, dualTone: $('#dual-tone').checked, grid: $('#grid').checked, glow: $('#glow').checked });
  context.putImageData(new ImageData(image.data, image.width, image.height), 0, 0);
  $('#clock').textContent = `${effect.t.toFixed(2)} s`;
  requestAnimationFrame(animate);
}
gaze();
requestAnimationFrame(animate);
