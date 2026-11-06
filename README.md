# oledfx

<p align="center"><img src="docs/brand/icon-512.png" alt="oledfx mark — 1-bit OLED eyes" width="160" height="160"></p>


**100 procedural OLED animations. Zero runtime dependencies. One bit of personality.**

小螢幕，有表情。Give a desktop robot a curious glance, a weather station a little rain, or a focus timer a steaming coffee. Preview and tune a real 1-bit framebuffer in the browser, then export a C header for your microcontroller. Pure ESM, deterministic animation, no image assets or npm install needed.

![25 robot expressions rendered by oledfx](docs/images/eyes-library.png)

| Category | FX | Included |
| --- | ---: | --- |
| Eyes | **25** | Blink, happy squint, curious tilt, sleepy, hearts, stars, surprised, charging, angry, dizzy, glitch, wink, sad, crying, sleeping, shy, suspicious, excited, determined, listening, searching, robot, sparkle, deadpan, loading |
| Weather | **18** | Sun, cloudy, rain, thunderstorm, snow, fog, wind, moon, rainbow, sandstorm, tornado, drizzle, hail, sunrise, starry night, aurora, frost, comet |
| System & IoT | **22** | Wi-Fi, Bluetooth, OTA, battery, CPU, thermometer, humidity, heartbeat, signal, sync, lock, SD card, fan, unlock, microphone, speaker, GPS, USB, memory, alert, bell, download |
| Pomodoro & desk | **20** | Hourglass, coffee, campfire, flip clock, fireworks, focus ring, tea, stretch, plant, tomato, timer, notebook, candle, nap, checklist, desk lamp, water, breathe, pencil, letter |
| Transitions | **15** | CRT, blinds, wipe, iris, radar, pixels, spiral, bars, scramble, fade, slide up, dissolve, checker, circle out, diamond |
| **Total** | **100** | All registered in the runtime index and gallery |

With Node.js 20+:

```sh
npm test
npm run check
node tools/check.mjs eyes/happy-squint
node tools/render.mjs eyes/happy-squint --dual-tone --out artifacts/contact.png
# Open artifacts/contact.png for an annotated timeline.
npm run gallery
```

Open **http://127.0.0.1:4173/gallery/**. The server also opens the gallery at `/`. The SSD1306 simulator has a PCB bezel, mounting holes and I²C pins, pixel pitch, phosphor glow, and the classic yellow top 16 rows / blue lower screen. Switch 128×64 / 128×32, adjust lookX/Y and blink, choose any FX, or browse the searchable animated catalog. Only visible catalog cards animate. Download a PNG or a complete `.h` directly in the browser.

```js
import { createFramebuffer, effects } from './src/index.js';

const screen = createFramebuffer('ssd1306-128x64');
const eyes = effects['eyes/heart'].create({ seed: 1, lookX: 0.5, lookY: -0.2 });
eyes.step(1 / 16);
eyes.draw(screen);
// screen.data: 1024 bytes in native SSD1306 vertical page order.
eyes.params.lookX = -0.5; // parameters stay live
```

The framebuffer supports `fillRect`, `fillCircle`, `fillRoundRect`, `clearRect`, fill, clear and pixel access as methods or standalone functions. Dithering includes threshold, stable Bayer 4×4 and checker patterns. The 128×32 profile uses 512 bytes per frame.

Export for hardware:

```sh
# Mode A: compressed native pages; self-contained C99/C++ header + frame player.
node tools/export-mcu.mjs eyes/happy-squint --format xor-rle --symbol animation --out artifacts/animation.h

# Mode B: standard-library horizontal bitmaps.
node tools/export-mcu.mjs weather/rain --format u8g2 --out artifacts/rain-xbm.h
node tools/export-mcu.mjs system/battery --format adafruit --out artifacts/battery-gfx.h

# Narrow OLED; --fx id is also supported by all CLIs.
node tools/export-mcu.mjs eyes/blink --profile ssd1306-128x32 --out artifacts/blink32.h
```

XOR-RLE stores changes between frames and decodes directly into your display driver's buffer, with no heap allocation or second framebuffer. Each default two-second animation (32 frames, 16 fps, seed 1) passes the **4 KiB flash budget including offset/size tables**, on both supported profiles. Mode B stores full independent frames: U8g2 XBM is LSB-first, Adafruit GFX is MSB-first. It uses more flash and supports random frame access.

Four [firmware examples](firmware/examples/README.md) cover both drivers and both export modes. Include `animation.h`, then call `animation_step_frame(display.getBuffer(), index)` or `oledfx_step_frame(...)`. Frame zero resets the buffer automatically on replay. The host C tests verify the player and decoder byte for byte; ESP32/ESP32-S3/RP2040 flashing and physical-display validation still require a board.

Render reproducible visual references:

```sh
node tools/render.mjs eyes/happy-squint --dual-tone --out artifacts/contact.png
node tools/render-catalog.mjs --out artifacts/library.png
node tools/render-catalog.mjs --category weather --out artifacts/weather.png
node tools/check.mjs weather/rain --profile ssd1306-128x32
```

`npm test` checks both profiles, every FX's determinism and actual emitted-header roundtrip, shimmer and flash budgets, bitmap bit ordering, C playback across repeated loops, geometry/dithering, PNGs, and gallery interactions. [AUTHORING](docs/AUTHORING.md) documents the complete API, file layout, shared helpers, fixtures, export formats and visual review workflow.

This release covers the SSD1306 software pipeline in [PRD 02](docs/PRD.md), including the 100-FX catalog. RGB565/HUB75/ST7789 renderers, physical board validation and launch video remain future work. PNG references in `docs/images/` are actual framebuffer renders; they are not browser screenshots.

Private gallery deployment: [GitHub Pages](https://malilion.github.io/oledfx/gallery/) once private Pages is enabled and its workflow succeeds. Access is limited to authorized repository collaborators after GitHub sign-in; an anonymous 404 does not establish a deployment failure. The repository and Pages site remain private.

If a command fails, use Node.js 20+ and run it from the repository root. Unknown effect IDs show example IDs; browse the full catalog in the gallery. If port 4173 is in use, run `PORT=4174 npm run gallery` on macOS/Linux and open http://127.0.0.1:4174/gallery/ (PowerShell: `$env:PORT=4174; npm run gallery`).
