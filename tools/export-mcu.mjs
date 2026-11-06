import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildHeader, decoderSource } from './mcu-format.mjs';
import { isMain, loadSequence, parseArgs } from './sequence.mjs';

export async function exportMCU(sequence, { out = 'artifacts/eyes.h', symbol = 'oledfx_animation', decoderPath = fileURLToPath(new URL('../firmware/ssd1306_xor_rle_decoder.c', import.meta.url)) } = {}) {
  const result = buildHeader(sequence, symbol);
  if (resolve(out) === resolve(decoderPath)) throw new Error('Header and decoder paths must differ');
  await mkdir(dirname(resolve(out)), { recursive: true });
  await writeFile(out, result.header);
  await mkdir(dirname(resolve(decoderPath)), { recursive: true });
  await writeFile(decoderPath, decoderSource);
  return { ...result, out, decoderPath };
}

if (isMain(import.meta.url)) {
  try {
    const options = parseArgs(process.argv.slice(2), ['symbol', 'decoder']);
    if (options.help) console.log('node tools/export-mcu.mjs [--fx eyes|happy-squint | --fixture frames.json] [--frames 32 --fps 16 --seed 1] [--out artifacts/eyes.h --symbol oledfx_animation --decoder firmware/ssd1306_xor_rle_decoder.c]');
    else {
      const sequence = await loadSequence(options);
      const result = await exportMCU(sequence, { out: options.out ?? `artifacts/${sequence.name}.h`, symbol: options.symbol, decoderPath: options.decoder });
      console.log(`${result.out}: ${sequence.frames.length} frames, ${sequence.frames.length * sequence.frames[0].length} raw bytes -> ${result.data.length} XOR-RLE bytes; ${result.storageBytes} flash bytes including tables`);
      console.log(`Decoder: ${result.decoderPath}`);
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
