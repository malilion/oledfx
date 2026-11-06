import { clamp, TAU } from '../../core/draw.js';

// Each expression uses a distinct silhouette; common gaze and blink stay live.
export function paintEyes(style, d, p, opts) {
  const wave = Math.sin(p * TAU), pulse = (1 - Math.cos(p * TAU)) / 2;
  const blink = clamp(opts.blink ?? Math.max(0, 1 - Math.abs(p - 0.82) / 0.045));
  const gazeX = clamp(opts.lookX ?? 0, -1, 1) * 7;
  const gazeY = clamp(opts.lookY ?? 0, -1, 1) * 4;
  for (let i = 0; i < 2; i++) {
    let x = 41 + i * 46 + gazeX, y = 31 + gazeY + wave * 1.8, w = 27, h = 29;
    if (style === 'curious-tilt') { y += (i ? 1 : -1) * (3 + 3 * wave); h += i ? -4 : 4; }
    if (style === 'sleepy' || style === 'bored') h = 9 + 4 * pulse;
    if (style === 'surprised') { w = 31 + 3 * pulse; h = 35 + 3 * pulse; }
    if (style === 'shy') { w = 19; h = 22; y += 3 * pulse; }
    if (style === 'suspicious') h = 10 + (i ? 5 : 0) + 3 * wave;
    if (style === 'excited') { y -= 3 * pulse; h = 25 + 6 * pulse; }
    if (style === 'determined') { h = 20; w = 31; y += 2; }
    if (style === 'listening') w = 21 + (i ? 1 : -1) * 6 * wave;
    if (style === 'scared') { x += Math.round(2 * Math.sin(p * TAU * 8)); h = 33; }
    if (style === 'wink' && i === 1) h *= 1 - 0.94 * pulse;
    if (style === 'searching') x += 7 * wave;
    if (style === 'sleeping') h = 3;
    h = Math.max(3, Math.round(h * (1 - blink * 0.92)));
    if (blink > 0.8) { d.round(x - w / 2, y - h / 2, w, h, 2); continue; }
    if (style === 'heart') {
      const r = 7 + 2 * pulse;
      d.circle(x - 6, y - 5, r); d.circle(x + 6, y - 5, r);
      d.polygon([[x - 14, y - 4], [x + 14, y - 4], [x, y + 16]]);
    } else if (style === 'star') {
      const points = Array.from({ length: 10 }, (_, j) => {
        const a = j * Math.PI / 5 - Math.PI / 2 + wave * 0.12, r = j % 2 ? 6 : 16 + pulse;
        return [x + Math.cos(a) * r, y + Math.sin(a) * r];
      }); d.polygon(points);
    } else if (style === 'dizzy') {
      for (let j = 0; j < 85; j++) {
        const a = j / 84 * TAU * 2.2 + p * TAU, r = 2 + j / 7;
        d.rect(x + Math.cos(a) * r, y + Math.sin(a) * r, 3, 3);
      }
    } else if (style === 'loading') {
      d.arc(x, y, 14, p * TAU, p * TAU + Math.PI * 1.45, 3);
      d.circle(x, y, 3);
    } else if (style === 'crying') {
      d.arc(x, y + 6, 14, Math.PI * 1.12, Math.PI * 1.88, 3);
      d.round(x - 9, y + 8 + 5 * pulse, 5, 7, 2);
    } else if (style === 'sleeping') {
      d.arc(x, y - 5 + wave, 13, 0.2, Math.PI - 0.2, 3);
    } else if (style === 'deadpan') {
      d.line(x - 10, y - 10, x + 10, y + 10, 4);
      d.line(x - 10, y + 10, x + 10, y - 10, 4);
      d.rect(x - 11, y + 18, 24 * pulse, 2);
    } else {
      d.round(x - w / 2, y - h / 2, w, h, Math.min(7, h / 2));
      if (['angry', 'determined'].includes(style)) {
        const dir = i ? -1 : 1;
        d.polygon([[x - w, y - h], [x + w, y - h], [x + dir * w, y + 1 + pulse * 3], [x - dir * w, y - 12]], 0);
      }
      if (style === 'sad') d.polygon([[x - w, y - h], [x + w, y - h], [x + (i ? -1 : 1) * w, y - 1], [x + (i ? 1 : -1) * w, y - 13]], 0);
      if (style === 'charging') {
        d.round(x - w / 2 + 3, y - h / 2 + 3, w - 6, h - 6, 3, 0);
        for (let j = 0; j < 4; j++) if (j <= Math.floor(pulse * 4)) d.rect(x - 8, y + 8 - j * 6, 17, 4);
      }
      if (style === 'robot') { d.rect(x - 9, y - 8, 18, 16, 0); d.rect(x - 6 + wave * 4, y - 3, 6, 6); }
      if (style === 'glitch') { const shift = Math.floor(p * 8) % 4; d.rect(x - 17, y - 8 + shift * 5, 34, 3, 0); d.rect(x - 18 + shift * 3, y + 14, 20, 3); }
      if (style === 'squint') d.circle(x, y + 20 - pulse * 10, 21, 0);
      if (style === 'bored' || style === 'sleepy') d.rect(x - 15, y - 9, 32, 7 + 4 * pulse, 0);
      if (style === 'sparkle') { d.line(x - 6, y - 8, x - 6, y + 2, 2, 0); d.line(x - 11, y - 3, x - 1, y - 3, 2, 0); }
    }
    if (style === 'shy') { d.line(x - 13, y + 14, x - 16, y + 18, 2); d.line(x - 6, y + 14, x - 9, y + 18, 2); }
    if (style === 'sleeping' && i === 1) { d.line(105, 17 - pulse * 4, 112, 17 - pulse * 4); d.line(112, 17 - pulse * 4, 105, 24 - pulse * 4); d.line(105, 24 - pulse * 4, 112, 24 - pulse * 4); }
  }
}
