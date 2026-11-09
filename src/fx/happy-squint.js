// Legacy import path and metadata. New effects use eyes/happy-squint.
import { meta as canonicalMeta } from './eyes/happy-squint.js';
export { create, draw } from './eyes/happy-squint.js';
export const meta = Object.freeze({ ...canonicalMeta, id: 'happy-squint' });
