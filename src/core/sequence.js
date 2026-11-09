import { createFramebuffer } from './framebuffer.js';

export function validateSequence(sequence) {
  const { width = 128, height = 64, fps = 16, frames } = sequence;
  const size = createFramebuffer(width, height).data.length;
  if (!Array.isArray(frames) || !frames.length || frames.length > 10000) throw new RangeError('Need 1..10000 frames');
  if (!Number.isFinite(fps) || fps <= 0 || fps > 1000) throw new RangeError('Invalid fps');
  for (const frame of frames) if (!(frame instanceof Uint8Array) || frame.length !== size) throw new RangeError('Invalid page-packed frame size');
  return { ...sequence, width, height, fps };
}
