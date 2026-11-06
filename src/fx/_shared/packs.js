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
  if (style === 'crt') {
    const h = Math.max(2, Math.round(48 * (1 - progress) / 16) * 16), w = Math.max(4, Math.round(104 * (1 - Math.max(0, progress - 0.7) / 0.3) / 8) * 8);
    d.rect(64 - w / 2, 32 - h / 2, w, h);
    if (h > 8) for (let i = 0; i < 7; i++) d.rect(20, 13 + i * 6, 88, 2, 0);
  }
  if (style === 'blinds') for (let i = 0; i < 4; i++) fb.fillRect(i * fb.width / 4, 0, Math.ceil(fb.width / 4 * progress), fb.height);
  if (style === 'wipe') fb.fillRect(0, 0, Math.ceil(fb.width * progress), fb.height);
  if (style === 'iris' && progress > 0) fb.fillCircle(fb.width / 2, fb.height / 2, progress * Math.ceil(Math.hypot(fb.width, fb.height) / 2));
  if (style === 'radar') {
    d.arc(64, 32, 27, 0, TAU); d.arc(64, 32, 15, 0, TAU);
    d.line(64, 32, 64 + 26 * Math.cos(p * TAU), 32 + 26 * Math.sin(p * TAU), 3);
    d.circle(77, 22, 3); d.circle(47, 41, 2);
  }
  if (style === 'dissolve') {
    const rand = mulberry32(opts.seed ?? 1);
    // Stable 8x8 tiles instead of flashing single-pixel noise.
    for (let y = 0; y < fb.height; y += 8) for (let x = 0; x < fb.width; x += 8) if (rand() < progress) fb.fillRect(x, y, 8, 8);
  }
}
