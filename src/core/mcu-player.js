// Shared verbatim with firmware/oledfx_player.h; tested for byte equality.
export const playerSource = `/* Zero-allocation XOR-RLE player, usable from C99, C++ and Arduino. */
#ifndef OLEDFX_PLAYER_H
#define OLEDFX_PLAYER_H
#include <stddef.h>
#include <stdint.h>
#include <string.h>
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
#ifndef OLEDFX_READ_U32
#ifdef __AVR__
#define OLEDFX_READ_U32(p) pgm_read_dword(p)
#else
#define OLEDFX_READ_U32(p) (*(p))
#endif
#endif

/* Frame 0 clears the buffer AFTER validating the complete payload. Call in
 * sequence; this function owns no frame counter and uses no scratch buffer. */
static inline int oledfx_step_frame(uint8_t *fb, size_t frame_bytes,
    const uint8_t *data, uint32_t offset, uint32_t length, uint32_t frame_index) {
  size_t i = 0, pos = 0, n, j;
  uint8_t token;
  const uint8_t *src;
  if (!fb || !data) return 0;
  src = data + offset;
  while (i < length) {
    token = OLEDFX_READ_BYTE(src + i++);
    n = (token & 127u) + 1u;
    if (n > frame_bytes - pos) return 0;
    if (token & 128u) {
      if (n > length - i) return 0;
      i += n;
    }
    pos += n;
  }
  if (pos != frame_bytes) return 0;
  if (frame_index == 0) memset(fb, 0, frame_bytes);
  i = 0; pos = 0;
  while (i < length) {
    token = OLEDFX_READ_BYTE(src + i++);
    n = (token & 127u) + 1u;
    if (token & 128u)
      for (j = 0; j < n; ++j) fb[pos + j] ^= OLEDFX_READ_BYTE(src + i++);
    pos += n;
  }
  return 1;
}
#endif
`;
