import { effects } from '../src/fx/index.js';
import { createFramebuffer } from '../src/core/framebuffer.js';
import { renderRGBA } from '../src/core/render-rgba.js';
import { blit, drawText, makeRGBA } from './raster.mjs';
import { savePNG } from './render.mjs';
import { isMain, numeric, parseArgs } from './sequence.mjs';

// A dependency-free, reproducible visual inventory of the actual runtime FX.
export function catalogSheet({ category, time = 0.65, profile = 'ssd1306-128x64', columns = 5, scale = 2 } = {}) {
  if (!Number.isInteger(columns) || columns < 1 || columns > 8 || !Number.isFinite(time)) throw new RangeError('Invalid sheet options');
  const entries = Object.entries(effects).filter(([id]) => !category || id.startsWith(category + '/'));
  if (!entries.length) throw new Error(`Unknown category: ${category}`);
  const fb = createFramebuffer(profile), width = fb.width * scale + 24, height = fb.height * scale + 54;
  const cols = Math.min(columns, entries.length), image = makeRGBA(cols * width + 24, Math.ceil(entries.length / cols) * height + 80);
  drawText(image, `OLEDFX / ${category ?? 'THE PIXEL COLLECTION'}`, 24, 18, [179, 225, 249, 255], 2);
  drawText(image, `${entries.length} FX   ${fb.width}X${fb.height}   1 BIT   T=${time.toFixed(2)}S   SEED=1`, 24, 46, [106, 219, 198, 255]);
  entries.forEach(([id, mod], i) => {
    const effect = mod.create({ seed: 1 }); effect.step(time); effect.draw(fb);
    const x = 24 + i % cols * width, y = 76 + Math.floor(i / cols) * height;
    blit(image, renderRGBA(fb, { scale, grid: true, glow: true, dualTone: fb.height === 64 }), x, y);
    drawText(image, id, x, y + fb.height * scale + 12, [148, 180, 198, 255]);
  });
  return image;
}

if (isMain(import.meta.url)) {
  try {
    const options = parseArgs(process.argv.slice(2), ['category', 'time', 'columns', 'scale']);
    const out = options.out ?? 'artifacts/catalog.png';
    const image = catalogSheet({ category: options.category, profile: options.profile, time: numeric(options, 'time', 0.65), columns: numeric(options, 'columns', 5), scale: numeric(options, 'scale', 2) });
    await savePNG(out, image);
    console.log(`${out}: ${image.width}x${image.height}`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
