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
  categories: { income: readonly string[]; expense: readonly string[] };
  paymentMethods: readonly string[];
  vatRates: readonly number[];
  generatedAt: string;
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

export type ItemInput = {
  name: string;
  category: Category;
  quantity: number;
  unit: Unit;
  unitCost: number;
  expiryDate: string;
  note?: string | null;
};
