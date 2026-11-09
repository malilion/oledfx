import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fillRate } from '../src/core/framebuffer.js';
import { renderRGBA } from '../src/core/render-rgba.js';
import { encodePNG } from '../src/core/png.js';
import { encodeGIF } from '../src/core/gif.js';
import { blit, drawText, makeRGBA, setPixel } from './raster.mjs';
import { isMain, loadSequence, numeric, parseArgs, validateSequence } from './sequence.mjs';

export function contactSheet(sequence, { scale = 3, columns = 4, samples = 12, dualTone = false } = {}) {
  validateSequence(sequence);
  if (!Number.isInteger(columns) || columns < 1 || columns > 8 || !Number.isInteger(samples) || samples < 1 || samples > 64) throw new RangeError('columns must be 1..8; samples 1..64');
  const count = Math.min(samples, sequence.frames.length), cols = Math.min(columns, count);
  const cellWidth = sequence.width * scale + 24, cellHeight = sequence.height * scale + 54;
  const sheet = makeRGBA(cols * cellWidth + 24, Math.ceil(count / cols) * cellHeight + 64);
  drawText(sheet, `OLEDFX / ${sequence.name ?? 'FIXTURE'}`, 24, 18, [179, 225, 249, 255], 2);
  drawText(sheet, `SSD1306  ${sequence.width}X${sequence.height}  ${sequence.fps}FPS  ${dualTone ? 'YELLOW/BLUE' : 'BLUE'}`, 24, 42, [99, 130, 153, 255]);
  for (let tile = 0; tile < count; tile++) {
    const index = count === 1 ? 0 : Math.round(tile * (sequence.frames.length - 1) / (count - 1));
    const fb = { width: sequence.width, height: sequence.height, data: sequence.frames[index] };
    const preview = renderRGBA(fb, { scale, dualTone });
    const x = 24 + (tile % cols) * cellWidth, y = 68 + Math.floor(tile / cols) * cellHeight;
    blit(sheet, preview, x, y);
    const line = [35, 61, 78, 255];
    for (let px = -1; px <= preview.width; px++) { setPixel(sheet, x + px, y - 1, line); setPixel(sheet, x + px, y + preview.height, line); }
    for (let py = -1; py <= preview.height; py++) { setPixel(sheet, x - 1, y + py, line); setPixel(sheet, x + preview.width, y + py, line); }
    const ox = x + (sequence.width >> 1) * scale, oy = y + (sequence.height >> 1) * scale;
    for (let d = -4; d <= 4; d++) { setPixel(sheet, ox + d, oy, line); setPixel(sheet, ox, oy + d, line); }
    drawText(sheet, `F${String(index).padStart(3, '0')} T${(index / sequence.fps).toFixed(3)}S ${(fillRate(fb) * 100).toFixed(1)}%`, x, y + preview.height + 12, [148, 180, 198, 255]);
    drawText(sheet, `ORIGIN ${sequence.width >> 1}/${sequence.height >> 1}`, x, y + preview.height + 26, [70, 98, 119, 255]);
  }
  return sheet;
}

export function spriteSheet(sequence, { scale = 1, columns = 8, dualTone = false } = {}) {
  const { width, height, fps, frames, name = 'fixture' } = validateSequence(sequence);
  if (!Number.isInteger(columns) || columns < 1 || columns > 32) throw new RangeError('columns must be 1..32');
  const cols = Math.min(columns, frames.length), rows = Math.ceil(frames.length / cols);
  const tileW = width * scale, tileH = height * scale;
  const image = makeRGBA(cols * tileW, rows * tileH, [0, 0, 0, 0]);
  const atlasFrames = [];
  const durationMs = Math.round(1000 / fps);
  frames.forEach((data, i) => {
    const x = (i % cols) * tileW, y = Math.floor(i / cols) * tileH;
    const tile = renderRGBA({ width, height, data }, { scale, dualTone, grid: scale > 1, glow: scale > 1 });
    blit(image, tile, x, y);
    atlasFrames.push({ index: i, frame: { x, y, w: tileW, h: tileH }, duration: durationMs });
  });
  const atlas = {
    frames: atlasFrames,
    meta: { app: 'oledfx', effect: name, width, height, scale, fps, frameCount: frames.length, size: { w: image.width, h: image.height } }
  };
  return { image, atlas };
}

export async function savePNG(path, image) {
  await mkdir(dirname(resolve(path)), { recursive: true });
  await writeFile(path, encodePNG({ w: image.width, h: image.height, data: image.data }));
}

export async function saveGIF(path, sequence, options = {}) {
  await mkdir(dirname(resolve(path)), { recursive: true });
  const gif = encodeGIF(sequence, options);
  await writeFile(path, gif);
  return gif;
}

if (isMain(import.meta.url)) {
  try {
    const options = parseArgs(process.argv.slice(2), ['scale', 'columns', 'samples', 'still-out', 'sheet', 'gif']);
    if (options.help) console.log('node tools/render.mjs [--fx eyes/blink|eyes/happy-squint | --fixture frames.json] [--profile ssd1306-128x64|ssd1306-128x32|led-matrix-64x32|st7789-128x128] [--out artifacts/eyes.png --still-out artifacts/eyes-still.png --sheet artifacts/eyes-sheet.png --gif artifacts/eyes.gif] [--dual-tone --scale 3 --columns 4 --samples 12]');
    else {
      const sequence = await loadSequence(options), scale = numeric(options, 'scale', 3);
      const out = options.out ?? `artifacts/${sequence.name}.png`;
      const sheet = contactSheet(sequence, { scale, columns: numeric(options, 'columns', 4), samples: numeric(options, 'samples', 12), dualTone: options['dual-tone'] });
      await savePNG(out, sheet);
      console.log(`${out}: ${sheet.width}x${sheet.height}, frame / seconds / fill / center crosshair`);
      if (options['still-out']) {
        await savePNG(options['still-out'], renderRGBA({ ...sequence, data: sequence.frames[0] }, { scale, dualTone: options['dual-tone'] }));
        console.log(`Still: ${options['still-out']}`);
      }
      if (options.sheet) {
        const { image, atlas } = spriteSheet(sequence, { scale: numeric(options, 'scale', 1), columns: numeric(options, 'columns', 8), dualTone: options['dual-tone'] });
        await savePNG(options.sheet, image);
        const atlasPath = options.sheet.replace(/\.png$/i, '') + '.json';
        await writeFile(atlasPath, JSON.stringify(atlas, null, 2));
        console.log(`Sprite sheet: ${options.sheet} + ${atlasPath}`);
      }
      if (options.gif) {
        await saveGIF(options.gif, sequence, { scale: Math.min(8, Math.max(1, scale)), dualTone: options['dual-tone'] });
        console.log(`GIF: ${options.gif}`);
      }
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
