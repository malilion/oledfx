import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMain } from '../tools/sequence.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};
export async function handleGalleryRequest(request, response) {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
    let path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (path.includes('\0')) { response.writeHead(404); response.end(); return; }
    if (path === '/' || path === '/gallery/' || path === '/gallery') path = '/gallery/index.html';
    // Serve only simulator files and browser-safe core/FX modules.
    if (!/^\/(gallery|src)\//.test(path) || !types[extname(path)]) { response.writeHead(404); response.end(); return; }
    const file = await realpath(resolve(root, '.' + path));
    if (![resolve(root, 'gallery') + sep, resolve(root, 'src') + sep].some(base => file.startsWith(base))) { response.writeHead(404); response.end(); return; }
    const data = await readFile(file);
    const headers = {
      'Content-Type': types[extname(file)],
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none';"
    };
    response.writeHead(200, headers);
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch { response.writeHead(404); response.end(); }
}
export function createGalleryServer() {
  return createServer(handleGalleryRequest);
}
if (isMain(import.meta.url)) {
  const port = Number(process.env.PORT ?? 4173);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new RangeError('Invalid PORT');
  const server = createGalleryServer();
  server.on('error', error => { console.error(`Simulator server: ${error.message}`); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`oledfx simulator: http://127.0.0.1:${server.address().port}`));
}
