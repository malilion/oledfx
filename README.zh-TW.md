<!-- Language Selector / 語言切換分頁 -->
<p align="center">
  <a href="README.md"><b>English</b></a> &nbsp;&nbsp;|&nbsp;&nbsp;
  <b>繁體中文</b>
</p>

---

<p align="center">
  <img src="docs/brand/icon-512.png" alt="oledfx 標誌 — 1-bit 微型動態引擎" width="140" height="140">
</p>

<h1 align="center">oledfx</h1>

<p align="center">
  <b>100 款程序化微型動效 &bull; 零執行時期依賴 &bull; 賦予極簡像素純粹靈魂</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/特效陣容-100款程序動效-5eead4?style=flat-square" alt="100 FX">
  <img src="https://img.shields.io/badge/執行時期依賴-0%20Zero-ffd241?style=flat-square" alt="零依賴">
  <img src="https://img.shields.io/badge/Flash預算-%3C%204%20KiB-ff6b2b?style=flat-square" alt="< 4 KiB">
  <img src="https://img.shields.io/badge/硬體設定檔-1--bit%20%26%20RGB565-4bc3ff?style=flat-square" alt="硬體支援">
  <img src="https://img.shields.io/badge/架構-Pure%20ESM%20%26%20C99-a855f7?style=flat-square" alt="架構">
</p>

---

## ✦ 產品願景與定位

> **「小螢幕，大靈魂。」**

**oledfx** 是一套專為微控制器（MCU）、桌面伴侶機器人、智慧 IoT 裝置與極簡桌面硬體打造的高質感程序化動效系統。

我們汲取 **Teenage Engineering** 與 **Braun** 的工業美學哲理，將單調冷冰的 1-bit 單色 OLED 與 16-bit RGB 點陣螢幕，轉化為富有呼吸感、生命力與情感共鳴的實體互動介面。無需載入任何外部點陣圖或厚重圖片檔案，所有動態皆由純數學演算法即時生成，在極限有限的晶片快閃記憶體中，呈現頂級工藝的像素美感。

<p align="center">
  <img src="docs/images/eyes-library.png" alt="oledfx 機器人眼神動態系列" width="780">
</p>

---

## ✦ 核心產品亮點

### 1. 100 款嚴選程序化動效矩陣 (Procedural FX Matrix)
全系統涵蓋五大實用情境，滿足各類硬體產品的原生互動需求：
- 🤖 **機器人靈動眼神 (Eyes · 25 款)**：眨眼、微笑瞇眼、好奇探頭、愛心注視、故障雜訊、瞌睡打盹、激動雀躍等豐富情感神態。
- ⛅ **微型環境氣象 (Weather · 18 款)**：晨曦破曉、細雨綿綿、雷暴閃電、極光飄動、流星劃過、漫天飛雪等擬真氛圍。
- 📡 **系統狀態與 IoT 遙測 (System & IoT · 22 款)**：Wi-Fi 連線、OTA 升級、電池充放、雙頻心律、儲存卡存取、CPU 負載監測。
- ⏳ **專注陪伴與桌面生活 (Pomodoro & Desk · 20 款)**：翻頁時鐘、裊裊熱咖啡、搖曳營火、沙漏流轉、深呼吸指引、伸展提醒。
- 🎞️ **工業級微轉場與著色器 (Transitions · 15 款)**：復古 CRT 關機、百葉窗滑動、光圈聚焦、雷達掃描、像素雜訊與動態溶解。

### 2. Awwwards 獲獎級互動展示實驗室 (Interactive Lab Showcase)
專案內建工業級網頁模擬器，將真實硬體質感完整還原於瀏覽器中：
- **3D 視差傾角邊框**：支援滑鼠動態視差傾斜與動態玻璃反光（Dynamic Glare），細膩重現霧面陽極氧化鋁與 PCB 沉金打樣質感。
- **OLED 螢光衰減與點距仿真**：重現經典 SSD1306 上黃下藍雙色分區、青綠螢光、微型矩陣縫隙與餘暉擴散。
- **即時示波器遙測儀 (Live Telemetry Bar)**：實時監控目前畫格的像素發光率（Active Fill %）、XOR 差分壓縮率（XOR Delta %）以及 Flash 空間佔用。
- **即時程式碼產生抽屜**：單鍵一鍵產生並複製 C99 PROGMEM 標頭檔、Arduino 範本及原生 ESM 程式碼。

### 3. 多規格硬體設定檔與 16-bit RGB565 渲染管線
一套動態邏輯，原生適配主流微型顯示器規格：
- **SSD1306 128×64**：經典 0.96 吋 OLED（1,024 Bytes 垂直分頁記憶體，支援黃藍雙色與純單色）。
- **SSD1306 128×32**：超長型 0.91 吋微型條狀顯示器（512 Bytes）。
- **LED Matrix 64×32**：HUB75 像素點陣看板（4,096 Bytes 16-bit RGB565）。
- **ST7789 128×128**：1.44 吋全彩 TFT / IPS 微型螢幕（32,768 Bytes RGB565）。
- **四大抖動演算法**：內建閥值二值化、4×4 Bayer 矩陣、棋盤格交錯、以及 Atkinson 6 鄰域誤差擴散抖動。

### 4. 極限 Flash 預算架構 (< 4 KiB / 2 秒動畫)
針對資源嚴苛的微控制器進行極致壓榨：
- **XOR-RLE 差分行程壓縮**：僅記錄相鄰畫格之間的像素差異位元，直接解碼至顯示器原生緩衝區。
- **零動態記憶體配置 (Zero-malloc)**：執行時期無需 `malloc`、無動態記憶體碎片風險，即使在最受限的 8-bit ATmega328P、RP2040、ESP32-S3 上皆能流暢運作。
- **嚴苛 Flash 預算門檻**：完整 2 秒（32 畫格 / 16 fps）動畫含索引位移表，均牢牢控制在 4,096 位元組以內。

### 5. AI Agent 閉環開發套件 (AI Agent Skill Kit)
為新一代自主編碼智慧體打造的原生工具鏈：
- 內建 `fx-skill-kit`，讓 AI Agent 能自主完成動態設計、動作分解、12fps 序列調校至多硬體輸出。
- 六重品質防線自動把關（CHK-01 確定性、CHK-02 閃爍率、CHK-03 空間預算、CHK-04 標頭檔回讀一致性、CHK-05 邊界溢出率、CHK-06 畫格渲染耗時）。

---

## ✦ 完整 100 款特效陣容總覽

| 分類 | 數量 | 包含特效明細 |
| :--- | :---: | :--- |
| **機器人眼神 (Eyes)** | **25** | `blink` 眨眼 &bull; `happy-squint` 微笑瞇眼 &bull; `curious-tilt` 好奇歪頭 &bull; `sleepy` 睏倦 &bull; `heart` 愛心 &bull; `star` 星星 &bull; `surprised` 驚訝 &bull; `charging` 充電 &bull; `angry` 生氣 &bull; `dizzy` 暈眩 &bull; `glitch` 故障 &bull; `wink` 眨單眼 &bull; `sad` 難過 &bull; `crying` 哭泣 &bull; `sleeping` 熟睡 &bull; `shy` 害羞 &bull; `suspicious` 懷疑 &bull; `excited` 興奮 &bull; `determined` 堅毅 &bull; `listening` 傾聽 &bull; `searching` 搜尋 &bull; `robot` 科技眼 &bull; `sparkle` 閃爍 &bull; `deadpan` 面癱 &bull; `loading` 載入 |
| **環境氣象 (Weather)** | **18** | `sun` 晴天 &bull; `cloudy` 多雲 &bull; `rain` 下雨 &bull; `thunderstorm` 雷暴 &bull; `snow` 飄雪 &bull; `fog` 濃霧 &bull; `wind` 狂風 &bull; `moon` 弦月 &bull; `rainbow` 彩虹 &bull; `sandstorm` 沙塵 &bull; `tornado` 龍捲風 &bull; `drizzle` 細雨 &bull; `hail` 冰雹 &bull; `sunrise` 日出 &bull; `starry-night` 星空 &bull; `aurora` 極光 &bull; `frost` 結霜 &bull; `comet` 彗星 |
| **系統與物聯網 (System & IoT)** | **22** | `wifi` 無線網 &bull; `bluetooth` 藍牙 &bull; `ota` 韌體升級 &bull; `battery` 電量 &bull; `cpu` 處理器 &bull; `thermometer` 溫度計 &bull; `humidity` 濕度 &bull; `heartbeat` 心率 &bull; `signal` 訊號 &bull; `sync` 資料同步 &bull; `lock` 鎖定 &bull; `sdcard` 記憶卡 &bull; `fan` 風扇 &bull; `unlock` 解鎖 &bull; `microphone` 麥克風 &bull; `speaker` 揚聲器 &bull; `gps` 定位 &bull; `usb` 介面 &bull; `memory` 記憶體 &bull; `alert` 警報 &bull; `bell` 鈴鐺 &bull; `download` 下載 |
| **專注陪伴 (Pomodoro & Desk)** | **20** | `hourglass` 沙漏 &bull; `coffee` 蒸氣咖啡 &bull; `campfire` 營火 &bull; `flip-clock` 翻頁鐘 &bull; `fireworks` 煙火 &bull; `focus-ring` 專注環 &bull; `tea` 沉靜熱茶 &bull; `stretch` 伸展操 &bull; `plant` 盆栽 &bull; `tomato` 番茄鐘 &bull; `timer-beep` 倒數計時 &bull; `notebook` 筆記本 &bull; `candle` 燭光 &bull; `nap` 小憩 &bull; `checklist` 待辦清單 &bull; `desk-lamp` 檯燈 &bull; `water` 飲水提醒 &bull; `breathe` 深呼吸 &bull; `pencil` 筆耕 &bull; `letter` 信件 |
| **微轉場與著色器 (Transitions)** | **15** | `crt` 復古電視 &bull; `blinds` 百葉窗 &bull; `wipe` 橫向擦除 &bull; `iris` 圓形光圈 &bull; `radar` 雷達掃描 &bull; `pixels` 像素雜湊 &bull; `spiral` 螺旋展開 &bull; `bars` 條紋交錯 &bull; `scramble` 擾碼重組 &bull; `fade-center` 居中漸隱 &bull; `slide-up` 向上推移 &bull; `dissolve` 粒子溶解 &bull; `checker` 棋盤顯影 &bull; `circle-out` 外擴光環 &bull; `diamond` 菱形擴展 |
| **總計** | **100** | 全數已註冊並支援即時模擬預覽、C 標頭導出與單元檢驗 |

---

## ✦ 快速體驗 (Quick Start)

### 啟動互動實驗室 (Interactive Lab)
- **線上即時展示**：**[malilion.github.io/oledfx/gallery](https://malilion.github.io/oledfx/gallery/)**
- **本地開箱即用**：
  ```sh
  npm run gallery
  ```
  瀏覽器開啟 **http://127.0.0.1:4173/gallery/** 即可即時體驗全套 100 款特效、調節注視角度（Look X/Y）、調速慢放、切換硬體邊框，並直接單鍵複製 C 語言 PROGMEM 標頭檔。

### 在 Web / Node.js 專案中使用
```js
import { createFramebuffer, effects } from 'oledfx';

// 建立 128x64 OLED 虛擬畫布
const screen = createFramebuffer('ssd1306-128x64');

// 實例化靈動眨眼眼神
const eyes = effects['eyes/blink'].create({ seed: 42, lookX: 0.2, lookY: -0.1 });

// 計算並繪製一格動畫
eyes.step(1 / 16);
eyes.draw(screen);

// screen.data: 1024 位元組原生 SSD1306 垂直分頁資料
```

### 微控制器 C++ 極簡播放範例
```cpp
#include <U8g2lib.h>
#include "animation.h" // 由 oledfx 導出之 XOR-RLE 標頭檔

U8G2_SSD1306_128X64_NONAME_F_HW_I2C u8g2(U8G2_R0);

void setup() {
  u8g2.begin();
}

void loop() {
  static uint16_t frame = 0;
  
  // 零 heap 空間佔用，直接就地解碼至驅動緩衝區
  animation_step_frame(u8g2.getBufferPtr(), frame++);
  u8g2.sendBuffer();
  
  delay(1000 / 16); // 16 fps 流暢播放
}
```

---

<p align="center">
  <sub>oledfx &copy; Designed for soulful micro-hardware. Crafted with precision.</sub><br>
  <sub><a href="README.md">Switch to English Version</a></sub>
</p>
