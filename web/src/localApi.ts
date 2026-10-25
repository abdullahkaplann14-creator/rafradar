import { ApiError } from './errors';
import { downloadText } from './download';
import type {
  AccountingData,
  AccountingSummary,
  Dashboard,
  Item,
  ItemInput,
  ItemStatus,
  Transaction,
  TransactionInput,
} from './types';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  VAT_RATES,
} from './types';
import { currentMonth, daysLeft, itemValue, vatOf } from './utils';

const ITEMS_KEY = 'rafradar.items.v1';
const TRANSACTIONS_KEY = 'rafradar.transactions.v1';

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Depolama kapalıysa veri oturum boyunca bellekte kalır.
  }
};

const readItems = () => read<Item[]>(ITEMS_KEY, []);
const writeItems = (items: Item[]) => write(ITEMS_KEY, items);
const readTransactions = () => read<Transaction[]>(TRANSACTIONS_KEY, []);
const writeTransactions = (transactions: Transaction[]) => write(TRANSACTIONS_KEY, transactions);

const newId = (prefix: string) =>
  `${prefix}-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`;

const nowIso = () => new Date().toISOString();

const pad = (value: number) => String(value).padStart(2, '0');

const localDate = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const dateWithOffset = (days: number) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return localDate(date);
};

const monthDate = (daysAgo: number) => {
  const date = new Date();
  const day = Math.max(1, date.getDate() - daysAgo);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(day)}`;
};

const isValidDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

const round = (value: number) => Math.round(value * 100) / 100;

const validateItem = (input: ItemInput) => {
  if (!input.name?.trim() || input.name.trim().length < 2) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Ürün adı en az 2 karakter olmalı', 'name');
  }
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Miktar 0’dan büyük olmalı', 'quantity');
  }
  if (!Number.isFinite(input.unitCost) || input.unitCost < 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Maliyet negatif olamaz', 'unitCost');
  }
  if (!isValidDate(input.expiryDate)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Geçerli bir tarih seç', 'expiryDate');
  }
};

const validateTransaction = (input: TransactionInput) => {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Tutar 0’dan büyük olmalı', 'amount');
  }
  if (!input.description?.trim() || input.description.trim().length < 2) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Açıklama en az 2 karakter olmalı', 'description');
  }
  if (!isValidDate(input.date)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Geçerli bir tarih seç', 'date');
  }
  const categories = input.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  if (!(categories as readonly string[]).includes(input.category)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Geçerli bir kategori seç', 'category');
  }
  if (!(PAYMENT_METHODS as readonly string[]).includes(input.paymentMethod)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Geçerli bir ödeme yöntemi seç', 'paymentMethod');
  }
  if (!(VAT_RATES as readonly number[]).includes(input.vatRate)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Geçerli bir KDV oranı seç', 'vatRate');
  }
};

const findItem = (items: Item[], id: string) => items.find((item) => item.id === id);

export async function createItem(input: ItemInput): Promise<Item> {
  validateItem(input);
  const item: Item = {
    id: newId('itm'),
    name: input.name.trim(),
    category: input.category,
    quantity: input.quantity,
    unit: input.unit,
    unitCost: input.unitCost,
    expiryDate: input.expiryDate,
    note: input.note?.trim() ? input.note.trim() : null,
    status: 'active',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    resolvedAt: null,
  };
  const items = readItems();
  writeItems([...items, item]);
  return item;
}

export async function updateItem(id: string, patch: Partial<ItemInput>): Promise<Item> {
  const items = readItems();
  const existing = findItem(items, id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Ürün bulunamadı');
  const merged = { ...existing, ...patch } as Item;
  validateItem(merged);
  const updated: Item = {
    ...existing,
    ...patch,
    name: (patch.name ?? existing.name).trim(),
    note: patch.note !== undefined ? (patch.note?.trim() ? patch.note.trim() : null) : existing.note,
    updatedAt: nowIso(),
  };
  writeItems(items.map((item) => (item.id === id ? updated : item)));
  return updated;
}

export async function deleteItem(id: string): Promise<void> {
  const items = readItems();
  if (!findItem(items, id)) throw new ApiError(404, 'NOT_FOUND', 'Ürün bulunamadı');
  writeItems(items.filter((item) => item.id !== id));
}

const resolve = async (id: string, status: Exclude<ItemStatus, 'active'>): Promise<Item> => {
  const items = readItems();
  const existing = findItem(items, id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Ürün bulunamadı');
  const updated: Item = {
    ...existing,
    status,
    resolvedAt: nowIso(),
    updatedAt: nowIso(),
  };
  writeItems(items.map((item) => (item.id === id ? updated : item)));
  return updated;
};

export async function resolveItem(
  id: string,
  outcome: Exclude<ItemStatus, 'active'>,
): Promise<Item> {
  return resolve(id, outcome);
}

export async function reopenItem(id: string): Promise<Item> {
  const items = readItems();
  const existing = findItem(items, id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Ürün bulunamadı');
  const updated: Item = {
    ...existing,
    status: 'active',
    resolvedAt: null,
    updatedAt: nowIso(),
  };
  writeItems(items.map((item) => (item.id === id ? updated : item)));
  return updated;
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  validateTransaction(input);
  const transaction: Transaction = {
    id: newId('txn'),
    type: input.type,
    category: input.category,
    amount: input.amount,
    date: input.date,
    description: input.description.trim(),
    paymentMethod: input.paymentMethod,
    documentNo: input.documentNo?.trim() ? input.documentNo.trim() : null,
    vatRate: input.vatRate,
    sold: input.type === 'income' ? input.sold !== false : true,
    note: input.note?.trim() ? input.note.trim() : null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  writeTransactions([...readTransactions(), transaction]);
  return transaction;
}

export async function updateTransaction(
  id: string,
  patch: Partial<TransactionInput>,
): Promise<Transaction> {
  const transactions = readTransactions();
  const existing = transactions.find((transaction) => transaction.id === id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Kasa kaydı bulunamadı');
  const merged = { ...existing, ...patch } as Transaction;
  validateTransaction(merged);
  const updated: Transaction = {
    ...existing,
    ...patch,
    description: (patch.description ?? existing.description).trim(),
    sold:
      merged.type === 'income'
        ? patch.sold !== undefined
          ? patch.sold
          : existing.sold
        : true,
    documentNo:
      patch.documentNo !== undefined
        ? patch.documentNo?.trim()
          ? patch.documentNo.trim()
          : null
        : existing.documentNo,
    note: patch.note !== undefined ? (patch.note?.trim() ? patch.note.trim() : null) : existing.note,
    updatedAt: nowIso(),
  };
  writeTransactions(transactions.map((transaction) => (transaction.id === id ? updated : transaction)));
  return updated;
}

export async function deleteTransaction(id: string): Promise<void> {
  const transactions = readTransactions();
  if (!transactions.some((transaction) => transaction.id === id)) {
    throw new ApiError(404, 'NOT_FOUND', 'Kasa kaydı bulunamadı');
  }
  writeTransactions(transactions.filter((transaction) => transaction.id !== id));
}

export async function getAccounting(month = currentMonth()): Promise<AccountingData> {
  const all = readTransactions();
  const transactions = all
    .filter((transaction) => transaction.date.startsWith(month))
    .sort(
      (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
    );
  const income = transactions.filter((transaction) => transaction.type === 'income');
  const soldIncome = income.filter((transaction) => transaction.sold);
  const pendingIncome = income.filter((transaction) => !transaction.sold);
  const expense = transactions.filter((transaction) => transaction.type === 'expense');

  const incomeTotal = round(soldIncome.reduce((sum, transaction) => sum + transaction.amount, 0));
  const pendingIncomeTotal = round(
    pendingIncome.reduce((sum, transaction) => sum + transaction.amount, 0),
  );
  const expenseTotal = round(expense.reduce((sum, transaction) => sum + transaction.amount, 0));
  const vatCollected = round(
    soldIncome.reduce(
      (sum, transaction) => sum + vatOf(transaction.amount, transaction.vatRate),
      0,
    ),
  );
  const vatDeductible = round(
    expense.reduce((sum, transaction) => sum + vatOf(transaction.amount, transaction.vatRate), 0),
  );
  const allTimeNet = round(
    all.reduce((sum, transaction) => {
      if (transaction.type === 'expense') return sum - transaction.amount;
      return transaction.sold ? sum + transaction.amount : sum;
    }, 0),
  );

  const summary: AccountingSummary = {
    month,
    incomeTotal,
    pendingIncomeTotal,
    expenseTotal,
    net: round(incomeTotal - expenseTotal),
    transactionCount: transactions.length,
    incomeCount: income.length,
    pendingIncomeCount: pendingIncome.length,
    expenseCount: expense.length,
    vatCollected,
    vatDeductible,
    vatPayable: round(vatCollected - vatDeductible),
    allTimeNet,
  };

  return {
    month,
    summary,
    transactions,
    categories: {
      income: INCOME_CATEGORIES,
      expense: EXPENSE_CATEGORIES,
    },
    paymentMethods: PAYMENT_METHODS,
    vatRates: VAT_RATES,
    generatedAt: nowIso(),
  };
}

export async function getDashboard(): Promise<Dashboard> {
  const items = readItems();
  const active = items.filter((item) => item.status === 'active');
  const attention = active
    .filter((item) => daysLeft(item.expiryDate) <= 7)
    .sort(
      (a, b) =>
        daysLeft(a.expiryDate) - daysLeft(b.expiryDate) ||
        a.name.localeCompare(b.name, 'tr'),
    );
  const rescued = items.filter((item) => item.status === 'rescued');
  const wasted = items.filter((item) => item.status === 'wasted');
  const recent = items
    .filter((item) => item.status !== 'active' && item.resolvedAt)
    .sort((a, b) => String(b.resolvedAt).localeCompare(String(a.resolvedAt)))
    .slice(0, 6);

  const accounting = await getAccounting();

  return {
    summary: {
      activeCount: active.length,
      expiringCount: active.filter((item) => {
        const days = daysLeft(item.expiryDate);
        return days >= 0 && days <= 7;
      }).length,
      expiredCount: active.filter((item) => daysLeft(item.expiryDate) < 0).length,
      attentionCount: attention.length,
      riskValue: round(attention.reduce((sum, item) => sum + itemValue(item), 0)),
      totalActiveValue: round(active.reduce((sum, item) => sum + itemValue(item), 0)),
      rescuedCount: rescued.length,
      rescuedValue: round(rescued.reduce((sum, item) => sum + itemValue(item), 0)),
      wastedCount: wasted.length,
      wastedValue: round(wasted.reduce((sum, item) => sum + itemValue(item), 0)),
    },
    attention,
    recent,
    items,
    accounting: {
      month: accounting.month,
      incomeTotal: accounting.summary.incomeTotal,
      pendingIncomeTotal: accounting.summary.pendingIncomeTotal,
      pendingIncomeCount: accounting.summary.pendingIncomeCount,
      expenseTotal: accounting.summary.expenseTotal,
      net: accounting.summary.net,
      transactionCount: accounting.summary.transactionCount,
      vatPayable: accounting.summary.vatPayable,
    },
    generatedAt: nowIso(),
  };
}

const demoItems: Array<Omit<ItemInput, 'note'> & { note?: string }> = [
  { name: 'Krema %35', category: 'Süt & Krema', quantity: 2, unit: 'litre', unitCost: 95, expiryDate: dateWithOffset(-1), note: 'Açılmamış, arka rafta.' },
  { name: 'Fesleğen', category: 'Sebze & Meyve', quantity: 0.5, unit: 'kg', unitCost: 140, expiryDate: dateWithOffset(0), note: 'Bugün pesto için kullanılmalı.' },
  { name: 'Mozzarella', category: 'Süt & Krema', quantity: 1, unit: 'kg', unitCost: 260, expiryDate: dateWithOffset(2) },
  { name: 'Füme somon', category: 'Et & Şarküteri', quantity: 1, unit: 'kg', unitCost: 690, expiryDate: dateWithOffset(5), note: 'Hafta sonu brunch menüsü.' },
  { name: 'Limon', category: 'Sebze & Meyve', quantity: 3, unit: 'kg', unitCost: 40, expiryDate: dateWithOffset(4) },
  { name: 'Taze kekik', category: 'Sebze & Meyve', quantity: 0.2, unit: 'kg', unitCost: 180, expiryDate: dateWithOffset(6) },
  { name: 'Filtre kahve çekirdeği', category: 'İçecek', quantity: 2, unit: 'kg', unitCost: 420, expiryDate: dateWithOffset(60), note: 'Yeni hasat.' },
  { name: 'Kaşar', category: 'Süt & Krema', quantity: 1, unit: 'kg', unitCost: 310, expiryDate: dateWithOffset(12) },
];

const demoTransactions: TransactionInput[] = [
  { type: 'income', category: 'Satış', amount: 18450, date: monthDate(0), description: 'Gün sonu satış', paymentMethod: 'Kart', documentNo: 'Z-1042', vatRate: 10, sold: true },
  { type: 'income', category: 'Satış', amount: 12780, date: monthDate(1), description: 'Gün sonu satış', paymentMethod: 'Nakit', documentNo: 'Z-1041', vatRate: 10, sold: true },
  { type: 'income', category: 'Satış', amount: 3200, date: monthDate(2), description: 'Telefonla ayrılan pasta siparişi', paymentMethod: 'Havale', vatRate: 10, sold: false, note: 'Teslim edilince “Satıldı” olarak işaretle.' },
  { type: 'income', category: 'Etkinlik', amount: 4500, date: monthDate(6), description: 'Özel etkinlik ikramı', paymentMethod: 'Havale', documentNo: 'FTR-208', vatRate: 20, sold: true },
  { type: 'expense', category: 'Tedarik', amount: 1240, date: monthDate(2), description: 'Süt ve krema alımı', paymentMethod: 'Havale', documentNo: 'F-8821', vatRate: 10 },
  { type: 'expense', category: 'Tedarik', amount: 2100, date: monthDate(3), description: 'Kahve çekirdeği', paymentMethod: 'Kart', documentNo: 'F-8834', vatRate: 20 },
  { type: 'expense', category: 'Fatura', amount: 1850, date: monthDate(5), description: 'Elektrik faturası', paymentMethod: 'Havale', documentNo: 'ELK-102', vatRate: 20 },
  { type: 'expense', category: 'Kira', amount: 12000, date: monthDate(10), description: 'Aylık kira', paymentMethod: 'Havale', documentNo: 'KIRA-10', vatRate: 0 },
  { type: 'expense', category: 'Personel', amount: 1500, date: monthDate(4), description: 'Personel avansı', paymentMethod: 'Nakit', vatRate: 0 },
];

export async function loadDemo(): Promise<{
  inserted: number;
  transactionsInserted: number;
  skipped: boolean;
}> {
  if (readItems().length > 0) {
    return { inserted: 0, transactionsInserted: 0, skipped: true };
  }
  const timestamp = nowIso();
  const items: Item[] = demoItems.map((sample) => ({
    id: newId('itm'),
    name: sample.name,
    category: sample.category,
    quantity: sample.quantity,
    unit: sample.unit,
    unitCost: sample.unitCost,
    expiryDate: sample.expiryDate,
    note: sample.note ?? null,
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
    resolvedAt: null,
  }));
  items.push(
    { id: newId('itm'), name: 'Croissant', category: 'Fırın', quantity: 10, unit: 'adet', unitCost: 22, expiryDate: dateWithOffset(-1), note: 'Sabah indirimiyle kurtarıldı.', status: 'rescued', createdAt: timestamp, updatedAt: timestamp, resolvedAt: timestamp },
    { id: newId('itm'), name: 'Süt', category: 'Süt & Krema', quantity: 4, unit: 'litre', unitCost: 32, expiryDate: dateWithOffset(-3), note: 'Buzdolabı arızası.', status: 'wasted', createdAt: timestamp, updatedAt: timestamp, resolvedAt: timestamp },
  );
  writeItems(items);
  const transactions: Transaction[] = demoTransactions.map((sample) => ({
    id: newId('txn'),
    type: sample.type,
    category: sample.category,
    amount: sample.amount,
    date: sample.date,
    description: sample.description,
    paymentMethod: sample.paymentMethod,
    documentNo: sample.documentNo ?? null,
    vatRate: sample.vatRate,
    sold: sample.type === 'income' ? sample.sold !== false : true,
    note: sample.note ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
  writeTransactions(transactions);
  return { inserted: items.length, transactionsInserted: transactions.length, skipped: false };
}

const escapeCsv = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
const csvMoney = (value: number) => value.toFixed(2).replace('.', ',');

const itemsCsv = () => {
  const header = ['Ürün', 'Kategori', 'Miktar', 'Birim', 'Birim Maliyet (TL)', 'Toplam Değer (TL)', 'Son Kullanma', 'Durum', 'Not'];
  const statusLabel = { active: 'Rafta', rescued: 'Kurtarıldı', wasted: 'Fire' };
  const lines = [
    header.map(escapeCsv).join(';'),
    ...readItems().map((item) =>
      [
        item.name,
        item.category,
        item.quantity,
        item.unit,
        csvMoney(item.unitCost),
        csvMoney(itemValue(item)),
        item.expiryDate,
        statusLabel[item.status],
        item.note ?? '',
      ].map(escapeCsv).join(';'),
    ),
  ];
  return `\uFEFF${lines.join('\r\n')}`;
};

const transactionsCsv = (month: string) => {
  const header = ['Tarih', 'Tür', 'Satış Durumu', 'Kategori', 'Açıklama', 'Ödeme', 'Belge No', 'Tutar (TL)', 'KDV Oranı', 'KDV (TL)', 'Not'];
  const typeLabel = { income: 'Gelir', expense: 'Gider' } as const;
  const rows = readTransactions()
    .filter((transaction) => transaction.date.startsWith(month))
    .sort((a, b) => b.date.localeCompare(a.date));
  const lines = [
    header.map(escapeCsv).join(';'),
    ...rows.map((transaction) =>
      [
        transaction.date,
        typeLabel[transaction.type],
        transaction.type === 'income' ? (transaction.sold ? 'Satıldı' : 'Satılmadı') : '—',
        transaction.category,
        transaction.description,
        transaction.paymentMethod,
        transaction.documentNo ?? '',
        csvMoney(transaction.amount),
        `%${transaction.vatRate}`,
        transaction.type === 'income' && !transaction.sold
          ? '0,00'
          : csvMoney(vatOf(transaction.amount, transaction.vatRate)),
        transaction.note ?? '',
      ].map(escapeCsv).join(';'),
    ),
  ];
  return `\uFEFF${lines.join('\r\n')}`;
};

export const localApi = {
  getDashboard,
  getAccounting,
  createItem,
  updateItem,
  deleteItem,
  resolveItem,
  reopenItem,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  loadDemo,
  downloadItemsCsv: async () => {
    downloadText('rafradar-urunler.csv', itemsCsv());
  },
  downloadTransactionsCsv: async (month: string) => {
    downloadText(`rafradar-kasa-${month}.csv`, transactionsCsv(month));
  },
};
