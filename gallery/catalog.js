import { effects, categories } from '../src/fx/index.js';
import { createFramebuffer } from '../src/core/framebuffer.js';
import { renderRGBA } from '../src/core/render-rgba.js';

const root = document.querySelector('#catalog'), tabs = document.querySelector('#categories');
const cards = [], fb = createFramebuffer();
let category = 'all';
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
for (const [id, module] of Object.entries(effects)) {
  const button = document.createElement('button'), canvas = document.createElement('canvas');
  button.type = 'button'; button.className = 'fx-card'; button.setAttribute('aria-label', `Preview ${module.meta.name}`);
  canvas.width = 256; canvas.height = 128;
  const label = document.createElement('span'), tag = document.createElement('small');
  label.textContent = module.meta.name; tag.textContent = id;
  button.append(canvas, label, tag); root.append(button);
  const effect = module.create({ seed: 1 }); effect.step(0.65);
  cards.push({ id, name: module.meta.name, button, canvas, effect, visible: false }); observer.observe(button);
  button.addEventListener('click', () => {
    const picker = document.querySelector('#fx-picker'); picker.value = id; picker.dispatchEvent(new Event('change'));
    document.querySelector('.workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
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
    const image = renderRGBA(fb, { scale: 2, glow: false, grid: true, dualTone: true });
    card.canvas.getContext('2d').putImageData(new ImageData(image.data, image.width, image.height), 0, 0);
  }
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
