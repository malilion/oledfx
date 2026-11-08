# Authoring oledfx

The public runtime is `src/index.js`. Everything is native ESM with zero runtime
packages; browser imports and Node tools share the framebuffer, FX registry,
compositor, XOR-RLE codec and header compiler.

## Effect contract

Every canonical effect lives at `src/fx/<category>/<name>.js` and exports:

```js
export const meta = Object.freeze({
  id: 'weather/example', name: 'Example', duration: 2,
  loop: true, width: 128, height: 64
});
export function create(opts = {}) {
  // Return { params, get t(), step(dt), draw(framebuffer) }.
}
```

`step(dt)` takes finite, nonnegative seconds and throws for invalid input. `t` is
read-only. `draw` clears and redraws the complete framebuffer without advancing
time. Updating `instance.params` affects the next draw. All 100 FX support this
interface. The 51 new FX and happy-squint also export pure `draw(fb, t, opts)`;
pure rendering supports deterministic out-of-order seeking and exact two-second
loop wrap. Curious blink retains its original create/step/draw interface.

Eyes accept `lookX, lookY` in -1..1 and `blink` in 0..1. A missing or null blink
selects automatic timing; explicit zero keeps the eyes open. Seeds must be stable;
use `mulberry32(seed)` from `src/core/prng.js`. The checker forbids `Math.random`
and `Date.now` and renders the sequence twice. Never use wall time or random
state during drawing. System/desk icons are procedural illustrations, not actual
sensor readers or clocks: supply live data from your application.

`system/ota` and `pomodoro/focus-ring` accept `progress` in 0..1. All transition
modules accept `progress`: wipe, blinds, dissolve and iris give empty/full masks
at 0/1; CRT contracts at 1. Radar is a looping sweep and does not use progress.
Without an override the masks use a two-second ping-pong preview, so both ends
join smoothly. Flip-clock previews accelerated demo seconds; it does not read
the system clock. Sensors and application state belong outside the renderer.

`eyes/happy-squint` preserves the PRD PoC: blink at 0.15–0.35 seconds, smile
ramp at 0.5–0.75, hold through 1.35, restore by 1.6. A black circle carves the
smile from rounded white eye boxes. `src/fx/eyes.js`, `src/fx/happy-squint.js`
and CLI IDs `eyes`, `happy-squint` remain legacy aliases; aliases do not enumerate
or inflate the catalog count.

## Add an FX

Register the module in `src/fx/index.js`; `effects`, `catalog` and `categories`
are browser-safe and immutable. Gallery picker, category tabs, cards, CLI checks
and catalog sheets derive entries from this registry. The current inventory is
25 eyes, 18 weather, 22 system, 20 pomodoro, 15 transitions = 100 effects. Update the
README counts, gallery intro and inventory expectation when expanding it.

`src/core/draw.js` offers `defineEffect(id, name, paint, options)` for pure FX.
It supplies lifecycle validation, clear-before-draw, modulo time and a centered
128×64 logical drawing space. `paint(drawing, phase, params, fb)` receives phase
0..1 and scaled `rect`, `round`, `circle`, `line`, `arc` and `polygon` helpers.
Use `{ eyes: true }` to expose gaze/blink defaults. The new packs share geometry
in `src/fx/_shared/eyes.js` and `_shared/packs.js`; a single wrapper depends on
those helpers and `core`, so copy that dependency closure when reusing a file.

New effects deliberately sample on two-pixel cells. This keeps moving thin
curves readable and eliminates isolated one-pixel changes on OLED hardware.
The original two effects retain their original rasterization. At 128×32, icons
are uniformly scaled and centered; keep details legible at this size. Full-screen
masks use physical framebuffer coordinates so narrow profiles still fill the
entire display. Non-transition content must stay off the outer border, including
at all gaze extremes.

After changing an FX:

```sh
node tools/check.mjs weather/rain
node tools/check.mjs weather/rain --profile ssd1306-128x32
node tools/render.mjs weather/rain --dual-tone --out artifacts/rain-contact.png
node tools/render-catalog.mjs --category weather --out artifacts/weather.png
npm test
```

Inspect the generated PNGs. Check silhouette, motion rhythm, tiny-screen
legibility, gaze extremes, loop boundaries and cropped edges. Prefer broad,
stable shapes over flickering noise. Contact sheets show frame numbers,
three-decimal timestamps, fill rates and center crosshairs. Re-render and inspect
after visual fixes. `--still-out file.png` writes the first raw simulated frame;
`--scale`, `--columns`, `--samples` tune contact sheets. Catalog sheets accept
`--category`, `--time`, `--profile`, `--columns`, `--scale`.

## Framebuffer and drawing

```js
import {
  createFramebuffer, clear, fill, getPixel, setPixel, fillRect
} from '../src/index.js';
const fb = createFramebuffer('ssd1306-128x64'); // also (128, 64)
fb.fillRoundRect(27, 18, 26, 28, 6, 1);
fb.fillCircle(40, 45, 17, 0); // carve black
fb.fillRect(4, 4, 8, 8, 1).clearRect(5, 5, 6, 6);
fillRect(fb, 10, 10, 4, 4); // standalone equivalent
clear(fb); fill(fb); fill(fb, 0);
setPixel(fb, 7, 9); // getPixel(fb, 7, 9) === 1
```

Data is `Uint8Array`, vertically page-packed: index `(y >> 3) * width + x`,
bit `y & 7`. Width must be positive integer, height a positive multiple of 8.
Out-of-bounds pixel writes are ignored; reads return zero. Pixel coordinates
must be integers. All shape geometry must be finite. Nonpositive rectangle
sizes draw nothing; negative radii throw. Shapes clip before iteration, so they
never wrap rows or pages. Rectangles cover `[x,x+w) × [y,y+h)` using integer
pixel centers. Circles include their boundary. Rounded corners clamp radius
to `(min(w,h)-1)/2`. Radius-zero circles draw their center; rounded rectangles
with radius zero are rectangles. Shapes and fill/clear return `fb` for chaining.

Profiles are frozen and unknown IDs throw:

| ID | Width | Height | Depth | Page bytes | Frame bytes |
| --- | ---: | ---: | ---: | ---: | ---: |
| `ssd1306-128x64` (default) | 128 | 64 | 1 | 128 | 1024 |
| `ssd1306-128x32` | 128 | 32 | 1 | 128 | 512 |
| `led-matrix-64x32` | 64 | 32 | 16 | 64 | 4096 |
| `st7789-128x128` | 128 | 128 | 16 | 128 | 32768 |

`dither(fb, source, mode)` accepts row-major luminance or `(x,y)=>0..1`:
threshold uses >=0.5; `bayer4x4` has 17 ordered levels via round(value×16);
checker has 3 levels via round(value×2); `atkinson` distributes 1/8 quantization
error across 6 neighbors for static halftones. Use spatially fixed patterns for
animations, never frame-dependent noise or temporal error diffusion.

`renderRGBA(fb, { scale, grid, glow, dualTone, split })` returns
`{ width, height, data }`. Scale is integer 1..16. Yellow/blue split defaults to
16 physical rows. Gallery switches narrow OLEDs to monochrome blue. This
compositor is shared by the gallery and all PNG renders.

## Sampling and diagnostics

```js
import { sampleEffect } from '../tools/sequence.mjs';
const sequence = sampleEffect({
  fx: 'eyes/happy-squint', profile: 'ssd1306-128x32',
  frames: 32, fps: 16, seed: 1, lookX: 0.5, blink: 0
});
```

Sampling defaults to 32 frames at 16 fps (two seconds); when changing fps, set
`--frames` to duration×fps to retain the full loop. CLI IDs may be positional
or `--fx id`; `--look-x`, `--look-y`, `--blink` fix parameters.

`check.mjs` exits nonzero on a failed check. Without an ID it checks all 100 FX.
The domain checks are:

- CHK-01: prohibit `Math.random`/`Date.now`, compare two full-sequence SHA-256
  hashes including dimensions, fps and frame count.
- CHK-02: isolated changed pixels with no changed 8-neighbor, divided by the
  total pixel samples across adjacent frames; default threshold 0.001. Also
  reports changes that reverse on the next frame. This is a shimmer proxy.
- CHK-03: compressed flash includes uint32 offsets/sizes; default 4096 bytes.
  Emitted header text has a separate 65536-byte limit. Override with `--budget`
  and `--header-budget` for intentionally larger animations.
- CHK-04: parse actual generated `.h` arrays, decode every delta and compare
  every byte with the sampled input.
- CHK-05: outer 1px border spill rate `<= 1.5%` (transitions exempt) and
  non-empty / non-overexposed active fill (`0.2% <= peak fill <= 85%`, tail
  blank frames `<= 15%`).
- CHK-06: per-frame execution budget (`<= 3.0 ms`).

Additional Agent closed-loop tools:
- `node tools/new.mjs <category>/<name> [--sim]`: generate a compliant effect scaffold.
- `node tools/act.mjs <id> [--fps 12]`: render a continuous 12fps action strip with `HOLD`/`STEP`/`BURST` delta tags.
- `node tools/render.mjs <id> [--sheet out.png] [--gif out.gif]`: export sprite sheets (+ JSON atlas) and animated GIF89a previews.
- `node tools/mcp-server.mjs`: stdio JSON-RPC 2.0 MCP server exposing `fx_search_catalog`, `fx_render_contact_sheet`, `fx_run_diagnostics`, and `fx_export_asset`.

The catalog tests run these checks on every FX and both profiles. Tests also
verify gaze boundaries, deterministic motion, pure seeking, loop wrap, emitted
Mode B pixels, decoder malformed input, C replay, and gallery control behavior.
The generic six-check workflow in the master PRD is broader than these four
OLED domain gates; frame-rate benchmarking is not claimed here.

## MCU formats and fixtures

```sh
node tools/export-mcu.mjs eyes/blink --format xor-rle --symbol animation --out artifacts/animation.h
node tools/export-mcu.mjs weather/rain --format u8g2 --out artifacts/rain.h
node tools/export-mcu.mjs system/battery --format adafruit --out artifacts/battery.h
node tools/export-mcu.mjs --fixture frames.json --format adafruit --out artifacts/fixture.h
```

Node API: `exportMCU(sequence, { out, symbol, format, decoderPath })` in
`tools/export-mcu.mjs`. Browser-safe `buildHeader`, `buildBitmapHeader` and
`packBitmap` live in `src/core/mcu.js` and return header text/data without I/O.
`--format` accepts only `xor-rle` (default), `u8g2`, `adafruit`. Legacy
`--compress xor-rle` is accepted. Do not combine it with a Mode B format.

Fixtures are `{ "width":128, "height":64, "fps":16, "frames":[[...1024 bytes...], ...] }`.
A bare frame array uses default dimensions/fps. Bytes must be integers 0..255.
Fixtures cannot be mixed with FX/profile/sampling flags. JS sequences use
`Uint8Array[]`; all formats validate dimensions, frame sizes, fps and C symbols
before writing.

Mode A: XOR each frame with its predecessor (zero before frame zero), then
encode zero skips and literal blocks of 1..128 bytes:

| Token | Action |
| --- | --- |
| `0xxxxxxx` | Skip token+1 zero delta bytes |
| `1xxxxxxx` | XOR the next (token & 127)+1 literal bytes into framebuffer |

This repository's tested wire format is authoritative; the illustrative
repeat-value token in the master PRD is not the format used by this codec.
Every encoded frame must cover the whole framebuffer exactly. JS and C reject
truncation, overflow and incomplete coverage. C validates first, then mutates.

Headers contain `<PREFIX>_WIDTH`, `HEIGHT`, `FRAME_BYTES`, `FRAME_COUNT`, `FPS`,
`DATA_BYTES`, `STORAGE_BYTES`, plus `_data`. XOR headers also have `PAGE_COUNT`,
`_offsets` (with end sentinel) and `_sizes`; arrays are `PROGMEM`.
The header embeds the guarded, zero-allocation `oledfx_step_frame` player and
provides `<symbol>_step_frame(fb, index)`. CLI exports also place
`oledfx_player.h` beside the header for direct reuse, and retain the standalone
`firmware/ssd1306_xor_rle_decoder.c` (`--decoder` changes that destination).
Browser header downloads are self-contained and need no decoder download.

```c
#include "animation.h"
// Feed indices in order into the driver's existing buffer. No malloc.
int ok = animation_step_frame(display_buffer, frame_index);
// Or call oledfx_step_frame(buffer, FRAME_BYTES, data, offset, size, index).
```

Frame zero clears the buffer automatically, including on replay. The wrapper
rejects invalid indices. Random seeking requires replay from zero. AVR flash
reads use `pgm_read_byte`/`pgm_read_dword`, with configurable
`OLEDFX_READ_BYTE`/`OLEDFX_READ_U32`; ESP32/RP2040/host use memory-mapped reads.
The low-level C decoder does not reset buffers automatically. Its C declaration
needs `extern "C"` when linked into C++; the header-only player needs no linking.

Mode B: independent horizontal rows, padded to `ceil(width/8)` bytes per row,
with unused bits zero. U8g2 uses LSB-first XBM for `drawXBMP` (PROGMEM).
Adafruit GFX uses MSB-first for `drawBitmap`. `ROW_BYTES` replaces `PAGE_COUNT`,
and `<symbol>_frame(i)` gives a flash pointer or null for an invalid index.
No delta tables or decoding are needed. Standard bitmap flash usage is
frameCount×rowBytes×height; the 4 KiB compressed budget does not apply.

See [firmware examples](../firmware/examples/README.md) for four complete minimal
sketches. The test suite compiles C99 playback with `cc` when available, checks
every byte through two loops, and optionally compiles C++ if a frontend is
installed. This session has C but no C++ frontend or ESP32 toolchain. Physical
board checks and a browser/hardware comparison video remain unverified.
