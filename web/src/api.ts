import type {
  AccountingData,
  Dashboard,
  Item,
  ItemInput,
  ItemStatus,
  Transaction,
  TransactionInput,
} from './types';
import { ApiError } from './errors';
import { downloadBlob } from './download';
import { localApi } from './localApi';

export { ApiError, errorMessage } from './errors';

export const isStaticMode = import.meta.env.VITE_STATIC_MODE === 'true';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'API sunucusuna ulaşılamadı. API çalışıyor mu?',
    );
  }

  if (response.status === 204) return undefined as T;

  const raw = await response.text();
  let payload: unknown = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const envelope = payload as
      | { error?: { code?: string; message?: string; field?: string } }
      | null;
    throw new ApiError(
      response.status,
      envelope?.error?.code ?? 'HTTP_ERROR',
      envelope?.error?.message ?? `İstek başarısız oldu (${response.status}).`,
      envelope?.error?.field,
    );
  }

  return payload as T;
}

async function downloadRemoteCsv(path: string, filename: string) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new ApiError(response.status, 'HTTP_ERROR', 'CSV indirilemedi.');
  }
  downloadBlob(filename, await response.blob());
}

export type DemoResult = {
  inserted: number;
  transactionsInserted: number;
  skipped: boolean;
  message?: string;
};

export type ApiClient = {
  getDashboard(): Promise<Dashboard>;
  getAccounting(month: string): Promise<AccountingData>;
  createItem(input: ItemInput): Promise<Item>;
  updateItem(id: string, input: Partial<ItemInput>): Promise<Item>;
  deleteItem(id: string): Promise<void>;
  resolveItem(id: string, outcome: Exclude<ItemStatus, 'active'>): Promise<Item>;
  reopenItem(id: string): Promise<Item>;
  createTransaction(input: TransactionInput): Promise<Transaction>;
  updateTransaction(id: string, input: Partial<TransactionInput>): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;
  loadDemo(): Promise<DemoResult>;
  downloadItemsCsv(): Promise<void>;
  downloadTransactionsCsv(month: string): Promise<void>;
};

const remoteApi: ApiClient = {
  getDashboard: () => request<Dashboard>('/api/dashboard'),

  createItem: (input) =>
    request<Item>('/api/items', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updateItem: (id, input) =>
    request<Item>(`/api/items/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  deleteItem: (id) =>
    request<void>(`/api/items/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  resolveItem: (id, outcome) =>
    request<Item>(
      `/api/items/${encodeURIComponent(id)}/${outcome === 'rescued' ? 'rescue' : 'waste'}`,
      { method: 'POST' },
    ),

  reopenItem: (id) =>
    request<Item>(`/api/items/${encodeURIComponent(id)}/reopen`, { method: 'POST' }),

  loadDemo: () => request<DemoResult>('/api/demo', { method: 'POST' }),

  getAccounting: (month) =>
    request<AccountingData>(`/api/accounting?month=${encodeURIComponent(month)}`),

  createTransaction: (input) =>
    request<Transaction>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updateTransaction: (id, input) =>
    request<Transaction>(`/api/transactions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  deleteTransaction: (id) =>
    request<void>(`/api/transactions/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  downloadItemsCsv: () => downloadRemoteCsv('/api/items/export.csv', 'rafradar-urunler.csv'),

  downloadTransactionsCsv: (month) =>
    downloadRemoteCsv(
      `/api/transactions/export.csv?month=${encodeURIComponent(month)}`,
      `rafradar-kasa-${month}.csv`,
    ),
};

export const api: ApiClient = isStaticMode ? localApi : remoteApi;
