/* oledfx XOR-RLE: persistent SSD1306 page-packed buffer; no allocation.
 * Zero buffer before frame 0. Reset before replay; feed frames in order.
 * AVR: read header offsets/sizes with pgm_read_dword; byte reads below
 * use pgm_read_byte. ESP32/host use normal memory-mapped flash reads. */
#include <stddef.h>
#include <stdint.h>
#ifdef __AVR__
#include <avr/pgmspace.h>
#endif
#ifndef OLEDFX_READ_BYTE
#ifdef __AVR__
#define OLEDFX_READ_BYTE(p) pgm_read_byte(p)
#else
#define OLEDFX_READ_BYTE(p) (*(p))
#endif
#endif

int oledfx_xor_rle_decode(uint8_t *frame, size_t frame_size,
                         const uint8_t *src, size_t src_size) {
  size_t i = 0, pos = 0, n, j;
  uint8_t token;
  if (!frame || !src) return 0;
  /* Validate first, so malformed input cannot partially mutate the frame. */
  while (i < src_size) {
    token = OLEDFX_READ_BYTE(src + i++);
    n = (token & 127u) + 1u;
    if (n > frame_size - pos) return 0;
    if (token & 128u) {
      if (n > src_size - i) return 0;
      i += n;
    }
    pos += n;
  }
  if (pos != frame_size) return 0;
  i = 0; pos = 0;
  while (i < src_size) {
    token = OLEDFX_READ_BYTE(src + i++);
    n = (token & 127u) + 1u;
    if (token & 128u)
      for (j = 0; j < n; ++j) frame[pos + j] ^= OLEDFX_READ_BYTE(src + i++);
    pos += n;
  }
  return 1;
}
