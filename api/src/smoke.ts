import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const testDb = path.join(os.tmpdir(), `rafradar-smoke-${Date.now()}.db`);
process.env.DB_PATH = testDb;

const {
  createItem,
  dateWithOffset,
  daysLeft,
  db,
  deleteItem,
  deleteTransaction,
  getAccounting,
  getDashboard,
  getItem,
  getAllTransactions,
  itemsToCsv,
  loadDemo,
  reopenItem,
  resetItems,
  resetTransactions,
  resolveItem,
  createTransaction,
  updateTransaction,
  transactionsToCsv,
  updateItem,
} = await import('./db.js');

let checks = 0;
const ok = (label: string) => {
  checks += 1;
  console.log(`  ✓ ${label}`);
};

try {
  const krema = createItem({
    name: 'Krema %35',
    category: 'Süt & Krema',
    quantity: 2,
    unit: 'litre',
    unitCost: 95,
    expiryDate: dateWithOffset(-1),
    note: 'Arka rafta.',
  });
  const feslegen = createItem({
    name: 'Fesleğen',
    category: 'Sebze & Meyve',
    quantity: 0.5,
    unit: 'kg',
    unitCost: 140,
    expiryDate: dateWithOffset(0),
  });
  createItem({
    name: 'Mozzarella',
    category: 'Süt & Krema',
    quantity: 1,
    unit: 'kg',
    unitCost: 260,
    expiryDate: dateWithOffset(3),
  });
  createItem({
    name: 'Filtre kahve',
    category: 'İçecek',
    quantity: 2,
    unit: 'kg',
    unitCost: 420,
    expiryDate: dateWithOffset(30),
  });
  ok('ürün oluşturma');

  let dashboard = getDashboard();
  assert.equal(dashboard.summary.activeCount, 4);
  assert.equal(dashboard.summary.expiredCount, 1);
  assert.equal(dashboard.summary.expiringCount, 2);
  assert.equal(dashboard.summary.attentionCount, 3);
  assert.equal(dashboard.summary.riskValue, 520);
  assert.equal(dashboard.summary.totalActiveValue, 1360);
  assert.equal(dashboard.attention[0].id, krema.id);
  assert.equal(daysLeft(feslegen.expiryDate), 0);
  ok('dashboard risk değeri, geciken ve yaklaşan sayıları');

  const rescued = resolveItem(krema.id, 'rescued');
  assert.equal(rescued?.status, 'rescued');
  dashboard = getDashboard();
  assert.equal(dashboard.summary.rescuedValue, 190);
  assert.equal(dashboard.summary.riskValue, 330);
  ok('kurtarma kaydı özeti günceller');

  const reopened = reopenItem(krema.id);
  assert.equal(reopened?.status, 'active');
  dashboard = getDashboard();
  assert.equal(dashboard.summary.riskValue, 520);
  ok('rafa geri alma');

  const updated = updateItem(krema.id, { quantity: 3 });
  assert.equal(updated?.quantity, 3);
  assert.equal(getDashboard().summary.riskValue, 615);
  ok('kısmi güncelleme');

  const needle = getDashboard().items.filter((item) =>
    item.name.toLocaleLowerCase('tr').includes('fesleğen'),
  );
  assert.equal(needle.length, 1);
  ok('Türkçe ürün adı');

  assert.equal(deleteItem(feslegen.id), true);
  assert.equal(getItem(feslegen.id), null);
  ok('ürün silme');

  const income = createTransaction({
    type: 'income',
    category: 'Satış',
    amount: 1000,
    date: dateWithOffset(0),
    description: 'Gün sonu satış',
    paymentMethod: 'Kart',
    documentNo: 'Z-1',
    vatRate: 20,
  });
  createTransaction({
    type: 'expense',
    category: 'Tedarik',
    amount: 500,
    date: dateWithOffset(0),
    description: 'Süt alımı',
    paymentMethod: 'Havale',
    vatRate: 10,
  });
  let accounting = getAccounting();
  assert.equal(accounting.summary.incomeTotal, 1000);
  assert.equal(accounting.summary.expenseTotal, 500);
  assert.equal(accounting.summary.net, 500);
  assert.equal(accounting.summary.vatCollected, 166.67);
  assert.equal(accounting.summary.vatDeductible, 45.45);
  assert.equal(accounting.summary.vatPayable, 121.22);
  assert.equal(accounting.summary.transactionCount, 2);
  assert.equal(getAllTransactions({ type: 'income' }).length, 1);
  ok('kasa: gelir, gider, net ve KDV özeti');

  updateTransaction(income.id, { amount: 1200, description: 'Gün sonu satış (düzeltme)' });
  accounting = getAccounting();
  assert.equal(accounting.summary.incomeTotal, 1200);
  assert.equal(accounting.summary.net, 700);
  assert.equal(accounting.summary.vatCollected, 200);
  assert.equal(
    accounting.transactions.find((transaction) => transaction.id === income.id)?.description,
    'Gün sonu satış (düzeltme)',
  );
  ok('kasa: kısmi güncelleme ve yeniden hesaplama');

  const expenseTx = accounting.transactions.find((transaction) => transaction.type === 'expense')!;
  assert.equal(deleteTransaction(expenseTx.id), true);
  assert.equal(getAccounting().summary.expenseTotal, 0);
  const txCsv = transactionsToCsv();
  assert.ok(txCsv.includes('Gün sonu satış'));
  assert.ok(txCsv.includes('Gelir'));
  ok('kasa: silme + CSV');

  resetTransactions();
  assert.equal(getAccounting().summary.transactionCount, 0);

  resetItems();
  assert.equal(getDashboard().items.length, 0);
  const demo = loadDemo();
  assert.equal(demo.inserted, 10);
  assert.equal(demo.transactionsInserted, 8);
  assert.equal(loadDemo().skipped, true);
  dashboard = getDashboard();
  assert.equal(dashboard.items.length, 10);
  assert.ok(dashboard.summary.riskValue > 0);
  assert.ok(dashboard.summary.rescuedValue > 0);
  assert.ok(dashboard.summary.wastedValue > 0);
  assert.equal(dashboard.accounting.incomeTotal, 35730);
  assert.equal(dashboard.accounting.expenseTotal, 18690);
  assert.equal(dashboard.accounting.net, 17040);
  assert.equal(dashboard.accounting.transactionCount, 8);
  ok('boş panoya 10 örnek ürün + 8 kasa kaydı, ikinci çağrı korunur');

  const demoAccounting = getAccounting();
  assert.equal(demoAccounting.summary.transactionCount, 8);
  assert.equal(demoAccounting.summary.net, 17040);
  assert.ok(demoAccounting.summary.vatPayable > 0);

  const csv = itemsToCsv();
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('Krema %35'));
  assert.ok(csv.includes('Kurtarıldı'));
  ok('CSV dışa aktarma');

  console.log(`\n[smoke] ${checks} kontrol geçti.`);
} finally {
  db.close();
  for (const suffix of ['', '-wal', '-shm']) {
    try {
      fs.rmSync(`${testDb}${suffix}`, { force: true });
    } catch {
      /* yok say */
    }
  }
}
