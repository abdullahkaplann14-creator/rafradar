import type {
  AccountingData,
  Dashboard,
  Item,
  ItemInput,
  ItemStatus,
  Transaction,
  TransactionInput,
} from './types';

export class ApiError extends Error {
  status: number;
  code: string;
  field?: string;

  constructor(status: number, code: string, message: string, field?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.field = field;
  }
}

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

export const api = {
  getDashboard: () => request<Dashboard>('/api/dashboard'),

  createItem: (input: ItemInput) =>
    request<Item>('/api/items', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updateItem: (id: string, input: Partial<ItemInput>) =>
    request<Item>(`/api/items/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  deleteItem: (id: string) =>
    request<void>(`/api/items/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  resolveItem: (id: string, outcome: Exclude<ItemStatus, 'active'>) =>
    request<Item>(`/api/items/${encodeURIComponent(id)}/${outcome === 'rescued' ? 'rescue' : 'waste'}`, {
      method: 'POST',
    }),

  reopenItem: (id: string) =>
    request<Item>(`/api/items/${encodeURIComponent(id)}/reopen`, { method: 'POST' }),

  loadDemo: () =>
    request<{ inserted: number; transactionsInserted: number; skipped: boolean; message?: string }>(
      '/api/demo',
      {
        method: 'POST',
      },
    ),

  getAccounting: (month: string) =>
    request<AccountingData>(`/api/accounting?month=${encodeURIComponent(month)}`),

  createTransaction: (input: TransactionInput) =>
    request<Transaction>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updateTransaction: (id: string, input: Partial<TransactionInput>) =>
    request<Transaction>(`/api/transactions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  deleteTransaction: (id: string) =>
    request<void>(`/api/transactions/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  transactionCsvUrl: (month: string) =>
    `/api/transactions/export.csv?month=${encodeURIComponent(month)}`,

  exportCsvUrl: '/api/items/export.csv',
};

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Beklenmeyen bir hata oluştu.';
}
