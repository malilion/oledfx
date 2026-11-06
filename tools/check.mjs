import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { getPixel } from '../src/core/framebuffer.js';
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

export async function checkSequence(factory, { flickerThreshold = 0.001, budget = 8192, headerBudget = 65536 } = {}) {
  if (!Number.isFinite(flickerThreshold) || flickerThreshold < 0 || flickerThreshold > 1 || !Number.isFinite(budget) || budget < 1 || !Number.isFinite(headerBudget) || headerBudget < 1) throw new RangeError('Invalid check limits');
  const random = Math.random;
  let sequence, repeat;
  Math.random = () => { throw new Error('CHK-01: Math.random() forbidden; use mulberry32'); };
  try {
    sequence = validateSequence(await factory());
    repeat = validateSequence(await factory());
  } finally { Math.random = random; }
  const hash = value => createHash('sha256').update(JSON.stringify([value.width, value.height, value.fps, value.frames.length])).update(Buffer.concat(value.frames.map(frame => Buffer.from(frame)))).digest('hex');
  const deterministic = hash(sequence) === hash(repeat);
  const flicker = islandFlickerRate(sequence), compiled = buildHeader(sequence);
  const headerBytes = Buffer.byteLength(compiled.header);
  const checks = [
    { id: 'CHK-01', pass: deterministic, detail: `determinism SHA-256 ${hash(sequence)}` },
    { id: 'CHK-02', pass: flicker.rate <= flickerThreshold, detail: `isolated changed pixels ${(100 * flicker.rate).toFixed(4)}% <= ${100 * flickerThreshold}% (${flicker.reversals} one-frame reversals)` },
    { id: 'CHK-03', pass: compiled.storageBytes <= budget && headerBytes <= headerBudget, detail: `flash ${compiled.storageBytes}/${budget} bytes, .h text ${headerBytes}/${headerBudget} bytes` },
    { id: 'CHK-04', pass: headerRoundtrip(compiled.header, sequence), detail: 'emitted .h arrays -> XOR-RLE decode: byte-exact' }
  ];
  return { name: sequence.name, pass: checks.every(check => check.pass), checks, flicker, storageBytes: compiled.storageBytes };
}

if (isMain(import.meta.url)) {
  try {
    const options = parseArgs(process.argv.slice(2), ['flicker-threshold', 'budget', 'header-budget']);
    if (options.help) console.log('node tools/check.mjs [--fx eyes|happy-squint | --fixture frames.json] [--frames 32 --fps 16 --seed 1] [--flicker-threshold 0.001 --budget 8192 --header-budget 65536]\nDefault: check both examples. CHK-02 measures singleton 8-connected components in consecutive XOR masks / all pixel transitions.');
    else {
      const targets = options.fx || options.fixture ? [options] : Object.keys(effects).map(fx => ({ ...options, fx }));
      for (const target of targets) {
        const result = await checkSequence(() => loadSequence(target), { flickerThreshold: numeric(options, 'flicker-threshold', 0.001), budget: numeric(options, 'budget', 8192), headerBudget: numeric(options, 'header-budget', 65536) });
        console.log(result.name);
        for (const check of result.checks) console.log(`  ${check.pass ? 'PASS' : 'FAIL'} ${check.id} ${check.detail}`);
        if (!result.pass) process.exitCode = 1;
      }
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
