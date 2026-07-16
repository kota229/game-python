// build-www.js — 静的サイトを www/ に集める（Capacitor の webDir 用）。
// ビルド（トランスパイル/バンドル）はしない。必要ファイルをコピーするだけ。
import { cpSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const www = join(root, 'www');

const ITEMS = ['index.html', 'manifest.webmanifest', 'css', 'js', 'data'];

if (existsSync(www)) rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });
for (const item of ITEMS) {
  const src = join(root, item);
  if (!existsSync(src)) { console.warn(`skip (not found): ${item}`); continue; }
  cpSync(src, join(www, item), { recursive: true });
}
console.log(`www/ を作成しました（${ITEMS.join(', ')}）。Capacitor の webDir はこの www を指します。`);
