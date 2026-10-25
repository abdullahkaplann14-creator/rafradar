import { useEffect } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { LandingPage } from './landing/LandingPage';
import { ProductPage } from './product/ProductPage';
import { KasaPage } from './product/KasaPage';
import { Logo } from './components/Logo';

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const timer = window.setTimeout(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
      }, 30);
      return () => window.clearTimeout(timer);
    }
    window.scrollTo(0, 0);
    return undefined;
  }, [pathname, hash]);
  return null;
}

function NotFound() {
  return (
    <div className="not-found">
      <Link to="/" aria-label="RafRadar ana sayfa">
        <Logo />
      </Link>
      <p className="panel-kicker">404</p>
      <h1>Bu rafta bir şey yok.</h1>
      <p>Aradığın sayfa taşınmış veya hiç var olmamış olabilir.</p>
      <Link to="/" className="button button--primary">
        Ana sayfaya dön
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<ProductPage />} />
        <Route path="/app/kasa" element={<KasaPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
