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
`);

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

  return {
    summary,
    attention,
    recent,
    items,
    generatedAt: new Date().toISOString(),
  };
}

export function loadDemo(): { inserted: number; skipped: boolean } {
  const count = Number(
    (db.prepare('SELECT COUNT(*) AS count FROM items').get() as { count: number }).count,
  );
  if (count > 0) return { inserted: 0, skipped: true };

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
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  return { inserted: samples.length, skipped: false };
}

export function resetItems(): number {
  const result = db.prepare('DELETE FROM items').run();
  return Number(result.changes);
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
