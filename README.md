<p align="center"><b>English</b> &nbsp;|&nbsp; <a href="README.zh-TW.md">繁體中文</a></p>

<p align="center">
  <img src="docs/brand/icon-512.png" alt="oledfx" width="140" height="140">
</p>

<h1 align="center">oledfx</h1>

<p align="center"><b>100 procedural micro-animations for tiny OLED and RGB565 displays — zero runtime dependencies.</b></p>

<p align="center">
  <img src="https://img.shields.io/badge/JavaScript-ESM-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript (ESM)">
  <img src="https://img.shields.io/badge/Node.js-20%2B-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js 20+">
  <img src="https://img.shields.io/badge/C-C99-A8B9CC?style=flat-square&logo=c&logoColor=black" alt="C99">
  <img src="https://img.shields.io/badge/Arduino-sketches-00878F?style=flat-square&logo=arduino&logoColor=white" alt="Arduino">
  <img src="https://img.shields.io/badge/ESP32-target-E7352C?style=flat-square&logo=espressif&logoColor=white" alt="ESP32">
  <img src="https://img.shields.io/badge/SSD1306-OLED-111111?style=flat-square" alt="SSD1306 OLED">
  <img src="https://img.shields.io/badge/MCP-stdio-000000?style=flat-square&logo=modelcontextprotocol&logoColor=white" alt="MCP">
  <a href="https://malilion.github.io/oledfx/"><img src="https://img.shields.io/badge/GitHub_Pages-live-222222?style=flat-square&logo=githubpages&logoColor=white" alt="GitHub Pages"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-D22128?style=flat-square&logo=apache&logoColor=white" alt="License: Apache 2.0"></a>
</p>

<p align="center"><a href="https://malilion.github.io/oledfx/gallery/"><b>Live gallery ↗</b></a></p>

**oledfx** generates every frame of small-screen animations with lightweight procedural math — no sprite sheets. Preview effects in the browser, then export them as self-contained C headers for SSD1306 OLEDs, LED matrices, and ST7789 TFTs on ESP32, RP2040, Arduino, and other MCUs.

<p align="center">
  <img src="docs/images/eyes-library.png" alt="oledfx robot eye expressions" width="780">
</p>

## Features

- **100 effects** in five categories: robot eyes, weather, system & IoT, pomodoro & desk, transitions.
- **Display profiles**: SSD1306 128×64 / 128×32 (1-bit), LED matrix 64×32 and ST7789 128×128 (RGB565).
- **Dithering**: threshold, 4×4 Bayer, checkerboard, Atkinson.
- **XOR-RLE compression**: a 2-second loop (32 frames @ 16 fps) fits in under 4 KiB, decoded straight into the driver framebuffer with no `malloc`.
- **Browser lab**: SSD1306 simulator, live fill / XOR-delta / flash-size readouts, one-click C header and Arduino sketch export.

## Installation

Requires Node.js 20+. There are no npm dependencies, so no `npm install` is needed.

```sh
git clone https://github.com/malilion/oledfx.git
cd oledfx
npm test
```

## Usage

```sh
npm run gallery                      # open http://127.0.0.1:4173/gallery/
npm run render -- eyes/blink         # render previews
npm run export -- eyes/blink --format xor-rle --profile ssd1306-128x64 --symbol animation --out animation.h
npm run check                        # quality checks
npm run mcp                          # stdio MCP server
```

From JavaScript:

```js
import { createFramebuffer, effects } from './src/index.js';

const screen = createFramebuffer('ssd1306-128x64');
const eyes = effects['eyes/blink'].create({ seed: 42 });

eyes.step(1 / 16);
eyes.draw(screen); // screen.data: 1024 bytes in SSD1306 page order
```

On the MCU (U8g2, using an exported `animation.h`):

```cpp
if (oledfx_step_frame(display.getBufferPtr(), ANIMATION_FRAME_BYTES,
    animation_data, OLEDFX_READ_U32(animation_offsets + frameIndex),
    OLEDFX_READ_U32(animation_sizes + frameIndex), frameIndex)) {
  display.sendBuffer();
}
frameIndex = (frameIndex + 1) % ANIMATION_FRAME_COUNT;
```

Full sketches for U8g2 and Adafruit SSD1306 are in [firmware/examples](firmware/examples/README.md). See [docs/AUTHORING.md](docs/AUTHORING.md) for authoring effects and [docs/ESP32-BURN.md](docs/ESP32-BURN.md) for flashing an ESP32.

## Effects

| Category | Count | Effect IDs |
| :--- | :---: | :--- |
| `eyes` | 25 | angry, blink, charging, crying, curious-tilt, deadpan, determined, dizzy, excited, glitch, happy-squint, heart, listening, loading, robot, sad, searching, shy, sleeping, sleepy, sparkle, star, surprised, suspicious, wink |
| `weather` | 18 | aurora, cloudy, comet, drizzle, fog, frost, hail, moon, rain, rainbow, sandstorm, snow, starry, sun, sunrise, thunderstorm, tornado, wind |
| `system` | 22 | alert, battery, bell, bluetooth, cpu, download, fan, gps, heartbeat, humidity, lock, memory, mic, ota, sdcard, signal, speaker, sync, thermometer, unlock, usb, wifi |
| `pomodoro` | 20 | breathe, campfire, candle, checklist, coffee, desk-lamp, fireworks, flip-clock, focus-ring, hourglass, letter, nap, notebook, pencil, plant, stretch, tea, timer-beep, tomato, water |
| `transitions` | 15 | bars, blinds, checker, circle-out, crt, diamond, dissolve, fade-center, iris, pixels, radar, scramble, slide-up, spiral, wipe |

## License

Copyright 2026 Malilion. Licensed under the [Apache License, Version 2.0](LICENSE). See [NOTICE](NOTICE).
