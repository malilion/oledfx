# 編寫 oledfx 動畫

每個動畫放在 `src/fx/<id>.js`，匯出 `meta`（id、name、duration、loop、width、height）與 `create(opts)`。實例提供唯讀 `t`、`step(dt)`、`draw(fb)`。`dt` 為秒；`draw` 清除並重繪 framebuffer，不推進時間。新增動畫後登錄 `src/fx/index.js`。

`eyes/blink` 的 `lookX`／`lookY` 為 -1..1，`blink` 為 0..1（0 張眼、1 閉眼，省略或 null 為自動）；`eyes/happy-squint` 支援相同視線與眨眼參數。實例的 `params` 可在繪製前更新。特效幾何以原生 128×64 座標設計；在 128×32 profile 中以等比例縮小並置中。新路徑為 `src/fx/eyes/blink.js` 與 `src/fx/eyes/happy-squint.js`。舊的 `src/fx/eyes.js`／`src/fx/happy-squint.js` 及 CLI ID `eyes`／`happy-squint` 仍可使用；`Object.keys(effects)` 只列出新的 canonical ID。

`eyes/happy-squint` 也匯出 pure API `draw(screen, t, opts)`：2 秒循環，在 0.15–0.35 秒快速眨眼，0.5–0.75 秒漸入笑眼、維持至 1.35 秒，再於 1.6 秒恢復。使用 `fillRoundRect(..., 1.0)` 畫白眼框、`fillCircle(..., 0.0)` 從下方挖出笑弧。`blink: 0` 明確覆寫自動眨眼；省略或 null 啟用自動曲線。

## Framebuffer 與抖動

```js
import { createFramebuffer, clear, fill, getPixel, setPixel } from '../src/core/framebuffer.js';
import { dither } from '../src/core/dither.js';
const fb = createFramebuffer('ssd1306-128x64'); // 也接受 (128, 64)
fb.fillRoundRect(27, 18, 26, 28, 6, 1.0);
fb.fillCircle(40, 45, 17, 0.0); // 黑色挖空
fb.fillRect(4, 4, 8, 8, 1);
fb.clearRect(5, 5, 6, 6);
clear(fb);          // fill(fb) 全亮；fill(fb, 0) 全暗
setPixel(fb, 7, 9); // getPixel(fb, 7, 9) === 1
dither(fb, (x, y) => x / 127, 'bayer4x4');
```

`fb = { width, height, data: Uint8Array }`，每 byte 表示同一 x 的 8 個垂直像素：`index = (y >> 3) * width + x`，`bit = y & 7`。預設共 1024 bytes。`createFramebuffer(profileId)` 使用 `src/core/profiles.js` 的 `getProfile(id)`；預設 `DEFAULT_PROFILE = 'ssd1306-128x64'`。未知 ID 會拋錯。Profiles 與各設定均為唯讀：

| Profile ID | w | h | depth | pageBytes | frameBytes |
| --- | --- | --- | --- | --- | --- |
| `ssd1306-128x64` | 128 | 64 | 1 | 128 | 1024 |
| `ssd1306-128x32` | 128 | 32 | 1 | 128 | 512 |

`pageBytes` 是一頁（8 列）的 byte 數。`createFramebuffer()`／`createFramebuffer(width, height)` 保留相容性。繪圖有兩種等價形式：`fb.fillRect(x, y, w, h, on)` 或從 framebuffer 模組匯入 `fillRect(fb, x, y, w, h, on)`。同樣提供 `fillCircle(cx, cy, radius, on)`、`fillRoundRect(x, y, w, h, radius, on)`、`clearRect(x, y, w, h)`，以及方法版 `clear`／`fill`／`setPixel`／`getPixel`。除 `getPixel` 外，shape 與 fill／clear 回傳 framebuffer，支援串接。值 0／0.0 清除、1／1.0 點亮；省略 `on` 為 1。

幾何以整數像素中心取樣，矩形涵蓋 `[x, x+w) × [y, y+h)`；小數邊界取範圍內的整數點，圓形含邊界。圓角半徑自動限制於 `(min(w,h)-1)/2`。所有圖形先裁切至螢幕，不會換列或跨頁溢出；寬／高 <=0 不繪製，負半徑與非有限座標拋出 RangeError。半徑 0 的圓在整數中心點亮一點，圓角半徑 0 等同矩形。

核心支援正整數寬度及 8 的倍數高度；像素座標須為整數，界外寫入忽略、讀取為 0。

灰階輸入為 0..1 的 row-major 陣列或 `(x, y) => value`：

| 模式 | 網點 |
| --- | --- |
| `threshold` | >=0.5 點亮 |
| `bayer4x4` | 4×4 固定矩陣，round(value×16)，17 階 |
| `checker` | 固定棋盤，round(value×2)，3 階 |

禁止誤差擴散與 `Math.random()`。需要亂數時，使用 `src/core/prng.js` 的 `mulberry32(seed)`；固定 seed 與步長須產生相同位元組。

## 預覽與檢查

```sh
node tools/render.mjs --fx eyes/happy-squint --seed 1 --frames 32 --fps 16 --dual-tone --out artifacts/sheet.png
node tools/check.mjs
node tools/check.mjs --fx eyes/blink --budget 3584 --flicker-threshold 0.001
```

Contact sheet 有幀號、三位小數秒數、填充率、安全框及中心準星；`--still-out` 另存第一幀純 OLED 圖。`--look-x`、`--look-y`、`--blink` 可固定參數。瀏覽器與 Node 共用 `renderRGBA(fb, { scale, grid, glow, dualTone, split })`，回傳 `{ width, height, data }`；黃藍 `split` 預設頂部 16 列。

- CHK-01：封鎖 `Math.random`，執行兩次，對尺寸、fps 與所有影格比較 SHA-256。
- CHK-02：連續幀 XOR 遮罩中，沒有任何 8 鄰居的單像素變化數／所有像素轉場數，預設上限 0.001；另列出隔一幀回復原狀的數量。這是孤島閃爍代理指標，幾何動作也可能產生少量單像素變化。
- CHK-03：壓縮資料與 uint32 offset／size 表的 flash 用量，預設上限 8192 bytes；`.h` 文字預設上限 65536 bytes（`--header-budget`）。範例的 32 KiB→3.5 KiB 目標另由測試驗證，不保證任意輸入皆可達成。
- CHK-04：解析實際產生的 `.h` 陣列，逐幀 XOR-RLE 解碼，與輸入逐 byte 比較。

檢查失敗會以非零狀態退出；無 `--fx` 時檢查兩個範例。

## 匯出與播放

```sh
node tools/export-mcu.mjs --fx eyes/blink --profile ssd1306-128x32 --frames 32 --fps 16 --out artifacts/eyes.h --symbol eyes
node tools/export-mcu.mjs --fixture frames.json --out artifacts/fixture.h
```

`--profile` 同時適用於 export、render 與 check；預設 128×64，128×32 匯出會產生 `HEIGHT 32`、`PAGE_COUNT 4`、`FRAME_BYTES 512`。程式化取樣用 `sampleEffect({ fx: 'eyes/happy-squint', profile: 'ssd1306-128x32' })`。

Gallery 的硬體選單可即時切換這兩個 profile。外殼包含玻璃邊框、安裝孔與 I²C 針腳；Pixel grid／Soft glow 控制像素黑縫與周邊微光，黃藍模式為頂部 16 列黃光、其餘藍光。128×32 為單色藍光。兩種表情均保留滑鼠追蹤與 lookX／lookY 滑桿。

JSON fixture 為 `{ "width": 128, "height": 64, "fps": 16, "frames": [[...1024 bytes...], ...] }`，也可直接給影格陣列，省略尺寸時使用 128×64。每幀是 page-packed 0..255 整數，不能與 FX 取樣選項或 `--profile` 混用（fixture 自帶尺寸）。JS API `exportMCU(sequence, { out, symbol, decoderPath })` 接受 `Uint8Array[]`。

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

AVR 的 offset／size 表用 `pgm_read_dword()` 讀取；decoder byte 讀取已使用 `pgm_read_byte()`，其他 flash 介面可覆寫 `OLEDFX_READ_BYTE(p)`。只保留一個 1024-byte（128×32 為 512-byte）framebuffer，無 malloc。**每次回到第 0 幀前必須清零**；隨機跳幀須從第 0 幀重播。排程與 SSD1306 匯流排傳送由韌體處理。

`npm test` 包含 JS roundtrip、動畫、fixture、輸出契約及 PNG 驗證；有 `cc` 時還會以 C99 編譯 decoder，逐 byte 核對兩組動畫 × 兩種 profile。CI 使用 Node 20／22。
