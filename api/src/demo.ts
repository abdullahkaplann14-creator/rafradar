import { db, loadDemo, getDashboard } from './db.js';

const result = loadDemo();
if (result.skipped) {
  console.log('[demo] Pano boş değil; mevcut veriler korunuyor.');
} else {
  const dashboard = getDashboard();
  console.log(
    `[demo] ${result.inserted} örnek ürün eklendi · ${dashboard.summary.attentionCount} ürün aksiyon bekliyor.`,
  );
}
db.close();
