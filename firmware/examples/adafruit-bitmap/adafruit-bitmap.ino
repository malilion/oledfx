// node tools/export-mcu.mjs system/battery --format adafruit --symbol animation --out firmware/examples/adafruit-bitmap/animation.h
#include <Wire.h>
#include <Adafruit_SSD1306.h>
#include "animation.h"
Adafruit_SSD1306 display(ANIMATION_WIDTH, ANIMATION_HEIGHT, &Wire, -1);
uint32_t frameIndex = 0, previousMs = 0;
void setup() {
  Wire.begin();
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) while (true) delay(1000);
}
void loop() {
  const uint32_t now = millis();
  if ((uint32_t)(now - previousMs) < 1000UL / ANIMATION_FPS) return;
  previousMs = now;
  display.clearDisplay();
  display.drawBitmap(0, 0, animation_frame(frameIndex), ANIMATION_WIDTH, ANIMATION_HEIGHT, SSD1306_WHITE);
  display.display();
  frameIndex = (frameIndex + 1) % ANIMATION_FRAME_COUNT;
}
