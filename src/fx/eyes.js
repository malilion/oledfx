// Legacy import path and metadata. New effects use eyes/blink.
import { meta as canonicalMeta } from './eyes/blink.js';
export { create } from './eyes/blink.js';
export const meta = Object.freeze({ ...canonicalMeta, id: 'eyes' });
