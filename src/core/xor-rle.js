// Tokens: 0xxxxxxx skips (token + 1) zero delta bytes;
// 1xxxxxxx XORs the next ((token & 127) + 1) literal bytes. Runs are 1..128.
function bytes(value, name) {
  if (!(value instanceof Uint8Array)) throw new TypeError(`${name} must be Uint8Array`);
}
export function encode(frame, previous = new Uint8Array(frame.length)) {
  bytes(frame, 'frame'); bytes(previous, 'previous');
  if (frame.length !== previous.length) throw new RangeError('Frame size mismatch');
  const delta = frame.map((byte, i) => byte ^ previous[i]), output = [];
  for (let i = 0; i < delta.length;) {
    const start = i, literal = delta[i] !== 0;
    while (i < delta.length && i - start < 128 && (delta[i] !== 0) === literal) i++;
    output.push((literal ? 128 : 0) | (i - start - 1));
    if (literal) for (let j = start; j < i; j++) output.push(delta[j]);
  }
  return Uint8Array.from(output);
}

export function decode(encoded, previous) {
  bytes(encoded, 'encoded'); bytes(previous, 'previous');
  const frame = previous.slice();
  let position = 0, cursor = 0;
  while (cursor < encoded.length) {
    const token = encoded[cursor++], count = (token & 127) + 1;
    if (position + count > frame.length) throw new RangeError('RLE output overflow');
    if (token & 128) {
      if (cursor + count > encoded.length) throw new RangeError('Truncated RLE literal');
      for (let j = 0; j < count; j++) frame[position + j] ^= encoded[cursor++];
    }
    position += count;
  }
  if (position !== frame.length) throw new RangeError('Incomplete RLE frame');
  return frame;
}

export function encodeSequence(frames) {
  if (!Array.isArray(frames) || !frames.length) throw new RangeError('At least one frame required');
  let previous = new Uint8Array(frames[0].length);
  return frames.map(frame => {
    const encoded = encode(frame, previous);
    previous = frame;
    return encoded;
  });
}
