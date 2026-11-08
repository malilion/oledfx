# oledfx Primitives, Profiles & Patterns Reference

## Display Profiles (`src/core/profiles.js`)

| Profile ID | Resolution | Depth | Raw Frame Bytes | Typical Driver |
| :--- | :--- | :--- | ---: | :--- |
| `ssd1306-128x64` | `128 × 64` | 1-bit | `1,024 B` | SSD1306 / SH1106 I²C/SPI |
| `ssd1306-128x32` | `128 × 32` | 1-bit | `512 B` | Narrow SSD1306 |
| `led-matrix-64x32` | `64 × 32` | RGB565 (16-bit) | `4,096 B` | HUB75 LED Matrix |
| `st7789-128x128` | `128 × 128` | RGB565 (16-bit) | `32,768 B` | ST7789 / SSD1351 TFT |

## Framebuffer & Drawing Primitives (`src/core/framebuffer.js`, `src/core/draw.js`)

- Low-level 1-bit framebuffer (`createFramebuffer(profile)`):
  - `fb.setPixel(x, y, on)`, `fb.getPixel(x, y)`
  - `fb.fill(on)`, `fb.clear()`
  - `fb.fillRect(x, y, w, h, on)`, `fb.clearRect(x, y, w, h)`
  - `fb.fillCircle(cx, cy, radius, on)`
  - `fb.fillRoundRect(x, y, w, h, radius, on)`
  - `fillRate(fb)` -> active pixel ratio `0..1`
- Logical `128×64` scaled drawing helper (`defineEffect(id, name, paint, options)`):
  - `d.rect(x, y, w, h, on = 1)`
  - `d.round(x, y, w, h, r = 3, on = 1)`
  - `d.circle(cx, cy, r, on = 1)`
  - `d.line(x0, y0, x1, y1, thick = 2, on = 1)`
  - `d.arc(cx, cy, r, startRad, endRad, thick = 2, on = 1)`
  - `d.polygon([[x0, y0], [x1, y1], ...], on = 1)`
  - Carve negative space by passing `on = 0` after drawing a filled white shape.

## Ordered & Error-Diffusion Dithering (`src/core/dither.js`)

- `threshold(v)`: crisp `>= 0.5` cutoff for eyes and icons.
- `bayer4x4(v, x, y)`: 17-level ordered Bayer matrix for temporally stable glow/steam without frame-to-frame shimmer.
- `checker(v, x, y)`: 50% checkerboard mask for overlays and yellow/blue split transitions.
- `atkinson` via `dither(fb, values, 'atkinson')`: classic 6-neighbor (`1/8` error weight) Atkinson error diffusion for static/still halftones.
