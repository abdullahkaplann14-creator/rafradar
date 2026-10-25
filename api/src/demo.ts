import { db, loadDemo, getDashboard, getAccounting } from './db.js';

const result = loadDemo();
if (result.skipped) {
  console.log('[demo] Pano boş değil; mevcut veriler korunuyor.');
} else {
  const dashboard = getDashboard();
  const accounting = getAccounting();
  console.log(
    `[demo] ${result.inserted} ürün, ${result.transactionsInserted} kasa kaydı eklendi · ${dashboard.summary.attentionCount} ürün aksiyon bekliyor · net ${accounting.summary.net} TL.`,
  );
}
db.close();
