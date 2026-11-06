import { createFramebuffer } from '../src/core/framebuffer.js';
import { renderRGBA } from '../src/core/render-rgba.js';
import { effects } from '../src/fx/index.js';
import { buildHeader, buildBitmapHeader } from '../src/core/mcu.js';

const $ = selector => document.querySelector(selector);
const canvas = $('canvas'), context = canvas.getContext('2d');
let fb = createFramebuffer();
let effect = effects['eyes/blink'].create({ seed: 1 }), paused = false, previous;
let selectedId = 'eyes/blink';
const groups = [...new Set(Object.keys(effects).map(id => id.split('/')[0]))];
$('#fx-picker').innerHTML = groups.map(category => `<optgroup label="${category}">${Object.values(effects).filter(fx => fx.meta.id.startsWith(category + '/')).map(fx => `<option value="${fx.meta.id}">${fx.meta.name}</option>`).join('')}</optgroup>`).join('');
$('#fx-count').textContent = `${Object.keys(effects).length} FX`;
function choose(id) {
  if (!Object.hasOwn(effects, id)) return;
  selectedId = id;
  effect = effects[id].create({ seed: 1 });
  $('#fx-picker').value = id;
  $('#fx-name').textContent = effects[id].meta.name;
  for (const other of document.querySelectorAll('.effect')) {
    other.classList.toggle('active', other.dataset.fx === id);
    other.setAttribute('aria-pressed', String(other.dataset.fx === id));
  }
  $('#blink-label').hidden = !('blink' in effect.params);
  $('#look-x').disabled = $('#look-y').disabled = !id.startsWith('eyes/');
  gaze();
}
$('#fx-picker').addEventListener('change', () => choose($('#fx-picker').value));
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
  choose(button.dataset.fx);
});
$('#profile').addEventListener('change', () => {
  fb = createFramebuffer($('#profile').value);
  canvas.width = fb.width * 5;
  canvas.height = fb.height * 5;
  canvas.style.aspectRatio = `${fb.width} / ${fb.height}`;
  $('#board-size').textContent = `${fb.width}×${fb.height} / I²C`;
  $('.intro .eyebrow').textContent = `${fb.width} × ${fb.height} PIXELS. A LITTLE PERSONALITY.`;
  $('#dual-tone').disabled = fb.height === 32;
  $('#dual-tone').checked = fb.height === 64;
});
$('#glow').addEventListener('change', () => $('.board').classList.toggle('glowing', $('#glow').checked));
$('#reset').addEventListener('click', () => {
  for (const input of document.querySelectorAll('input[type=range]')) input.value = 0;
  gaze();
});
$('#pause').addEventListener('click', () => { paused = !paused; $('#pause').textContent = paused ? 'Resume' : 'Pause'; });
function download(blob, filename) {
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$('#download-png').addEventListener('click', () => canvas.toBlob(blob => { if (blob) download(blob, selectedId.replace('/', '-') + '.png'); }));
$('#download-header').addEventListener('click', () => {
  const sampled = effects[selectedId].create({ seed: 1, ...effect.params }), frames = [];
  const target = createFramebuffer($('#profile').value || 'ssd1306-128x64');
  for (let i = 0; i < 32; i++) { sampled.draw(target); frames.push(target.data.slice()); sampled.step(1 / 16); }
  const sequence = { width: target.width, height: target.height, fps: 16, frames };
  const format = $('#export-format').value;
  // Standalone header: the browser embeds the same player used by the CLI.
  const compiled = format === 'xor-rle' ? buildHeader(sequence) : buildBitmapHeader(sequence, 'oledfx_animation', format);
  download(new Blob([compiled.header], { type: 'text/plain' }), selectedId.replace('/', '-') + '-' + format + '.h');
  $('#export-status').textContent = `${format} · ${compiled.storageBytes.toLocaleString()} flash bytes`;
});
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
