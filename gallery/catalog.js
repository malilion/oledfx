import { effects, categories } from '../src/fx/index.js';
import { createFramebuffer } from '../src/core/framebuffer.js';
import { renderRGBA } from '../src/core/render-rgba.js';
import { buildHeader } from '../src/core/mcu.js';

const root = document.querySelector('#catalog'), tabs = document.querySelector('#categories');
const cards = [], fb = createFramebuffer();
let category = 'all', catalogDualTone = true;
const names = { all: 'All animations', eyes: 'Eyes', weather: 'Weather', system: 'System & IoT', pomodoro: 'Pomodoro & desk', transitions: 'Transitions' };
for (const key of ['all', ...categories]) {
  const button = document.createElement('button');
  const count = Object.keys(effects).filter(id => key === 'all' || id.startsWith(key + '/')).length;
  button.textContent = `${names[key]} ${count}`; button.type = 'button';
  button.setAttribute('aria-pressed', String(key === category));
  button.addEventListener('click', () => {
    category = key;
    for (const other of tabs.children) other.setAttribute('aria-pressed', String(other === button));
    filter();
  });
  tabs.append(button);
}
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) cards.find(card => card.button === entry.target).visible = entry.isIntersecting;
});

function copyEffectHeader(id) {
  if (typeof buildHeader !== 'function') return;
  const sampled = effects[id].create({ seed: 1 }), target = createFramebuffer('ssd1306-128x64'), frames = [];
  for (let i = 0; i < 32; i++) { sampled.draw(target); frames.push(target.data.slice()); sampled.step(1 / 16); }
  const compiled = buildHeader({ width: 128, height: 64, fps: 16, frames });
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(compiled.header).catch(() => {});
  }
  const toast = document.querySelector('#toast');
  if (toast) {
    toast.textContent = `Copied ${id}.h (${compiled.storageBytes.toLocaleString()} B Flash)`;
    toast.hidden = false;
    setTimeout(() => { toast.hidden = true; }, 1800);
  }
}

let index = 0;
for (const [id, module] of Object.entries(effects)) {
  index++;
  const button = document.createElement('button'), canvas = document.createElement('canvas');
  button.type = 'button'; button.className = 'fx-card'; button.setAttribute('aria-label', `Preview ${module.meta.name}`);
  canvas.width = 256; canvas.height = 128;
  const label = document.createElement('span'), tag = document.createElement('small');
  const actions = document.createElement('div');
  actions.className = 'fx-card-actions';
  const inspectChip = document.createElement('em'), copyChip = document.createElement('b');
  inspectChip.textContent = 'Inspect ↗';
  copyChip.textContent = 'Copy .h ⎘';
  copyChip.addEventListener('click', event => {
    if (event?.stopPropagation) event.stopPropagation();
    copyEffectHeader(id);
  });
  actions.append(inspectChip, copyChip);
  label.textContent = module.meta.name;
  tag.textContent = `#${String(index).padStart(3, '0')} · ${id} · LOOP`;
  button.append(canvas, label, tag, actions); root.append(button);
  const effect = module.create({ seed: 1 }); effect.step(0.65);
  cards.push({ id, name: module.meta.name, button, canvas, effect, visible: false }); observer.observe(button);
  button.addEventListener('click', () => {
    const picker = document.querySelector('#fx-picker'); picker.value = id; picker.dispatchEvent(new Event('change'));
    document.querySelector('.workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

const toneBtn = document.querySelector('#catalog-tone');
if (toneBtn) {
  toneBtn.addEventListener('click', () => {
    catalogDualTone = !catalogDualTone;
    toneBtn.setAttribute('aria-pressed', String(catalogDualTone));
    toneBtn.textContent = catalogDualTone ? '◐ Dual-Tone' : '◯ Mono Cyan';
  });
}

if (document.querySelectorAll) {
  for (const btn of document.querySelectorAll('.density-btn')) {
    btn.addEventListener('click', () => {
      root.setAttribute('data-cols', btn.dataset?.cols || '4');
      for (const other of document.querySelectorAll('.density-btn')) {
        other.classList?.toggle('active', other === btn);
      }
    });
  }
}

function filter() {
  const term = document.querySelector('#search').value.toLowerCase();
  let count = 0;
  for (const card of cards) {
    card.button.hidden = !(category === 'all' || card.id.startsWith(category + '/')) || !`${card.id} ${card.name}`.toLowerCase().includes(term);
    if (!card.button.hidden) count++;
  }
  document.querySelector('#empty').hidden = count !== 0;
}
document.querySelector('#search').addEventListener('input', filter);
let previous;
function animate(timestamp) {
  const dt = previous === undefined ? 0 : Math.min((timestamp - previous) / 1000, 0.1);
  previous = timestamp;
  for (const card of cards) if (card.visible && !card.button.hidden) {
    card.effect.step(dt); card.effect.draw(fb);
    const image = renderRGBA(fb, { scale: 2, glow: false, grid: true, dualTone: catalogDualTone });
    card.canvas.getContext('2d').putImageData(new ImageData(image.data, image.width, image.height), 0, 0);
  }
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
