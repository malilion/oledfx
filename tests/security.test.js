import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleGalleryRequest } from '../gallery/serve.mjs';
import { handleMCPRequest, callMCPTool } from '../tools/mcp-server.mjs';
import { validateEffectId, createEffectFile } from '../tools/new.mjs';
import { exportMCU } from '../tools/export-mcu.mjs';
import { buildHeader, buildBitmapHeader, buildRGB565Header } from '../src/core/mcu.js';
import { sampleEffect } from '../tools/sequence.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

async function simulateRequest(url, method = 'GET') {
  let status = null, headers = {}, body = null;
  const req = { url, method };
  const res = {
    writeHead(s, h = {}) { status = s; headers = h; },
    end(b) { body = b; }
  };
  await handleGalleryRequest(req, res);
  return { status, headers, body };
}

test('security: gallery server applies defense-in-depth headers and restricts paths', async () => {
  // 1. Valid endpoints return 200 with complete security headers
  for (const path of ['/', '/gallery/index.html', '/gallery/style.css', '/gallery/simulator.js', '/gallery/logo.svg', '/gallery/favicon.ico', '/gallery/favicon.png', '/src/core/framebuffer.js']) {
    const res = await simulateRequest(path);
    assert.equal(res.status, 200, `Expected 200 for ${path}`);
    assert.equal(res.headers['X-Content-Type-Options'], 'nosniff');
    assert.equal(res.headers['X-Frame-Options'], 'DENY');
    assert.equal(res.headers['Referrer-Policy'], 'strict-origin-when-cross-origin');
    assert.equal(res.headers['Cross-Origin-Opener-Policy'], 'same-origin');
    assert.ok(res.headers['Content-Security-Policy'].includes("default-src 'self'"));
    assert.ok(res.headers['Content-Security-Policy'].includes("frame-ancestors 'none'"));
  }

  // 2. Traversal attacks return 404
  const blockedPaths = [
    '/package.json',
    '/.git/config',
    '/.github/workflows/ci.yml',
    '/gallery/../../package.json',
    '/src/../../package.json',
    '/gallery/%2e%2e/%2e%2e/package.json',
    '/gallery/..%2fstyle.css',
    '/etc/passwd',
    '/gallery/index.html\0.js',
    '/src/core/framebuffer.js%00'
  ];
  for (const path of blockedPaths) {
    const res = await simulateRequest(path);
    assert.equal(res.status, 404, `Path should be blocked with 404: ${path}`);
  }

  // 3. Invalid HTTP methods return 405
  for (const method of ['POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']) {
    const res = await simulateRequest('/gallery/index.html', method);
    assert.equal(res.status, 405, `Method ${method} should return 405`);
  }
});

test('security: MCP server defends against malformed requests and invalid arguments', async () => {
  // Test invalid method returns -32601
  const notFound = await handleMCPRequest({ jsonrpc: '2.0', id: 1, method: 'unsupported_method' });
  assert.equal(notFound.error.code, -32601);

  // Test callMCPTool defensive against null or undefined args
  const list = await callMCPTool('fx_search_catalog', null);
  assert.ok(list.content[0].text);
  const list2 = await callMCPTool('fx_search_catalog', undefined);
  assert.ok(list2.content[0].text);

  // Test callMCPTool throws for unknown tool
  await assert.rejects(callMCPTool('malicious_tool', {}), /Unknown MCP tool/);
});

test('security: effect scaffolding and CLI tools prevent directory traversal and git overwrites', async () => {
  // validateEffectId prevents traversal in ID
  for (const badId of ['../bad', 'weather/../../etc/passwd', 'weather/', 'weather/invalid_char!', 'pomodoro/tool;rm']) {
    assert.throws(() => validateEffectId(badId), /Effect ID must be/);
  }

  // createEffectFile blocks null byte and .git targeting
  await assert.rejects(createEffectFile({ id: 'weather/cloudy', out: join(root, '.git', 'hooks', 'pre-commit') }), /Refusing to write into .git/);
  await assert.rejects(createEffectFile({ id: 'weather/cloudy', out: join(root, '.git') }), /Refusing to write into .git/);
  await assert.rejects(createEffectFile({ id: 'weather/cloudy', out: 'test\0file.js' }), /Path cannot contain null bytes/);
});

test('security: C symbol generation prevents identifier injection in headers', async () => {
  const sequence = sampleEffect({ fx: 'eyes/blink' });

  const invalidSymbols = [
    'bad-name',
    '123num',
    'foo; evil();',
    'foo\n#define HACK 1',
    'foo/*comment*/',
    'void*',
    '$variable'
  ];

  for (const symbol of invalidSymbols) {
    assert.throws(() => buildHeader(sequence, symbol), /Symbol must be a C identifier/);
    assert.throws(() => buildBitmapHeader(sequence, symbol, 'u8g2'), /Symbol must be a C identifier/);
    assert.throws(() => buildRGB565Header(sequence, symbol), /Symbol must be a C identifier/);
    await assert.rejects(exportMCU(sequence, { symbol }), /Symbol must be a C identifier/);
  }

  // exportMCU blocks writing into .git or using null bytes
  await assert.rejects(exportMCU(sequence, { out: join(root, '.git', 'bad.h') }), /Refusing to write into .git/);
  await assert.rejects(exportMCU(sequence, { decoderPath: join(root, '.git', 'bad.c') }), /Refusing to write into .git/);
  await assert.rejects(exportMCU(sequence, { out: 'test\0.h' }), /Path cannot contain null bytes/);
});

test('security: codebase audit verifies zero dangerous runtime primitives and clean repository', async () => {
  // Scan all src/ and gallery/ files for eval / new Function
  async function scanDir(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== '.git') await scanDir(fullPath);
      } else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) {
        const content = await readFile(fullPath, 'utf8');
        assert.ok(!/\beval\s*\(/.test(content), `eval() detected in ${fullPath}`);
        assert.ok(!/new\s+Function\s*\(/.test(content), `new Function() detected in ${fullPath}`);
      }
    }
  }

  await scanDir(join(root, 'src'));
  await scanDir(join(root, 'gallery'));
  await scanDir(join(root, 'tools'));

  // Verify GitHub Actions workflows specify least-privilege permissions
  const ci = await readFile(join(root, '.github/workflows/ci.yml'), 'utf8');
  assert.ok(ci.includes('permissions:'), 'ci.yml must declare explicit permissions');
  assert.ok(ci.includes('contents: read'), 'ci.yml must restrict to contents: read');

  const pages = await readFile(join(root, '.github/workflows/pages.yml'), 'utf8');
  assert.ok(pages.includes('permissions:'), 'pages.yml must declare explicit permissions');
});
