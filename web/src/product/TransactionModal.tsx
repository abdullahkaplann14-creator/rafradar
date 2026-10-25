import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Check, Receipt, Trash2, X } from 'lucide-react';
import { ApiError } from '../api';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  VAT_RATES,
  type PaymentMethod,
  type Transaction,
  type TransactionInput,
  type TransactionType,
  type VatRate,
} from '../types';
import { formatMoney, monthLabel, vatOf } from '../utils';

type FieldErrors = Partial<
  Record<'amount' | 'date' | 'description' | 'category' | 'note', string>
>;

type TransactionModalProps = {
  transaction?: Transaction;
  month: string;
  onClose: () => void;
  onCreate: (input: TransactionInput) => Promise<void>;
  onUpdate: (id: string, input: Partial<TransactionInput>) => Promise<void>;
  onDelete: (id: string, description: string) => Promise<void>;
};

const parseNumber = (value: string) => Number(value.replace(',', '.'));

const todayDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
};

const isValidDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export function TransactionModal({
  transaction,
  month,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: TransactionModalProps) {
  const editing = Boolean(transaction);
  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'expense');
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '');
  const [date, setDate] = useState(transaction?.date ?? todayDate());
  const [description, setDescription] = useState(transaction?.description ?? '');
  const [category, setCategory] = useState(
    transaction?.category ?? EXPENSE_CATEGORIES[0],
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    transaction?.paymentMethod ?? 'Nakit',
  );
  const [documentNo, setDocumentNo] = useState(transaction?.documentNo ?? '');
  const [vatRate, setVatRate] = useState<VatRate>(transaction?.vatRate ?? 0);
  const [note, setNote] = useState(transaction?.note ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    if (!(categories as readonly string[]).includes(category)) setCategory(categories[0]);
  }, [categories, category]);

  const numericAmount = useMemo(() => {
    const value = parseNumber(amount);
    return Number.isFinite(value) ? value : 0;
  }, [amount]);
  const vatAmount = useMemo(() => vatOf(numericAmount, vatRate), [numericAmount, vatRate]);

  const switchType = (next: TransactionType) => {
    if (next === type) return;
    setType(next);
    setCategory(next === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  };

  const validate = () => {
    const next: FieldErrors = {};
    if (!amount.trim() || !Number.isFinite(parseNumber(amount)) || parseNumber(amount) <= 0) {
      next.amount = 'Tutar 0’dan büyük olmalı.';
    }
    if (!isValidDate(date)) next.date = 'Geçerli bir tarih seç.';
    if (description.trim().length < 2) next.description = 'En az 2 karakterlik bir açıklama yaz.';
    if (!(categories as readonly string[]).includes(category)) {
      next.category = 'Bu tür için bir kategori seç.';
    }
    if (note.length > 300) next.note = 'Not en fazla 300 karakter olabilir.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (saving || deleting || !validate()) return;

    const input: TransactionInput = {
      type,
      category,
      amount: parseNumber(amount),
      date,
      description: description.trim(),
      paymentMethod,
      documentNo: documentNo.trim() || null,
      vatRate,
      note: note.trim() || null,
    };

    setSaving(true);
    setErrors({});
    try {
      if (transaction) await onUpdate(transaction.id, input);
      else await onCreate(input);
    } catch (error) {
      if (error instanceof ApiError && error.field) {
        setErrors({ [error.field]: error.message } as FieldErrors);
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!transaction || deleting) return;
    setDeleting(true);
    try {
      await onDelete(transaction.id, transaction.description);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="item-modal"
        role="dialog"
        aria-modal="true"
        aria-label={editing ? 'Kasa kaydını düzenle' : 'Yeni kasa kaydı'}
      >
        <header className="item-modal-head">
          <div>
            <p className="panel-kicker">{editing ? 'KASA KAYDI' : 'YENİ KAYIT'}</p>
            <h2>{editing ? 'İşlemi düzenle' : 'Kasaya bir işlem ekle'}</h2>
            <p className="item-modal-sub">
              {monthLabel(month)} dönemine işlenecek. Gelir ve gideri ayrı tut; net sonuç anında görünsün.
            </p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Kapat">
            <X size={19} />
          </button>
        </header>

        <form className="item-form" onSubmit={submit} noValidate>
          <div className="txn-type-toggle" role="group" aria-label="İşlem türü">
            <button
              type="button"
              className={`txn-type txn-type--income ${type === 'income' ? 'is-active' : ''}`}
              onClick={() => switchType('income')}
            >
              Gelir
            </button>
            <button
              type="button"
              className={`txn-type txn-type--expense ${
                type === 'expense' ? 'is-active' : ''
              }`}
              onClick={() => switchType('expense')}
            >
              Gider
            </button>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="txn-amount">Tutar</label>
              <div className={`input-prefix ${errors.amount ? 'has-error' : ''}`}>
                <span>₺</span>
                <input
                  id="txn-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0"
                  inputMode="decimal"
                  autoFocus
                />
              </div>
              {errors.amount ? <span className="field-error">{errors.amount}</span> : null}
            </div>
            <div className="field">
              <label htmlFor="txn-date">Tarih</label>
              <input
                id="txn-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={errors.date ? 'has-error' : ''}
              />
              {errors.date ? <span className="field-error">{errors.date}</span> : null}
            </div>
          </div>

          <div className="field">
            <label htmlFor="txn-description">Açıklama</label>
            <input
              id="txn-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={type === 'income' ? 'örn. Gün sonu satış' : 'örn. Süt ve krema alımı'}
              maxLength={120}
              className={errors.description ? 'has-error' : ''}
            />
            {errors.description ? (
              <span className="field-error">{errors.description}</span>
            ) : null}
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="txn-category">Kategori</label>
              <select
                id="txn-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categories.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="txn-payment">Ödeme yöntemi</label>
              <select
                id="txn-payment"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
              >
                {PAYMENT_METHODS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="txn-document">
                Belge no <span className="field-optional">(opsiyonel)</span>
              </label>
              <input
                id="txn-document"
                value={documentNo}
                onChange={(event) => setDocumentNo(event.target.value)}
                placeholder="Fiş / fatura no"
                maxLength={40}
              />
            </div>
            <div className="field">
              <label htmlFor="txn-vat">KDV oranı</label>
              <select
                id="txn-vat"
                value={vatRate}
                onChange={(event) => setVatRate(Number(event.target.value) as VatRate)}
              >
                {VAT_RATES.map((rate) => (
                  <option key={rate} value={rate}>
                    %{rate} (fiyata dahil)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="txn-note">
              Not <span className="field-optional">(opsiyonel)</span>
            </label>
            <textarea
              id="txn-note"
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Kim ödedi, hangi banka, ek bilgi…"
              maxLength={300}
            />
          </div>

          <div className="txn-preview">
            <span className="txn-preview-icon">
              <Receipt size={16} />
            </span>
            <div>
              <span>KDV dahil tutar</span>
              <strong>{formatMoney(numericAmount)}</strong>
            </div>
            <div>
              <span>İçindeki KDV</span>
              <strong>{formatMoney(vatAmount)}</strong>
            </div>
            <span className={`txn-preview-badge txn-preview-badge--${type}`}>
              {type === 'income' ? 'Gelir' : 'Gider'}
            </span>
          </div>

          <footer className="item-modal-foot">
            <div className="delete-zone">
              {editing ? (
                confirmDelete ? (
                  <div className="delete-confirm">
                    <span>Kayıt silinsin mi?</span>
                    <button
                      type="button"
                      className="mini-button mini-button--danger-solid"
                      onClick={remove}
                      disabled={deleting}
                    >
                      {deleting ? 'Siliniyor…' : 'Evet, sil'}
                    </button>
                    <button
                      type="button"
                      className="mini-button"
                      onClick={() => setConfirmDelete(false)}
                      disabled={deleting}
                    >
                      Vazgeç
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="text-button text-button--danger"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 size={14} />
                    Kaydı sil
                  </button>
                )
              ) : (
                <span className="foot-hint">Enter ile kaydet · Esc ile kapat</span>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="button button--ghost" onClick={onClose}>
                Vazgeç
              </button>
              <button type="submit" className="button button--primary" disabled={saving || deleting}>
                <Check size={15} />
                {saving ? 'Kaydediliyor…' : editing ? 'Değişiklikleri kaydet' : 'Kaydı ekle'}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
