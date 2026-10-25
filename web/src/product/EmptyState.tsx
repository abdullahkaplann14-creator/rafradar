import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, Milk, Package, Plus, Radar, Sparkles } from 'lucide-react';

export function EmptyState({
  onAdd,
  onDemo,
  demoPending,
}: {
  onAdd: () => void;
  onDemo: () => void;
  demoPending: boolean;
}) {
  return (
    <div className="empty-product">
      <div className="empty-product-inner">
        <div className="empty-illustration" aria-hidden="true">
          <div className="shelf-board">
            <span className="shelf-item shelf-item--one">
              <Milk size={20} />
            </span>
            <span className="shelf-item shelf-item--two">
              <Package size={20} />
            </span>
            <span className="shelf-item shelf-item--three">
              <Leaf size={20} />
            </span>
            <span className="shelf-tag">?</span>
          </div>
          <div className="empty-radar">
            <Radar size={20} />
          </div>
        </div>

        <p className="panel-kicker">BAŞLANGIÇ</p>
        <h1>Rafın henüz boş.</h1>
        <p className="empty-lede">
          İlk ürünü ekle; son kullanma tarihini yaz. RafRadar bu hafta riskte olanı ve
          TL karşılığını hemen göstersin.
        </p>

        <div className="empty-actions">
          <button type="button" className="button button--primary button--lg" onClick={onAdd}>
            <Plus size={17} />
            İlk ürünü ekle
          </button>
          <button
            type="button"
            className="button button--outline button--lg"
            onClick={onDemo}
            disabled={demoPending}
          >
            <Sparkles size={16} />
            {demoPending ? 'Yükleniyor…' : 'Örnek 10 ürünle keşfet'}
          </button>
        </div>

        <div className="empty-steps">
          <div>
            <span>1</span>
            <strong>Ekle</strong>
            <small>10 saniye</small>
          </div>
          <i aria-hidden="true" />
          <div>
            <span>2</span>
            <strong>Riski gör</strong>
            <small>tek ekran</small>
          </div>
          <i aria-hidden="true" />
          <div>
            <span>3</span>
            <strong>Kurtar</strong>
            <small>veya fireye ayır</small>
          </div>
        </div>

        <p className="empty-note">
          Örnek veriler gerçek kayıt olarak eklenir ve kalıcıdır. İstersen tek tek
          silebilirsin.
        </p>

        <Link to="/" className="empty-back">
          Satış sayfasına dön
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
