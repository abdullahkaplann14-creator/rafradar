import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Leaf,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { api, errorMessage } from '../api';
import { useProductActions } from '../hooks/useProductActions';
import { ProductTopbar } from '../components/ProductTopbar';
import { Toasts, useToasts } from '../components/Toast';
import { EmptyState } from './EmptyState';
import { ItemModal } from './ItemModal';
import { CATEGORIES, type Item, type ItemInput, type ItemStatus } from '../types';
import {
  categoryClass,
  expiryInfo,
  formatDate,
  formatMoney,
  itemValue,
  monthLabel,
  normalize,
  statusLabel,
  todayLong,
} from '../utils';

type StatusFilter = Exclude<ItemStatus, 'active'> | 'active';
type ModalState = { type: 'create' } | { type: 'edit'; id: string } | null;

const tabs: { key: StatusFilter; label: string }[] = [
  { key: 'active', label: 'Rafta' },
  { key: 'rescued', label: 'Kurtarılan' },
  { key: 'wasted', label: 'Fire' },
];

export function ProductPage() {
  const query = useQuery({ queryKey: ['dashboard'], queryFn: api.getDashboard });
  const data = query.data;
  const { toasts, notify, dismiss } = useToasts();
  const actions = useProductActions(notify);

  const [modal, setModal] = useState<ModalState>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);

  const editingItem = useMemo(() => {
    if (modal?.type !== 'edit' || !data) return null;
    return data.items.find((item) => item.id === modal.id) ?? null;
  }, [data, modal]);

  useEffect(() => {
    if (modal?.type === 'edit' && data && !editingItem) setModal(null);
  }, [data, editingItem, modal]);

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

  const filtered = useMemo(() => {
    if (!data) return [];
    let items = data.items.filter((item) => item.status === statusFilter);
    if (categoryFilter !== 'all') {
      items = items.filter((item) => item.category === categoryFilter);
    }
    const needle = normalize(search.trim());
    if (needle) {
      items = items.filter((item) =>
        normalize(`${item.name} ${item.category} ${item.note ?? ''}`).includes(needle),
      );
    }
    items = [...items].sort((a, b) => {
      if (statusFilter === 'active') return a.expiryDate.localeCompare(b.expiryDate);
      return String(b.resolvedAt ?? '').localeCompare(String(a.resolvedAt ?? ''));
    });
    return items;
  }, [data, statusFilter, categoryFilter, search]);

  const openCreate = () => setModal({ type: 'create' });
  const openEdit = (id: string) => setModal({ type: 'edit', id });

  const handleDemo = async () => {
    try {
      const result = await actions.loadDemo.mutateAsync();
      notify(
        'success',
        result.skipped
          ? 'Pano boş değil; mevcut veriler korundu.'
          : `${result.inserted} örnek ürün yüklendi.`,
      );
    } catch {
      /* merkezi hata bildirimi */
    }
  };

  const handleResolve = async (item: Item, outcome: Exclude<ItemStatus, 'active'>) => {
    setBusyId(item.id);
    try {
      await actions.resolveItem.mutateAsync({ id: item.id, outcome });
      notify(
        outcome === 'rescued' ? 'success' : 'info',
        outcome === 'rescued'
          ? `${item.name} kurtarıldı · ${formatMoney(itemValue(item))} korundu.`
          : `${item.name} fireye ayrıldı · ${formatMoney(itemValue(item))} kayıp.`,
      );
    } catch {
      /* merkezi hata bildirimi */
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async (input: ItemInput) => {
    const item = await actions.createItem.mutateAsync(input);
    notify('success', `${item.name} rafa eklendi.`);
    setModal(null);
  };

  const handleUpdate = async (id: string, input: Partial<ItemInput>) => {
    const item = await actions.updateItem.mutateAsync({ id, input });
    notify('success', `${item.name} güncellendi.`);
    setModal(null);
  };

  const handleDelete = async (id: string, name: string) => {
    await actions.deleteItem.mutateAsync(id);
    notify('success', `${name} silindi.`);
    setModal(null);
  };

  const handleReopen = async (id: string, name: string) => {
    await actions.reopenItem.mutateAsync(id);
    notify('success', `${name} rafa geri alındı.`);
    setModal(null);
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
  };

  const summary = data?.summary;
  const resolvedTotal = (summary?.rescuedValue ?? 0) + (summary?.wastedValue ?? 0);
  const recoveryRate =
    resolvedTotal > 0 ? Math.round(((summary?.rescuedValue ?? 0) / resolvedTotal) * 100) : 0;

  return (
    <div className="product">
      <ProductTopbar />

      <main className="pd-main">
        {query.isLoading && !data ? <DashboardSkeleton /> : null}

        {query.isError && !data ? (
          <div className="pd-error">
            <span className="pd-error-icon">
              <AlertTriangle size={26} />
            </span>
            <p className="panel-kicker">BAĞLANTI YOK</p>
            <h1>Panele ulaşamadım.</h1>
            <p>
              Ürün verisi API’den geliyor. API sunucusunun çalıştığından emin olup
              tekrar dene.
            </p>
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
              <Link to="/" className="button button--ghost">
                Satış sayfasına dön
              </Link>
            </div>
          </div>
        ) : null}

        {data && data.items.length === 0 ? (
          <EmptyState
            onAdd={openCreate}
            onDemo={handleDemo}
            demoPending={actions.loadDemo.isPending}
          />
        ) : null}

        {data && data.items.length > 0 && summary ? (
          <>
            <section className="pd-hero" id="panel">
              <div>
                <p className="panel-kicker">KAFE PANELİ</p>
                <h1>Raf durumu</h1>
                <p className="pd-hero-sub">
                  {todayLong()} · {summary.activeCount} ürün rafta · {summary.attentionCount}{' '}
                  ürün aksiyon bekliyor
                </p>
              </div>
              <div className="pd-hero-actions">
                <a
                  className="button button--outline button--small"
                  href={api.exportCsvUrl}
                  download
                >
                  <Download size={14} />
                  CSV indir
                </a>
                <button type="button" className="button button--primary" onClick={openCreate}>
                  <Plus size={16} />
                  Yeni ürün
                </button>
              </div>
            </section>

            <div className="summary-grid">
              <SummaryCard
                variant="risk"
                icon={<AlertTriangle size={20} />}
                label="Bu hafta riskte"
                value={formatMoney(summary.riskValue)}
                hint={`${summary.attentionCount} ürün aksiyon bekliyor`}
              />
              <SummaryCard
                variant="soon"
                icon={<Clock size={20} />}
                label="Bu hafta bitiyor"
                value={String(summary.expiringCount)}
                hint={
                  summary.expiredCount > 0
                    ? `${summary.expiredCount} ürünün tarihi geçti`
                    : 'Tarihi geçen ürün yok'
                }
              />
              <SummaryCard
                variant="saved"
                icon={<CheckCircle2 size={20} />}
                label="Kurtarılan değer"
                value={formatMoney(summary.rescuedValue)}
                hint={`${summary.rescuedCount} ürün kurtarıldı`}
              />
              <SummaryCard
                variant="wasted"
                icon={<Trash2 size={20} />}
                label="Fireye giden"
                value={formatMoney(summary.wastedValue)}
                hint={`${summary.wastedCount} ürün fireye ayrıldı`}
              />
            </div>

            <div className="pd-columns">
              <section className="panel attention-panel">
                <header className="panel-head">
                  <div>
                    <p className="panel-kicker">BU HAFTA</p>
                    <h2>Aksiyon bekleyenler</h2>
                  </div>
                  <span className="panel-count">{summary.attentionCount} ürün</span>
                </header>
                <p className="panel-sub">
                  Son kullanma tarihi 7 gün içinde olan veya geçen ürünler. Kurtar ya da
                  fireye ayır; özet anında güncellensin.
                </p>

                {data.attention.length === 0 ? (
                  <div className="calm-state">
                    <span className="calm-icon">
                      <Leaf size={22} />
                    </span>
                    <h3>Bu hafta risk yok.</h3>
                    <p>
                      Yeni bir ürün eklediğinde tarihi yaklaşınca burada görünecek.
                    </p>
                    <button type="button" className="text-button" onClick={openCreate}>
                      <Plus size={13} />
                      Ürün ekle
                    </button>
                  </div>
                ) : (
                  <div className="attention-list">
                    {data.attention.map((item) => {
                      const expiry = expiryInfo(item.expiryDate);
                      const busy = busyId === item.id;
                      return (
                        <article className={`attention-row attention-row--${expiry.tone}`} key={item.id}>
                          <span className="attention-dot" aria-hidden="true" />
                          <div className="attention-info">
                            <strong>{item.name}</strong>
                            <span>
                              {item.category} · {item.quantity} {item.unit} ·{' '}
                              {formatMoney(item.unitCost)}/{item.unit}
                            </span>
                          </div>
                          <span className={`expiry-badge expiry-badge--${expiry.tone}`}>
                            {expiry.label}
                          </span>
                          <span className="attention-value">{formatMoney(itemValue(item))}</span>
                          <div className="attention-actions">
                            <button
                              type="button"
                              className="mini-button mini-button--save"
                              onClick={() => void handleResolve(item, 'rescued')}
                              disabled={busy}
                              title="İndirimle kurtarıldı veya kullanıldı"
                            >
                              <Check size={13} />
                              Kurtardım
                            </button>
                            <button
                              type="button"
                              className="mini-button mini-button--waste"
                              onClick={() => void handleResolve(item, 'wasted')}
                              disabled={busy}
                              title="Ürün fireye ayrıldı"
                            >
                              <Trash2 size={12} />
                              Fire
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              <aside className="pd-side">
                <section className="panel recovery-panel">
                  <div className="recovery-head">
                    <div>
                      <p className="panel-kicker">SONUÇ</p>
                      <h2>Kurtarma oranı</h2>
                    </div>
                    <strong className="recovery-rate">{recoveryRate}%</strong>
                  </div>
                  <div className="recovery-bar" aria-hidden="true">
                    <span style={{ width: `${recoveryRate}%` }} />
                  </div>
                  <div className="recovery-values">
                    <span>
                      <i className="dot dot--saved" />
                      {formatMoney(summary.rescuedValue)} kurtarıldı
                    </span>
                    <span>
                      <i className="dot dot--wasted" />
                      {formatMoney(summary.wastedValue)} fire
                    </span>
                  </div>
                </section>

                <section className="panel recent-panel">
                  <header className="panel-head panel-head--compact">
                    <div>
                      <p className="panel-kicker">SON HAREKETLER</p>
                      <h2>Raftan çıkanlar</h2>
                    </div>
                  </header>
                  {data.recent.length === 0 ? (
                    <p className="recent-empty">
                      Henüz kurtarılan veya fireye ayrılan ürün yok. İlk kayıt burada
                      görünecek.
                    </p>
                  ) : (
                    <ul className="recent-list">
                      {data.recent.map((item) => (
                        <li key={item.id}>
                          <i
                            className={`dot ${
                              item.status === 'rescued' ? 'dot--saved' : 'dot--wasted'
                            }`}
                          />
                          <div>
                            <strong>{item.name}</strong>
                            <span>
                              {statusLabel[item.status]}
                              {item.resolvedAt
                                ? ` · ${formatDate(item.resolvedAt.slice(0, 10))}`
                                : ''}
                            </span>
                          </div>
                          <b>{formatMoney(itemValue(item))}</b>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <div className="tip-card">
                  <span className="tip-icon">
                    <Leaf size={17} />
                  </span>
                  <p>
                    <strong>Bugünün küçük kararı:</strong> Servisten önce en eski tarihli
                    ürünü öne al. Bir dakika, bir kg peynir demek.
                  </p>
                </div>
              </aside>
            </div>

            <section className="panel cashflow-panel">
              <div className="cashflow-copy">
                <p className="panel-kicker">KASA · {monthLabel(data.accounting.month)}</p>
                <h2>Rafın yanında kasa da hazır.</h2>
                <p>
                  Gelir-gideri, KDV’yi ve aylık net kârı aynı panelde takip et.
                  {data.accounting.transactionCount === 0
                    ? ' Bu ay henüz kayıt yok; ilk işlemi ekle.'
                    : ` Bu ay ${data.accounting.transactionCount} kayıt var.`}
                </p>
                <Link to="/app/kasa" className="button button--outline button--small">
                  Kasa defterini aç
                  <ArrowRight size={14} />
                </Link>
                {data.accounting.pendingIncomeTotal > 0 ? (
                  <span className="cashflow-pending">
                    {formatMoney(data.accounting.pendingIncomeTotal)} bekleyen satış ·
                    ciro/KDV dışında
                  </span>
                ) : null}
              </div>
              <div className="cashflow-stats">
                <div>
                  <span>Gelir</span>
                  <strong>{formatMoney(data.accounting.incomeTotal)}</strong>
                </div>
                <div>
                  <span>Gider</span>
                  <strong>{formatMoney(data.accounting.expenseTotal)}</strong>
                </div>
                <div className={data.accounting.net >= 0 ? 'is-positive' : 'is-negative'}>
                  <span>Net kâr</span>
                  <strong>
                    {data.accounting.net >= 0 ? '+' : ''}
                    {formatMoney(data.accounting.net)}
                  </strong>
                </div>
                <div>
                  <span>KDV ödenecek</span>
                  <strong>{formatMoney(data.accounting.vatPayable)}</strong>
                </div>
              </div>
            </section>

            <section className="panel inventory-panel" id="urunler">
              <header className="inventory-head">
                <div>
                  <p className="panel-kicker">RAF</p>
                  <h2>
                    Ürünler <span className="inventory-count">{filtered.length}</span>
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
                      placeholder="Ürünlerde ara…"
                      aria-label="Ürünlerde ara"
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
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </header>

              <div className="inventory-tabs" role="tablist" aria-label="Ürün durumu">
                {tabs.map((tab) => {
                  const count =
                    tab.key === 'active'
                      ? summary.activeCount
                      : tab.key === 'rescued'
                        ? summary.rescuedCount
                        : summary.wastedCount;
                  return (
                    <button
                      type="button"
                      key={tab.key}
                      role="tab"
                      aria-selected={statusFilter === tab.key}
                      className={`inventory-tab ${statusFilter === tab.key ? 'is-active' : ''}`}
                      onClick={() => setStatusFilter(tab.key)}
                    >
                      {tab.label}
                      <span>{count}</span>
                    </button>
                  );
                })}
              </div>

              {filtered.length === 0 ? (
                <div className="table-empty">
                  <span className="table-empty-icon">
                    <Package size={24} />
                  </span>
                  <h3>
                    {statusFilter === 'active' && !search && categoryFilter === 'all'
                      ? 'Rafta ürün yok.'
                      : 'Bu filtrede ürün yok.'}
                  </h3>
                  <p>
                    {statusFilter === 'active' && !search && categoryFilter === 'all'
                      ? 'Yeni bir ürün ekleyerek başla.'
                      : 'Aramayı değiştir veya filtreleri temizle.'}
                  </p>
                  {statusFilter === 'active' && !search && categoryFilter === 'all' ? (
                    <button type="button" className="button button--primary" onClick={openCreate}>
                      <Plus size={15} />
                      Yeni ürün
                    </button>
                  ) : (
                    <button type="button" className="button button--outline" onClick={clearFilters}>
                      Filtreleri temizle
                    </button>
                  )}
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="item-table">
                    <thead>
                      <tr>
                        <th>Ürün</th>
                        <th>Kategori</th>
                        <th>Miktar</th>
                        <th>Son tarih</th>
                        <th>Değer</th>
                        <th>Durum</th>
                        <th aria-label="Düzenle" />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((item) => {
                        const expiry = expiryInfo(item.expiryDate);
                        return (
                          <tr
                            key={item.id}
                            onClick={() => openEdit(item.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') openEdit(item.id);
                            }}
                            tabIndex={0}
                          >
                            <td data-label="Ürün">
                              <div className="item-name-cell">
                                <i className={`category-dot ${categoryClass(item.category)}`} />
                                <div>
                                  <strong>{item.name}</strong>
                                  {item.note ? <small>{item.note}</small> : null}
                                </div>
                              </div>
                            </td>
                            <td data-label="Kategori">
                              <span className={`category-chip ${categoryClass(item.category)}`}>
                                {item.category}
                              </span>
                            </td>
                            <td data-label="Miktar">
                              {item.quantity} {item.unit}
                            </td>
                            <td data-label="Son tarih">
                              <span className={`expiry-inline expiry-inline--${expiry.tone}`}>
                                {formatDate(item.expiryDate)}
                              </span>
                              {item.status === 'active' ? (
                                <small className={`expiry-small expiry-small--${expiry.tone}`}>
                                  {expiry.label}
                                </small>
                              ) : null}
                            </td>
                            <td data-label="Değer" className="value-cell">
                              {formatMoney(itemValue(item))}
                            </td>
                            <td data-label="Durum">
                              <span className={`status-pill status-pill--${item.status}`}>
                                {statusLabel[item.status]}
                              </span>
                            </td>
                            <td className="row-action">
                              <button
                                type="button"
                                className="icon-button icon-button--small"
                                aria-label={`${item.name} ürününü düzenle`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openEdit(item.id);
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
          Veriler bu sunucuda kalıcı · sayfayı yenile, kaybolmaz
        </span>
        <span>
          <Sparkles size={13} />
          RafRadar demo · {new Date().getFullYear()}
        </span>
      </footer>

      <Toasts items={toasts} onDismiss={dismiss} />

      {modal?.type === 'create' ? (
        <ItemModal
          key="create"
          onClose={() => setModal(null)}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onReopen={handleReopen}
        />
      ) : null}

      {modal?.type === 'edit' && editingItem ? (
        <ItemModal
          key={editingItem.id}
          item={editingItem}
          onClose={() => setModal(null)}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onReopen={handleReopen}
        />
      ) : null}
    </div>
  );
}

function SummaryCard({
  variant,
  icon,
  label,
  value,
  hint,
}: {
  variant: 'risk' | 'soon' | 'saved' | 'wasted';
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className={`summary-card summary-card--${variant}`}>
      <div className="summary-top">
        <span className="summary-icon">{icon}</span>
        <span className="summary-label">{label}</span>
      </div>
      <strong className="summary-value">{value}</strong>
      <span className="summary-hint">{hint}</span>
    </article>
  );
}

function DashboardSkeleton() {
  return (
    <div className="pd-skeleton" aria-busy="true" aria-label="Panel yükleniyor">
      <div className="skel skel-heading" />
      <div className="summary-grid">
        {[0, 1, 2, 3].map((item) => (
          <div className="skel skel-summary" key={item} />
        ))}
      </div>
      <div className="pd-columns">
        <div className="skel skel-panel" />
        <div className="skel skel-panel skel-panel--small" />
      </div>
      <div className="skel skel-table" />
    </div>
  );
}
