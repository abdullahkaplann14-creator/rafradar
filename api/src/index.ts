import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import { z } from 'zod';
import {
  CATEGORIES,
  UNITS,
  createItem,
  deleteItem,
  getDashboard,
  getAllItems,
  getItem,
  itemsToCsv,
  loadDemo,
  reopenItem,
  resolveItem,
  updateItem,
  type Category,
  type ItemInput,
  type ItemStatus,
  type Unit,
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

const firstIssue = (error: z.ZodError) => error.issues[0];

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', product: 'RafRadar' });
});

app.get('/api/dashboard', (_req, res) => {
  res.json(getDashboard());
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
