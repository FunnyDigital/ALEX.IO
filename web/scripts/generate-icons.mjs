// Dependency-free PWA icon generator.
// Renders a green rounded-square mark with a white "A" glyph to PNG.
// Run with: node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '..', 'public', 'icons');
mkdirSync(OUT, { recursive: true });

const BRAND = [16, 185, 129];
const WHITE = [255, 255, 255];

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePng(size, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function inRoundedRect(x, y, size, radius) {
  const px = Math.min(Math.max(x, radius), size - radius);
  const py = Math.min(Math.max(y, radius), size - radius);
  const dx = x - px;
  const dy = y - py;
  return dx * dx + dy * dy <= radius * radius;
}

function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy || 1;
  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function render(size, { maskable }) {
  const rgba = Buffer.alloc(size * size * 4);
  const radius = maskable ? size * 0.5 : size * 0.28;
  const scale = maskable ? 0.6 : 0.84;
  const offset = (1 - scale) / 2;
  const samples = 3;
  const thickness = 0.055 * scale * size;

  const point = (nx, ny) => [(offset + nx * scale) * size, (offset + ny * scale) * size];
  const segments = [
    [...point(0.28, 0.74), ...point(0.5, 0.26)],
    [...point(0.72, 0.74), ...point(0.5, 0.26)],
    [...point(0.38, 0.58), ...point(0.62, 0.58)],
  ];

  const total = samples * samples;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let bgHits = 0;
      let fgHits = 0;

      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const px = x + (sx + 0.5) / samples;
          const py = y + (sy + 0.5) / samples;
          const inBackground = maskable ? true : inRoundedRect(px, py, size, radius);
          if (!inBackground) continue;
          bgHits += 1;
          let distance = Infinity;
          for (const [x1, y1, x2, y2] of segments) {
            distance = Math.min(distance, distanceToSegment(px, py, x1, y1, x2, y2));
          }
          if (distance <= thickness) fgHits += 1;
        }
      }

      const index = (y * size + x) * 4;
      if (bgHits === 0) {
        rgba[index + 3] = 0;
        continue;
      }
      const fgAlpha = fgHits / total;
      rgba[index] = Math.round(BRAND[0] * (1 - fgAlpha) + WHITE[0] * fgAlpha);
      rgba[index + 1] = Math.round(BRAND[1] * (1 - fgAlpha) + WHITE[1] * fgAlpha);
      rgba[index + 2] = Math.round(BRAND[2] * (1 - fgAlpha) + WHITE[2] * fgAlpha);
      rgba[index + 3] = Math.round((bgHits / total) * 255);
    }
  }

  return encodePng(size, rgba);
}

const outputs = [
  ['icon-192.png', 192, { maskable: false }],
  ['icon-512.png', 512, { maskable: false }],
  ['apple-touch-icon.png', 180, { maskable: false }],
  ['maskable-512.png', 512, { maskable: true }],
];

for (const [name, size, options] of outputs) {
  writeFileSync(resolve(OUT, name), render(size, options));
  console.log(`generated ${name}`);
}

writeFileSync(
  resolve(OUT, 'favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="48" height="48" rx="13" fill="#10b981"/>
  <path d="M15 34 L24 13 L33 34" fill="none" stroke="#ffffff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M19.5 26.5 H28.5" stroke="#ffffff" stroke-width="3.6" stroke-linecap="round"/>
</svg>
`
);
console.log('generated favicon.svg');
