import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { performance } from 'node:perf_hooks';
import { fillRate, getPixel } from '../src/core/framebuffer.js';
import { decode } from '../src/core/xor-rle.js';
import { effects } from '../src/fx/index.js';
import { buildHeader } from './mcu-format.mjs';
import { isMain, loadSequence, numeric, parseArgs, validateSequence } from './sequence.mjs';

export function islandFlickerRate(sequence) {
  const { width, height, frames } = sequence;
  let islands = 0, reversals = 0;
  for (let i = 1; i < frames.length; i++) {
    const before = { width, height, data: frames[i - 1] }, now = { width, height, data: frames[i] };
    const changed = (x, y) => x >= 0 && x < width && y >= 0 && y < height && getPixel(before, x, y) !== getPixel(now, x, y);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      if (!changed(x, y)) continue;
      let neighbors = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if ((dx || dy) && changed(x + dx, y + dy)) neighbors++;
      }
      if (!neighbors) {
        islands++;
        if (i + 1 < frames.length && getPixel({ width, height, data: frames[i + 1] }, x, y) === getPixel(before, x, y)) reversals++;
      }
    }
  }
  const samples = Math.max(1, frames.length - 1) * width * height;
  return { rate: islands / samples, islands, reversals, samples };
}

export function edgeSpillRate(sequence) {
  const { width, height, frames, name = '' } = sequence;
  const exempt = String(name).startsWith('transitions/') || width < 8 || height <= 8;
  let borderOn = 0, total = 0;
  for (const data of frames) {
    const fb = { width, height, data };
    for (let x = 0; x < width; x++) {
      borderOn += getPixel(fb, x, 0) + (height > 1 ? getPixel(fb, x, height - 1) : 0);
      total += height > 1 ? 2 : 1;
    }
    for (let y = 1; y < height - 1; y++) {
      borderOn += getPixel(fb, 0, y) + (width > 1 ? getPixel(fb, width - 1, y) : 0);
      total += width > 1 ? 2 : 1;
    }
  }
  return { exempt, rate: total ? borderOn / total : 0, borderOn, total };
}

export function deadFrameStats(sequence) {
  const { width, height, frames, name = '' } = sequence;
  const exempt = !name || name === 'fixture' || String(name).startsWith('transitions/') || frames.length < 4;
  const fills = frames.map(data => fillRate({ width, height, data }));
  const maxFill = Math.max(0, ...fills), minFill = Math.min(1, ...fills);
  let tailBlank = 0;
  for (let i = frames.length - 1; i >= 0 && fills[i] === 0; i--) tailBlank++;
  const tailBlankRatio = tailBlank / Math.max(1, frames.length);
  return { exempt, maxFill, minFill, tailBlank, tailBlankRatio };
}

export function headerRoundtrip(header, sequence, symbol = 'oledfx_animation') {
  const values = name => {
    const body = header.match(new RegExp(`${symbol}_${name}\\[\\] PROGMEM = \\{([^}]+)\\}`, 's'))?.[1];
    if (!body) throw new Error(`Missing header array ${name}`);
    return body.split(',').map(value => Number(value.trim()));
  };
  const data = Uint8Array.from(values('data')), offsets = values('offsets'), sizes = values('sizes');
  if (offsets.length !== sequence.frames.length + 1 || sizes.length !== sequence.frames.length || offsets[0] !== 0 || offsets.at(-1) !== data.length) return false;
  let previous = new Uint8Array(sequence.frames[0].length);
  for (let i = 0; i < sequence.frames.length; i++) {
    if (offsets[i] + sizes[i] !== offsets[i + 1]) return false;
    previous = decode(data.subarray(offsets[i], offsets[i + 1]), previous);
    if (!Buffer.from(previous).equals(Buffer.from(sequence.frames[i]))) return false;
  }
  return true;
}

export async function checkSequence(factory, { flickerThreshold = 0.001, spillThreshold = 0.015, frameBudget = 3.0, budget = 4096, headerBudget = 65536 } = {}) {
  if (!Number.isFinite(flickerThreshold) || flickerThreshold < 0 || flickerThreshold > 1 || !Number.isFinite(spillThreshold) || spillThreshold < 0 || spillThreshold > 1 || !Number.isFinite(frameBudget) || frameBudget <= 0 || !Number.isFinite(budget) || budget < 1 || !Number.isFinite(headerBudget) || headerBudget < 1) throw new RangeError('Invalid check limits');
  const random = Math.random;
  const now = Date.now;
  let sequence, repeat, elapsedMs = 0;
  Math.random = () => { throw new Error('CHK-01: Math.random() forbidden; use mulberry32'); };
  Date.now = () => { throw new Error('CHK-01: Date.now() forbidden; use animation time'); };
  try {
    sequence = validateSequence(await factory());
    const start = performance.now();
    repeat = validateSequence(await factory());
    elapsedMs = performance.now() - start;
  } finally { Math.random = random; Date.now = now; }
  const hash = value => createHash('sha256').update(JSON.stringify([value.width, value.height, value.fps, value.frames.length])).update(Buffer.concat(value.frames.map(frame => Buffer.from(frame)))).digest('hex');
  const deterministic = hash(sequence) === hash(repeat);
  const flicker = islandFlickerRate(sequence), compiled = buildHeader(sequence);
  const spill = edgeSpillRate(sequence), dead = deadFrameStats(sequence);
  const perFrameMs = elapsedMs / Math.max(1, sequence.frames.length);
  const headerBytes = Buffer.byteLength(compiled.header);
  const spillPass = spill.exempt || spill.rate <= spillThreshold;
  const deadPass = dead.exempt || (dead.maxFill >= 0.002 && dead.maxFill <= 0.85 && dead.tailBlankRatio <= 0.15);
  const checks = [
    { id: 'CHK-01', pass: deterministic, detail: `determinism SHA-256 ${hash(sequence)}` },
    { id: 'CHK-02', pass: flicker.rate <= flickerThreshold, detail: `isolated changed pixels ${(100 * flicker.rate).toFixed(4)}% <= ${100 * flickerThreshold}% (${flicker.reversals} one-frame reversals)` },
    { id: 'CHK-03', pass: compiled.storageBytes <= budget && headerBytes <= headerBudget, detail: `flash ${compiled.storageBytes}/${budget} bytes, .h text ${headerBytes}/${headerBudget} bytes` },
    { id: 'CHK-04', pass: headerRoundtrip(compiled.header, sequence), detail: 'emitted .h arrays -> XOR-RLE decode: byte-exact' },
    { id: 'CHK-05', pass: spillPass && deadPass, detail: `edge spill ${(100 * spill.rate).toFixed(2)}%${spill.exempt ? ' (exempt)' : ''}, peak fill ${(100 * dead.maxFill).toFixed(1)}%, tail blank ${(100 * dead.tailBlankRatio).toFixed(1)}%` },
    { id: 'CHK-06', pass: perFrameMs <= frameBudget, detail: `frame budget ${perFrameMs.toFixed(3)}ms <= ${frameBudget.toFixed(1)}ms` }
  ];
  return { name: sequence.name, pass: checks.every(check => check.pass), checks, flicker, spill, dead, perFrameMs, storageBytes: compiled.storageBytes };
}

if (isMain(import.meta.url)) {
  try {
    const rawArgs = process.argv.slice(2);
    const json = rawArgs.includes('--json');
    const options = parseArgs(rawArgs.filter(a => a !== '--json'), ['flicker-threshold', 'spill-threshold', 'frame-budget', 'budget', 'header-budget']);
    if (options.help) console.log('node tools/check.mjs [id | --fx id | --fixture frames.json] [--profile ssd1306-128x64|ssd1306-128x32|led-matrix-64x32|st7789-128x128] [--frames 32 --fps 16 --seed 1] [--flicker-threshold 0.001 --spill-threshold 0.015 --frame-budget 3.0 --budget 4096 --header-budget 65536] [--json]\nDefault: check the complete catalog across CHK-01..CHK-06.');
    else {
      const targets = options.fx || options.fixture ? [options] : Object.keys(effects).map(fx => ({ ...options, fx }));
      const results = [];
      for (const target of targets) {
        const result = await checkSequence(() => loadSequence(target), {
          flickerThreshold: numeric(options, 'flicker-threshold', 0.001),
          spillThreshold: numeric(options, 'spill-threshold', 0.015),
          frameBudget: numeric(options, 'frame-budget', 3.0),
          budget: numeric(options, 'budget', 4096),
          headerBudget: numeric(options, 'header-budget', 65536)
        });
        results.push(result);
        if (!json) {
          console.log(result.name);
          for (const check of result.checks) console.log(`  ${check.pass ? 'PASS' : 'FAIL'} ${check.id} ${check.detail}`);
        }
        if (!result.pass) process.exitCode = 1;
      }
      if (json) console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2));
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
