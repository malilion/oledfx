// node tools/export-mcu.mjs eyes/blink --symbol animation --out firmware/examples/u8g2-xor-rle/animation.h
// Arduino library: U8g2. Use the full-buffer (_F_) constructor, rotation R0.
#include <Wire.h>
#include <U8g2lib.h>
#include "animation.h"

U8G2_SSD1306_128X64_NONAME_F_HW_I2C display(U8G2_R0, U8X8_PIN_NONE);
uint32_t frameIndex = 0, previousMs = 0;

void setup() {
  display.begin();
  display.clearBuffer();
}

void loop() {
  const uint32_t now = millis();
  if ((uint32_t)(now - previousMs) < 1000UL / ANIMATION_FPS) return;
  previousMs = now;
  // Native R0 full-buffer SSD1306 page layout: no second framebuffer.
  if (!oledfx_step_frame(display.getBufferPtr(), ANIMATION_FRAME_BYTES,
      animation_data, OLEDFX_READ_U32(animation_offsets + frameIndex),
      OLEDFX_READ_U32(animation_sizes + frameIndex), frameIndex)) return;
  display.sendBuffer();
  frameIndex = (frameIndex + 1) % ANIMATION_FRAME_COUNT;
}
