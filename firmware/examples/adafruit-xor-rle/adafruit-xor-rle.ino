// Generate animation.h + oledfx_player.h into this sketch directory:
// node tools/export-mcu.mjs eyes/happy-squint --symbol animation --out firmware/examples/adafruit-xor-rle/animation.h
// Arduino libraries: Adafruit SSD1306 + Adafruit GFX. ESP32 default I2C pins
// are commonly SDA=21/SCL=22; adapt Wire.begin() for your board and wiring.
#include <Wire.h>
#include <Adafruit_SSD1306.h>
#include "animation.h"

Adafruit_SSD1306 display(ANIMATION_WIDTH, ANIMATION_HEIGHT, &Wire, -1);
uint32_t frameIndex = 0, previousMs = 0;

void setup() {
  Wire.begin();
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) while (true) delay(1000);
  display.clearDisplay();
}

void loop() {
  const uint32_t now = millis();
  if ((uint32_t)(now - previousMs) < 1000UL / ANIMATION_FPS) return;
  previousMs = now;
  // Uses the driver's existing page-packed buffer. Frame 0 resets on replay.
  if (!oledfx_step_frame(display.getBuffer(), ANIMATION_FRAME_BYTES,
      animation_data, OLEDFX_READ_U32(animation_offsets + frameIndex),
      OLEDFX_READ_U32(animation_sizes + frameIndex), frameIndex)) return;
  display.display();
  frameIndex = (frameIndex + 1) % ANIMATION_FRAME_COUNT;
}
