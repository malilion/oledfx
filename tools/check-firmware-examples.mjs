import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { exportMCU } from './export-mcu.mjs';
import { sampleEffect, isMain } from './sequence.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const examples = [
  { name: 'u8g2-xor-rle', fx: 'eyes/blink', format: 'xor-rle', library: 'U8g2lib.h' },
  { name: 'adafruit-xor-rle', fx: 'eyes/happy-squint', format: 'xor-rle', library: 'Adafruit_SSD1306.h' },
  { name: 'u8g2-bitmap', fx: 'weather/sun', format: 'u8g2', library: 'U8g2lib.h' },
  { name: 'adafruit-bitmap', fx: 'system/battery', format: 'adafruit', library: 'Adafruit_SSD1306.h' },
];

// Validate the sketch's local include tree and every generated API it uses.
// This is static validation, not proof that Arduino libraries or a board work.
export async function validateSketch(sketchPath, { format, library }) {
  const sketch = (await readFile(sketchPath, 'utf8')).replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
  if (!/^\s*#include\s+"animation\.h"/m.test(sketch)) throw new Error('Sketch must include animation.h');
  if (!sketch.includes(`#include <${library}>`)) throw new Error(`Missing display include: ${library}`);
  const seen = new Set();
  async function includes(path) {
    if (seen.has(path)) return '';
    seen.add(path);
    const source = await readFile(path, 'utf8');
    let result = source;
    for (const match of source.matchAll(/^\s*#include\s+"([^"\n]+)"/gm)) result += '\n' + await includes(join(dirname(path), match[1]));
    return result;
  }
  const header = await includes(join(dirname(sketchPath), 'animation.h'));
  for (const match of sketch.matchAll(/^\s*#include\s+"([^"\n]+)"/gm)) await includes(join(dirname(sketchPath), match[1]));
  for (const [name, value] of [['WIDTH', 128], ['HEIGHT', 64], ['FRAME_BYTES', 1024], ['FRAME_COUNT', 32], ['FPS', 16]]) {
    if (!new RegExp(`^#define ANIMATION_${name} ${value}$`, 'm').test(header)) throw new Error(`Unexpected ANIMATION_${name}`);
  }
  const symbols = new Set(sketch.match(/\b(?:ANIMATION_[A-Z0-9_]+|animation_[a-z0-9_]+|OLEDFX_[A-Z0-9_]+|oledfx_[a-z0-9_]+)\b/g));
  for (const symbol of symbols) {
    if (!new RegExp(`(?:#define\\s+${symbol}\\b|\\b${symbol}\\s*(?:\\[|\\())`).test(header)) throw new Error(`Missing exported symbol: ${symbol}`);
  }
  if (format === 'xor-rle') {
    // The exporter also supplies this companion for custom integrations.
    const player = await readFile(join(dirname(sketchPath), 'oledfx_player.h'), 'utf8');
    if (!player.includes('oledfx_step_frame')) throw new Error('Missing companion frame player');
  } else if (!header.includes(`${format}, horizontal rows`)) throw new Error(`Wrong bitmap format: ${format}`);
  return { symbols: [...symbols], includes: [...seen].map(path => basename(path)) };
}

export async function main(args = process.argv.slice(2)) {
  let staticOnly = false, fqbn = 'esp32:esp32:esp32';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--static') staticOnly = true;
    else if (args[i] === '--fqbn' && args[i + 1] && !args[i + 1].startsWith('--')) fqbn = args[++i];
    else if (args[i] === '--help') {
      console.log('node tools/check-firmware-examples.mjs [--static] [--fqbn esp32:esp32:esp32]\nGenerates in a temporary directory; never uploads or installs dependencies.');
      return;
    } else throw new Error(`Unknown or incomplete option: ${args[i]}`);
  }
  console.log('Physical burn not performed in this environment');
  const directory = await mkdtemp(join(tmpdir(), 'oledfx-firmware-'));
  try {
    // Finish all static checks before any optional board compilation.
    for (const example of examples) {
      const name = `${example.name}.ino`, out = join(directory, example.name);
      const sketch = await readFile(join(root, 'firmware/examples', example.name, name), 'utf8');
      await exportMCU(sampleEffect({ fx: example.fx, seed: 1, frames: 32, fps: 16, profile: 'ssd1306-128x64' }), {
        format: example.format, symbol: 'animation', out: join(out, 'animation.h'), decoderPath: join(directory, 'decoder.c'),
      });
      await writeFile(join(out, name), sketch);
      const result = await validateSketch(join(out, name), example);
      console.log(`PASS static ${example.name}: ${result.symbols.length} generated symbols; ${result.includes.join(', ')}`);
    }
    if (staticOnly) { console.log('SKIP Arduino compile: --static requested'); return; }
    const probe = spawnSync('arduino-cli', ['version'], { encoding: 'utf8' });
    if (probe.error?.code === 'ENOENT') { console.log('SKIP Arduino compile: arduino-cli not found; static validation only'); return; }
    if (probe.error || probe.status !== 0) throw new Error(`arduino-cli probe failed: ${probe.error?.message ?? probe.stderr}`);
    for (const example of examples) {
      console.log(`Compile ${example.name} for ${fqbn}`);
      const result = spawnSync('arduino-cli', ['compile', '--fqbn', fqbn, join(directory, example.name)], { stdio: 'inherit', timeout: 180000 });
      if (result.error || result.status !== 0) throw new Error(`Arduino compile failed (${example.name}): ${result.error?.message ?? result.status}. Install the selected ESP32 core and display libraries; see docs/ESP32-BURN.md.`);
      console.log(`PASS compile ${example.name}`);
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
}

if (isMain(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
