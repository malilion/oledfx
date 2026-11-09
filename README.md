<!-- Language Selector / 語言切換分頁 -->
<p align="center">
  <b>English</b> &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="README.zh-TW.md"><b>繁體中文</b></a>
</p>

---

<p align="center">
  <img src="docs/brand/icon-512.png" alt="oledfx mark — 1-bit procedural OLED animations" width="140" height="140">
</p>

<h1 align="center">oledfx</h1>

<p align="center">
  <b>100 Procedural Micro-Animations &bull; Zero Runtime Dependencies &bull; Pure Silicon Soul</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FX_Catalog-100_Animations-5eead4?style=flat-square" alt="100 FX">
  <img src="https://img.shields.io/badge/Runtime_Dependencies-0_Zero-ffd241?style=flat-square" alt="Zero Dependencies">
  <img src="https://img.shields.io/badge/Flash_Budget-%3C_4_KiB-ff6b2b?style=flat-square" alt="< 4 KiB">
  <img src="https://img.shields.io/badge/Hardware_Profiles-1--bit_%26_RGB565-4bc3ff?style=flat-square" alt="Hardware Profiles">
  <img src="https://img.shields.io/badge/Architecture-Pure_ESM_%26_C99-a855f7?style=flat-square" alt="Architecture">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg" alt="License: Apache 2.0"></a>
</p>

---

## ✦ Product Vision & Concept

> **"Small displays, big personality."**

**oledfx** is a high-craft procedural micro-animation engine crafted for microcontrollers (MCUs), desktop companion robots, ambient IoT devices, and physical computing hardware.

Inspired by the iconic industrial design ethos of **Teenage Engineering** and **Braun**, `oledfx` breathes organic warmth, kinetic rhythm, and distinct character into tiny 1-bit monochrome OLEDs and 16-bit RGB displays. Every single frame is generated on-the-fly with lightweight procedural mathematics—no static sprites, no bloated bitmaps, and no runtime external dependencies.

<p align="center">
  <img src="docs/images/eyes-library.png" alt="oledfx robot expressions" width="780">
</p>

---

## ✦ Key Product Highlights

### 1. Curated 100-FX Procedural Catalog
Covering five core hardware and interactive scenarios:
- 🤖 **Robot Expressions & Gaze (Eyes · 25 FX)**: Blink, happy squint, curious tilt, heart gaze, glitch, sleepy nap, excited burst, and more.
- ⛅ **Dynamic Ambient Weather (Weather · 18 FX)**: Sunrise, soft rain, thunderstorm, drifting snow, aurora borealis, comets, and tornadoes.
- 📡 **System & IoT Telemetry (System & IoT · 22 FX)**: Wi-Fi beacon, Bluetooth pairing, OTA flashing, battery fuel gauge, dual-frequency pulse, SD card I/O, and CPU load.
- ⏳ **Desk & Pomodoro Companion (Pomodoro & Desk · 20 FX)**: Flip clock, steaming coffee mug, crackling campfire, hourglass, deep breathing guide, and stretch prompt.
- 🎞️ **Industrial Micro-Transitions & Shaders (Transitions · 15 FX)**: Vintage CRT collapse, venetian blinds, iris zoom, radar sweep, pixel scramble, and particle dissolve.

### 2. Interactive Lab Showcase
An embedded hardware workbench directly inside the browser:
- **3D Tilt Bezel with Dynamic Glare**: Interactive perspective tracking with realistic anodized aluminum matte casing and optical glass glare.
- **Authentic OLED Phosphor Simulation**: Recreates genuine SSD1306 dual-tone yellow top / blue bottom split, phosphor decay, and subpixel grid pitch.
- **Live Oscilloscope Telemetry Bar**: Real-time readout of Active Pixel Fill %, XOR Delta % compression ratio, and compiled Flash bytes.
- **Live Code Inspector Drawer**: One-click generation and instant clipboard copying of C99 PROGMEM headers, Arduino sketches, and ESM snippets.

### 3. Multi-Hardware Profiles & 16-Bit RGB565 Pipeline
A unified procedural rendering API scaling seamlessly across hardware form factors:
- **SSD1306 128×64**: Classic 0.96" OLED (1,024 Bytes vertical page layout, dual-tone or pure monochrome).
- **SSD1306 128×32**: Ultra-compact 0.91" elongated display (512 Bytes).
- **LED Matrix 64×32**: HUB75 RGB565 matrix panel (4,096 Bytes 16-bit color).
- **ST7789 128×128**: 1.44" IPS/TFT full-color display (32,768 Bytes RGB565).
- **Dithering Suite**: Threshold, 4×4 Bayer ordered dither, Checkerboard, and Atkinson 6-neighbor error-diffusion.

### 4. Extreme Flash Footprint (< 4 KiB / 2-Second Loop)
Engineered for the tightest microcontroller storage boundaries:
- **XOR-RLE Delta Compression**: Encodes only changed bits between adjacent frames, decoding straight into the driver framebuffer.
- **Zero Heap Allocations (`malloc`-free)**: Immune to runtime memory fragmentation. Runs reliably on constrained 8-bit ATmega328P, RP2040, ESP32, and ARM Cortex-M.
- **Strict Budget Ceiling**: Every complete 2-second animation (32 frames @ 16 fps), including offset and size tables, fits strictly within 4,096 bytes.

### 5. Autonomous AI-Agent Native Workflow (`fx-skill-kit`)
Purpose-built for AI-agent pair programming and automation:
- Built-in `fx-skill-kit` empowers AI agents to autonomously scaffold, tune, decompose, and verify procedural animations.
- Enforces six strict automated quality gates (CHK-01 Determinism, CHK-02 Shimmer, CHK-03 Flash Budget, CHK-04 Byte-exact Header Roundtrip, CHK-05 Edge Spill, CHK-06 Frame Render Budget).

---

## ✦ The 100-FX Complete Catalog

| Category | FX Count | Included Animations |
| :--- | :---: | :--- |
| **Robot Eyes** | **25** | `blink` &bull; `happy-squint` &bull; `curious-tilt` &bull; `sleepy` &bull; `heart` &bull; `star` &bull; `surprised` &bull; `charging` &bull; `angry` &bull; `dizzy` &bull; `glitch` &bull; `wink` &bull; `sad` &bull; `crying` &bull; `sleeping` &bull; `shy` &bull; `suspicious` &bull; `excited` &bull; `determined` &bull; `listening` &bull; `searching` &bull; `robot` &bull; `sparkle` &bull; `deadpan` &bull; `loading` |
| **Ambient Weather** | **18** | `sun` &bull; `cloudy` &bull; `rain` &bull; `thunderstorm` &bull; `snow` &bull; `fog` &bull; `wind` &bull; `moon` &bull; `rainbow` &bull; `sandstorm` &bull; `tornado` &bull; `drizzle` &bull; `hail` &bull; `sunrise` &bull; `starry-night` &bull; `aurora` &bull; `frost` &bull; `comet` |
| **System & IoT** | **22** | `wifi` &bull; `bluetooth` &bull; `ota` &bull; `battery` &bull; `cpu` &bull; `thermometer` &bull; `humidity` &bull; `heartbeat` &bull; `signal` &bull; `sync` &bull; `lock` &bull; `sdcard` &bull; `fan` &bull; `unlock` &bull; `microphone` &bull; `speaker` &bull; `gps` &bull; `usb` &bull; `memory` &bull; `alert` &bull; `bell` &bull; `download` |
| **Pomodoro & Desk** | **20** | `hourglass` &bull; `coffee` &bull; `campfire` &bull; `flip-clock` &bull; `fireworks` &bull; `focus-ring` &bull; `tea` &bull; `stretch` &bull; `plant` &bull; `tomato` &bull; `timer-beep` &bull; `notebook` &bull; `candle` &bull; `nap` &bull; `checklist` &bull; `desk-lamp` &bull; `water` &bull; `breathe` &bull; `pencil` &bull; `letter` |
| **Micro-Transitions** | **15** | `crt` &bull; `blinds` &bull; `wipe` &bull; `iris` &bull; `radar` &bull; `pixels` &bull; `spiral` &bull; `bars` &bull; `scramble` &bull; `fade-center` &bull; `slide-up` &bull; `dissolve` &bull; `checker` &bull; `circle-out` &bull; `diamond` |
| **Total** | **100** | All fully registered, playable in the simulator, and exportable to C headers |

---

## ✦ Quick Start

### Launch the Interactive Lab
- **Live Online Showcase**: **[malilion.github.io/oledfx/gallery](https://malilion.github.io/oledfx/gallery/)**
- **Local Workbench**:
  ```sh
  npm run gallery
  ```
  Open **http://127.0.0.1:4173/gallery/** to audition all 100 FX, adjust gaze tracking parameters (Look X/Y), toggle hardware bezels, and copy production-ready C headers with one click.

### Using in Web / Node.js
```js
import { createFramebuffer, effects } from 'oledfx';

// Initialize a 128x64 OLED virtual canvas
const screen = createFramebuffer('ssd1306-128x64');

// Create an instance of the animated blink effect
const eyes = effects['eyes/blink'].create({ seed: 42, lookX: 0.2, lookY: -0.1 });

// Advance time and render
eyes.step(1 / 16);
eyes.draw(screen);

// screen.data: 1024 bytes in native SSD1306 vertical page arrangement
```

### Microcontroller Playback (C++ / Arduino)
```cpp
#include <U8g2lib.h>
#include "animation.h" // Self-contained XOR-RLE header exported from oledfx

U8G2_SSD1306_128X64_NONAME_F_HW_I2C u8g2(U8G2_R0);

void setup() {
  u8g2.begin();
}

void loop() {
  static uint16_t frame = 0;
  
  // Zero-malloc decompression directly into driver RAM buffer
  animation_step_frame(u8g2.getBufferPtr(), frame++);
  u8g2.sendBuffer();
  
  delay(1000 / 16); // 16 fps smooth playback
}
```

---

---

## License

Copyright 2026 Malilion.

Licensed under the [Apache License, Version 2.0](LICENSE). See [NOTICE](NOTICE) for attribution.

<p align="center">
  <sub>oledfx &copy; Designed for soulful micro-hardware. Crafted with precision.</sub><br>
  <sub><a href="README.zh-TW.md">切換至繁體中文版本</a></sub>
</p>
