import { Buffer } from 'node:buffer';
import { createInterface } from 'node:readline';
import { encodePNG } from '../src/core/png.js';
import { encodeGIF } from '../src/core/gif.js';
import { buildHeader, buildBitmapHeader, buildRGB565Header } from '../src/core/mcu.js';
import { catalog, categories, effects } from '../src/fx/index.js';
import { checkSequence } from './check.mjs';
import { contactSheet, spriteSheet } from './render.mjs';
import { isMain, sampleEffect } from './sequence.mjs';

export const mcpTools = Object.freeze([
  {
    name: 'fx_search_catalog',
    description: 'Search oledfx procedural animations by keyword and optional category.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Substring match against effect id or name' },
        category: { type: 'string', enum: [...categories], description: 'Optional category filter' }
      }
    }
  },
  {
    name: 'fx_render_contact_sheet',
    description: 'Render an annotated contact sheet PNG (base64) for visual review.',
    inputSchema: {
      type: 'object',
      required: ['effect_id'],
      properties: {
        effect_id: { type: 'string', description: 'Effect ID (e.g. eyes/happy-squint)' },
        palette: { type: 'string', enum: ['blue', 'dual-tone'], description: 'OLED phosphor mode' },
        profile: { type: 'string', description: 'Display profile ID' }
      }
    }
  },
  {
    name: 'fx_run_diagnostics',
    description: 'Run CHK-01..CHK-06 quality gates (determinism, shimmer, flash budget, roundtrip, spill, frame budget).',
    inputSchema: {
      type: 'object',
      required: ['effect_id'],
      properties: {
        effect_id: { type: 'string', description: 'Effect ID to check' },
        profile: { type: 'string', description: 'Display profile ID' }
      }
    }
  },
  {
    name: 'fx_export_asset',
    description: 'Compile an effect to MCU C header (xor-rle, u8g2, adafruit, rgb565), sprite-sheet JSON+PNG, or GIF.',
    inputSchema: {
      type: 'object',
      required: ['effect_id', 'target_format'],
      properties: {
        effect_id: { type: 'string', description: 'Effect ID' },
        target_format: { type: 'string', enum: ['xor-rle', 'u8g2', 'adafruit', 'rgb565', 'sprite-sheet', 'gif'] },
        profile: { type: 'string', description: 'Display profile ID' }
      }
    }
  }
]);

export async function callMCPTool(name, args = {}) {
  const safeArgs = (args && typeof args === 'object') ? args : {};
  if (name === 'fx_search_catalog') {
    const q = String(safeArgs.query ?? '').trim().toLowerCase();
    const cat = safeArgs.category ? String(safeArgs.category).trim().toLowerCase() : '';
    const matches = catalog.filter(meta =>
      (!cat || meta.id.startsWith(`${cat}/`)) &&
      (!q || meta.id.toLowerCase().includes(q) || meta.name.toLowerCase().includes(q))
    ).map(meta => ({
      ...meta,
      params: meta.id.startsWith('eyes/') ? ['seed', 'lookX', 'lookY', 'blink']
        : meta.id.startsWith('transitions/') || ['system/ota', 'pomodoro/focus-ring'].includes(meta.id) ? ['seed', 'progress']
        : ['seed']
    }));
    return { content: [{ type: 'text', text: JSON.stringify({ count: matches.length, matches }, null, 2) }] };
  }
  if (name === 'fx_render_contact_sheet') {
    const sequence = sampleEffect({ fx: safeArgs.effect_id, profile: safeArgs.profile });
    const dualTone = safeArgs.palette === 'dual-tone';
    const sheet = contactSheet(sequence, { scale: 3, columns: 4, samples: 12, dualTone });
    const png = encodePNG({ w: sheet.width, h: sheet.height, data: sheet.data });
    return {
      content: [
        { type: 'text', text: `Rendered ${sequence.name} (${sheet.width}x${sheet.height}, ${sequence.frames.length} frames)` },
        { type: 'image', mimeType: 'image/png', data: png.toString('base64') }
      ]
    };
  }
  if (name === 'fx_run_diagnostics') {
    const report = await checkSequence(() => sampleEffect({ fx: safeArgs.effect_id, profile: safeArgs.profile }));
    return { content: [{ type: 'text', text: JSON.stringify(report, null, 2) }] };
  }
  if (name === 'fx_export_asset') {
    const sequence = sampleEffect({ fx: safeArgs.effect_id, profile: safeArgs.profile });
    const fmt = safeArgs.target_format ?? 'xor-rle';
    if (fmt === 'sprite-sheet') {
      const { image, atlas } = spriteSheet(sequence);
      const png = encodePNG({ w: image.width, h: image.height, data: image.data });
      return { content: [{ type: 'text', text: JSON.stringify(atlas, null, 2) }, { type: 'image', mimeType: 'image/png', data: png.toString('base64') }] };
    }
    if (fmt === 'gif') {
      const gif = encodeGIF(sequence);
      return { content: [{ type: 'text', text: `GIF89a (${gif.length} bytes)` }, { type: 'image', mimeType: 'image/gif', data: gif.toString('base64') }] };
    }
    const compiled = fmt === 'xor-rle' ? buildHeader(sequence)
      : fmt === 'rgb565' ? buildRGB565Header(sequence)
      : buildBitmapHeader(sequence, 'oledfx_animation', fmt);
    return { content: [{ type: 'text', text: JSON.stringify({ format: fmt, storageBytes: compiled.storageBytes, header: compiled.header }) }] };
  }
  throw new Error(`Unknown MCP tool: ${name}`);
}

export async function handleMCPRequest(req) {
  const { id, method, params = {} } = req ?? {};
  try {
    if (method === 'initialize') {
      return { jsonrpc: '2.0', id, result: { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'oledfx-mcp', version: '0.1.0' } } };
    }
    if (method === 'notifications/initialized') return null;
    if (method === 'ping') return { jsonrpc: '2.0', id, result: {} };
    if (method === 'tools/list') return { jsonrpc: '2.0', id, result: { tools: mcpTools } };
    if (method === 'tools/call') return { jsonrpc: '2.0', id, result: await callMCPTool(params.name, params.arguments) };
    return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
  } catch (error) {
    return { jsonrpc: '2.0', id, error: { code: -32602, message: error.message } };
  }
}

if (isMain(import.meta.url)) {
  const rl = createInterface({ input: process.stdin, terminal: false });
  rl.on('line', async line => {
    if (!line.trim()) return;
    try {
      const parsed = JSON.parse(line);
      const res = await handleMCPRequest(parsed);
      if (res) process.stdout.write(JSON.stringify(res) + '\n');
    } catch (err) {
      process.stdout.write(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: `Parse error: ${err.message}` }
      }) + '\n');
    }
  });
}
