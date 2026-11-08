import { Buffer } from 'node:buffer';
import { getPixel } from './framebuffer.js';
import { validateSequence } from './sequence.js';

function lzwEncode(indices, minCodeSize = 2) {
  const clearCode = 1 << minCodeSize, eoiCode = clearCode + 1;
  let codeSize = minCodeSize + 1, nextCode = eoiCode + 1;
  const dict = new Map();
  let bitBuf = 0, bitCount = 0;
  const bytes = [];
  const pushCode = code => {
    bitBuf |= code << bitCount;
    bitCount += codeSize;
    while (bitCount >= 8) {
      bytes.push(bitBuf & 0xff);
      bitBuf >>= 8;
      bitCount -= 8;
    }
  };
  pushCode(clearCode);
  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i], key = (prefix << 4) | k;
    if (dict.has(key)) {
      prefix = dict.get(key);
    } else {
      pushCode(prefix);
      if (nextCode < 4096) {
        dict.set(key, nextCode++);
        if (nextCode > (1 << codeSize) && codeSize < 12) codeSize++;
      } else {
        pushCode(clearCode);
        dict.clear();
        codeSize = minCodeSize + 1;
        nextCode = eoiCode + 1;
      }
      prefix = k;
    }
  }
  pushCode(prefix);
  pushCode(eoiCode);
  if (bitCount > 0) bytes.push(bitBuf & 0xff);
  const subBlocks = [minCodeSize];
  for (let i = 0; i < bytes.length; i += 255) {
    const chunk = bytes.slice(i, i + 255);
    subBlocks.push(chunk.length, ...chunk);
  }
  subBlocks.push(0);
  return subBlocks;
}

// Zero-dependency GIF89a encoder for 1-bit OLED sequences (with optional scale and dual-tone).
export function encodeGIF(sequence, { scale = 2, dualTone = false, split = 16, loop = 0 } = {}) {
  const { width, height, fps, frames } = validateSequence(sequence);
  if (!Number.isInteger(scale) || scale < 1 || scale > 8) throw new RangeError('GIF scale must be 1..8');
  const outW = width * scale, outH = height * scale;
  const delay = Math.max(2, Math.round(100 / fps));
  // 4-color palette: 0=off, 1=blue, 2=yellow, 3=grid gap
  const palette = [3, 7, 12, 75, 195, 255, 255, 210, 65, 18, 48, 68];
  const out = [
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, // GIF89a
    outW & 0xff, (outW >> 8) & 0xff, outH & 0xff, (outH >> 8) & 0xff,
    0x91, 0x00, 0x00, // GCT flag, 2-bit color resolution (4 colors)
    ...palette,
    // NETSCAPE2.0 loop extension
    0x21, 0xff, 0x0b, 0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30,
    0x03, 0x01, loop & 0xff, (loop >> 8) & 0xff, 0x00
  ];
  for (const frame of frames) {
    const fb = { width, height, data: frame };
    const indices = new Uint8Array(outW * outH);
    for (let py = 0; py < outH; py++) {
      const y = Math.floor(py / scale);
      const tone = dualTone && y < split ? 2 : 1;
      for (let px = 0; px < outW; px++) {
        const x = Math.floor(px / scale);
        if (!getPixel(fb, x, y)) continue;
        const gap = scale > 1 && (px % scale === scale - 1 || py % scale === scale - 1);
        indices[py * outW + px] = gap ? 3 : tone;
      }
    }
    out.push(
      0x21, 0xf9, 0x04, 0x04, delay & 0xff, (delay >> 8) & 0xff, 0x00, 0x00,
      0x2c, 0x00, 0x00, 0x00, 0x00, outW & 0xff, (outW >> 8) & 0xff, outH & 0xff, (outH >> 8) & 0xff, 0x00,
      ...lzwEncode(indices, 2)
    );
  }
  out.push(0x3b);
  return Buffer.from(out);
}
