import { Jimp, intToRGBA, rgbaToInt } from 'jimp';

const W = 1080, H = 1920;
const img = new Jimp({ width: W, height: H, color: 0x0a0a14 });

function rect(j, x, y, w, h, hex) {
  const c = rgbaToInt(...Object.values(intToRGBA(hex)));
  for (let row = y; row < y + h; row++) {
    for (let col = x; col < x + w; col++) {
      j.setPixelColor(c, col, row);
    }
  }
}

rect(img, 160, 80, 760, 60, 0xffffff);
rect(img, 80, 200, 200, 50, 0x00ff88);
rect(img, 760, 200, 200, 50, 0x4444ff);
rect(img, 80, 320, 300, 40, 0xff4444);
rect(img, 420, 380, 240, 36, 0xffaa00);

const gx = 140, gy = 500, cell = 160, gap = 8, rows = 5, cols = 5;
rect(img, gx - 20, gy - 20, cols * cell + 20, rows * cell + 20, 0x12122a);
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    const x = gx + c * cell + gap / 2;
    const y = gy + r * cell + gap / 2;
    const s = cell - gap;
    const col = r === 2 && c === 2 ? 0x4444ff
              : r === 2 && c === 3 ? 0x88ccff
              : 0x1a1a2e;
    rect(img, x, y, s, s, col);
  }
}

rect(img, 200, 1500, 680, 80, 0x1a1a2e);
rect(img, 200, 1600, 680, 4, 0x4444ff);

await img.write('public/screenshots/1.jpg');
console.log('Screenshot generated: public/screenshots/1.jpg');
