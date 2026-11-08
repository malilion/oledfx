import { TAU, clamp } from '../../core/draw.js';
import { mulberry32 } from '../../core/prng.js';

function cloud(d, x = 64, y = 23) {
  d.circle(x - 14, y + 2, 9); d.circle(x, y - 3, 13); d.circle(x + 15, y + 2, 10);
  d.round(x - 22, y + 1, 46, 13, 5);
}
function sun(d, x, y, p, radius = 11) {
  d.circle(x, y, radius);
  for (let i = 0; i < 8; i++) {
    const a = i * TAU / 8 + p * TAU / 8;
    d.line(x + Math.cos(a) * (radius + 5), y + Math.sin(a) * (radius + 5), x + Math.cos(a) * (radius + 11), y + Math.sin(a) * (radius + 11));
  }
}
function digit(d, n, x, y, scale = 1) {
  const segments = [63, 6, 91, 79, 102, 109, 125, 7, 127, 111][n % 10];
  const bars = [[2, 0, 10, 2], [12, 2, 2, 10], [12, 14, 2, 10], [2, 24, 10, 2], [0, 14, 2, 10], [0, 2, 2, 10], [2, 12, 10, 2]];
  bars.forEach((bar, i) => { if (segments & (1 << i)) d.rect(x + bar[0] * scale, y + bar[1] * scale, bar[2] * scale, bar[3] * scale); });
}

export function paintWeather(style, d, p, opts) {
  const wave = Math.sin(p * TAU), rand = mulberry32(opts.seed ?? 1);
  if (style === 'sun') sun(d, 64, 32, p);
  if (style === 'cloudy') { sun(d, 47, 25, p, 10); cloud(d, 70 + wave * 4, 33); }
  if (style === 'rain' || style === 'thunderstorm') {
    cloud(d, 64 + wave * 2, 17);
    for (let i = 0; i < 7; i++) {
      const x = 35 + i * 9, y = 37 + ((p * 24 + i * 7) % 17);
      if (style === 'thunderstorm' && i >= 2 && i <= 4) continue;
      d.line(x, y, x - 2, y + 4, 2);
    }
    d.line(30, 58, 98, 58, 2);
    if (style === 'thunderstorm') {
      d.polygon([[64, 31], [55, 45], [63, 45], [58, 57], [77, 39], [66, 39]]);
      if (p > 0.42 && p < 0.52) { d.line(24, 23, 18, 19); d.line(103, 23, 109, 19); }
    } else for (let i = 0; i < 3; i++) { const x = 42 + i * 22, rise = (p * 3 + i / 3) % 1; d.line(x - 4 * rise, 58 - 4 * Math.sin(rise * Math.PI), x - 2, 58, 2); }
  }
  if (style === 'snow') {
    cloud(d, 64, 18);
    for (let i = 0; i < 7; i++) {
      const x = 29 + i * 11 + Math.sin(p * TAU + i) * 3, y = 35 + ((p * 18 + i * 5) % 20);
      d.rect(x - 2, y, 6, 2); d.rect(x, y - 2, 2, 6);
    }
    for (let i = 0; i < 6; i++) d.circle(33 + i * 12, 57, 4 + (i % 2));
    d.rect(24, 60, 82, 4, 0);
  }
  if (style === 'fog') {
    cloud(d, 64 + wave * 3, 20);
    for (let i = 0; i < 4; i++) { const offset = Math.sin(p * TAU + i * 0.7) * 8; d.round(30 + offset, 38 + i * 6, 65 - i * 5, 3, 1); }
  }
  if (style === 'wind') {
    for (let i = 0; i < 3; i++) { const x = 28 + Math.sin(p * TAU + i) * 6; d.line(x, 21 + i * 12, x + 45, 21 + i * 12); d.arc(x + 45, 16 + i * 12, 5, -Math.PI, Math.PI / 2); }
    d.polygon([[84 + wave * 5, 44], [96 + wave * 5, 40], [91 + wave * 5, 51]]);
  }

  if (style === 'drizzle') {
    cloud(d, 64 + wave * 2, 22);
    for (let i = 0; i < 8; i++) { const x = 36 + i * 8, y = 38 + ((Math.floor(p * 12) + i * 3) % 12); d.rect(x, y, 2, 4); }
    d.line(34, 56, 94, 56, 2);
  }
  if (style === 'hail') {
    cloud(d, 64, 22 + Math.sin(p * TAU) * 1.5);
    for (let i = 0; i < 7; i++) { const x = 34 + i * 10, y = 38 + ((Math.floor(p * 12) + i * 2) % 12); d.circle(x, y, 2); }
  }
  if (style === 'sandstorm') {
    for (let i = 0; i < 5; i++) { const y = 14 + i * 9, x = 18 + Math.sin(p * TAU + i) * 14; d.line(x, y, x + 60, y + 2); }
    d.polygon([[86 + wave * 6, 40], [104 + wave * 6, 36], [96 + wave * 6, 52]]);
  }
  if (style === 'rainbow') {
    const open = 0.15 + p * 0.35;
    for (let i = 0; i < 4; i++) d.arc(64, 58, 36 - i * 5, Math.PI + open, TAU - open, 2);
    cloud(d, 42, 46); cloud(d, 88, 46);
  }
  if (style === 'tornado') {
    for (let i = 0; i < 6; i++) { const w = 8 + i * 6, y = 10 + i * 8; d.round(64 - w / 2 + Math.sin(p * TAU + i) * 4, y, w, 5, 2); }
  }
  if (style === 'sunrise') {
    d.round(18, 42, 92, 12, 2);
    for (let i = 0; i < 4; i++) d.rect(30 + i * 20, 42, 2, 8);
    const rise = (1 - Math.cos(p * TAU)) / 2;
    sun(d, 64, 36 - rise * 12, 0.2, 8);
  }
  if (style === 'starry') {
    const stars = [[22, 14], [38, 24], [54, 12], [74, 22], [108, 16], [30, 38], [50, 44], [86, 36], [112, 42], [68, 48]];
    const tick = Math.floor(p * 10);
    for (let i = 0; i < stars.length; i++) {
      if ((tick + i) % 5 === 0) continue;
      const [x, y] = stars[i];
      d.rect(x, y, 3, 2); d.rect(x + 1, y - 1, 2, 4);
    }
    d.circle(96, 20, 8); d.circle(102 + wave * 2, 17, 7, 0);
  }
  if (style === 'aurora') {
    for (let i = 0; i < 3; i++) d.round(24 + Math.sin(p * TAU + i * 1.4) * 8, 16 + i * 10, 62, 4, 1);
    const tick = Math.floor(p * 8);
    for (let i = 0; i < 5; i++) if ((tick + i) % 3 !== 0) d.rect(26 + i * 16, 50, 3, 3);
  }
  if (style === 'frost') {
    d.round(24, 12, 80, 40, 3); d.round(28, 16, 72, 32, 2, 0);
    const n = Math.floor(p * 8);
    for (const [i, [x, y]] of [[40, 28], [56, 24], [74, 30], [46, 40], [66, 38], [84, 36]].entries()) {
      const s = 3 + ((n + i) % 4) * 2;
      d.rect(x, y, s, 2); d.rect(x + 1, y - s / 2, 2, s);
    }
    d.line(34 + Math.sin(p * TAU) * 6, 34, 78 + Math.sin(p * TAU) * 6, 34, 2);
  }
  if (style === 'comet') {
    d.round(20, 50, 88, 6, 2);
    for (let i = 0; i < 4; i++) d.rect(26 + i * 18, 16 + (i % 2) * 10, 3, 3);
    const x = 40 + p * 48, y = 26 + Math.sin(p * TAU) * 4;
    d.circle(x, y, 3);
    for (let i = 1; i <= 3; i++) d.rect(x - i * 6, y + 1, 4, 2);
  }
  if (style === 'moon') {
    d.circle(61, 30, 20); d.circle(70 + wave * 2, 23, 18, 0);
    for (let i = 0; i < 4; i++) { const x = 28 + rand() * 75, y = 10 + rand() * 42, r = 2 + ((i + Math.floor(p * 4)) % 2); d.rect(x - r, y, r * 2 + 1, 2); d.rect(x, y - r, 2, r * 2 + 1); }
  }
}

export function paintSystem(style, d, p, opts) {
  const pulse = (1 - Math.cos(p * TAU)) / 2;
  if (style === 'wifi') {
    d.circle(64, 50, 3);
    for (let i = 0; i < 3; i++) d.arc(64, 50, 12 + i * 12 + pulse * 3, Math.PI * 1.22, Math.PI * 1.78, i <= Math.floor(p * 4) ? 4 : 2);
  }
  if (style === 'bluetooth') {
    d.line(61, 12, 61, 52, 3); d.line(61, 12, 77, 25, 3); d.line(77, 25, 49, 43, 3);
    d.line(49, 21, 77, 39, 3); d.line(77, 39, 61, 52, 3);
    d.arc(64, 32, 25 + pulse * 3, -0.65, 0.65); d.arc(64, 32, 25 + pulse * 3, Math.PI - 0.65, Math.PI + 0.65);
  }
  if (style === 'ota') {
    cloud(d, 64, 17); d.rect(60, 20, 8, 18, 0); d.polygon([[54, 30], [74, 30], [64, 40]], 0);
    d.round(22, 47, 84, 10, 3); d.round(24, 49, 80, 6, 2, 0);
    d.rect(26, 50, 76 * clamp(opts.progress ?? pulse), 4);
  }
  if (style === 'battery') {
    d.round(28, 18, 70, 31, 4); d.round(31, 21, 64, 25, 2, 0); d.rect(98, 27, 5, 13);
    for (let i = 0; i < 4; i++) if (i <= Math.floor(pulse * 4)) d.rect(35 + i * 14, 25, 10, 17);
    d.polygon([[64, 8], [55, 27], [63, 27], [58, 43], [73, 23], [65, 23]], 0);
    d.circle(111, 49 - p * 32, 2 + pulse);
  }
  if (style === 'cpu') {
    d.round(22, 9, 84, 46, 3); d.round(24, 11, 80, 42, 2, 0);
    for (let i = 0; i < 5; i++) { d.rect(16, 15 + i * 8, 6, 3); d.rect(106, 15 + i * 8, 6, 3); }
    for (let x = 29; x < 98; x++) { const y = 33 + 11 * Math.sin(x / 8 + p * TAU) * Math.sin(x / 21 - p * TAU); d.line(x, y, x + 1, 33 + 11 * Math.sin((x + 1) / 8 + p * TAU) * Math.sin((x + 1) / 21 - p * TAU)); }
  }
  if (style === 'thermometer') {
    d.round(53, 9, 15, 36, 6); d.round(57, 12, 7, 34, 3, 0); d.circle(60, 45, 11); d.circle(60, 45, 7, 0);
    d.circle(60, 45, 5); d.rect(58, 39 - pulse * 23, 5, 23 * pulse + 7);
    for (let i = 0; i < 4; i++) d.rect(73, 13 + i * 10, i % 2 ? 8 : 12, 2);
  }
  if (style === 'humidity') {
    d.polygon([[64, 8], [45, 36], [83, 36]]); d.circle(64, 36, 19);
    d.circle(64, 36, 14, 0); d.polygon([[64, 16], [51, 36], [77, 36]], 0);
    for (let x = 51; x < 78; x++) d.rect(x, 39 + 3 * Math.sin(x / 5 + p * TAU), 2, 6);
  }

  if (style === 'signal') {
    for (let i = 0; i < 5; i++) {
      const h = 10 + i * 7;
      const lit = (Math.floor(p * 10) + i) % 5 <= Math.floor(pulse * 5);
      d.rect(36 + i * 11, 50 - h, 7, lit ? h : Math.max(4, h * 0.25));
    }
  }
  if (style === 'sync') {
    d.arc(64, 32, 18, p * TAU, p * TAU + Math.PI * 1.4, 3);
    d.arc(64, 32, 18, p * TAU + Math.PI, p * TAU + Math.PI * 2.4, 3);
    d.polygon([[82, 24], [90, 32], [78, 34]]); d.polygon([[46, 40], [38, 32], [50, 30]]);
  }
  if (style === 'lock') {
    const y = 28 + Math.sin(p * TAU) * 2;
    d.round(46, y, 36, 28, 4); d.round(50, y + 4, 28, 20, 3, 0);
    d.arc(64, y, 14, Math.PI, TAU, 3); d.rect(61, y + 10, 6, 10); d.circle(64, y + 12, 3);
  }
  if (style === 'unlock') {
    d.round(46, 30, 36, 26, 4); d.round(50, 34, 28, 18, 3, 0);
    d.arc(74, 24 - pulse * 6, 11, Math.PI, TAU, 3);
    d.rect(60, 40, 8, 8); d.circle(64, 43, 2, 0);
  }
  if (style === 'mic') {
    const bob = Math.sin(p * TAU) * 2;
    d.round(56, 12 + bob, 16, 26, 8);
    d.arc(64, 40, 14, 0.15, Math.PI - 0.15, 3); d.rect(62, 40, 4, 10); d.rect(50, 52, 28, 3);
    const rings = 1 + Math.floor(pulse * 2);
    for (let i = 0; i < rings; i++) d.arc(64, 26, 18 + i * 6, -0.6, 0.6, 2);
  }
  if (style === 'speaker') {
    const shake = Math.sin(p * TAU * 2) * 2;
    d.polygon([[40 + shake, 24], [54 + shake, 24], [68 + shake, 14], [68 + shake, 50], [54 + shake, 40], [40 + shake, 40]]);
    const rings = 1 + Math.floor(pulse * 2);
    for (let i = 0; i < rings; i++) d.arc(74, 32, 10 + i * 6, -0.7, 0.7, 2);
  }
  if (style === 'gps') {
    const r = 16 + Math.round(pulse * 2) * 2;
    d.circle(64, 28, r); d.circle(64, 28, 8, 0); d.circle(64, 28, 4);
    d.line(64, 14, 64, 42); d.line(50, 28, 78, 28);
    const a = p * TAU;
    d.circle(64 + Math.cos(a) * 11, 28 + Math.sin(a) * 11, 2, 0);
    d.polygon([[64, 46], [56, 56], [72, 56]]);
  }
  if (style === 'usb') {
    d.round(50, 10, 28, 34, 3); d.round(54, 14, 20, 22, 2, 0); d.rect(58, 44, 12, 10);
    d.rect(60, 16, 2, 8); d.circle(66, 18, 2); d.rect(70, 16, 2, 6);
    d.rect(58, 26 + Math.sin(p * TAU) * 6, 12, 3);
  }
  if (style === 'sdcard') {
    d.polygon([[44, 10], [78, 10], [84, 18], [84, 54], [44, 54]]); d.rect(48, 14, 28, 8, 0);
    for (let i = 0; i < 4; i++) d.rect(50 + i * 7, 16, 4, 4);
    const w = 8 + pulse * 18; d.round(50, 30, w, 16, 2, 0); d.rect(52, 32, Math.max(2, w - 4), 12);
  }
  if (style === 'fan') {
    d.circle(64, 32, 6); for (let i = 0; i < 3; i++) { const a = p * TAU + i * TAU / 3; d.polygon([[64, 32], [64 + Math.cos(a) * 22, 32 + Math.sin(a) * 22], [64 + Math.cos(a + 0.5) * 10, 32 + Math.sin(a + 0.5) * 10]]); }
  }
  if (style === 'memory') {
    d.round(22, 16, 84, 32, 3); d.round(26, 20, 76, 24, 2, 0);
    const filled = Math.floor(p * 9);
    for (let i = 0; i < 8; i++) d.rect(30 + i * 9, 24, 6, i < filled ? 16 : 5);
    d.rect(30 + ((p * 8) % 1) * 64, 22, 2, 20);
  }
  if (style === 'alert') {
    d.polygon([[64, 12], [32, 50], [96, 50]]); d.polygon([[64, 22], [42, 46], [86, 46]], 0);
    const bob = Math.sin(p * TAU) * 3;
    d.rect(62, 30 + bob, 4, 8); d.circle(64, 43, 2);
    d.rect(36 + p * 48, 53, 6, 3);
  }
  if (style === 'bell') {
    const sway = Math.sin(p * TAU) * 4;
    d.polygon([[64 + sway, 14], [50 + sway, 34], [78 + sway, 34]]);
    d.round(48 + sway, 32, 32, 8, 3); d.rect(62 + sway, 38, 4, 6);
    d.circle(64 + sway * 1.3, 48, 3);
    if (pulse > 0.55) d.arc(64, 28, 24, -2.5, -1.9, 2);
    if (pulse > 0.75) d.arc(64, 28, 24, -1.2, -0.6, 2);
  }
  if (style === 'download') {
    d.round(38, 40, 52, 14, 3); d.round(42, 44, 44, 6, 2, 0);
    const travel = Math.round((1 - Math.cos(p * TAU)) / 2 * 10);
    d.rect(44, 45, 6 + travel * 3, 4);
    const y = 16 + (1 - Math.cos(p * TAU)) / 2 * 14;
    d.polygon([[64, y + 8], [56, y], [61, y], [61, y - 4], [67, y - 4], [67, y], [72, y]]);
  }
  if (style === 'heartbeat') {
    d.line(18, 33, 110, 33);
    const points = [[18, 33], [43, 33], [50, 24], [57, 44], [65, 14], [72, 38], [79, 33], [110, 33]];
    for (let i = 1; i < points.length; i++) d.line(...points[i - 1], ...points[i], 3);
    const x = 19 + p * 89; d.rect(x, 9, 3, 46, 0); d.circle(x, 33, 3);
  }
}

export function paintDesk(style, d, p, opts) {
  const wave = Math.sin(p * TAU), pulse = (1 - Math.cos(p * TAU)) / 2;
  if (style === 'hourglass') {
    d.round(44, 8, 40, 4, 1); d.round(44, 53, 40, 4, 1);
    d.line(48, 13, 78, 51); d.line(78, 13, 48, 51);
    d.polygon([[51, 15 + pulse * 12], [75, 15 + pulse * 12], [63, 31]]);
    d.polygon([[50, 51], [76, 51], [63, 49 - pulse * 14]]);
    d.rect(62, 33, 3, 13 + wave * 2);
  }
  if (style === 'coffee') {
    d.round(40, 29, 43, 26, 5); d.round(43, 31, 37, 5, 2, 0);
    d.arc(84, 40, 9, -Math.PI / 2, Math.PI / 2, 3); d.line(32, 58, 92, 58, 3);
    for (let i = 0; i < 3; i++) for (let y = 9; y < 24; y++) d.rect(49 + i * 10 + 3 * Math.sin(y / 5 + p * TAU + i), y, 2, 2);
  }
  if (style === 'campfire') {
    d.line(43, 52, 84, 57, 4); d.line(43, 57, 84, 52, 4);
    d.polygon([[40, 48], [45, 31], [53, 36], [61 + wave * 3, 9], [70, 29], [77, 23 + pulse * 6], [88, 48], [75, 52], [51, 52]]);
    d.polygon([[53, 49], [63, 29 + pulse * 6], [75, 49]], 0);
  }
  if (style === 'flip-clock') {
    const seconds = Math.floor(p * 60), y = 20;
    for (const x of [25, 72]) { d.round(x - 5, 11, 37, 43, 4); d.round(x - 3, 13, 33, 39, 3, 0); }
    digit(d, Math.floor(seconds / 10), 29, y, 1); digit(d, seconds % 10, 76, y, 1);
    d.rect(19, 31, 92, 2, 0); d.rect(23, 31, 3, 2); d.rect(98, 31, 3, 2);
  }
  if (style === 'fireworks') {
    const rand = mulberry32(opts.seed ?? 1);
    for (let i = 0; i < 3; i++) {
      const x = 30 + i * 34, y = 25 + (i % 2) * 13, age = (p + i / 3) % 1;
      d.circle(x, y, 2);
      for (let j = 0; j < 8; j++) { const a = j * TAU / 8 + rand() * 0.1, r = 4 + age * 13; d.line(x + Math.cos(a) * r, y + Math.sin(a) * r, x + Math.cos(a) * (r + 3), y + Math.sin(a) * (r + 3), 2); }
    }
  }

  if (style === 'tea') {
    d.round(42, 28, 40, 24, 6); d.arc(82, 38, 8, -Math.PI / 2, Math.PI / 2, 3); d.line(36, 54, 90, 54, 3);
    for (let i = 0; i < 3; i++) for (let y = 10; y < 26; y++) d.rect(50 + i * 9 + 2 * Math.sin(y / 4 + p * TAU + i), y, 2, 2);
  }
  if (style === 'notebook') {
    d.round(28, 12, 72, 42, 2); d.rect(36, 12, 4, 42); d.round(42, 16, 52, 34, 1, 0);
    for (let i = 0; i < 4; i++) d.line(48, 22 + i * 8, 88, 22 + i * 8);
    const row = Math.floor(p * 4) % 4;
    d.line(48, 22 + row * 8, 48 + (p * 4 % 1) * 34, 22 + row * 8, 3);
  }
  if (style === 'stretch') {
    d.circle(64, 14, 6); d.line(64, 20, 64, 38, 3); d.line(64, 26, 48 - pulse * 8, 34, 3); d.line(64, 26, 80 + pulse * 8, 34, 3);
    d.line(64, 38, 52, 54, 3); d.line(64, 38, 76, 54, 3);
  }
  if (style === 'plant') {
    d.round(50, 42, 28, 14, 3); d.line(64, 42, 64, 22, 3);
    for (let i = 0; i < 4; i++) { const a = -1.2 + i * 0.7 + wave * 0.2; d.circle(64 + Math.cos(a) * 14, 28 + Math.sin(a) * 8, 6); }
  }
  if (style === 'candle') {
    d.rect(58, 28, 12, 26); d.round(56, 26, 16, 6, 3);
    const flicker = 14 + Math.sin(p * TAU * 2) * 4;
    d.polygon([[64, flicker], [56, 26], [72, 26]]); d.circle(64, flicker + 3, 2);
    d.rect(76 + Math.sin(p * TAU) * 8, 16, 3, 3);
  }
  if (style === 'tomato') {
    d.circle(64, 34, 18); d.circle(64, 34, 12, 0); d.polygon([[64, 12], [56, 22], [72, 22]]);
    const n = Math.max(0, 9 - Math.floor(p * 10));
    digit(d, n, 56, 26, 0.7);
  }
  if (style === 'nap') {
    d.circle(48, 30, 9); d.circle(76, 30, 9);
    d.rect(42, 28, 12, 3, 0); d.rect(70, 28, 12, 3, 0);
    d.round(38, 36, 52, 14, 6);
    const z = (p * 2) % 1;
    d.rect(90, 24 - z * 10, 8, 2); d.rect(98, 18 - z * 8, 10, 2);
  }
  if (style === 'checklist') {
    const step = p * 4, done = Math.floor(step), partial = step % 1;
    for (let i = 0; i < 4; i++) {
      const y = 12 + i * 12;
      d.round(26, y, 16, 12, 2); d.round(28, y + 2, 12, 8, 1, 0);
      if (i < done) { d.line(31, y + 6, 34, y + 8, 2); d.line(34, y + 8, 38, y + 4, 2); }
      else if (i === done) d.line(31, y + 6, 31 + partial * 7, y + 6 + partial * 2, 2);
      d.line(50, y + 5, 98, y + 5);
    }
  }
  if (style === 'timer-beep') {
    d.circle(64, 32, 24); d.circle(64, 32, 18, 0); d.line(64, 32, 64, 18, 3); d.line(64, 32, 76, 32 + pulse * 4, 3);
    if (pulse > 0.55) { d.arc(64, 32, 28, -0.4, 0.4); d.arc(64, 32, 28, Math.PI - 0.4, Math.PI + 0.4); }
  }
  if (style === 'desk-lamp') {
    d.rect(56, 50, 16, 6); d.line(64, 50, 64, 30, 3); d.line(64, 30, 86, 20, 3);
    d.polygon([[84, 14], [102, 22], [80, 26]]);
    for (let i = 0; i < 3; i++) {
      const a = 0.45 + i * 0.28 + Math.sin(p * TAU) * 0.1;
      d.line(92, 24, 92 + Math.cos(a) * 14, 24 + Math.sin(a) * 14, 2);
    }
  }
  if (style === 'water') {
    d.round(48, 12, 32, 42, 4); d.round(52, 16, 24, 34, 3, 0);
    const level = 40 - Math.floor(p * 8) * 2;
    d.rect(54, level, 20, 46 - level);
    d.circle(58 + Math.sin(p * TAU) * 5, 43, 2, 0);
  }
  if (style === 'breathe') {
    const r = 10 + Math.round((1 - Math.cos(p * TAU)) * 3);
    d.circle(64, 36, r); d.circle(64, 36, Math.max(3, r - 5), 0);
    const a = p * TAU - Math.PI / 2;
    d.circle(64 + Math.cos(a) * (r + 5), 36 + Math.sin(a) * (r + 5), 2);
  }
  if (style === 'pencil') {
    d.round(26, 16, 64, 36, 2); d.round(32, 20, 52, 28, 1, 0);
    for (let i = 0; i < 3; i++) d.line(38, 26 + i * 8, 78, 26 + i * 8);
    const row = Math.floor(p * 3) % 3, x = 38 + (p * 3 % 1) * 34;
    d.line(38, 26 + row * 8, x, 26 + row * 8, 3);
    d.polygon([[x, 20 + row * 8], [x + 14, 14 + row * 8], [x + 6, 26 + row * 8]]);
  }
  if (style === 'letter') {
    d.polygon([[36, 18], [92, 18], [92, 50], [36, 50]]);
    d.polygon([[40, 22], [88, 22], [88, 46], [40, 46]], 0);
    const flap = 26 + Math.sin(p * TAU) * 6;
    d.line(40, 22, 64, flap, 2); d.line(88, 22, 64, flap, 2);
    d.rect(58, 32, 12, 8);
  }
  if (style === 'focus-ring') {
    d.arc(64, 32, 23, -Math.PI / 2, -Math.PI / 2 + TAU, 2);
    d.arc(64, 32, 19, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(opts.progress ?? (0.1 + pulse * 0.9)), 3);
    d.line(59, 24, 59, 40, 3); d.line(68, 24, 68, 40, 3);
    d.circle(64 + 23 * Math.sin(p * TAU), 32 - 23 * Math.cos(p * TAU), 3);
  }
}

export function paintTransition(style, d, p, opts, fb) {
  // Ping-pong preview returns to its initial state; progress overrides for UI use.
  const progress = clamp(opts.progress ?? (1 - Math.cos(p * TAU)) / 2);
  const h = fb.height > 64 && opts.progress === undefined ? 64 : fb.height;
  const y0 = (fb.height - h) >> 1;
  if (style === 'crt') {
    const ch = Math.max(2, Math.round(48 * (1 - progress) / 16) * 16), w = Math.max(4, Math.round(104 * (1 - Math.max(0, progress - 0.7) / 0.3) / 8) * 8);
    d.rect(64 - w / 2, 32 - ch / 2, w, ch);
    if (ch > 8) for (let i = 0; i < 7; i++) d.rect(20, 13 + i * 6, 88, 2, 0);
  }
  if (style === 'blinds') {
    const bw = h < fb.height ? Math.round(fb.width / 16 * progress) * 4 : Math.ceil(fb.width / 4 * progress);
    for (let i = 0; i < 4; i++) fb.fillRect(i * fb.width / 4, y0, bw, h);
  }
  if (style === 'wipe') fb.fillRect(0, y0, Math.ceil(fb.width * progress), h);
  if (style === 'iris' && progress > 0) {
    if (h < fb.height) d.circle(64, 32, Math.round(progress * 10) * 4);
    else fb.fillCircle(fb.width / 2, fb.height / 2, progress * Math.ceil(Math.hypot(fb.width, fb.height) / 2));
  }
  if (style === 'radar') {
    d.arc(64, 32, 27, 0, TAU); d.arc(64, 32, 15, 0, TAU);
    d.line(64, 32, 64 + 26 * Math.cos(p * TAU), 32 + 26 * Math.sin(p * TAU), 3);
    d.circle(77, 22, 3); d.circle(47, 41, 2);
  }

  if (style === 'pixels') {
    // Coarse 16px tiles keep XOR deltas sparse and under the 4KB flash budget.
    const rand = mulberry32(opts.seed ?? 1);
    for (let y = y0; y < y0 + h; y += 16) for (let x = 0; x < fb.width; x += 16) if (rand() < progress) fb.fillRect(x, y, 16, 16);
  }
  if (style === 'spiral') {
    for (let i = 0; i < 40 * progress; i++) { const a = i * 0.35, r = i * 0.9; d.rect(64 + Math.cos(a) * r, 32 + Math.sin(a) * r, 3, 3); }
  }
  if (style === 'checker') {
    const rows = Math.round(progress * 8);
    for (let y = y0; y < y0 + rows * 8 && y < y0 + h; y += 8) for (let x = 0; x < fb.width; x += 8) {
      if (((x + y - y0) / 8) % 2 === 0) fb.fillRect(x, y, 8, 8);
    }
  }
  if (style === 'bars') {
    for (let i = 0; i < 8; i++) fb.fillRect(0, y0 + i * 8, Math.ceil(fb.width * Math.min(1, progress * 1.4 - i * 0.05)), 8);
  }
  if (style === 'circle-out') {
    // Coarse radius steps keep the interior stable so XOR only stores the ring.
    const r = 4 + Math.round(progress * 8) * 4;
    d.circle(64, 32, r);
  }
  if (style === 'diamond') {
    const r = 4 + Math.round(progress * 8) * 4;
    d.polygon([[64, 32 - r], [64 + r, 32], [64, 32 + r], [64 - r, 32]]);
  }
  if (style === 'scramble') {
    const rand = mulberry32(opts.seed ?? 1);
    const n = Math.floor(progress * 12);
    for (let i = 0; i < n; i++) {
      const x = Math.floor(rand() * 8) * 16, y = y0 + Math.floor(rand() * 4) * 16;
      fb.fillRect(x, y, 16, 16);
    }
  }
  if (style === 'fade-center') {
    const r = h < fb.height ? Math.round((1 - progress) * 7) * 5 : (1 - progress) * 70;
    d.circle(64, 32, h < fb.height ? 36 : 80); if (r > 0) d.circle(64, 32, r, 0);
  }
  if (style === 'slide-up') {
    // Page-aligned rising bar (8px steps) stays XOR-friendly.
    const sh = Math.round(progress * 8) * 8;
    if (sh > 0) fb.fillRect(0, y0 + h - sh, fb.width, sh);
  }
  if (style === 'dissolve') {
    const rand = mulberry32(opts.seed ?? 1);
    // Stable 8x8 tiles instead of flashing single-pixel noise.
    for (let y = y0; y < y0 + h; y += 8) for (let x = 0; x < fb.width; x += 8) if (rand() < progress) fb.fillRect(x, y, 8, 8);
  }
}
