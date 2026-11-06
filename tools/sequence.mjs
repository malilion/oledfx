import { validateSequence } from '../src/core/sequence.js';
export { validateSequence } from '../src/core/sequence.js';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createFramebuffer } from '../src/core/framebuffer.js';
import { effects } from '../src/fx/index.js';

export const isMain = url => process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === url;
export function parseArgs(args, extra = []) {
  const allowed = new Set(['fx', 'profile', 'frames', 'fps', 'seed', 'out', 'fixture', 'look-x', 'look-y', 'blink', ...extra]);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (i === 0 && !args[i].startsWith('--')) { options.fx = args[i]; continue; }
    const key = args[i].slice(2);
    if (!args[i].startsWith('--') || (!allowed.has(key) && !['help', 'dual-tone'].includes(key))) throw new Error(`Unknown argument: ${args[i]}`);
    if (['help', 'dual-tone'].includes(key)) { options[key] = true; continue; }
    if (args[i + 1] === undefined || args[i + 1].startsWith('--')) throw new Error(`Missing value for --${key}`);
    options[key] = args[++i];
  }
  return options;
}
export function numeric(options, key, fallback) {
  const value = options[key] === undefined ? fallback : Number(options[key]);
  if (!Number.isFinite(value)) throw new RangeError(`--${key} must be finite`);
  return value;
}
export function sampleEffect({ fx = 'eyes/blink', profile, frames = 32, fps = 16, seed = 1, ...params } = {}) {
  if (!Object.hasOwn(effects, fx)) throw new Error(`Unknown effect: ${fx}`);
  if (!Number.isInteger(frames) || frames < 1 || frames > 10000) throw new RangeError('frames must be 1..10000');
  if (!Number.isFinite(fps) || fps <= 0 || fps > 1000) throw new RangeError('fps must be >0 and <=1000');
  const effect = effects[fx].create({ seed, ...params }), fb = createFramebuffer(profile);
  const sequence = [];
  for (let i = 0; i < frames; i++) {
    effect.draw(fb);
    sequence.push(fb.data.slice());
    effect.step(1 / fps);
  }
  return { name: fx, width: fb.width, height: fb.height, fps, frames: sequence };
}
export async function loadSequence(options = {}) {
  if (options.fixture) {
    if (options.fx !== undefined || options.profile !== undefined || options.frames !== undefined || options.fps !== undefined || options.seed !== undefined ||
        options['look-x'] !== undefined || options['look-y'] !== undefined || options.blink !== undefined)
      throw new Error('--fixture cannot be combined with effect sampling options');
    const source = JSON.parse(await readFile(options.fixture, 'utf8'));
    const fixture = Array.isArray(source) ? { frames: source } : source;
    if (!fixture || !Array.isArray(fixture.frames)) throw new Error('Fixture requires frames');
    const frames = fixture.frames.map(frame => {
      if (!Array.isArray(frame) || !frame.every(byte => Number.isInteger(byte) && byte >= 0 && byte <= 255)) throw new Error('Fixture bytes must be integers 0..255');
      return Uint8Array.from(frame);
    });
    return validateSequence({ ...fixture, name: 'fixture', frames });
  }
  const params = {};
  for (const [flag, key] of [['look-x', 'lookX'], ['look-y', 'lookY'], ['blink', 'blink']]) {
    if (options[flag] !== undefined) params[key] = numeric(options, flag, 0);
  }
  return sampleEffect({ fx: options.fx, profile: options.profile, frames: numeric(options, 'frames', 32), fps: numeric(options, 'fps', 16), seed: numeric(options, 'seed', 1), ...params });
}
