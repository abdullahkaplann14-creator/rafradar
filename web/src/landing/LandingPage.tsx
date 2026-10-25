import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Leaf,
  Milk,
  Package,
  Radar,
  Receipt,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import { Logo } from '../components/Logo';

const plans = [
  {
    name: 'Başlangıç',
    price: '149',
    period: '/ay',
    note: 'Rafını yeni düzene sokuyorsan',
    features: [
      '1 şube',
      '60 ürüne kadar',
      'Son kullanma ve risk paneli',
      'Kurtarma + fire kaydı',
      'Gelir-gider defteri',
      '30 günlük geçmiş',
    ],
    cta: 'Başlangıç ile dene',
    recommended: false,
  },
  {
    name: 'Pro',
    price: '299',
    period: '/ay',
    note: 'Fireyi düzenli takip eden kafeler',
    features: [
      '1 şube',
      'Sınırsız ürün',
      '7 günlük risk paneli',
      'Gelir-gider + KDV defteri',
      'Tüm geçmiş',
      'CSV dışa aktarma',
      'Öncelikli destek',
    ],
    cta: '14 gün ücretsiz dene',
    recommended: true,
  },
  {
    name: 'Pro Yıllık',
    price: '2.990',
    period: '/yıl',
    note: 'Yıllık öde, 2 ay hediye kazan',
    features: [
      'Pro’daki her şey',
      '2 ay hediye',
      'Yıl boyu sabit fiyat',
      'Öncelikli destek',
      'Tek fatura',
    ],
    cta: 'Yıllık planı seç',
    recommended: false,
  },
];

const faqs = [
  {
    q: 'Verilerim nerede duruyor?',
    a: 'RafRadar bu demoda verileri bağlı olduğu sunucudaki tek dosyalık bir veritabanında tutar. Sayfayı yenilesen de, sunucuyu kapatıp açsan da kaybolmaz. Gerçek kurulumda veriler kendi sunucunuzda kalır.',
  },
  {
    q: 'POS’um var, neden ayrı bir ürün kullanayım?',
    a: 'POS satışı ve ciroyu görür; rafta duran ürünün son kullanma tarihini görmez. RafRadar tam olarak bu boşluğu kapatır. Mevcut POS’unuza dokunmaz, entegrasyon istemez.',
  },
  {
    q: 'Kurulum ne kadar sürer?',
    a: 'Ortalama 2 dakika. İlk ürünü eklediğiniz anda risk paneli çalışmaya başlar. Muhasebe programı gibi uzun bir kurulum yok.',
  },
  {
    q: 'İstediğim zaman iptal edebilir miyim?',
    a: 'Evet. Aylık planlarda taahhüt yoktur; bir sonraki dönem yenilenmez. Verilerinizi CSV olarak dışa aktarabilirsiniz.',
  },
  {
    q: 'Neden ücretsiz değil?',
    a: 'RafRadar’ı bedava yaparsak geliştirmeye devam edemeyiz. Aylık 299 TL, günde tek bir ürünü kurtardığınızda kendini fazlasıyla çıkarır. 14 gün boyunca kredi kartı istemiyoruz.',
  },
  {
    q: 'Muhasebe programım var, neden burada kasa tutayım?',
    a: 'RafRadar tam bir muhasebe programı ya da e-fatura çözümü değil. Günlük gelir-gideri, ödeme yöntemini ve KDV özetini rafın yanında gösterir. Ay sonu net kârı görmek ve firenin gerçek etkisini anlamak için tasarlandı.',
  },
  {
    q: 'Tek başıma çalışıyorum, bana fazla mı?',
    a: 'Tam tersi: ürünü tek şubeli, 3-15 kişilik bağımsız kafeler için tasarladık. Başlangıç planı 60 ürüne kadar yeterli.',
  },
];

export function LandingPage() {
  return (
    <div className="landing">
      <header className="lp-nav">
        <div className="lp-container lp-nav-inner">
          <Link to="/" className="lp-brand" aria-label="RafRadar ana sayfa">
            <Logo />
          </Link>
          <nav className="lp-links" aria-label="Ana menü">
            <a href="#urun">Ürün</a>
            <a href="#nasil">Nasıl çalışır</a>
            <a href="#fiyatlar">Fiyatlar</a>
            <a href="#sss">SSS</a>
          </nav>
          <Link to="/app" className="button button--dark button--small lp-nav-cta">
            Ürünü dene
            <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      <main>
        <section className="lp-hero">
          <div className="lp-container lp-hero-grid">
            <div className="lp-hero-copy">
              <p className="lp-eyebrow">
                <span aria-hidden="true" />
                Kafeler için raf + kasa
              </p>
              <h1>
                Rafındaki para
                <br />
                <em>çöpe gitmesin.</em>
              </h1>
              <p className="lp-lede">
                Kafendeki ürünlerin son kullanma tarihini ve kasadaki parayı tek ekranda
                topla. Bu hafta riskte olanı gör, indirimle kurtar, fireyi ve net kârı ölç.
              </p>
              <div className="lp-hero-actions">
                <Link to="/app" className="button button--primary button--lg">
                  14 gün ücretsiz dene
                  <ArrowRight size={17} />
                </Link>
                <a href="#urun" className="button button--ghost button--lg">
                  Ürünü 2 dakikada gör
                </a>
              </div>
              <ul className="lp-trust">
                <li>
                  <Check size={14} /> Kurulum yok
                </li>
                <li>
                  <Check size={14} /> Kredi kartı yok
                </li>
                <li>
                  <Check size={14} /> Veriler senin
                </li>
              </ul>
              <p className="lp-audience">
                <span className="audience-mark">
                  <Leaf size={14} />
                </span>
                3-15 kişilik bağımsız kafeler ve pastaneler için
              </p>
              <div className="lp-hero-facts" aria-label="Ürün gerçekleri">
                <div>
                  <strong>10 sn</strong>
                  <span>ortalama kayıt</span>
                </div>
                <div>
                  <strong>7 gün</strong>
                  <span>risk penceresi</span>
                </div>
                <div>
                  <strong>1 ekran</strong>
                  <span>raf + kasa</span>
                </div>
              </div>
            </div>

            <div className="lp-hero-visual" aria-label="RafRadar ürün ekranı önizlemesi">
              <div className="hero-orbit" aria-hidden="true" />
              <div className="hero-frame">
                <div className="hero-frame-bar">
                  <i />
                  <i />
                  <i />
                  <span>rafradar.app/panel</span>
                </div>
                <img
                  src="/app-preview.png"
                  alt="RafRadar paneli: bu hafta riskteki ürünler ve kurtarılan değer"
                />
              </div>
              <div className="float-card float-card--risk">
                <span>BU HAFTA RİSKTE</span>
                <strong>₺1.366</strong>
                <small>6 ürün aksiyon bekliyor</small>
              </div>
              <div className="float-card float-card--saved">
                <span className="float-icon">
                  <CheckCircle2 size={17} />
                </span>
                <div>
                  <span>KURTARILDI</span>
                  <strong>₺220</strong>
                </div>
              </div>
              <div className="hero-stamp">
                <strong>10 sn</strong>
                <span>kayıt süresi</span>
              </div>
            </div>
          </div>

          <div className="lp-container">
            <div className="lp-proof">
              <span className="proof-label">Kimler için?</span>
              <span>Bağımsız kafeler</span>
              <span>Pastaneler</span>
              <span>Küçük mutfaklar</span>
              <span>Kahve dükkânları</span>
              <span className="proof-end">Excel’i bırakan ekipler</span>
            </div>
          </div>
        </section>

        <section className="lp-problem">
          <div className="lp-container">
            <div className="lp-section-head lp-section-head--cream">
              <p className="lp-eyebrow lp-eyebrow--light">
                <span aria-hidden="true" />
                Sorun
              </p>
              <h2>
                Ay sonunda fireyi
                <br />
                <em>kimse bilmiyor.</em>
              </h2>
              <p>
                Çoğu kafe fireyi Excel’de, WhatsApp’ta veya kafasında tutuyor. Muhasebe
                programları fazla büyük; POS’lar rafın arkasındaki tarihi göstermiyor.
                Gıda maliyetleri her ay artarken görünmeyen fire, kafenin en sessiz
                gideri.
              </p>
            </div>

            <div className="problem-grid">
              <article className="problem-card">
                <span className="problem-icon">
                  <Milk size={22} />
                </span>
                <h3>“Sütün tarihi dün dolmuş.”</h3>
                <p>Yoğun serviste kimse arka rafa bakmıyor. Ertesi gün fark ediliyor.</p>
                <span className="problem-cost">Ortalama 2 litre · ₺64</span>
              </article>
              <article className="problem-card">
                <span className="problem-icon">
                  <Package size={22} />
                </span>
                <h3>“Peynir arkada kalmış.”</h3>
                <p>Yeni mal geldi, eskisi öne alınmadı. Ay sonunda çöpe gidiyor.</p>
                <span className="problem-cost">1 kg mozzarella · ₺260</span>
              </article>
              <article className="problem-card">
                <span className="problem-icon">
                  <Trash2 size={22} />
                </span>
                <h3>“Ne kadar fire verdik?”</h3>
                <p>Kimse bilmiyor. Çünkü kaybedilen ürün hiçbir yere yazılmıyor.</p>
                <span className="problem-cost">Görünmeyen aylık kayıp</span>
              </article>
            </div>

            <div className="problem-footer">
              <p>
                RafRadar bu üç sorunu tek ekranda kapatır: <strong>ne var, ne zaman bitiyor,
                ne kadar para riskte?</strong>
              </p>
              <Link to="/app" className="text-link text-link--cream">
                Rafını taramaya başla
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        <section className="lp-product" id="urun">
          <div className="lp-container">
            <div className="lp-product-head">
              <div>
                <p className="lp-eyebrow">
                  <span aria-hidden="true" />
                  Ürün
                </p>
                <h2>
                  On saniyelik kayıt.
                  <br />
                  <em>Haftalık net karar.</em>
                </h2>
              </div>
              <p>
                RafRadar tam bir muhasebe programı değil. Rafın ve kasanın günlük kararını
                tek ekranda görünür kılar.
              </p>
            </div>

            <div className="product-shot-wrap">
              <span className="shot-badge">
                <span className="live-dot" />
                GERÇEK EKRAN
              </span>
              <div className="product-shot">
                <div className="hero-frame-bar">
                  <i />
                  <i />
                  <i />
                  <span>rafradar.app/panel</span>
                </div>
                <img
                  src="/app-preview.png"
                  alt="RafRadar panelinde risk kartları, aksiyon listesi ve ürün tablosu"
                />
              </div>
              <div className="shot-caption">
                <span className="live-dot" aria-hidden="true" />
                Gerçek ürün ekranı · örnek kafe verisi · sayfayı yenile, veri yerinde
              </div>
            </div>

            <div className="product-points">
              <div className="product-point">
                <span className="point-number">01</span>
                <div>
                  <h3>Ürünü ekle</h3>
                  <p>Ad, miktar, maliyet ve son kullanma tarihi. Toplam 10 saniye.</p>
                </div>
              </div>
              <div className="product-point">
                <span className="point-number">02</span>
                <div>
                  <h3>Risk panelini oku</h3>
                  <p>7 gün içinde bitecekler ve toplam TL riski tek bakışta.</p>
                </div>
              </div>
              <div className="product-point">
                <span className="point-number">03</span>
                <div>
                  <h3>Kurtar ya da fireye ayır</h3>
                  <p>Sonucu kaydet. Kurtardığın parayı ay sonunda kanıtla.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-how" id="nasil">
          <div className="lp-container">
            <div className="lp-section-head">
              <p className="lp-eyebrow">
                <span aria-hidden="true" />
                Nasıl çalışır
              </p>
              <h2>
                Sabah iki dakika.
                <br />
                <em>Akşam rahat bir kasa.</em>
              </h2>
            </div>
            <div className="how-grid">
              <article className="how-step">
                <span className="how-number">1</span>
                <span className="how-icon">
                  <Zap size={22} />
                </span>
                <h3>Rafa bak, ekle</h3>
                <p>Yeni gelen ürünü tarihiyle kaydet. Ürün adı ve maliyet yeterli.</p>
              </article>
              <article className="how-step">
                <span className="how-number">2</span>
                <span className="how-icon">
                  <Radar size={22} />
                </span>
                <h3>Riskleri gör</h3>
                <p>RafRadar 7 gün içinde bitecek ürünleri ve TL karşılığını öne çıkarır.</p>
              </article>
              <article className="how-step">
                <span className="how-number">3</span>
                <span className="how-icon">
                  <Wallet size={22} />
                </span>
                <h3>Kurtar veya fireye ayır</h3>
                <p>İndirimle kurtardığını, çöpe gideni ayır. Ay sonunda farkı gör.</p>
              </article>
            </div>
            <div className="how-note">
              <ShieldCheck size={18} />
              <span>
                <strong>Rafa dokunmadan.</strong> Barkod, POS entegrasyonu veya yeni
                donanım gerekmez.
              </span>
            </div>
          </div>
        </section>

        <section className="lp-benefits">
          <div className="lp-container">
            <div className="benefit-grid">
              <article className="benefit-card">
                <span className="benefit-icon">
                  <Clock size={24} />
                </span>
                <h3>10 saniyede kaydet</h3>
                <p>
                  Muhasebe programı değil. Menüden ürün seçer gibi hızlı: ad, miktar,
                  maliyet, tarih. Bitti.
                </p>
              </article>
              <article className="benefit-card">
                <span className="benefit-icon">
                  <TrendingDown size={24} />
                </span>
                <h3>Bu haftanın riskini gör</h3>
                <p>
                  “3 gün kaldı” uyarısıyla birlikte rafta ne kadar para riskte olduğunu
                  tek ekranda oku.
                </p>
              </article>
              <article className="benefit-card">
                <span className="benefit-icon">
                  <Wallet size={24} />
                </span>
                <h3>Kurtardığını kanıtla</h3>
                <p>
                  İndirimle kurtardığın ürünü ve fireye gideni ayır. Ay sonunda gerçek
                  tasarrufu gör.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="lp-cash">
          <div className="lp-container cash-grid">
            <div className="cash-copy">
              <p className="lp-eyebrow">
                <span aria-hidden="true" />
                Raf + kasa
              </p>
              <h2>
                Rafı kurtaran panel,
                <br />
                <em>kasadaki parayı da</em> görür.
              </h2>
              <p>
                Son kullanma tarihini takip ederken günün gelirini ve giderini de aynı
                yere yaz. Ay sonunda iki sorunun cevabı hazır: ne kadar fire verdim, ne
                kadar kazandım?
              </p>
              <ul className="cash-list">
                <li>
                  <span>
                    <Wallet size={18} />
                  </span>
                  <div>
                    <strong>Günlük gelir-gider</strong>
                    <small>Nakit, kart, havale; belge no ve KDV ile.</small>
                  </div>
                </li>
                <li>
                  <span>
                    <Receipt size={18} />
                  </span>
                  <div>
                    <strong>KDV özeti</strong>
                    <small>Hesaplanan ve indirilecek KDV; ay sonu tek bakış.</small>
                  </div>
                </li>
                <li>
                  <span>
                    <TrendingUp size={18} />
                  </span>
                  <div>
                    <strong>Aylık net kâr</strong>
                    <small>Gelir eksi gider; tüm zamanların bakiyesi.</small>
                  </div>
                </li>
              </ul>
              <Link to="/app/kasa" className="text-link">
                Kasa defterini aç
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="cash-visual">
              <div className="cash-card">
                <div className="cash-card-head">
                  <span>KASA · EKİM 2026</span>
                  <span className="cash-live">
                    <i />
                    CANLI
                  </span>
                </div>
                <span className="cash-label">BU AYIN NET KÂRI</span>
                <strong className="cash-total">+₺17.040</strong>
                <div className="cash-meters">
                  <div>
                    <span>Gelir</span>
                    <div>
                      <i className="cash-fill cash-fill--income" style={{ width: '100%' }} />
                    </div>
                    <strong>₺35.730</strong>
                  </div>
                  <div>
                    <span>Gider</span>
                    <div>
                      <i className="cash-fill cash-fill--expense" style={{ width: '52%' }} />
                    </div>
                    <strong>₺18.690</strong>
                  </div>
                </div>
                <div className="cash-lines">
                  <div>
                    <span>Gelir</span>
                    <strong>₺35.730</strong>
                  </div>
                  <div>
                    <span>Gider</span>
                    <strong>−₺18.690</strong>
                  </div>
                  <div>
                    <span>KDV ödenecek</span>
                    <strong>₺2.818</strong>
                  </div>
                </div>
                <div className="cash-card-foot">Örnek kasa özeti · tutarlar KDV dahil</div>
              </div>
              <div className="cash-sticker">
                <span>RAF + KASA</span>
                <strong>tek panel</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-roi">
          <div className="lp-container roi-grid">
            <div className="roi-copy">
              <p className="lp-eyebrow lp-eyebrow--light">
                <span aria-hidden="true" />
                Küçük bir hesap
              </p>
              <h2>
                Bir ürünü kurtarmak,
                <br />
                <em>bir ürünü çöpe atmaktan</em> karlı.
              </h2>
              <p>
                RafRadar’ın aylık ücretini çıkarmak için günde tek bir ürünü kurtarman
                yeterli. Gerisini kendi rafın söylesin.
              </p>
              <Link to="/app" className="button button--cream button--lg">
                Kendi rafını dene
                <ArrowRight size={17} />
              </Link>
            </div>
            <div className="roi-card">
              <div className="roi-card-head">
                <span>ÖRNEK HESAP</span>
                <span className="roi-tag">1 şube</span>
              </div>
              <div className="roi-line">
                <span>Günde kurtarılan ürün</span>
                <strong>1 ürün</strong>
              </div>
              <div className="roi-line">
                <span>Ortalama ürün değeri</span>
                <strong>₺90</strong>
              </div>
              <div className="roi-line">
                <span>Aylık kurtarılan değer</span>
                <strong>₺2.700</strong>
              </div>
              <div className="roi-line roi-line--muted">
                <span>RafRadar Pro</span>
                <strong>−₺299</strong>
              </div>
              <div className="roi-total">
                <span>Aylık net etki</span>
                <strong>+₺2.401</strong>
              </div>
              <p>Örnek hesaplama; kendi ürün fiyatlarınla değişir.</p>
            </div>
          </div>
        </section>

        <section className="lp-pricing" id="fiyatlar">
          <div className="lp-container">
            <div className="lp-section-head lp-section-head--center">
              <p className="lp-eyebrow">
                <span aria-hidden="true" />
                Fiyatlar
              </p>
              <h2>
                Rafına uygun
                <br />
                <em>net bir plan.</em>
              </h2>
              <p>14 gün ücretsiz. Kredi kartı istemiyoruz. İstediğin an iptal et.</p>
            </div>

            <div className="pricing-trust">
              <span>
                <Check size={13} />
                14 gün ücretsiz
              </span>
              <span>
                <Check size={13} />
                Kredi kartı yok
              </span>
              <span>
                <Check size={13} />
                İstediğin an iptal
              </span>
            </div>

            <div className="pricing-grid">
              {plans.map((plan) => (
                <article
                  key={plan.name}
                  className={`price-card ${plan.recommended ? 'price-card--featured' : ''}`}
                >
                  {plan.recommended ? (
                    <span className="price-badge">
                      <Sparkles size={13} />
                      En çok tercih edilen
                    </span>
                  ) : (
                    <span className="price-badge price-badge--empty" />
                  )}
                  <div className="price-head">
                    <h3>{plan.name}</h3>
                    <p>{plan.note}</p>
                  </div>
                  <div className="price">
                    <span className="price-currency">₺</span>
                    <strong>{plan.price}</strong>
                    <span className="price-period">{plan.period}</span>
                  </div>
                  <Link
                    to="/app"
                    className={`button ${
                      plan.recommended ? 'button--primary' : 'button--outline'
                    } button--block`}
                  >
                    {plan.cta}
                    <ArrowRight size={15} />
                  </Link>
                  <ul className="price-features">
                    {plan.features.map((feature) => (
                      <li key={feature}>
                        <Check size={14} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <p className="pricing-note">
              Fiyatlar KDV dahildir. Yıllık planda 2 ay hediye. Faturalandırma demo
              üründür; bu sayfada ödeme alınmaz.
            </p>
          </div>
        </section>

        <section className="lp-faq" id="sss">
          <div className="lp-container faq-grid">
            <div className="faq-copy">
              <p className="lp-eyebrow">
                <span aria-hidden="true" />
                SSS
              </p>
              <h2>
                Karar vermeden önce
                <br />
                <em>merak edilenler.</em>
              </h2>
              <p>
                Başka bir sorun mu var? Ürünü aç, 2 dakika kurcala. Cevabı rafın
                verecek.
              </p>
              <Link to="/app" className="text-link">
                Ürünü ücretsiz dene
                <ArrowRight size={15} />
              </Link>
            </div>
            <div className="faq-list">
              {faqs.map((faq) => (
                <details key={faq.q} className="faq-item">
                  <summary>
                    <span>{faq.q}</span>
                    <ChevronDown size={18} />
                  </summary>
                  <p>{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-final">
          <div className="lp-container lp-final-inner">
            <div>
              <p className="lp-eyebrow lp-eyebrow--light">
                <span aria-hidden="true" />
                Bugün başla
              </p>
              <h2>
                Bu hafta kaç ürün
                <br />
                <em>çöpe gidecek?</em>
              </h2>
              <p>İlk ürünü ekle, cevabı gör. Kredi kartı yok, kurulum yok.</p>
            </div>
            <Link to="/app" className="button button--cream button--xl">
              Rafı taramaya başla
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <div>
            <Logo />
            <p>Kafeler için son kullanma ve fire takibi.</p>
          </div>
          <div className="lp-footer-links">
            <a href="#urun">Ürün</a>
            <a href="#fiyatlar">Fiyatlar</a>
            <a href="#sss">SSS</a>
            <Link to="/app">Panele git</Link>
          </div>
          <p className="lp-footer-note">
            © 2026 RafRadar · Demo ürün, ödeme alınmaz.
          </p>
        </div>
      </footer>
    </div>
  );
}
