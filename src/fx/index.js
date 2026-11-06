import * as blink from './eyes/blink.js';
import * as happySquint from './eyes/happy-squint.js';
import * as legacyEyes from './eyes.js';
import * as legacyHappySquint from './happy-squint.js';

// Enumerate canonical IDs once; preserve direct access through the old names.
export const effects = Object.freeze(Object.defineProperties({
  'eyes/blink': blink, 'eyes/happy-squint': happySquint
}, {
  eyes: { value: legacyEyes }, 'happy-squint': { value: legacyHappySquint }
}));
