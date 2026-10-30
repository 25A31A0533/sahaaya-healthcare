import fs from 'fs';
import path from 'path';

const distIndex = path.resolve('dist', 'index.html');
const dist404 = path.resolve('dist', '404.html');

if (fs.existsSync(distIndex)) {
  fs.copyFileSync(distIndex, dist404);
  console.log('Successfully generated dist/404.html for GitHub Pages fallback.');
}
