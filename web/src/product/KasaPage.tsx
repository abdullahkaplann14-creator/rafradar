import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Download,
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { api, errorMessage } from '../api';
import { useAccountingActions } from '../hooks/useAccountingActions';
import { ProductTopbar } from '../components/ProductTopbar';
import { Toasts, useToasts } from '../components/Toast';
import { TransactionModal } from './TransactionModal';
import {
  type Transaction,
  type TransactionInput,
  type TransactionType,
} from '../types';
import {
  currentMonth,
  formatDate,
  formatMoney,
  monthLabel,
  normalize,
  shiftMonth,
  transactionTypeLabel,
  vatOf,
} from '../utils';

type TypeFilter = 'all' | 'income' | 'expense' | 'pending';
type ModalState = { type: 'create' } | { type: 'edit'; id: string } | null;

export function KasaPage() {
  const [month, setMonth] = useState(currentMonth());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [modal, setModal] = useState<ModalState>(null);

  const { toasts, notify, dismiss } = useToasts();
  const actions = useAccountingActions(notify);
  const searchRef = useRef<HTMLInputElement>(null);

  const query = useQuery({
    queryKey: ['accounting', month],
    queryFn: () => api.getAccounting(month),
  });
  const data = query.data;

  const editingTransaction = useMemo(() => {
    if (modal?.type !== 'edit' || !data) return null;
    return data.transactions.find((transaction) => transaction.id === modal.id) ?? null;
  }, [data, modal]);

  useEffect(() => {
    if (modal?.type === 'edit' && data && !editingTransaction) setModal(null);
  }, [data, editingTransaction, modal]);

  useEffect(() => {
    setCategoryFilter('all');
  }, [typeFilter]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (modal) {
          setModal(null);
          return;
        }
      }

      const target = event.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (typing || modal) return;

      if (event.key === '/') {
        event.preventDefault();
        searchRef.current?.focus();
      }

      if ((event.key === 'n' || event.key === 'N') && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setModal({ type: 'create' });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modal]);

  const categoryOptions = useMemo(() => {
    if (!data) return [] as string[];
    if (typeFilter === 'income' || typeFilter === 'pending') return [...data.categories.income];
    if (typeFilter === 'expense') return [...data.categories.expense];
    return [...new Set([...data.categories.income, ...data.categories.expense])];
  }, [data, typeFilter]);

  const filtered = useMemo(() => {
    if (!data) return [] as Transaction[];
    let transactions = data.transactions;
    if (typeFilter === 'pending') {
      transactions = transactions.filter(
        (transaction) => transaction.type === 'income' && !transaction.sold,
      );
    } else if (typeFilter !== 'all') {
      transactions = transactions.filter((transaction) => transaction.type === typeFilter);
    }
    if (categoryFilter !== 'all') {
      transactions = transactions.filter((transaction) => transaction.category === categoryFilter);
    }
    const needle = normalize(search.trim());
    if (needle) {
      transactions = transactions.filter((transaction) =>
        normalize(
          `${transaction.description} ${transaction.category} ${transaction.documentNo ?? ''} ${transaction.note ?? ''}`,
        ).includes(needle),
      );
    }
    return transactions;
  }, [data, typeFilter, categoryFilter, search]);

  const openCreate = () => setModal({ type: 'create' });
  const openEdit = (id: string) => setModal({ type: 'edit', id });

  const handleCreate = async (input: TransactionInput) => {
    const transaction = await actions.createTransaction.mutateAsync(input);
    notify('success', `${transaction.description} kasaya eklendi.`);
    setModal(null);
  };

  const handleUpdate = async (id: string, input: Partial<TransactionInput>) => {
    const transaction = await actions.updateTransaction.mutateAsync({ id, input });
    notify('success', `${transaction.description} güncellendi.`);
    setModal(null);
  };

  const handleDelete = async (id: string, description: string) => {
    await actions.deleteTransaction.mutateAsync(id);
    notify('success', `${description} silindi.`);
    setModal(null);
  };

  const summary = data?.summary;
  const vatLabel = (summary?.vatPayable ?? 0) < 0 ? 'Devreden KDV' : 'KDV ödenecek';
  const vatValue = Math.abs(summary?.vatPayable ?? 0);

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setTypeFilter('all');
  };

  return (
    <div className="product">
      <ProductTopbar />

      <main className="pd-main">
        <section className="pd-hero">
          <div>
            <p className="panel-kicker">KASA DEFTERİ</p>
            <h1>Kasa</h1>
            <p className="pd-hero-sub">
              {monthLabel(month)} · {summary?.transactionCount ?? 0} kayıt · net{' '}
              {formatMoney(summary?.net ?? 0)}
            </p>
          </div>
          <div className="pd-hero-actions">
            <a
              className={`button button--outline button--small ${
                data?.transactions.length ? '' : 'is-disabled'
              }`}
              href={data?.transactions.length ? api.transactionCsvUrl(month) : undefined}
              download
              aria-disabled={!data?.transactions.length}
            >
              <Download size={14} />
              CSV indir
            </a>
            <button type="button" className="button button--primary" onClick={openCreate}>
              <Plus size={16} />
              Yeni işlem
            </button>
          </div>
        </section>

        <div className="month-bar">
          <div className="month-switcher">
            <button
              type="button"
              className="icon-button icon-button--small"
              onClick={() => setMonth(shiftMonth(month, -1))}
              aria-label="Önceki ay"
            >
              <ArrowLeft size={15} />
            </button>
            <input
              type="month"
              value={month}
              onChange={(event) => event.target.value && setMonth(event.target.value)}
              aria-label="Kasa dönemi"
            />
            <button
              type="button"
              className="icon-button icon-button--small"
              onClick={() => setMonth(shiftMonth(month, 1))}
              aria-label="Sonraki ay"
            >
              <ArrowRight size={15} />
            </button>
          </div>
          <button
            type="button"
            className={`month-today ${month === currentMonth() ? 'is-current' : ''}`}
            onClick={() => setMonth(currentMonth())}
          >
            Bu ay
          </button>
          <span className="month-all-time">
            Tüm zamanlar net
            <strong>{formatMoney(summary?.allTimeNet ?? 0)}</strong>
          </span>
        </div>

        {query.isLoading && !data ? <KasaSkeleton /> : null}

        {query.isError && !data ? (
          <div className="pd-error">
            <span className="pd-error-icon">
              <RefreshCw size={26} />
            </span>
            <p className="panel-kicker">BAĞLANTI YOK</p>
            <h1>Kasa açılmadı.</h1>
            <p>Kasa verisi API’den geliyor. Sunucunun çalıştığından emin olup tekrar dene.</p>
            <code>{errorMessage(query.error)}</code>
            <div className="pd-error-actions">
              <button
                type="button"
                className="button button--primary"
                onClick={() => void query.refetch()}
              >
                <RefreshCw size={15} />
                Tekrar dene
              </button>
              <Link to="/app" className="button button--ghost">
                Panele dön
              </Link>
            </div>
          </div>
        ) : null}

        {data && summary ? (
          <>
            <div className="cash-summary-grid">
              <article className="cash-summary-card cash-summary-card--income">
                <span className="cash-summary-icon">
                  <TrendingUp size={19} />
                </span>
                <span className="cash-summary-label">Gelir</span>
                <strong>{formatMoney(summary.incomeTotal)}</strong>
                <small>
                  {summary.incomeCount} satış kaydı
                  {summary.pendingIncomeCount > 0
                    ? ` · ${summary.pendingIncomeCount} bekliyor`
                    : ''}
                </small>
              </article>
              <article className="cash-summary-card cash-summary-card--expense">
                <span className="cash-summary-icon">
                  <TrendingDown size={19} />
                </span>
                <span className="cash-summary-label">Gider</span>
                <strong>{formatMoney(summary.expenseTotal)}</strong>
                <small>{summary.expenseCount} gider kaydı</small>
              </article>
              <article
                className={`cash-summary-card cash-summary-card--net ${
                  summary.net >= 0 ? 'is-positive' : 'is-negative'
                }`}
              >
                <span className="cash-summary-icon">
                  <Wallet size={19} />
                </span>
                <span className="cash-summary-label">Net kâr</span>
                <strong>
                  {summary.net >= 0 ? '+' : ''}
                  {formatMoney(summary.net)}
                </strong>
                <small>{summary.transactionCount} kayıt</small>
              </article>
              <article className="cash-summary-card cash-summary-card--vat">
                <span className="cash-summary-icon">
                  <Receipt size={19} />
                </span>
                <span className="cash-summary-label">{vatLabel}</span>
                <strong>{formatMoney(vatValue)}</strong>
                <small>
                  Satılan KDV {formatMoney(summary.vatCollected)} − {formatMoney(summary.vatDeductible)} indirim
                </small>
              </article>
            </div>

            {summary.pendingIncomeTotal > 0 ? (
              <div className="pending-sales">
                <span className="pending-sales-icon">
                  <Receipt size={17} />
                </span>
                <div>
                  <strong>{formatMoney(summary.pendingIncomeTotal)} bekleyen satış</strong>
                  <span>
                    {summary.pendingIncomeCount} kayıt satılmadı olarak işaretli; ciroya ve
                    KDV’ye dahil edilmedi.
                  </span>
                </div>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setTypeFilter('pending')}
                >
                  Bekleyenleri gör
                  <ArrowRight size={13} />
                </button>
              </div>
            ) : null}

            <section className="panel inventory-panel kasa-panel">
              <header className="inventory-head">
                <div>
                  <p className="panel-kicker">HAREKETLER</p>
                  <h2>
                    Kasa defteri <span className="inventory-count">{filtered.length}</span>
                  </h2>
                </div>
                <div className="inventory-tools">
                  <label className="search-box">
                    <Search size={15} />
                    <input
                      ref={searchRef}
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Açıklama, belge no…"
                      aria-label="Kasa kayıtlarında ara"
                    />
                    {search ? (
                      <button
                        type="button"
                        className="search-clear"
                        onClick={() => setSearch('')}
                        aria-label="Aramayı temizle"
                      >
                        <X size={13} />
                      </button>
                    ) : (
                      <kbd>/</kbd>
                    )}
                  </label>
                  <select
                    className="filter-select"
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                    aria-label="Kategori filtresi"
                  >
                    <option value="all">Tüm kategoriler</option>
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </header>

              <div className="inventory-tabs" role="tablist" aria-label="İşlem türü">
                {(
                  [
                    { key: 'all', label: 'Tümü', count: summary.transactionCount },
                    { key: 'income', label: 'Gelir', count: summary.incomeCount },
                    { key: 'pending', label: 'Bekleyen', count: summary.pendingIncomeCount },
                    { key: 'expense', label: 'Gider', count: summary.expenseCount },
                  ] as { key: TypeFilter; label: string; count: number }[]
                ).map((tab) => (
                  <button
                    type="button"
                    key={tab.key}
                    role="tab"
                    aria-selected={typeFilter === tab.key}
                    className={`inventory-tab ${typeFilter === tab.key ? 'is-active' : ''}`}
                    onClick={() => setTypeFilter(tab.key)}
                  >
                    {tab.label}
                    <span>{tab.count}</span>
                  </button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div className="table-empty">
                  <span className="table-empty-icon">
                    <Receipt size={24} />
                  </span>
                  <h3>
                    {data.transactions.length === 0
                      ? 'Bu dönemde kasa kaydı yok.'
                      : 'Bu filtrede kayıt yok.'}
                  </h3>
                  <p>
                    {data.transactions.length === 0
                      ? 'İlk gelir veya gideri ekleyerek kasa defterini başlat.'
                      : 'Aramayı değiştir veya filtreleri temizle.'}
                  </p>
                  {data.transactions.length === 0 ? (
                    <button type="button" className="button button--primary" onClick={openCreate}>
                      <Plus size={15} />
                      İlk işlemi ekle
                    </button>
                  ) : (
                    <button type="button" className="button button--outline" onClick={clearFilters}>
                      Filtreleri temizle
                    </button>
                  )}
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="item-table txn-table">
                    <thead>
                      <tr>
                        <th>Tarih</th>
                        <th>Açıklama</th>
                        <th>Kategori</th>
                        <th>Ödeme</th>
                        <th>Tutar</th>
                        <th>KDV</th>
                        <th aria-label="Düzenle" />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((transaction) => {
                        const vat = vatOf(transaction.amount, transaction.vatRate);
                        return (
                          <tr
                            key={transaction.id}
                            className={`txn-row txn-row--${transaction.type}`}
                            onClick={() => openEdit(transaction.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') openEdit(transaction.id);
                            }}
                            tabIndex={0}
                          >
                            <td data-label="Tarih" className="txn-date">
                              {formatDate(transaction.date)}
                            </td>
                            <td data-label="Açıklama">
                              <div className="txn-desc">
                                <span
                                  className={`txn-kind txn-kind--${transaction.type}`}
                                  title={transactionTypeLabel[transaction.type]}
                                >
                                  {transaction.type === 'income' ? (
                                    <ArrowUpRight size={12} />
                                  ) : (
                                    <ArrowDownRight size={12} />
                                  )}
                                  {transactionTypeLabel[transaction.type]}
                                </span>
                                <div>
                                  <strong>{transaction.description}</strong>
                                  {transaction.documentNo ? (
                                    <small>Belge: {transaction.documentNo}</small>
                                  ) : null}
                                </div>
                              </div>
                            </td>
                            <td data-label="Kategori">
                              <span className={`category-chip txn-category--${transaction.type}`}>
                                {transaction.category}
                              </span>
                            </td>
                            <td data-label="Ödeme">{transaction.paymentMethod}</td>
                            <td data-label="Tutar" className="txn-amount-cell">
                              <strong
                                className={`txn-amount txn-amount--${transaction.type} ${
                                  transaction.type === 'income' && !transaction.sold
                                    ? 'txn-amount--pending'
                                    : ''
                                }`}
                              >
                                {transaction.type === 'income' ? '+' : '−'}
                                {formatMoney(transaction.amount)}
                              </strong>
                              {transaction.type === 'income' ? (
                                <span
                                  className={`sale-flag sale-flag--${
                                    transaction.sold ? 'sold' : 'pending'
                                  }`}
                                >
                                  {transaction.sold ? 'Satıldı' : 'Satılmadı'}
                                </span>
                              ) : null}
                            </td>
                            <td data-label="KDV" className="txn-vat-cell">
                              {transaction.type === 'income' && !transaction.sold ? (
                                <>
                                  —
                                  <small>satılmadı</small>
                                </>
                              ) : (
                                <>
                                  {transaction.vatRate ? `%${transaction.vatRate}` : '—'}
                                  {transaction.vatRate ? <small>{formatMoney(vat)}</small> : null}
                                </>
                              )}
                            </td>
                            <td className="row-action">
                              <button
                                type="button"
                                className="icon-button icon-button--small"
                                aria-label={`${transaction.description} kaydını düzenle`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openEdit(transaction.id);
                                }}
                              >
                                <Pencil size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>

      <footer className="pd-footer">
        <span>
          <span className="live-dot" />
          Kasa ve raf aynı veritabanında · kalıcı
        </span>
        <span>RafRadar demo · {new Date().getFullYear()}</span>
      </footer>

      <Toasts items={toasts} onDismiss={dismiss} />

      {modal?.type === 'create' ? (
        <TransactionModal
          key="create-txn"
          month={month}
          onClose={() => setModal(null)}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ) : null}

      {modal?.type === 'edit' && editingTransaction ? (
        <TransactionModal
          key={editingTransaction.id}
          transaction={editingTransaction}
          month={month}
          onClose={() => setModal(null)}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ) : null}
    </div>
  );
}

function KasaSkeleton() {
  return (
    <div className="pd-skeleton" aria-busy="true" aria-label="Kasa yükleniyor">
      <div className="skel skel-heading" />
      <div className="cash-summary-grid">
        {[0, 1, 2, 3].map((item) => (
          <div className="skel skel-summary" key={item} />
        ))}
      </div>
      <div className="skel skel-table" />
    </div>
  );
}
