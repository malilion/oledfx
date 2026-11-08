import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildHeader, buildBitmapHeader, buildRGB565Header, decoderSource } from './mcu-format.mjs';
import { isMain, loadSequence, parseArgs } from './sequence.mjs';

export async function exportMCU(sequence, { out = 'artifacts/eyes.h', symbol = 'oledfx_animation', format = 'xor-rle', dualTone = false, decoderPath = fileURLToPath(new URL('../firmware/ssd1306_xor_rle_decoder.c', import.meta.url)) } = {}) {
  if (!['xor-rle', 'u8g2', 'adafruit', 'rgb565'].includes(format)) throw new RangeError(`Unknown format: ${format}`);
  const result = format === 'xor-rle' ? buildHeader(sequence, symbol)
    : format === 'rgb565' ? buildRGB565Header(sequence, symbol, { dualTone })
    : buildBitmapHeader(sequence, symbol, format);
  if (resolve(out) === resolve(decoderPath)) throw new Error('Header and decoder paths must differ');
  const playerPath = resolve(dirname(out), 'oledfx_player.h');
  if (format === 'xor-rle' && (resolve(out) === playerPath || resolve(decoderPath) === playerPath)) throw new Error('Output paths collide with oledfx_player.h');
  const playerSource = format === 'xor-rle' ? await readFile(new URL('../firmware/oledfx_player.h', import.meta.url), 'utf8') : null;
  await mkdir(dirname(resolve(out)), { recursive: true });
  await writeFile(out, result.header);
  if (format === 'xor-rle') {
    await mkdir(dirname(resolve(decoderPath)), { recursive: true });
    await writeFile(decoderPath, decoderSource);
    if (playerPath !== fileURLToPath(new URL('../firmware/oledfx_player.h', import.meta.url))) await writeFile(playerPath, playerSource);
  }
  return { ...result, out, format, decoderPath: format === 'xor-rle' ? decoderPath : null, playerPath: format === 'xor-rle' ? playerPath : null };
}

if (isMain(import.meta.url)) {
  try {
    const options = parseArgs(process.argv.slice(2), ['symbol', 'decoder', 'format', 'compress']);
    if (options.compress && options.compress !== 'xor-rle') throw new Error('--compress supports xor-rle; use --format for bitmap exports');
    if (options.compress && options.format && options.format !== 'xor-rle') throw new Error('--compress xor-rle conflicts with the selected bitmap format');
    if (options.help) console.log('node tools/export-mcu.mjs [id | --fx id | --fixture frames.json] [--format xor-rle|u8g2|adafruit] [--profile ssd1306-128x64|ssd1306-128x32] [--frames 32 --fps 16 --seed 1] [--out artifacts/eyes.h --symbol oledfx_animation --decoder firmware/ssd1306_xor_rle_decoder.c]');
    else {
      const sequence = await loadSequence(options);
      const result = await exportMCU(sequence, { out: options.out ?? `artifacts/${sequence.name}.h`, symbol: options.symbol, format: options.format, decoderPath: options.decoder });
      console.log(`${result.out}: ${sequence.frames.length} frames, ${result.format}, ${result.storageBytes} flash bytes`);
      if (result.decoderPath) console.log(`Decoder: ${result.decoderPath}; player: ${result.playerPath}`);
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
