# 編寫 oledfx 動畫

每個動畫放在 `src/fx/<id>.js`，匯出 `meta`（id、name、duration、width、height）與 `create(opts)`。實例提供唯讀 `t`、`step(dt)`、`draw(fb)`。`dt` 為秒；`draw` 清除並重繪 framebuffer，不推進時間。新增動畫後登錄 `src/fx/index.js`。

`eyes` 的 `lookX`／`lookY` 為 -1..1，`blink` 為 0..1（0 張眼、1 閉眼，省略或 null 為自動）；`happy-squint` 支援相同視線參數。實例的 `params` 可在繪製前更新。特效幾何以原生 128×64 座標設計。

## Framebuffer 與抖動

```js
import { createFramebuffer, clear, fill, getPixel, setPixel } from '../src/core/framebuffer.js';
import { dither } from '../src/core/dither.js';
const fb = createFramebuffer(128, 64);
clear(fb);          // fill(fb) 全亮；fill(fb, 0) 全暗
setPixel(fb, 7, 9); // getPixel(fb, 7, 9) === 1
dither(fb, (x, y) => x / 127, 'bayer4x4');
```

`fb = { width, height, data: Uint8Array }`，每 byte 表示同一 x 的 8 個垂直像素：`index = (y >> 3) * width + x`，`bit = y & 7`。預設共 1024 bytes。核心支援正整數寬度及 8 的倍數高度；像素座標須為整數，界外寫入忽略、讀取為 0。

灰階輸入為 0..1 的 row-major 陣列或 `(x, y) => value`：

| 模式 | 網點 |
| --- | --- |
| `threshold` | >=0.5 點亮 |
| `bayer4x4` | 4×4 固定矩陣，round(value×16)，17 階 |
| `checker` | 固定棋盤，round(value×2)，3 階 |

禁止誤差擴散與 `Math.random()`。需要亂數時，使用 `src/core/prng.js` 的 `mulberry32(seed)`；固定 seed 與步長須產生相同位元組。

## 預覽與檢查

```sh
node tools/render.mjs --fx happy-squint --seed 1 --frames 32 --fps 16 --dual-tone --out artifacts/sheet.png
node tools/check.mjs
node tools/check.mjs --fx eyes --budget 3584 --flicker-threshold 0.001
```

Contact sheet 有幀號、三位小數秒數、填充率、安全框及中心準星；`--still-out` 另存第一幀純 OLED 圖。`--look-x`、`--look-y`、`--blink` 可固定參數。瀏覽器與 Node 共用 `renderRGBA(fb, { scale, grid, glow, dualTone, split })`，回傳 `{ width, height, data }`；黃藍 `split` 預設頂部 16 列。

- CHK-01：封鎖 `Math.random`，執行兩次，對尺寸、fps 與所有影格比較 SHA-256。
- CHK-02：連續幀 XOR 遮罩中，沒有任何 8 鄰居的單像素變化數／所有像素轉場數，預設上限 0.001；另列出隔一幀回復原狀的數量。這是孤島閃爍代理指標，幾何動作也可能產生少量單像素變化。
- CHK-03：壓縮資料與 uint32 offset／size 表的 flash 用量，預設上限 8192 bytes；`.h` 文字預設上限 65536 bytes（`--header-budget`）。範例的 32 KiB→3.5 KiB 目標另由測試驗證，不保證任意輸入皆可達成。
- CHK-04：解析實際產生的 `.h` 陣列，逐幀 XOR-RLE 解碼，與輸入逐 byte 比較。

檢查失敗會以非零狀態退出；無 `--fx` 時檢查兩個範例。

## 匯出與播放

```sh
node tools/export-mcu.mjs --fx eyes --frames 32 --fps 16 --out artifacts/eyes.h --symbol eyes
node tools/export-mcu.mjs --fixture frames.json --out artifacts/fixture.h
```

JSON fixture 為 `{ "width": 128, "height": 64, "fps": 16, "frames": [[...1024 bytes...], ...] }`，也可直接給影格陣列，省略尺寸時使用 128×64。每幀是 page-packed 0..255 整數，不能與 FX 取樣選項混用。JS API `exportMCU(sequence, { out, symbol, decoderPath })` 接受 `Uint8Array[]`。

每幀與前幀 XOR（第一幀以前幀全零計算），再編碼為 1..128 bytes 的 runs：

| Token | 語義 |
| --- | --- |
| `0xxxxxxx` | 跳過 `token + 1` 個零 delta bytes |
| `1xxxxxxx` | 讀入 `(token & 127) + 1` 個 literal bytes，與 framebuffer XOR |

例如 `[0,0,3,4,0]` 相對全零幀編為 `[1,129,3,4,0]`。每個編碼幀必須恰好覆蓋完整 framebuffer；JS 與 C 都拒絕截斷、溢出、長度不足。C 先驗證再修改緩衝區。

`.h` 提供 `<SYMBOL>_WIDTH`、`HEIGHT`、`PAGE_COUNT`、`FRAME_BYTES`、`FRAME_COUNT`、`FPS`、`DATA_BYTES`、`STORAGE_BYTES`，以及 `<symbol>_data`、`_offsets`（含結尾位置）、`_sizes`。陣列使用 `PROGMEM`，非 AVR 平台有空巨集 fallback；匯出時也寫入 `firmware/ssd1306_xor_rle_decoder.c`（`--decoder` 可自訂位置）。

ESP32／host 範例，先連結 C decoder（若由 C++ 呼叫，函式宣告用 `extern "C"`）：

```c
#include <stddef.h>
#include "eyes.h"
int oledfx_xor_rle_decode(uint8_t *, size_t, const uint8_t *, size_t);
static uint8_t framebuffer[EYES_FRAME_BYTES]; // 初始為 0
// i 依序為 0..EYES_FRAME_COUNT-1，每隔 1/EYES_FPS 秒更新。
int ok = oledfx_xor_rle_decode(framebuffer, sizeof framebuffer,
    eyes_data + eyes_offsets[i], eyes_sizes[i]);
// ok == 1 後，以 page order 將 framebuffer 傳給 SSD1306。
```

AVR 的 offset／size 表用 `pgm_read_dword()` 讀取；decoder byte 讀取已使用 `pgm_read_byte()`，其他 flash 介面可覆寫 `OLEDFX_READ_BYTE(p)`。只保留一個 1024-byte framebuffer，無 malloc。**每次回到第 0 幀前必須清零**；隨機跳幀須從第 0 幀重播。排程與 SSD1306 匯流排傳送由韌體處理。

`npm test` 包含 JS roundtrip、動畫、fixture、輸出契約及 PNG 驗證；有 `cc` 時還會以 C99 編譯 decoder，逐 byte 核對兩組完整動畫。CI 使用 Node 20／22。
