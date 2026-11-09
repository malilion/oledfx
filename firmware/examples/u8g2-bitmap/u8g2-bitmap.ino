// node tools/export-mcu.mjs weather/sun --format u8g2 --symbol animation --out firmware/examples/u8g2-bitmap/animation.h
#include <U8g2lib.h>
#include "animation.h"
U8G2_SSD1306_128X64_NONAME_F_HW_I2C display(U8G2_R0, U8X8_PIN_NONE);
uint32_t frameIndex = 0, previousMs = 0;
void setup() { display.begin(); }
void loop() {
  const uint32_t now = millis();
  if ((uint32_t)(now - previousMs) < 1000UL / ANIMATION_FPS) return;
  previousMs = now;
  display.clearBuffer();
  display.drawXBMP(0, 0, ANIMATION_WIDTH, ANIMATION_HEIGHT, animation_frame(frameIndex));
  display.sendBuffer();
  frameIndex = (frameIndex + 1) % ANIMATION_FRAME_COUNT;
}
