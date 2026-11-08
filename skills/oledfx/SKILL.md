---
name: oledfx-author
description: Search, integrate, export, or author procedural 1-bit / RGB565 micro-display animations (oledfx) for SSD1306, HUB75, and ST7789 screens. Trigger when the user asks to create robot expressions, weather icons, IoT status indicators, Pomodoro desk animations, screen transitions, or export ESP32 C headers.
---

# oledfx Authoring & Visual Closed-Loop Skill

Use this workflow (`Draft → Render → Look → Check → Refine`) whenever creating, modifying, or exporting an `oledfx` procedural animation.

## 1. Closed-Loop Workflow (Never Blind-Write)

Every time you create or edit `src/fx/<category>/<name>.js`, you **MUST** run the diagnostic and visual loop before delivering:

1. **Scaffold**:
   ```sh
   node tools/new.mjs <category>/<name>
   ```
2. **Automated Quality Gates (`CHK-01` .. `CHK-06`)**:
   ```sh
   node tools/check.mjs <category>/<name>
   node tools/check.mjs <category>/<name> --profile ssd1306-128x32
   ```
   - `CHK-01`: Deterministic seeded PRNG (`mulberry32(seed)` only; `Math.random` and `Date.now` are forbidden).
   - `CHK-02`: Temporal shimmer / isolated singleton pixel changes `<= 0.1%`.
   - `CHK-03`: XOR-RLE compressed flash footprint `<= 4096 bytes` (including `uint32_t` offset/size tables).
   - `CHK-04`: Emitted C header `.h` array byte-exact roundtrip decode.
   - `CHK-05`: Outer 1px border spill `<= 1.5%` (non-transitions) and dead/overexposed frame guard (`0.2% <= peak fill <= 85%`, tail blank `<= 15%`).
   - `CHK-06`: Per-frame execution budget (`<= 3.0 ms`).
3. **Render Contact Sheet & Action Strip**:
   ```sh
   node tools/render.mjs <category>/<name> --dual-tone --out artifacts/contact.png
   node tools/act.mjs <category>/<name> --dual-tone --out artifacts/act.png
   ```
4. **Visual Inspection (Look & Refine)**:
   Open and inspect `artifacts/contact.png` and `artifacts/act.png` using your image viewing tool:
   - **Silhouette & Negative Space**: On a `128×64` or `128×32` 1-bit screen, bold silhouettes with clean black cutouts read far better than dense 1px stipple.
   - **2-Pixel Cell Stability**: Prefer `defineEffect` from `src/core/draw.js` or 2×2 pixel blocks so moving curves never produce 1-frame isolated pixel shimmer.
   - **Timing Contrast**: Avoid flat linear motion. Use eased pulses, crisp blinks, and distinct hold phases (`HOLD` vs `BURST` in `act.png`).
   - **Center & Safe Margin**: Check that the visual center aligns with the `(64, 32)` crosshair and never clips the 1px outer border (including at `lookX = ±1, lookY = ±1` for `eyes/*`).
   - Iterate at least 2 rounds if any frame looks cramped, noisy, or static.

## 2. Hardware Export & MCP Tools

- **Export MCU C Header**:
  ```sh
  node tools/export-mcu.mjs <id> --format xor-rle --symbol animation --out artifacts/animation.h
  node tools/export-mcu.mjs <id> --format u8g2 --out artifacts/xbm.h
  node tools/export-mcu.mjs <id> --format adafruit --out artifacts/gfx.h
  node tools/export-mcu.mjs <id> --format rgb565 --profile st7789-128x128 --out artifacts/tft.h
  ```
- **MCP Server (`tools/mcp-server.mjs`)**:
  Exposes `fx_search_catalog`, `fx_render_contact_sheet`, `fx_run_diagnostics`, and `fx_export_asset`.

See [references/primitives-and-patterns.md](references/primitives-and-patterns.md) for drawing primitives, dithering modes, and effect templates.
