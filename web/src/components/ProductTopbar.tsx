import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { isStaticMode } from '../api';

export function ProductTopbar() {
  const { pathname } = useLocation();

  return (
    <header className="pd-topbar">
      <div className="pd-topbar-inner">
        <Link to="/" className="pd-brand" aria-label="RafRadar ana sayfa">
          <Logo />
          <span className="pd-brand-tag">{isStaticMode ? 'DEMO' : 'PANEL'}</span>
        </Link>
        <nav className="pd-nav" aria-label="Panel menüsü">
          <Link to="/app" className={pathname === '/app' ? 'is-active' : ''}>
            Panel
          </Link>
          <Link to="/app/kasa" className={pathname === '/app/kasa' ? 'is-active' : ''}>
            Kasa
          </Link>
          <Link to="/app#urunler">Ürünler</Link>
          <Link to="/">Satış sayfası</Link>
        </nav>
        <div className="pd-topbar-actions">
          <span className="pd-save-state">
            <i aria-hidden="true" />
            Veriler kalıcı
          </span>
        </div>
      </div>
    </header>
  );
}
