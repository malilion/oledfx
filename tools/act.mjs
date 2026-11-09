import { fillRate, getPixel } from '../src/core/framebuffer.js';
import { renderRGBA } from '../src/core/render-rgba.js';
import { blit, drawText, makeRGBA, setPixel } from './raster.mjs';
import { savePNG } from './render.mjs';
import { isMain, loadSequence, numeric, parseArgs, validateSequence } from './sequence.mjs';

export function frameDeltaRate(prev, curr, width, height) {
  let diff = 0;
  const a = { width, height, data: prev }, b = { width, height, data: curr };
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (getPixel(a, x, y) !== getPixel(b, x, y)) diff++;
  }
  return diff / (width * height);
}

// Continuous 12fps action strip for debugging windup, freeze/hold, and recovery.
export function actionStrip(sequence, { scale = 2, columns = 6, dualTone = false } = {}) {
  validateSequence(sequence);
  if (!Number.isInteger(columns) || columns < 1 || columns > 12) throw new RangeError('columns must be 1..12');
  const count = sequence.frames.length, cols = Math.min(columns, count);
  const cellWidth = sequence.width * scale + 20, cellHeight = sequence.height * scale + 54;
  const sheet = makeRGBA(cols * cellWidth + 24, Math.ceil(count / cols) * cellHeight + 68);
  drawText(sheet, `OLEDFX ACT STRIP / ${sequence.name ?? 'FIXTURE'}`, 24, 18, [179, 225, 249, 255], 2);
  drawText(sheet, `CONTINUOUS ${sequence.fps}FPS  ${count} FRAMES  ${sequence.width}X${sequence.height}`, 24, 42, [106, 219, 198, 255]);
  for (let i = 0; i < count; i++) {
    const fb = { width: sequence.width, height: sequence.height, data: sequence.frames[i] };
    const prev = i > 0 ? sequence.frames[i - 1] : sequence.frames[0];
    const delta = i === 0 ? 0 : frameDeltaRate(prev, sequence.frames[i], sequence.width, sequence.height);
    const preview = renderRGBA(fb, { scale, dualTone });
    const x = 24 + (i % cols) * cellWidth, y = 68 + Math.floor(i / cols) * cellHeight;
    blit(sheet, preview, x, y);
    const tag = i > 0 && delta < 0.002 ? 'HOLD' : delta > 0.04 ? 'BURST' : 'STEP';
    const border = tag === 'BURST' ? [255, 210, 65, 255] : tag === 'HOLD' ? [70, 98, 119, 255] : [35, 61, 78, 255];
    for (let px = -1; px <= preview.width; px++) { setPixel(sheet, x + px, y - 1, border); setPixel(sheet, x + px, y + preview.height, border); }
    for (let py = -1; py <= preview.height; py++) { setPixel(sheet, x - 1, y + py, border); setPixel(sheet, x + preview.width, y + py, border); }
    const ox = x + (sequence.width >> 1) * scale, oy = y + (sequence.height >> 1) * scale;
    for (let d = -3; d <= 3; d++) { setPixel(sheet, ox + d, oy, [35, 61, 78, 255]); setPixel(sheet, ox, oy + d, [35, 61, 78, 255]); }
    drawText(sheet, `#${String(i).padStart(2, '0')} T${(i / sequence.fps).toFixed(2)}S ${(fillRate(fb) * 100).toFixed(1)}%`, x, y + preview.height + 10, [148, 180, 198, 255]);
    drawText(sheet, `DLT ${(delta * 100).toFixed(1)}% ${tag}`, x, y + preview.height + 24, tag === 'BURST' ? [255, 210, 65, 255] : [99, 130, 153, 255]);
  }
  return sheet;
}

if (isMain(import.meta.url)) {
  try {
    const options = parseArgs(process.argv.slice(2), ['scale', 'columns']);
    if (options.help) {
      console.log('node tools/act.mjs [id | --fx id | --fixture frames.json] [--profile ssd1306-128x64|ssd1306-128x32|led-matrix-64x32|st7789-128x128] [--fps 12 --frames 24] [--scale 2 --columns 6 --dual-tone] [--out artifacts/act.png]');
    } else {
      const fps = numeric(options, 'fps', 12);
      const frames = numeric(options, 'frames', Math.round(2 * fps));
      const sequence = await loadSequence({ ...options, fps: String(fps), frames: String(frames) });
      const out = options.out ?? `artifacts/${sequence.name}-act.png`;
      const strip = actionStrip(sequence, {
        scale: numeric(options, 'scale', 2),
        columns: numeric(options, 'columns', 6),
        dualTone: Boolean(options['dual-tone'])
      });
      await savePNG(out, strip);
      console.log(`${out}: ${strip.width}x${strip.height} (${sequence.frames.length} continuous frames @ ${sequence.fps}fps)`);
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
