import { access, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { categories } from '../src/fx/index.js';
import { isMain } from './sequence.mjs';

function titleCase(slug) {
  return slug.split('-').map((part, i) => i === 0 ? part[0].toUpperCase() + part.slice(1) : part).join(' ');
}

export function validateEffectId(id) {
  if (typeof id !== 'string' || !/^[a-z]+\/[a-z0-9-]+$/.test(id)) {
    throw new Error(`Effect ID must be <category>/<kebab-name> (got "${id}")`);
  }
  const [category, slug] = id.split('/');
  if (!categories.includes(category)) {
    throw new Error(`Unknown category "${category}". Valid categories: ${categories.join(', ')}`);
  }
  return { id, category, slug, name: titleCase(slug) };
}

export function scaffoldEffect({ id, name, duration = 2, loop = true, sim = false, eyes } = {}) {
  const parsed = validateEffectId(id);
  const displayName = name ?? parsed.name;
  const isEyes = eyes ?? (parsed.category === 'eyes');
  if (sim) {
    return `import { clear, fillRect, fillRoundRect } from '../../core/framebuffer.js';
import { mulberry32 } from '../../core/prng.js';

export const meta = Object.freeze({
  id: '${parsed.id}', name: '${displayName}', duration: ${duration},
  loop: ${Boolean(loop)}, width: 128, height: 64
});

export function draw(fb, t, opts = {}) {
  clear(fb);
  const rand = mulberry32(opts.seed ?? 1);
  const phase = (((t % meta.duration) + meta.duration) % meta.duration) / meta.duration;
  const pulse = (1 - Math.cos(phase * Math.PI * 2)) / 2;
  const scale = Math.min(fb.width / 128, fb.height / 64);
  const cx = Math.round(fb.width / 2${isEyes ? ' + Math.max(-1, Math.min(1, opts.lookX ?? 0)) * 8 * scale' : ''});
  const cy = Math.round(fb.height / 2${isEyes ? ' + Math.max(-1, Math.min(1, opts.lookY ?? 0)) * 5 * scale' : ''});
  const w = Math.max(4, Math.round((24 + pulse * 8) * scale));
  const h = Math.max(4, Math.round((16 + (rand() * 4)) * scale));
  fillRoundRect(fb, Math.round(cx - w / 2), Math.round(cy - h / 2), w, h, Math.max(1, Math.round(4 * scale)), 1);
  for (let y = 0; y < fb.height; y += 2) for (let x = 0; x < fb.width; x += 2) {
    fillRect(fb, x, y, 2, 2, fb.getPixel(x, y));
  }
}

export function create(opts = {}) {
  let t = 0;
  const params = { seed: 1, ${isEyes ? 'lookX: 0, lookY: 0, blink: null, ' : ''}...opts };
  return {
    params,
    get t() { return t; },
    step(dt) {
      if (!Number.isFinite(dt) || dt < 0) throw new RangeError('dt must be finite and nonnegative');
      t += dt;
    },
    draw(fb) { draw(fb, t, params); }
  };
}
`;
  }
  return `import { defineEffect, TAU } from '../../core/draw.js';
import { mulberry32 } from '../../core/prng.js';

export const { meta, draw, create } = defineEffect(
  '${parsed.id}',
  '${displayName}',
  (d, p, opts) => {
    const rand = mulberry32(opts.seed ?? 1);
    const pulse = (1 - Math.cos(p * TAU)) / 2;
    const ox = ${isEyes ? 'Math.max(-1, Math.min(1, opts.lookX ?? 0)) * 7' : '0'};
    const oy = ${isEyes ? 'Math.max(-1, Math.min(1, opts.lookY ?? 0)) * 4' : '0'};
    const jitter = Math.round((rand() - 0.5) * 2);
    d.round(48 + ox, 20 + oy, 32, Math.max(6, Math.round(24 - pulse * 6)), 4);
    d.circle(64 + ox + jitter, 32 + oy, 4 + Math.round(pulse * 2), 0);
  },
  { duration: ${duration}, loop: ${Boolean(loop)}${isEyes ? ', eyes: true' : ''} }
);
`;
}

export async function createEffectFile({ id, out, loop = true, sim = false, eyes, force = false } = {}) {
  const parsed = validateEffectId(id);
  const root = fileURLToPath(new URL('../', import.meta.url));
  if (out && typeof out === 'string') {
    if (out.includes('\0')) throw new Error('Path cannot contain null bytes');
    const resolved = resolve(out);
    const gitDir = resolve(root, '.git');
    if (resolved === gitDir || resolved.startsWith(gitDir + '/')) {
      throw new Error('Refusing to write into .git directory');
    }
  }
  const targetPath = resolve(out ?? `${root}/src/fx/${parsed.id}.js`);
  if (!force) {
    const exists = await access(targetPath).then(() => true, () => false);
    if (exists) throw new Error(`File already exists: ${targetPath} (pass --force to overwrite)`);
  }
  const source = scaffoldEffect({ id: parsed.id, loop, sim, eyes });
  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(targetPath, source, 'utf8');
  return { id: parsed.id, path: targetPath, source };
}

if (isMain(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (!args.length || args.includes('--help')) {
      console.log('node tools/new.mjs <category>/<name> [--loop | --no-loop] [--sim] [--eyes] [--force] [--out path]');
    } else {
      let id, out, loop = true, sim = false, eyes, force = false;
      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (!arg.startsWith('--') && !id) id = arg;
        else if (arg === '--loop') loop = true;
        else if (arg === '--no-loop') loop = false;
        else if (arg === '--sim') sim = true;
        else if (arg === '--eyes') eyes = true;
        else if (arg === '--force') force = true;
        else if (arg === '--out' && args[i + 1]) out = args[++i];
        else throw new Error(`Unknown argument: ${arg}`);
      }
      if (!id) throw new Error('Missing <category>/<name>');
      const created = await createEffectFile({ id, out, loop, sim, eyes, force });
      console.log(`Scaffolded ${created.id} -> ${created.path}`);
      console.log(`Next: register in src/fx/index.js, then run:\n  node tools/check.mjs ${created.id}\n  node tools/render.mjs ${created.id} --dual-tone`);
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
