import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, Check, RotateCcw, Trash2, X } from 'lucide-react';
import { ApiError } from '../api';
import { CATEGORIES, UNITS, type Category, type Item, type ItemInput, type Unit } from '../types';
import { formatMoney, itemValue, statusLabel } from '../utils';

type FieldErrors = Partial<
  Record<'name' | 'quantity' | 'unitCost' | 'expiryDate' | 'note', string>
>;

type ItemModalProps = {
  item?: Item;
  onClose: () => void;
  onCreate: (input: ItemInput) => Promise<void>;
  onUpdate: (id: string, input: Partial<ItemInput>) => Promise<void>;
  onDelete: (id: string, name: string) => Promise<void>;
  onReopen: (id: string, name: string) => Promise<void>;
};

const parseNumber = (value: string) => Number(value.replace(',', '.'));

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

export function ItemModal({
  item,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onReopen,
}: ItemModalProps) {
  const editing = Boolean(item);
  const [name, setName] = useState(item?.name ?? '');
  const [category, setCategory] = useState<Category>(item?.category ?? 'Süt & Krema');
  const [quantity, setQuantity] = useState(item ? String(item.quantity) : '1');
  const [unit, setUnit] = useState<Unit>(item?.unit ?? 'adet');
  const [unitCost, setUnitCost] = useState(item ? String(item.unitCost) : '');
  const [expiryDate, setExpiryDate] = useState(item?.expiryDate ?? '');
  const [note, setNote] = useState(item?.note ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const estimate = useMemo(() => {
    const q = parseNumber(quantity);
    const c = parseNumber(unitCost);
    if (!Number.isFinite(q) || !Number.isFinite(c) || q <= 0 || c < 0) return 0;
    return Math.round(q * c * 100) / 100;
  }, [quantity, unitCost]);

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (name.trim().length < 2) next.name = 'Ürün adı en az 2 karakter olmalı.';
    if (name.trim().length > 80) next.name = 'Ürün adı en fazla 80 karakter olabilir.';
    const q = parseNumber(quantity);
    if (!quantity.trim() || !Number.isFinite(q) || q <= 0) {
      next.quantity = 'Miktar 0’dan büyük bir sayı olmalı.';
    }
    const c = parseNumber(unitCost);
    if (!unitCost.trim() || !Number.isFinite(c) || c < 0) {
      next.unitCost = 'Birim maliyet 0 veya daha büyük olmalı.';
    }
    if (!isValidDate(expiryDate)) next.expiryDate = 'Geçerli bir son kullanma tarihi seç.';
    if (note.length > 300) next.note = 'Not en fazla 300 karakter olabilir.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (saving || deleting) return;
    if (!validate()) return;

    const input: ItemInput = {
      name: name.trim(),
      category,
      quantity: parseNumber(quantity),
      unit,
      unitCost: parseNumber(unitCost),
      expiryDate,
      note: note.trim() ? note.trim() : null,
    };

    setSaving(true);
    setErrors({});
    try {
      if (item) await onUpdate(item.id, input);
      else await onCreate(input);
    } catch (error) {
      if (error instanceof ApiError && error.field) {
        setErrors({ [error.field]: error.message });
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!item || deleting) return;
    setDeleting(true);
    try {
      await onDelete(item.id, item.name);
    } catch {
      setDeleting(false);
    }
  };

  const reopen = async () => {
    if (!item || saving) return;
    setSaving(true);
    try {
      await onReopen(item.id, item.name);
    } catch {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="item-modal" role="dialog" aria-modal="true" aria-label={editing ? 'Ürünü düzenle' : 'Yeni ürün'}>
        <header className="item-modal-head">
          <div>
            <p className="panel-kicker">{editing ? 'ÜRÜN DETAYI' : 'YENİ KAYIT'}</p>
            <h2>{editing ? item?.name : 'Rafa bir ürün ekle'}</h2>
            <p className="item-modal-sub">
              {editing
                ? 'Bilgileri güncelle veya ürünü raftan çıkar.'
                : 'Son kullanma tarihini yaz; riski hemen hesaplayalım.'}
            </p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Kapat">
            <X size={19} />
          </button>
        </header>

        {item ? (
          <div className={`item-status-strip item-status-strip--${item.status}`}>
            <span className="status-pill">{statusLabel[item.status]}</span>
            <span>
              {item.status === 'active'
                ? `Şu an rafta · ${formatMoney(itemValue(item))} değerinde`
                : item.status === 'rescued'
                  ? `Kurtarıldı · ${formatMoney(itemValue(item))} korundu`
                  : `Fireye ayrıldı · ${formatMoney(itemValue(item))} kayıp`}
            </span>
            {item.status !== 'active' ? (
              <button type="button" className="text-button" onClick={reopen} disabled={saving}>
                <RotateCcw size={13} />
                Rafa geri al
              </button>
            ) : null}
          </div>
        ) : null}

        <form className="item-form" onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="item-name">Ürün adı</label>
            <input
              id="item-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="örn. Mozzarella"
              maxLength={80}
              autoFocus
              className={errors.name ? 'has-error' : ''}
            />
            {errors.name ? <span className="field-error">{errors.name}</span> : null}
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="item-category">Kategori</label>
              <select
                id="item-category"
                value={category}
                onChange={(event) => setCategory(event.target.value as Category)}
              >
                {CATEGORIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="item-expiry">Son kullanma tarihi</label>
              <input
                id="item-expiry"
                type="date"
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
                className={errors.expiryDate ? 'has-error' : ''}
              />
              {errors.expiryDate ? (
                <span className="field-error">{errors.expiryDate}</span>
              ) : null}
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="item-quantity">Miktar</label>
              <div className={`input-pair ${errors.quantity ? 'has-error' : ''}`}>
                <input
                  id="item-quantity"
                  type="number"
                  min="0.01"
                  step="0.1"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  inputMode="decimal"
                />
                <select
                  value={unit}
                  onChange={(event) => setUnit(event.target.value as Unit)}
                  aria-label="Birim"
                >
                  {UNITS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              {errors.quantity ? <span className="field-error">{errors.quantity}</span> : null}
            </div>
            <div className="field">
              <label htmlFor="item-cost">Birim maliyet</label>
              <div className={`input-prefix ${errors.unitCost ? 'has-error' : ''}`}>
                <span>₺</span>
                <input
                  id="item-cost"
                  type="number"
                  min="0"
                  step="0.5"
                  value={unitCost}
                  onChange={(event) => setUnitCost(event.target.value)}
                  placeholder="0"
                  inputMode="decimal"
                />
              </div>
              {errors.unitCost ? (
                <span className="field-error">{errors.unitCost}</span>
              ) : null}
            </div>
          </div>

          <div className="field">
            <label htmlFor="item-note">Not <span className="field-optional">(opsiyonel)</span></label>
            <textarea
              id="item-note"
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Raf konumu, açılmış mı, kime ayrıldı…"
              maxLength={300}
              className={errors.note ? 'has-error' : ''}
            />
            {errors.note ? <span className="field-error">{errors.note}</span> : null}
          </div>

          <div className="estimate-strip">
            <span className="estimate-label">
              <AlertTriangle size={15} />
              Bu ürünün raftaki değeri
            </span>
            <strong>{formatMoney(estimate)}</strong>
            <span className="estimate-hint">Miktar × birim maliyet</span>
          </div>

          <footer className="item-modal-foot">
            <div className="delete-zone">
              {editing ? (
                confirmDelete ? (
                  <div className="delete-confirm">
                    <span>Ürün silinsin mi?</span>
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
                    Ürünü sil
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
                {saving ? 'Kaydediliyor…' : editing ? 'Değişiklikleri kaydet' : 'Ürünü ekle'}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
