import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DB_PATH } from './env.js';

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    category    TEXT NOT NULL,
    quantity    REAL NOT NULL,
    unit        TEXT NOT NULL,
    unit_cost   REAL NOT NULL,
    expiry_date TEXT NOT NULL,
    note        TEXT,
    status      TEXT NOT NULL DEFAULT 'active',
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    resolved_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_items_status ON items(status, expiry_date);

  CREATE TABLE IF NOT EXISTS transactions (
    id             TEXT PRIMARY KEY,
    type           TEXT NOT NULL,
    category       TEXT NOT NULL,
    amount         REAL NOT NULL,
    date           TEXT NOT NULL,
    description    TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    document_no    TEXT,
    vat_rate       INTEGER NOT NULL DEFAULT 0,
    sold           INTEGER NOT NULL DEFAULT 1,
    note           TEXT,
    created_at     TEXT NOT NULL,
    updated_at     TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
`);

// Eski veritabanları için satış durumu kolonu.
const transactionColumns = db.prepare('PRAGMA table_info(transactions)').all() as {
  name: string;
}[];
if (!transactionColumns.some((column) => column.name === 'sold')) {
  db.exec('ALTER TABLE transactions ADD COLUMN sold INTEGER NOT NULL DEFAULT 1');
}

export const CATEGORIES = [
  'Süt & Krema',
  'Et & Şarküteri',
  'Sebze & Meyve',
  'Fırın',
  'İçecek',
  'Diğer',
] as const;

export const UNITS = ['adet', 'kg', 'litre', 'paket'] as const;

export type Category = (typeof CATEGORIES)[number];
export type Unit = (typeof UNITS)[number];
export type ItemStatus = 'active' | 'rescued' | 'wasted';

export type Item = {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  unit: Unit;
  unitCost: number;
  expiryDate: string;
  note: string | null;
  status: ItemStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

export type ItemInput = {
  name: string;
  category: Category;
  quantity: number;
  unit: Unit;
  unitCost: number;
  expiryDate: string;
  note?: string | null;
};

export const INCOME_CATEGORIES = ['Satış', 'Etkinlik', 'Diğer Gelir'] as const;
export const EXPENSE_CATEGORIES = [
  'Tedarik',
  'Kira',
  'Personel',
  'Fatura',
  'Vergi',
  'Diğer Gider',
] as const;
export const PAYMENT_METHODS = ['Nakit', 'Kart', 'Havale'] as const;
export const VAT_RATES = [0, 1, 10, 20] as const;

export type TransactionType = 'income' | 'expense';
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type VatRate = (typeof VAT_RATES)[number];

export type Transaction = {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: string;
  description: string;
  paymentMethod: PaymentMethod;
  documentNo: string | null;
  vatRate: VatRate;
  sold: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TransactionInput = {
  type: TransactionType;
  category: string;
  amount: number;
  date: string;
  description: string;
  paymentMethod: PaymentMethod;
  documentNo?: string | null;
  vatRate: VatRate;
  sold?: boolean;
  note?: string | null;
};

export type AccountingSummary = {
  month: string;
  incomeTotal: number;
  pendingIncomeTotal: number;
  expenseTotal: number;
  net: number;
  transactionCount: number;
  incomeCount: number;
  pendingIncomeCount: number;
  expenseCount: number;
  vatCollected: number;
  vatDeductible: number;
  vatPayable: number;
  allTimeNet: number;
};

export type AccountingData = {
  month: string;
  summary: AccountingSummary;
  transactions: Transaction[];
  categories: {
    income: readonly string[];
    expense: readonly string[];
  };
  paymentMethods: readonly string[];
  vatRates: readonly number[];
  generatedAt: string;
};

export type Summary = {
  activeCount: number;
  expiringCount: number;
  expiredCount: number;
  attentionCount: number;
  riskValue: number;
  totalActiveValue: number;
  rescuedCount: number;
  rescuedValue: number;
  wastedCount: number;
  wastedValue: number;
};

export type Dashboard = {
  summary: Summary;
  attention: Item[];
  recent: Item[];
  items: Item[];
  accounting: {
    month: string;
    incomeTotal: number;
    pendingIncomeTotal: number;
    pendingIncomeCount: number;
    expenseTotal: number;
    net: number;
    transactionCount: number;
    vatPayable: number;
  };
  generatedAt: string;
};

type ItemRow = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  expiry_date: string;
  note: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

const toItem = (row: ItemRow): Item => ({
  id: row.id,
  name: row.name,
  category: row.category as Category,
  quantity: Number(row.quantity),
  unit: row.unit as Unit,
  unitCost: Number(row.unit_cost),
  expiryDate: row.expiry_date,
  note: row.note,
  status: row.status as ItemStatus,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  resolvedAt: row.resolved_at,
});

type TransactionRow = {
  id: string;
  type: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  payment_method: string;
  document_no: string | null;
  vat_rate: number;
  sold: number;
  note: string | null;
  created_at: string;
  updated_at: string;
};

const toTransaction = (row: TransactionRow): Transaction => ({
  id: row.id,
  type: row.type as TransactionType,
  category: row.category,
  amount: Number(row.amount),
  date: row.date,
  description: row.description,
  paymentMethod: row.payment_method as PaymentMethod,
  documentNo: row.document_no,
  vatRate: Number(row.vat_rate) as VatRate,
  sold: Boolean(row.sold),
  note: row.note,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export function currentMonth(date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

/** Tutar KDV dahildir; içindeki KDV payını döndürür. */
export function vatOf(amount: number, rate: number): number {
  if (!rate) return 0;
  return round((amount * rate) / (100 + rate));
}

const pad = (value: number) => String(value).padStart(2, '0');

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dateWithOffset(days: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return localDate(date);
}

export function daysLeft(expiryDate: string): number {
  const [year, month, day] = expiryDate.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export const itemValue = (item: Pick<Item, 'quantity' | 'unitCost'>) =>
  Math.round(item.quantity * item.unitCost * 100) / 100;

const round = (value: number) => Math.round(value * 100) / 100;

export function getAllItems(filters?: {
  status?: ItemStatus | 'all';
  q?: string;
  category?: string;
}): Item[] {
  let items = (
    db.prepare('SELECT * FROM items ORDER BY expiry_date ASC, created_at DESC').all() as ItemRow[]
  ).map(toItem);

  if (filters?.status && filters.status !== 'all') {
    items = items.filter((item) => item.status === filters.status);
  }
  if (filters?.category && filters.category !== 'all') {
    items = items.filter((item) => item.category === filters.category);
  }
  if (filters?.q?.trim()) {
    const needle = normalize(filters.q);
    items = items.filter((item) =>
      normalize(`${item.name} ${item.category} ${item.note ?? ''}`).includes(needle),
    );
  }

  return items;
}

export function getItem(id: string): Item | null {
  const row = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as ItemRow | undefined;
  return row ? toItem(row) : null;
}

export function createItem(input: ItemInput): Item {
  const id = `itm-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`;
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO items
     (id, name, category, quantity, unit, unit_cost, expiry_date, note, status, created_at, updated_at, resolved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, NULL)`,
  ).run(
    id,
    input.name,
    input.category,
    input.quantity,
    input.unit,
    input.unitCost,
    input.expiryDate,
    input.note?.trim() ? input.note.trim() : null,
    now,
    now,
  );
  return getItem(id)!;
}

export function updateItem(
  id: string,
  patch: Partial<ItemInput>,
): Item | null {
  if (!getItem(id)) return null;

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (patch.name !== undefined) {
    fields.push('name = ?');
    values.push(patch.name);
  }
  if (patch.category !== undefined) {
    fields.push('category = ?');
    values.push(patch.category);
  }
  if (patch.quantity !== undefined) {
    fields.push('quantity = ?');
    values.push(patch.quantity);
  }
  if (patch.unit !== undefined) {
    fields.push('unit = ?');
    values.push(patch.unit);
  }
  if (patch.unitCost !== undefined) {
    fields.push('unit_cost = ?');
    values.push(patch.unitCost);
  }
  if (patch.expiryDate !== undefined) {
    fields.push('expiry_date = ?');
    values.push(patch.expiryDate);
  }
  if (patch.note !== undefined) {
    fields.push('note = ?');
    values.push(patch.note?.trim() ? patch.note.trim() : null);
  }

  if (fields.length > 0) {
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    db.prepare(`UPDATE items SET ${fields.join(', ')} WHERE id = ?`).run(...values, id);
  }
  return getItem(id);
}

export function deleteItem(id: string): boolean {
  const result = db.prepare('DELETE FROM items WHERE id = ?').run(id);
  return Number(result.changes) > 0;
}

export function resolveItem(id: string, status: 'rescued' | 'wasted'): Item | null {
  if (!getItem(id)) return null;
  const now = new Date().toISOString();
  db.prepare(
    'UPDATE items SET status = ?, resolved_at = ?, updated_at = ? WHERE id = ?',
  ).run(status, now, now, id);
  return getItem(id);
}

export function reopenItem(id: string): Item | null {
  if (!getItem(id)) return null;
  db.prepare(
    "UPDATE items SET status = 'active', resolved_at = NULL, updated_at = ? WHERE id = ?",
  ).run(new Date().toISOString(), id);
  return getItem(id);
}

export function getDashboard(): Dashboard {
  const items = getAllItems();
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

  const summary: Summary = {
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
  };

  const accounting = getAccounting();

  return {
    summary,
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
    generatedAt: new Date().toISOString(),
  };
}

export function loadDemo(): {
  inserted: number;
  transactionsInserted: number;
  skipped: boolean;
} {
  const count = Number(
    (db.prepare('SELECT COUNT(*) AS count FROM items').get() as { count: number }).count,
  );
  if (count > 0) return { inserted: 0, transactionsInserted: 0, skipped: true };

  const now = new Date();
  const resolvedAt = (daysAgo: number) => {
    const date = new Date(now.getTime() - daysAgo * 86_400_000);
    return date.toISOString();
  };

  const samples: Array<Omit<ItemInput, 'note'> & {
    note?: string;
    status?: ItemStatus;
    resolvedAt?: string;
  }> = [
    {
      name: 'Krema %35',
      category: 'Süt & Krema',
      quantity: 2,
      unit: 'litre',
      unitCost: 95,
      expiryDate: dateWithOffset(-1),
      note: 'Açılmamış, arka rafta.',
    },
    {
      name: 'Fesleğen',
      category: 'Sebze & Meyve',
      quantity: 0.5,
      unit: 'kg',
      unitCost: 140,
      expiryDate: dateWithOffset(0),
      note: 'Bugün pesto için kullanılmalı.',
    },
    {
      name: 'Mozzarella',
      category: 'Süt & Krema',
      quantity: 1,
      unit: 'kg',
      unitCost: 260,
      expiryDate: dateWithOffset(2),
    },
    {
      name: 'Füme somon',
      category: 'Et & Şarküteri',
      quantity: 1,
      unit: 'kg',
      unitCost: 690,
      expiryDate: dateWithOffset(5),
      note: 'Hafta sonu brunch menüsü.',
    },
    {
      name: 'Limon',
      category: 'Sebze & Meyve',
      quantity: 3,
      unit: 'kg',
      unitCost: 40,
      expiryDate: dateWithOffset(4),
    },
    {
      name: 'Taze kekik',
      category: 'Sebze & Meyve',
      quantity: 0.2,
      unit: 'kg',
      unitCost: 180,
      expiryDate: dateWithOffset(6),
    },
    {
      name: 'Filtre kahve çekirdeği',
      category: 'İçecek',
      quantity: 2,
      unit: 'kg',
      unitCost: 420,
      expiryDate: dateWithOffset(60),
      note: 'Yeni hasat.',
    },
    {
      name: 'Kaşar',
      category: 'Süt & Krema',
      quantity: 1,
      unit: 'kg',
      unitCost: 310,
      expiryDate: dateWithOffset(12),
    },
    {
      name: 'Croissant',
      category: 'Fırın',
      quantity: 10,
      unit: 'adet',
      unitCost: 22,
      expiryDate: dateWithOffset(-1),
      note: 'Sabah indirimiyle kurtarıldı.',
      status: 'rescued',
      resolvedAt: resolvedAt(1),
    },
    {
      name: 'Süt',
      category: 'Süt & Krema',
      quantity: 4,
      unit: 'litre',
      unitCost: 32,
      expiryDate: dateWithOffset(-3),
      note: 'Buzdolabı arızası.',
      status: 'wasted',
      resolvedAt: resolvedAt(2),
    },
  ];

  const insert = db.prepare(
    `INSERT INTO items
     (id, name, category, quantity, unit, unit_cost, expiry_date, note, status, created_at, updated_at, resolved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const today = new Date();
  const monthDate = (daysAgo: number) => {
    const day = Math.max(1, today.getDate() - daysAgo);
    return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(day)}`;
  };

  const transactionSamples: Array<Omit<TransactionInput, 'note' | 'documentNo'> & {
    documentNo?: string;
    note?: string;
  }> = [
    {
      type: 'income',
      category: 'Satış',
      amount: 18450,
      date: monthDate(0),
      description: 'Gün sonu satış',
      paymentMethod: 'Kart',
      documentNo: 'Z-1042',
      vatRate: 10,
    },
    {
      type: 'income',
      category: 'Satış',
      amount: 12780,
      date: monthDate(1),
      description: 'Gün sonu satış',
      paymentMethod: 'Nakit',
      documentNo: 'Z-1041',
      vatRate: 10,
    },
    {
      type: 'income',
      category: 'Etkinlik',
      amount: 4500,
      date: monthDate(6),
      description: 'Özel etkinlik ikramı',
      paymentMethod: 'Havale',
      documentNo: 'FTR-208',
      vatRate: 20,
    },
    {
      type: 'expense',
      category: 'Tedarik',
      amount: 1240,
      date: monthDate(2),
      description: 'Süt ve krema alımı',
      paymentMethod: 'Havale',
      documentNo: 'F-8821',
      vatRate: 10,
    },
    {
      type: 'expense',
      category: 'Tedarik',
      amount: 2100,
      date: monthDate(3),
      description: 'Kahve çekirdeği',
      paymentMethod: 'Kart',
      documentNo: 'F-8834',
      vatRate: 20,
    },
    {
      type: 'expense',
      category: 'Fatura',
      amount: 1850,
      date: monthDate(5),
      description: 'Elektrik faturası',
      paymentMethod: 'Havale',
      documentNo: 'ELK-102',
      vatRate: 20,
    },
    {
      type: 'expense',
      category: 'Kira',
      amount: 12000,
      date: monthDate(10),
      description: 'Aylık kira',
      paymentMethod: 'Havale',
      documentNo: 'KIRA-10',
      vatRate: 0,
    },
    {
      type: 'expense',
      category: 'Personel',
      amount: 1500,
      date: monthDate(4),
      description: 'Personel avansı',
      paymentMethod: 'Nakit',
      vatRate: 0,
    },
    {
      type: 'income',
      category: 'Satış',
      amount: 3200,
      date: monthDate(2),
      description: 'Telefonla ayrılan pasta siparişi',
      paymentMethod: 'Havale',
      vatRate: 10,
      sold: false,
      note: 'Teslim edilince “Satıldı” olarak işaretle.',
    },
  ];

  const insertTransaction = db.prepare(
    `INSERT INTO transactions
     (id, type, category, amount, date, description, payment_method, document_no, vat_rate, sold, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  db.exec('BEGIN');
  try {
    for (const sample of samples) {
      const id = `itm-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`;
      const createdAt = new Date(now.getTime() - 6 * 86_400_000).toISOString();
      insert.run(
        id,
        sample.name,
        sample.category,
        sample.quantity,
        sample.unit,
        sample.unitCost,
        sample.expiryDate,
        sample.note ?? null,
        sample.status ?? 'active',
        createdAt,
        sample.resolvedAt ?? createdAt,
        sample.resolvedAt ?? null,
      );
    }

    const transactionCount = Number(
      (db.prepare('SELECT COUNT(*) AS count FROM transactions').get() as { count: number })
        .count,
    );
    if (transactionCount === 0) {
      for (const sample of transactionSamples) {
        const id = `txn-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`;
        const createdAt = new Date(now.getTime() - 2 * 86_400_000).toISOString();
        insertTransaction.run(
          id,
          sample.type,
          sample.category,
          sample.amount,
          sample.date,
          sample.description,
          sample.paymentMethod,
          sample.documentNo?.trim() ? sample.documentNo.trim() : null,
          sample.vatRate,
          sample.type === 'income' ? (sample.sold === false ? 0 : 1) : 1,
          sample.note?.trim() ? sample.note.trim() : null,
          createdAt,
          createdAt,
        );
      }
    }

    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  return {
    inserted: samples.length,
    transactionsInserted: transactionSamples.length,
    skipped: false,
  };
}

export function resetItems(): number {
  const result = db.prepare('DELETE FROM items').run();
  return Number(result.changes);
}

export function getAllTransactions(filters?: {
  month?: string;
  type?: TransactionType | 'all';
  q?: string;
  category?: string;
}): Transaction[] {
  let transactions = (
    db
      .prepare('SELECT * FROM transactions ORDER BY date DESC, created_at DESC')
      .all() as TransactionRow[]
  ).map(toTransaction);

  if (filters?.month) {
    transactions = transactions.filter((transaction) => transaction.date.startsWith(filters.month!));
  }
  if (filters?.type && filters.type !== 'all') {
    transactions = transactions.filter((transaction) => transaction.type === filters.type);
  }
  if (filters?.category && filters.category !== 'all') {
    transactions = transactions.filter((transaction) => transaction.category === filters.category);
  }
  if (filters?.q?.trim()) {
    const needle = normalize(filters.q);
    transactions = transactions.filter((transaction) =>
      normalize(
        `${transaction.description} ${transaction.category} ${transaction.documentNo ?? ''} ${transaction.note ?? ''}`,
      ).includes(needle),
    );
  }

  return transactions;
}

export function getTransaction(id: string): Transaction | null {
  const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as
    | TransactionRow
    | undefined;
  return row ? toTransaction(row) : null;
}

export function createTransaction(input: TransactionInput): Transaction {
  const id = `txn-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`;
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO transactions
     (id, type, category, amount, date, description, payment_method, document_no, vat_rate, sold, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.type,
    input.category,
    input.amount,
    input.date,
    input.description,
    input.paymentMethod,
    input.documentNo?.trim() ? input.documentNo.trim() : null,
    input.vatRate,
    input.type === 'income' ? (input.sold === false ? 0 : 1) : 1,
    input.note?.trim() ? input.note.trim() : null,
    now,
    now,
  );
  return getTransaction(id)!;
}

export function updateTransaction(
  id: string,
  patch: Partial<TransactionInput>,
): Transaction | null {
  if (!getTransaction(id)) return null;

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (patch.type !== undefined) {
    fields.push('type = ?');
    values.push(patch.type);
  }
  if (patch.category !== undefined) {
    fields.push('category = ?');
    values.push(patch.category);
  }
  if (patch.amount !== undefined) {
    fields.push('amount = ?');
    values.push(patch.amount);
  }
  if (patch.date !== undefined) {
    fields.push('date = ?');
    values.push(patch.date);
  }
  if (patch.description !== undefined) {
    fields.push('description = ?');
    values.push(patch.description);
  }
  if (patch.paymentMethod !== undefined) {
    fields.push('payment_method = ?');
    values.push(patch.paymentMethod);
  }
  if (patch.documentNo !== undefined) {
    fields.push('document_no = ?');
    values.push(patch.documentNo?.trim() ? patch.documentNo.trim() : null);
  }
  if (patch.vatRate !== undefined) {
    fields.push('vat_rate = ?');
    values.push(patch.vatRate);
  }
  if (patch.sold !== undefined) {
    fields.push('sold = ?');
    values.push(patch.sold ? 1 : 0);
  }
  if (patch.note !== undefined) {
    fields.push('note = ?');
    values.push(patch.note?.trim() ? patch.note.trim() : null);
  }

  if (fields.length > 0) {
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    db.prepare(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`).run(...values, id);
  }
  return getTransaction(id);
}

export function deleteTransaction(id: string): boolean {
  const result = db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
  return Number(result.changes) > 0;
}

export function resetTransactions(): number {
  const result = db.prepare('DELETE FROM transactions').run();
  return Number(result.changes);
}

export function getAccounting(month = currentMonth()): AccountingData {
  const transactions = getAllTransactions({ month });
  const income = transactions.filter((transaction) => transaction.type === 'income');
  const soldIncome = income.filter((transaction) => transaction.sold);
  const pendingIncome = income.filter((transaction) => !transaction.sold);
  const expense = transactions.filter((transaction) => transaction.type === 'expense');

  const incomeTotal = round(
    soldIncome.reduce((sum, transaction) => sum + transaction.amount, 0),
  );
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
    getAllTransactions().reduce((sum, transaction) => {
      if (transaction.type === 'expense') return sum - transaction.amount;
      return transaction.sold ? sum + transaction.amount : sum;
    }, 0),
  );

  return {
    month,
    summary: {
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
    },
    transactions,
    categories: {
      income: INCOME_CATEGORIES,
      expense: EXPENSE_CATEGORIES,
    },
    paymentMethods: PAYMENT_METHODS,
    vatRates: VAT_RATES,
    generatedAt: new Date().toISOString(),
  };
}

export function transactionsToCsv(month = currentMonth()): string {
  const transactions = getAllTransactions({ month });
  const header = [
    'Tarih',
    'Tür',
    'Satış Durumu',
    'Kategori',
    'Açıklama',
    'Ödeme',
    'Belge No',
    'Tutar (TL)',
    'KDV Oranı',
    'KDV (TL)',
    'Not',
  ];
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const money = (value: number) => value.toFixed(2).replace('.', ',');
  const typeLabel = { income: 'Gelir', expense: 'Gider' } as const;

  const lines = [
    header.map(escape).join(';'),
    ...transactions.map((transaction) =>
      [
        escape(transaction.date),
        escape(typeLabel[transaction.type]),
        escape(
          transaction.type === 'income'
            ? transaction.sold
              ? 'Satıldı'
              : 'Satılmadı'
            : '—',
        ),
        escape(transaction.category),
        escape(transaction.description),
        escape(transaction.paymentMethod),
        escape(transaction.documentNo ?? ''),
        escape(money(transaction.amount)),
        escape(`%${transaction.vatRate}`),
        escape(
          transaction.type === 'income' && !transaction.sold
            ? '0,00'
            : money(vatOf(transaction.amount, transaction.vatRate)),
        ),
        escape(transaction.note ?? ''),
      ].join(';'),
    ),
  ];

  return `\uFEFF${lines.join('\r\n')}`;
}

const trMap: Record<string, string> = {
  ı: 'i',
  İ: 'i',
  I: 'i',
  ş: 's',
  Ş: 's',
  ğ: 'g',
  Ğ: 'g',
  ç: 'c',
  Ç: 'c',
  ö: 'o',
  Ö: 'o',
  ü: 'u',
  Ü: 'u',
};

export function normalize(value: string): string {
  return value
    .replace(/[ıİIşŞğĞçÇöÖüÜ]/g, (char) => trMap[char] ?? char)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const statusLabel: Record<ItemStatus, string> = {
  active: 'Rafta',
  rescued: 'Kurtarıldı',
  wasted: 'Fire',
};

export function itemsToCsv(): string {
  const rows = getAllItems();
  const header = [
    'Ürün',
    'Kategori',
    'Miktar',
    'Birim',
    'Birim Maliyet (TL)',
    'Toplam Değer (TL)',
    'Son Kullanma',
    'Durum',
    'Not',
  ];
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const money = (value: number) => value.toFixed(2).replace('.', ',');

  const lines = [
    header.map(escape).join(';'),
    ...rows.map((item) =>
      [
        escape(item.name),
        escape(item.category),
        escape(item.quantity),
        escape(item.unit),
        escape(money(item.unitCost)),
        escape(money(itemValue(item))),
        escape(item.expiryDate),
        escape(statusLabel[item.status]),
        escape(item.note ?? ''),
      ].join(';'),
    ),
  ];

  return `\uFEFF${lines.join('\r\n')}`;
}
