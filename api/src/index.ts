import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import { z } from 'zod';
import {
  CATEGORIES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  UNITS,
  VAT_RATES,
  createItem,
  createTransaction,
  currentMonth,
  deleteItem,
  deleteTransaction,
  getAccounting,
  getDashboard,
  getAllItems,
  getAllTransactions,
  getItem,
  getTransaction,
  itemsToCsv,
  loadDemo,
  reopenItem,
  resolveItem,
  transactionsToCsv,
  updateItem,
  updateTransaction,
  type Category,
  type ItemInput,
  type ItemStatus,
  type PaymentMethod,
  type TransactionInput,
  type TransactionType,
  type Unit,
  type VatRate,
} from './db.js';
import { API_PORT } from './env.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const fail = (
  res: Response,
  status: number,
  code: string,
  message: string,
  field?: string,
) => res.status(status).json({ error: { code, message, ...(field ? { field } : {}) } });

const categorySchema = z.enum([...CATEGORIES] as [Category, ...Category[]]);
const unitSchema = z.enum([...UNITS] as [Unit, ...Unit[]]);

const isValidDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

const itemSchema = z.object({
  name: z
    .string({ required_error: 'Ürün adı zorunlu' })
    .trim()
    .min(2, 'Ürün adı en az 2 karakter olmalı')
    .max(80, 'Ürün adı en fazla 80 karakter olabilir'),
  category: categorySchema,
  quantity: z
    .number({ required_error: 'Miktar zorunlu', invalid_type_error: 'Miktar sayı olmalı' })
    .finite()
    .positive('Miktar 0’dan büyük olmalı')
    .max(100000, 'Miktar çok büyük'),
  unit: unitSchema,
  unitCost: z
    .number({ required_error: 'Birim maliyet zorunlu', invalid_type_error: 'Maliyet sayı olmalı' })
    .finite()
    .min(0, 'Maliyet negatif olamaz')
    .max(1000000, 'Maliyet çok büyük'),
  expiryDate: z
    .string({ required_error: 'Son kullanma tarihi zorunlu' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçerli bir tarih seç (YYYY-AA-GG)')
    .refine(isValidDate, 'Takvimde olmayan bir tarih girdin'),
  note: z.string().trim().max(300, 'Not en fazla 300 karakter olabilir').optional().nullable(),
});

const patchSchema = itemSchema.partial();

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Ay YYYY-AA biçiminde olmalı');

const transactionSchema = z.object({
  type: z.enum(['income', 'expense'], {
    required_error: 'İşlem türü zorunlu',
    invalid_type_error: 'İşlem türü gelir veya gider olmalı',
  }),
  category: z
    .string({ required_error: 'Kategori zorunlu' })
    .trim()
    .min(1, 'Kategori zorunlu')
    .max(40, 'Kategori çok uzun'),
  amount: z
    .number({ required_error: 'Tutar zorunlu', invalid_type_error: 'Tutar sayı olmalı' })
    .finite()
    .positive('Tutar 0’dan büyük olmalı')
    .max(10_000_000, 'Tutar çok büyük'),
  date: z
    .string({ required_error: 'Tarih zorunlu' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçerli bir tarih seç')
    .refine(isValidDate, 'Takvimde olmayan bir tarih girdin'),
  description: z
    .string({ required_error: 'Açıklama zorunlu' })
    .trim()
    .min(2, 'Açıklama en az 2 karakter olmalı')
    .max(120, 'Açıklama en fazla 120 karakter olabilir'),
  paymentMethod: z.enum([...PAYMENT_METHODS] as [PaymentMethod, ...PaymentMethod[]]),
  documentNo: z.string().trim().max(40, 'Belge no çok uzun').optional().nullable(),
  vatRate: z
    .number()
    .int()
    .refine((value) => (VAT_RATES as readonly number[]).includes(value), 'Geçerli KDV oranı seç')
    .transform((value) => value as VatRate),
  sold: z.boolean({ invalid_type_error: 'Satış durumu doğru/yanlış olmalı' }).optional(),
  note: z.string().trim().max(300, 'Not en fazla 300 karakter olabilir').optional().nullable(),
});

const transactionPatchSchema = transactionSchema.partial();

const categoryForType = (type: TransactionType): readonly string[] =>
  type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

const firstIssue = (error: z.ZodError) => error.issues[0];

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', product: 'RafRadar' });
});

app.get('/api/dashboard', (_req, res) => {
  res.json(getDashboard());
});

// ——— Kasa / muhasebe ———
app.get('/api/accounting', (req, res) => {
  const month = typeof req.query.month === 'string' ? req.query.month : currentMonth();
  if (!monthSchema.safeParse(month).success) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Ay YYYY-AA biçiminde olmalı', 'month');
  }
  res.json(getAccounting(month));
});

app.get('/api/transactions/export.csv', (req, res) => {
  const month = typeof req.query.month === 'string' ? req.query.month : currentMonth();
  if (!monthSchema.safeParse(month).success) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Ay YYYY-AA biçiminde olmalı', 'month');
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="rafradar-kasa-${month}.csv"`);
  res.send(transactionsToCsv(month));
});

app.get('/api/transactions', (req, res) => {
  const month = typeof req.query.month === 'string' ? req.query.month : undefined;
  if (month && !monthSchema.safeParse(month).success) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Ay YYYY-AA biçiminde olmalı', 'month');
  }
  const type = typeof req.query.type === 'string' ? req.query.type : 'all';
  if (!['all', 'income', 'expense'].includes(type)) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Geçersiz işlem türü', 'type');
  }
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  const category = typeof req.query.category === 'string' ? req.query.category : 'all';
  res.json({
    transactions: getAllTransactions({
      month,
      type: type as TransactionType | 'all',
      q,
      category,
    }),
  });
});

app.get('/api/transactions/:id', (req, res) => {
  const transaction = getTransaction(req.params.id);
  if (!transaction) return fail(res, 404, 'NOT_FOUND', 'Kasa kaydı bulunamadı');
  res.json(transaction);
});

app.post('/api/transactions', (req, res) => {
  const parsed = transactionSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    const issue = firstIssue(parsed.error);
    return fail(
      res,
      400,
      'VALIDATION_ERROR',
      issue?.message ?? 'Geçersiz kasa kaydı',
      issue?.path?.join('.'),
    );
  }
  if (!categoryForType(parsed.data.type).includes(parsed.data.category)) {
    return fail(
      res,
      400,
      'VALIDATION_ERROR',
      parsed.data.type === 'income'
        ? 'Gelir için geçerli bir kategori seç'
        : 'Gider için geçerli bir kategori seç',
      'category',
    );
  }
  const input = {
    ...parsed.data,
    sold: parsed.data.type === 'income' ? parsed.data.sold !== false : true,
  } as TransactionInput;
  const transaction = createTransaction(input);
  res.status(201).json(transaction);
});

app.patch('/api/transactions/:id', (req, res) => {
  const existing = getTransaction(req.params.id);
  if (!existing) return fail(res, 404, 'NOT_FOUND', 'Kasa kaydı bulunamadı');

  const parsed = transactionPatchSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    const issue = firstIssue(parsed.error);
    return fail(
      res,
      400,
      'VALIDATION_ERROR',
      issue?.message ?? 'Geçersiz kasa kaydı',
      issue?.path?.join('.'),
    );
  }
  if (Object.keys(parsed.data).length === 0) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Değiştirilecek alan gönderilmedi');
  }

  const nextType = (parsed.data.type ?? existing.type) as TransactionType;
  const nextCategory = parsed.data.category ?? existing.category;
  if (!categoryForType(nextType).includes(nextCategory)) {
    return fail(
      res,
      400,
      'VALIDATION_ERROR',
      nextType === 'income'
        ? 'Gelir için geçerli bir kategori seç'
        : 'Gider için geçerli bir kategori seç',
      'category',
    );
  }

  const patch = { ...parsed.data } as Partial<TransactionInput>;
  if (nextType === 'expense') patch.sold = true;
  else if (patch.sold === undefined && existing.type !== 'income') patch.sold = true;

  const transaction = updateTransaction(req.params.id, patch);
  if (!transaction) return fail(res, 404, 'NOT_FOUND', 'Kasa kaydı bulunamadı');
  res.json(transaction);
});

app.delete('/api/transactions/:id', (req, res) => {
  if (!deleteTransaction(req.params.id)) {
    return fail(res, 404, 'NOT_FOUND', 'Kasa kaydı bulunamadı');
  }
  res.status(204).end();
});

app.get('/api/items/export.csv', (_req, res) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="rafradar-urunler.csv"');
  res.send(itemsToCsv());
});

app.get('/api/items', (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : 'all';
  const allowed: Array<ItemStatus | 'all'> = ['all', 'active', 'rescued', 'wasted'];
  if (!allowed.includes(status as ItemStatus | 'all')) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Geçersiz durum filtresi', 'status');
  }
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  const category = typeof req.query.category === 'string' ? req.query.category : 'all';
  res.json({
    items: getAllItems({
      status: status as ItemStatus | 'all',
      q,
      category,
    }),
  });
});

app.get('/api/items/:id', (req, res) => {
  const item = getItem(req.params.id);
  if (!item) return fail(res, 404, 'NOT_FOUND', 'Ürün bulunamadı');
  res.json(item);
});

app.post('/api/items', (req, res) => {
  const parsed = itemSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    const issue = firstIssue(parsed.error);
    return fail(
      res,
      400,
      'VALIDATION_ERROR',
      issue?.message ?? 'Geçersiz ürün bilgisi',
      issue?.path?.join('.'),
    );
  }
  try {
    const item = createItem(parsed.data as ItemInput);
    res.status(201).json(item);
  } catch (error) {
    console.error('[api] ürün eklenemedi:', error);
    fail(res, 500, 'INTERNAL_ERROR', 'Ürün kaydedilemedi');
  }
});

app.patch('/api/items/:id', (req, res) => {
  if (!getItem(req.params.id)) return fail(res, 404, 'NOT_FOUND', 'Ürün bulunamadı');
  const parsed = patchSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    const issue = firstIssue(parsed.error);
    return fail(
      res,
      400,
      'VALIDATION_ERROR',
      issue?.message ?? 'Geçersiz ürün bilgisi',
      issue?.path?.join('.'),
    );
  }
  if (Object.keys(parsed.data).length === 0) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Değiştirilecek alan gönderilmedi');
  }
  const item = updateItem(req.params.id, parsed.data as Partial<ItemInput>);
  if (!item) return fail(res, 404, 'NOT_FOUND', 'Ürün bulunamadı');
  res.json(item);
});

app.delete('/api/items/:id', (req, res) => {
  if (!deleteItem(req.params.id)) return fail(res, 404, 'NOT_FOUND', 'Ürün bulunamadı');
  res.status(204).end();
});

app.post('/api/items/:id/rescue', (req, res) => {
  const item = resolveItem(req.params.id, 'rescued');
  if (!item) return fail(res, 404, 'NOT_FOUND', 'Ürün bulunamadı');
  res.json(item);
});

app.post('/api/items/:id/waste', (req, res) => {
  const item = resolveItem(req.params.id, 'wasted');
  if (!item) return fail(res, 404, 'NOT_FOUND', 'Ürün bulunamadı');
  res.json(item);
});

app.post('/api/items/:id/reopen', (req, res) => {
  const item = reopenItem(req.params.id);
  if (!item) return fail(res, 404, 'NOT_FOUND', 'Ürün bulunamadı');
  res.json(item);
});

app.post('/api/demo', (_req, res) => {
  const result = loadDemo();
  if (result.skipped) {
    return res.json({
      ...result,
      skipped: true,
      message: 'Demo verisi yalnızca boş panoya yüklenebilir.',
    });
  }
  res.status(201).json(result);
});

app.use('/api', (_req, res) => {
  fail(res, 404, 'NOT_FOUND', 'Uç nokta bulunamadı');
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof SyntaxError) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Geçersiz JSON gövdesi');
  }
  console.error('[api] beklenmeyen hata:', error);
  fail(res, 500, 'INTERNAL_ERROR', 'Beklenmeyen bir hata oluştu');
});

app.listen(API_PORT, () => {
  console.log(`[api] RafRadar API hazır → http://localhost:${API_PORT}`);
});
