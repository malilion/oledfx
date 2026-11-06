# SSD1306 examples

Run each sketch's first comment from the repository root to generate its
`animation.h` (and the XOR player's `oledfx_player.h`), then open the matching
folder in Arduino IDE. Install the named display library there; oledfx's Node
runtime needs no packages. Exported headers are generated assets, not checked in.

The XOR examples call `oledfx_step_frame` directly on the display driver's
existing framebuffer. The generated `animation_step_frame(buffer, index)` is
also available as a convenient wrapper. Sequential playback is required; frame
zero clears the buffer automatically. No separate C file is needed for this
header-only player. The standalone C decoder remains available for integrations.

Mode B examples use random-access, row-packed frames with `drawXBMP` (U8g2,
LSB first) and `drawBitmap` (Adafruit GFX, MSB first). These store complete frames
and trade flash space for standard-library compatibility.

All examples default to 128×64, I²C address 0x3C and a non-reset OLED. Change
address/pins for your module. For 128×32, export with `--profile ssd1306-128x32`;
Adafruit reads the generated dimensions, and U8g2 needs its matching 128X32
full-buffer constructor. Keep rotation R0 for native XOR pages. ESP32, ESP32-S3
and RP2040 can use their normal Wire pin configuration.

The C player is compiled and byte-checked on the host. Arduino sketches are
integration examples; no ESP32 board compile, flashing, electrical validation,
or browser-versus-hardware recording has been performed in this environment.

Reference APIs: [U8g2 drawXBMP](https://github.com/olikraus/u8g2/wiki/u8g2reference#drawxbm),
[Adafruit GFX drawBitmap](https://adafruit.github.io/Adafruit-GFX-Library/html/class_adafruit___g_f_x.html).
