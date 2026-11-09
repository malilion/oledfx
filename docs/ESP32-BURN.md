# ESP32 + SSD1306 burn guide

> **Hardware status: not yet verified on a physical board**
>
> 尚未在實體 ESP32／OLED 上燒錄或驗證接線與畫面。This guide covers the software path; host tests and static checks do not establish board compatibility or electrical correctness.

## 1. Prepare the tools

Use Node.js 20+ from this repository root. The Node renderer/exporter has no runtime dependencies and needs no `npm install`. Arduino firmware separately requires Arduino IDE or `arduino-cli`, the **esp32 by Espressif Systems** board package, and the display libraries:

| Sketch family | Arduino Library Manager packages |
| --- | --- |
| U8g2 | U8g2 |
| Adafruit | Adafruit SSD1306, Adafruit GFX Library, and their Library Manager dependencies (including Adafruit BusIO) |

Select the board matching your physical module. The checklist defaults to FQBN `esp32:esp32:esp32` (generic ESP32); an ESP32-S3/C3 or another board needs its own FQBN. Follow [Espressif's Arduino installation instructions](https://docs.espressif.com/projects/arduino-esp32/en/latest/installing.html) for the board package. Nothing in the checklist installs packages, connects to a board, or uploads firmware.

## 2. Export the exact headers used by the sketches

Run all commands below **from the oledfx repository root**. Each sketch expects `--symbol animation` and a file named `animation.h` in its own folder. These commands intentionally write generated assets next to the sketches; do not add those generated files to a source commit.

```sh
# XOR-RLE / U8g2: sequential, native SSD1306 vertical pages.
node tools/export-mcu.mjs eyes/blink --format xor-rle --profile ssd1306-128x64 --frames 32 --fps 16 --seed 1 --symbol animation --out firmware/examples/u8g2-xor-rle/animation.h --decoder artifacts/u8g2-xor-rle-decoder.c

# XOR-RLE / Adafruit: same packed format, different driver framebuffer API.
node tools/export-mcu.mjs eyes/happy-squint --format xor-rle --profile ssd1306-128x64 --frames 32 --fps 16 --seed 1 --symbol animation --out firmware/examples/adafruit-xor-rle/animation.h --decoder artifacts/adafruit-xor-rle-decoder.c

# U8g2 bitmap: independent horizontal rows, LSB first, drawXBMP().
node tools/export-mcu.mjs weather/sun --format u8g2 --profile ssd1306-128x64 --frames 32 --fps 16 --seed 1 --symbol animation --out firmware/examples/u8g2-bitmap/animation.h

# Adafruit bitmap: independent horizontal rows, MSB first, drawBitmap().
node tools/export-mcu.mjs system/battery --format adafruit --profile ssd1306-128x64 --frames 32 --fps 16 --seed 1 --symbol animation --out firmware/examples/adafruit-bitmap/animation.h
```

For a rain variant, replace the effect ID with `weather/rain` while keeping the format, output folder and symbol matching the chosen sketch.

XOR export emits `animation.h` (with an embedded header-only player), a companion `oledfx_player.h`, and a standalone `.c` decoder at `--decoder`. The examples only need `#include "animation.h"`; do not add the standalone decoder to these sketches. Their sequential player reads `animation_data`, `animation_offsets`, `animation_sizes`, `ANIMATION_FRAME_BYTES` and `ANIMATION_FRAME_COUNT`; frame zero clears the persistent driver buffer at every replay. Use U8g2's full-buffer `_F_` constructor and `U8G2_R0`. Bitmap exports instead provide `animation_frame(index)` for random access. All four use `ANIMATION_WIDTH`, `ANIMATION_HEIGHT` and `ANIMATION_FPS`.

## 3. Run the checklist

```sh
node tools/check-firmware-examples.mjs

# Deterministic static-only run, even on a machine with arduino-cli:
node tools/check-firmware-examples.mjs --static

# Use your board's installed FQBN for an optional compile:
node tools/check-firmware-examples.mjs --fqbn esp32:esp32:esp32
```

The script reads all four checked-in `.ino` files, generates fresh 128×64 / 32-frame / 16fps headers with seed 1 in a temporary directory, and checks quoted local includes, display-library include names, dimensions, timing macros, exported API symbols and the XOR companion player. It cleans up its temporary files and does not overwrite your example exports or edits.

If `arduino-cli` exists, it runs `arduino-cli compile --fqbn <board> <temporary-sketch-folder>` for all four sketches. Missing cores/libraries or a compilation error produce a nonzero exit. If the executable is absent, it reports **SKIP Arduino compile**, then exits successfully only if static validation passed. A static pass does not validate installed display libraries. The [Arduino compile reference](https://docs.arduino.cc/arduino-cli/commands-reference/arduino-cli_compile) describes the board selector.

## 4. Wire a generic 128×64 I²C module

Disconnect power before wiring. Verify your module's pin labels, supply rating, pull-ups and controller; an SH1106, SPI-only display or 128×32 panel needs different configuration. For a module rated for 3.3 V:

| SSD1306 pin | Generic ESP32 Dev Module |
| --- | --- |
| GND | GND (shared ground) |
| VCC | 3V3, if supported by the module |
| SDA | GPIO21 |
| SCL | GPIO22 |

GPIO21/22 are the **generic ESP32** defaults; confirm the pinout for S3/C3 and other boards. The I²C bus needs suitable pull-ups to 3.3 V; many breakout modules include them. Avoid pull-ups to 5 V on ESP32 GPIO. See [Espressif's I²C API and pin notes](https://docs.espressif.com/projects/arduino-esp32/en/latest/api/i2c.html).

The examples assume 7-bit address `0x3C` and no dedicated reset pin. Confirm the address with your module documentation or an I²C scanner. For Adafruit, change `display.begin(SSD1306_SWITCHCAPVCC, 0x3C)` if needed; replace `Wire.begin()` with `Wire.begin(SDA_PIN, SCL_PIN)` for custom ESP32 pins.

For U8g2, custom ESP32 pins can be supplied in the constructor, **clock first, then data**:

```cpp
U8G2_SSD1306_128X64_NONAME_F_HW_I2C display(
  U8G2_R0, U8X8_PIN_NONE, /* clock SCL */ 22, /* data SDA */ 21);

// In setup(), before display.begin(), only if the address needs changing:
display.setI2CAddress(0x3C << 1);
```

U8g2 uses the 7-bit address multiplied by two; Adafruit takes the 7-bit value directly. See the [U8g2 constructor reference](https://github.com/olikraus/u8g2/wiki/u8g2setupcpp) and [setI2CAddress reference](https://github.com/olikraus/u8g2/wiki/u8g2reference#seti2caddress). A yellow/blue module has physically fixed color rows; the 1-bit header contains no color data.

## 5. Open, compile and upload on your hardware

After exporting, use Arduino IDE **File → Open** on one of these files, keeping it in its matching folder:

- [u8g2-xor-rle.ino](../firmware/examples/u8g2-xor-rle/u8g2-xor-rle.ino)
- [adafruit-xor-rle.ino](../firmware/examples/adafruit-xor-rle/adafruit-xor-rle.ino)
- [u8g2-bitmap.ino](../firmware/examples/u8g2-bitmap/u8g2-bitmap.ino)
- [adafruit-bitmap.ino](../firmware/examples/adafruit-bitmap/adafruit-bitmap.ino)

Select your board and serial port, confirm pins/address, click **Verify**, then **Upload** when your connected hardware is ready. With Arduino CLI, the corresponding manual commands are:

```sh
arduino-cli board list
arduino-cli compile --fqbn esp32:esp32:esp32 firmware/examples/u8g2-xor-rle
# Replace the example port and FQBN with the actual connected board:
arduino-cli upload --port /dev/ttyUSB0 --fqbn esp32:esp32:esp32 firmware/examples/u8g2-xor-rle
```

The checklist never executes upload. Arduino documents the distinction between [compiling and uploading](https://docs.arduino.cc/arduino-cli/getting-started).

Record these results before calling a physical burn verified:

- [ ] Exact board/module, Arduino core and library versions, FQBN and exported seed/fps/profile recorded.
- [ ] Compile output saved for both driver families and both formats.
- [ ] Upload completed on the connected board, with correct wiring and I²C address.
- [ ] Full animation plays for multiple loops without corruption or a replay seam; test reset/reconnect too.
- [ ] Compare the same seed/profile/times against Node renders and record discrepancies.
- [ ] Capture actual hardware footage for the browser/ESP32 comparison; a rendered PNG or GIF cannot fill this evidence gap.

本清單保持未勾選，直到有人提供實機證據。All hardware items remain unverified until hardware evidence is provided.
