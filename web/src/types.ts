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

export type Dashboard = {
  summary: Summary;
  attention: Item[];
  recent: Item[];
  items: Item[];
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
