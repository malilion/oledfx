import { createFramebuffer } from '../src/core/framebuffer.js';
import { renderRGBA } from '../src/core/render-rgba.js';
import { effects } from '../src/fx/index.js';
import { buildHeader, buildBitmapHeader, buildRGB565Header } from '../src/core/mcu.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll ? document.querySelectorAll(selector) : [];
const canvas = $('canvas'), context = canvas.getContext('2d');
let fb = createFramebuffer();
let effect = effects['eyes/blink'].create({ seed: 1 }), paused = false, previous;
let selectedId = 'eyes/blink', speed = 1, activeTab = 'header';
let prevFrameData = new Uint8Array(fb.data.length);
let cachedHeader = null;

const effectIds = Object.keys(effects);
const groups = [...new Set(effectIds.map(id => id.split('/')[0]))];
$('#fx-picker').innerHTML = groups.map(category => `<optgroup label="${category}">${Object.values(effects).filter(fx => fx.meta.id.startsWith(category + '/')).map(fx => `<option value="${fx.meta.id}">${fx.meta.name}</option>`).join('')}</optgroup>`).join('');
$('#fx-count').textContent = `${effectIds.length} FX`;

function popcountBuffer(buf) {
  let bits = 0;
  for (let i = 0; i < buf.length; i++) {
    let b = buf[i];
    while (b) { b &= b - 1; bits++; }
  }
  return bits;
}

function xorBits(a, b) {
  let bits = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    let d = a[i] ^ b[i];
    while (d) { d &= d - 1; bits++; }
  }
  return bits;
}

function compileCurrent() {
  const profileId = ($('#profile').value && $('#profile').value !== '0') ? $('#profile').value : 'ssd1306-128x64';
  const sampled = effects[selectedId].create({ seed: 1, ...effect.params }), frames = [];
  const target = createFramebuffer(profileId);
  for (let i = 0; i < 32; i++) { sampled.draw(target); frames.push(target.data.slice()); sampled.step(1 / 16); }
  const sequence = { width: target.width, height: target.height, fps: 16, frames };
  const format = ($('#export-format').value && $('#export-format').value !== '0') ? $('#export-format').value : 'xor-rle';
  const compiled = format === 'xor-rle' ? buildHeader(sequence)
    : format === 'rgb565' && typeof buildRGB565Header === 'function' ? buildRGB565Header(sequence, 'oledfx_animation', { dualTone: $('#dual-tone').checked })
    : buildBitmapHeader(sequence, 'oledfx_animation', format);
  cachedHeader = { ...compiled, format, profileId, width: target.width, height: target.height };
  return cachedHeader;
}

function updateInspector() {
  const codeEl = $('#code-preview');
  const flashEl = $('#telemetry-flash'), meterFlash = $('#meter-flash'), badgeEl = $('#telemetry-badge'), metaEl = $('#inspector-meta');
  if (!codeEl && !flashEl && !badgeEl) return;
  const compiled = compileCurrent();
  const rawBytes = 32 * compiled.width * compiled.height / 8;
  const savedPct = Math.max(0, Math.round((1 - compiled.storageBytes / rawBytes) * 100));
  if (flashEl) flashEl.textContent = `${compiled.storageBytes.toLocaleString()} B / 4,096 B`;
  if (meterFlash?.style) meterFlash.style.width = `${Math.min(100, Math.round(compiled.storageBytes / 4096 * 100))}%`;
  if (badgeEl) badgeEl.textContent = `${compiled.format.toUpperCase()} · ${compiled.storageBytes.toLocaleString()} B (${savedPct > 0 ? `-${savedPct}%` : 'RAW'})`;
  if (metaEl) metaEl.textContent = `${compiled.profileId.toUpperCase()} · ${compiled.storageBytes.toLocaleString()} B FLASH · 0 B HEAP`;
  if (!codeEl) return;

  if (activeTab === 'header') {
    const lines = compiled.header.split('\n');
    codeEl.textContent = lines.slice(0, 26).join('\n') + (lines.length > 26 ? `\n/* ... ${lines.length - 26} more lines (${compiled.storageBytes} bytes total) ... */` : '');
  } else if (activeTab === 'Arduino') {
    codeEl.textContent = `#include <Wire.h>
#include <Adafruit_SSD1306.h>
#include "${selectedId.replace('/', '_')}.h"

Adafruit_SSD1306 display(${compiled.width}, ${compiled.height}, &Wire, -1);
uint32_t frame_idx = 0;

void setup() {
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
}

void loop() {
  oledfx_animation_step_frame(display.getBuffer(), frame_idx);
  display.display();
  frame_idx = (frame_idx + 1) % OLEDFX_ANIMATION_FRAME_COUNT;
  delay(1000 / OLEDFX_ANIMATION_FPS);
}`;
  } else {
    const lx = Number($('#look-x').value || 0).toFixed(2);
    const ly = Number($('#look-y').value || 0).toFixed(2);
    codeEl.textContent = `import { createFramebuffer, effects } from './src/index.js';

const screen = createFramebuffer('${compiled.profileId}');
const fx = effects['${selectedId}'].create({
  seed: 1,${selectedId.startsWith('eyes/') ? ` lookX: ${lx}, lookY: ${ly},` : ''}
});

// Step at 16 fps and render into native page-packed Uint8Array
fx.step(1 / 16);
fx.draw(screen);`;
  }
}

function showToast(msg) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.hidden = false;
  setTimeout(() => { toast.hidden = true; }, 1800);
}

async function copyText(text, label) {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    }
    showToast(label);
  } catch {
    showToast(label);
  }
}

function choose(id) {
  if (!Object.hasOwn(effects, id)) return;
  selectedId = id;
  effect = effects[id].create({ seed: 1 });
  prevFrameData = new Uint8Array(fb.data.length);
  $('#fx-picker').value = id;
  $('#fx-name').textContent = effects[id].meta.name;
  for (const other of $$('.effect')) {
    other.classList.toggle('active', other.dataset.fx === id);
    other.setAttribute('aria-pressed', String(other.dataset.fx === id));
  }
  $('#blink-label').hidden = !('blink' in effect.params);
  $('#look-x').disabled = $('#look-y').disabled = !id.startsWith('eyes/');
  gaze();
  updateInspector();
}

$('#fx-picker').addEventListener('change', () => choose($('#fx-picker').value));

$('#prev-fx')?.addEventListener('click', () => {
  const idx = (effectIds.indexOf(selectedId) - 1 + effectIds.length) % effectIds.length;
  choose(effectIds[idx]);
});
$('#next-fx')?.addEventListener('click', () => {
  const idx = (effectIds.indexOf(selectedId) + 1) % effectIds.length;
  choose(effectIds[idx]);
});

function gaze() {
  effect.params.lookX = Number($('#look-x').value);
  effect.params.lookY = Number($('#look-y').value);
  if ('blink' in effect.params) effect.params.blink = Number($('#blink').value) || null;
  $('#position').textContent = `X ${effect.params.lookX.toFixed(2)}   Y ${effect.params.lookY.toFixed(2)}`;
}

for (const control of $$('input[type=range]')) {
  if (control.id === 'frame-scrubber') continue;
  control.addEventListener('input', () => { gaze(); if (activeTab === 'esm') updateInspector(); });
}

canvas.addEventListener('pointermove', event => {
  const rect = canvas.getBoundingClientRect();
  $('#look-x').value = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
  $('#look-y').value = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
  gaze();
});

const stageEl = $('#display-stage'), boardEl = $('.board');
stageEl?.addEventListener('pointermove', event => {
  if (!stageEl.getBoundingClientRect || !boardEl?.style?.setProperty) return;
  const rect = stageEl.getBoundingClientRect();
  const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
  const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  boardEl.style.setProperty('--tilt-x', `${(nx * 5.5).toFixed(2)}deg`);
  boardEl.style.setProperty('--tilt-y', `${(-ny * 4.5).toFixed(2)}deg`);
  boardEl.style.setProperty('--glare-x', `${Math.round(50 + nx * 35)}%`);
  boardEl.style.setProperty('--glare-y', `${Math.round(40 + ny * 35)}%`);
});
stageEl?.addEventListener('pointerleave', () => {
  if (!boardEl?.style?.setProperty) return;
  boardEl.style.setProperty('--tilt-x', '0deg');
  boardEl.style.setProperty('--tilt-y', '0deg');
});

for (const button of $$('.effect')) button.addEventListener('click', () => {
  choose(button.dataset.fx);
});

$('#profile').addEventListener('change', () => {
  const id = $('#profile').value;
  fb = createFramebuffer(id);
  prevFrameData = new Uint8Array(fb.data.length);
  canvas.width = fb.width * 5;
  canvas.height = fb.height * 5;
  canvas.style.aspectRatio = `${fb.width} / ${fb.height}`;
  const bus = id === 'led-matrix-64x32' ? 'HUB75' : id === 'st7789-128x128' ? 'SPI' : 'I²C';
  $('#board-size').textContent = `${fb.width}×${fb.height} / ${bus}`;
  $('.intro .eyebrow').textContent = `${fb.width} × ${fb.height} PIXELS. A LITTLE PERSONALITY.`;
  $('#dual-tone').disabled = fb.height === 32;
  $('#dual-tone').checked = fb.height >= 64;
  updateInspector();
});

$('#export-format')?.addEventListener('change', updateInspector);
$('#glow').addEventListener('change', () => $('.board').classList.toggle('glowing', $('#glow').checked));

$('#reset').addEventListener('click', () => {
  for (const input of $$('input[type=range]')) {
    if (input.id === 'frame-scrubber') continue;
    input.value = 0;
  }
  gaze();
  updateInspector();
});

function setPaused(state) {
  paused = state;
  $('#pause').textContent = paused ? 'Resume' : 'Pause';
  const modeTag = $('#preview-mode-tag');
  if (modeTag) modeTag.textContent = paused ? 'PAUSED // STEP MODE' : `REALTIME · ${speed}×`;
}

$('#pause').addEventListener('click', () => setPaused(!paused));

function seekToFrame(frameIdx) {
  const clamped = ((frameIdx % 32) + 32) % 32;
  effect = effects[selectedId].create({ seed: 1, ...effect.params });
  effect.step(clamped / 16);
  setPaused(true);
}

$('#step-prev')?.addEventListener('click', () => {
  const cur = Math.round(((effect.t % 2) / 2) * 32);
  seekToFrame(cur - 1);
});
$('#step-next')?.addEventListener('click', () => {
  const cur = Math.round(((effect.t % 2) / 2) * 32);
  seekToFrame(cur + 1);
});
$('#frame-scrubber')?.addEventListener('input', e => {
  seekToFrame(Number(e.target.value));
});

for (const btn of $$('.speed-btn')) {
  btn.addEventListener('click', () => {
    speed = Number(btn.dataset.speed) || 1;
    for (const other of $$('.speed-btn')) other.classList?.toggle('active', other === btn);
    const modeTag = $('#preview-mode-tag');
    if (modeTag && !paused) modeTag.textContent = `REALTIME · ${speed}×`;
  });
}

for (const tab of $$('.insp-tab')) {
  tab.addEventListener('click', () => {
    activeTab = tab.dataset.tab;
    for (const other of $$('.insp-tab')) other.classList?.toggle('active', other === tab);
    updateInspector();
  });
}

$('#copy-code')?.addEventListener('click', () => {
  const compiled = cachedHeader ?? compileCurrent();
  const content = activeTab === 'header' ? compiled.header : ($('#code-preview')?.textContent ?? '');
  copyText(content, `Copied ${activeTab} (${compiled.storageBytes} B)`);
});

$('#copy-header')?.addEventListener('click', () => {
  const compiled = compileCurrent();
  copyText(compiled.header, `Copied ${selectedId}.h (${compiled.storageBytes} flash bytes)`);
});
$('#hero-copy-h')?.addEventListener('click', () => {
  const compiled = compileCurrent();
  copyText(compiled.header, `Copied ${selectedId}.h (${compiled.storageBytes} flash bytes)`);
});

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
  const compiled = format === 'xor-rle' ? buildHeader(sequence)
    : format === 'rgb565' && typeof buildRGB565Header === 'function' ? buildRGB565Header(sequence, 'oledfx_animation', { dualTone: $('#dual-tone').checked })
    : buildBitmapHeader(sequence, 'oledfx_animation', format);
  download(new Blob([compiled.header], { type: 'text/plain' }), selectedId.replace('/', '-') + '-' + format + '.h');
  $('#export-status').textContent = `${format} · ${compiled.storageBytes.toLocaleString()} flash bytes`;
});

function getEffectiveTheme() {
  if (typeof document === 'undefined' || !document.documentElement?.getAttribute) return 'dark';
  return document.documentElement.getAttribute('data-theme') || 'dark';
}

function applyTheme(theme) {
  if (typeof document !== 'undefined' && document.documentElement?.setAttribute) {
    document.documentElement.setAttribute('data-theme', theme);
  }
  const textEl = $('#theme-text');
  if (textEl) textEl.textContent = theme === 'light' ? 'LIGHT' : 'DARK';
  const toggleBtn = $('#theme-toggle');
  if (toggleBtn?.setAttribute) {
    toggleBtn.setAttribute('aria-label', `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`);
  }
  if (typeof localStorage !== 'undefined' && localStorage.setItem) {
    try { localStorage.setItem('oledfx-theme', theme); } catch (_) {}
  }
}

function toggleTheme() {
  const current = getEffectiveTheme();
  applyTheme(current === 'light' ? 'dark' : 'light');
}

const themeBtn = $('#theme-toggle');
if (themeBtn?.addEventListener) {
  themeBtn.addEventListener('click', toggleTheme);
}
applyTheme(getEffectiveTheme());

if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('keydown', event => {
    const tag = event.target?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (event.key === ' ') { event.preventDefault(); setPaused(!paused); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); $('#next-fx')?.fire ? $('#next-fx').fire('click') : $('#next-fx')?.click?.(); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); $('#prev-fx')?.fire ? $('#prev-fx').fire('click') : $('#prev-fx')?.click?.(); }
    else if (event.key === 'c' || event.key === 'C') { $('#copy-header')?.click?.(); }
    else if (event.key === 't' || event.key === 'T') { event.preventDefault(); toggleTheme(); }
    else if (event.key === '/') { event.preventDefault(); $('#search')?.focus?.(); }
  });
}

function animate(timestamp) {
  if (previous !== undefined && !paused) effect.step(Math.min((timestamp - previous) / 1000, 0.1) * speed);
  previous = timestamp;
  effect.draw(fb);
  const totalPixels = fb.width * fb.height;
  const fillPct = (popcountBuffer(fb.data) / totalPixels) * 100;
  const deltaPct = (xorBits(prevFrameData, fb.data) / totalPixels) * 100;
  prevFrameData.set(fb.data);

  const fillEl = $('#telemetry-fill'), meterFill = $('#meter-fill');
  if (fillEl) fillEl.textContent = `${fillPct.toFixed(1)}%`;
  if (meterFill?.style) meterFill.style.width = `${Math.min(100, fillPct * 2.2).toFixed(0)}%`;

  const deltaEl = $('#telemetry-delta'), meterDelta = $('#meter-delta');
  const tag = deltaPct < 0.2 ? 'HOLD' : deltaPct > 4.0 ? 'BURST' : 'STEP';
  if (deltaEl) deltaEl.textContent = `${deltaPct.toFixed(1)}% · ${tag}`;
  if (meterDelta?.style) meterDelta.style.width = `${Math.min(100, deltaPct * 8).toFixed(0)}%`;

  const frameIdx = Math.floor(((effect.t % 2) / 2) * 32) % 32;
  const frameEl = $('#telemetry-frame'), scrubberEl = $('#frame-scrubber');
  if (frameEl) frameEl.textContent = `F${String(frameIdx).padStart(2, '0')} / 31`;
  if (scrubberEl && !paused) scrubberEl.value = String(frameIdx);

  const profile = $('#profile').value && $('#profile').value !== '0' ? { profile: $('#profile').value } : {};
  const image = renderRGBA(fb, { scale: 5, dualTone: $('#dual-tone').checked, grid: $('#grid').checked, glow: $('#glow').checked, ...profile });
  context.putImageData(new ImageData(image.data, image.width, image.height), 0, 0);
  $('#clock').textContent = `${effect.t.toFixed(2)} s`;
  requestAnimationFrame(animate);
}
gaze();
updateInspector();
requestAnimationFrame(animate);
