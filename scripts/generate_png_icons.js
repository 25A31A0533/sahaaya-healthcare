import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

const crcTable = createCrcTable();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function generatePNG(width, height, isMaskable = false) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: width(4), height(4), bitDepth=8(1), colorType=6 (RGBA)(1), comp=0(1), filter=0(1), interlace=0(1)
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw image data: height rows, each row starts with filter byte 0
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  const cx = width / 2;
  const cy = height / 2;
  const crossWidth = isMaskable ? width * 0.16 : width * 0.2;
  const crossLength = isMaskable ? width * 0.44 : width * 0.54;
  const circleRadius = isMaskable ? width * 0.08 : width * 0.1;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Primary green background: #0F6E56 = rgb(15, 110, 86)
      let r = 15;
      let g = 110;
      let b = 86;
      let a = 255;

      // Distance from center
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Medical Cross
      const inHorizCross = (dx <= crossLength / 2 && dy <= crossWidth / 2);
      const inVertCross = (dy <= crossLength / 2 && dx <= crossWidth / 2);

      if (inHorizCross || inVertCross) {
        // Crisp White #FFFFFF
        r = 255;
        g = 255;
        b = 255;
      }

      // Amber Center Accent #F59E0B = rgb(245, 158, 11)
      if (dist <= circleRadius) {
        r = 245;
        g = 158;
        b = 11;
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePNG(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePNG(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'maskable-icon-512x512.png'), generatePNG(512, 512, true));

console.log('Successfully generated pwa-192x192.png, pwa-512x512.png, and maskable-icon-512x512.png');
