import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, '..', 'dist');
const index = path.join(dist, 'index.html');

if (!fs.existsSync(index)) {
  throw new Error('dist/index.html bulunamadı. Önce vite build çalıştır.');
}

fs.copyFileSync(index, path.join(dist, '200.html'));
console.log('[static] dist/200.html oluşturuldu (SPA fallback).');
