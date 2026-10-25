import type { Category, Item, ItemStatus } from './types';

export function normalize(value: string): string {
  const map: Record<string, string> = {
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
  return value
    .replace(/[ıİIşŞğĞçÇöÖüÜ]/g, (char) => map[char] ?? char)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function formatMoney(value: number): string {
  const fractionDigits = Number.isInteger(value) ? 0 : 2;
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatDate(value: string, withYear = false): string {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return value;
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    ...(withYear || !sameYear ? { year: 'numeric' } : {}),
  }).format(date);
}

export function daysLeft(expiryDate: string): number {
  const [year, month, day] = expiryDate.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export type ExpiryTone = 'expired' | 'today' | 'soon' | 'safe';

export function expiryInfo(expiryDate: string): {
  days: number;
  label: string;
  tone: ExpiryTone;
} {
  const days = daysLeft(expiryDate);
  if (days < 0) {
    const abs = Math.abs(days);
    return {
      days,
      label: abs === 1 ? 'Dün doldu' : `${abs} gün önce doldu`,
      tone: 'expired',
    };
  }
  if (days === 0) return { days, label: 'Bugün doluyor', tone: 'today' };
  if (days === 1) return { days, label: 'Yarın doluyor', tone: 'soon' };
  if (days <= 7) return { days, label: `${days} gün kaldı`, tone: 'soon' };
  return { days, label: formatDate(expiryDate), tone: 'safe' };
}

export const itemValue = (item: Pick<Item, 'quantity' | 'unitCost'>) =>
  Math.round(item.quantity * item.unitCost * 100) / 100;

export const statusLabel: Record<ItemStatus, string> = {
  active: 'Rafta',
  rescued: 'Kurtarıldı',
  wasted: 'Fire',
};

export function categoryClass(category: Category): string {
  const map: Record<Category, string> = {
    'Süt & Krema': 'cat-dairy',
    'Et & Şarküteri': 'cat-meat',
    'Sebze & Meyve': 'cat-produce',
    'Fırın': 'cat-bakery',
    'İçecek': 'cat-drink',
    'Diğer': 'cat-other',
  };
  return map[category];
}

export function todayLong(): string {
  return new Intl.DateTimeFormat('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
}

export function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
