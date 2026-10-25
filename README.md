# RafRadar

**Kafeler için raf ve kasa kontrolü.**  
Son kullanma tarihini, fireyi ve günlük gelir-gideri tek panelde görünür kılar.

![RafRadar paneli](web/public/app-preview.png)

> 3-15 kişilik bağımsız kafeler ve pastaneler için. Pro plan **299 TL/ay**.
> 14 gün ücretsiz, kredi kartı yok.

## Neden var?

Küçük kafelerde iki sessiz kayıp vardır: **raf** ve **kasa**. Son kullanma tarihi
yaklaşan ürün fark edilmez; fire Excel’de, WhatsApp’ta veya kafada tutulur. Günün
geliri ve gideri ise ayrı bir defterde kaybolur. Ay sonunda “ne kadar fire verdim, ne
kadar kazandım?” sorusunun net cevabı yoktur.

RafRadar iki işi aynı yerde tutar:

> Ürünü 10 saniyede ekle → 7 günlük riski ve TL karşılığını gör → kurtar veya fireye
> ayır → gelir-gideri kasaya yaz → net kârı ve KDV’yi gör.

## Hızlı başlangıç

Gereksinim: **Node.js 24+** (yerleşik `node:sqlite` kullanılır) ve npm.

```bash
npm install
npm run dev
```

- Satış sayfası: **http://localhost:5174**
- Ürün paneli: **http://localhost:5174/app**
- Kasa defteri: **http://localhost:5174/app/kasa**
- API: **http://localhost:4000/api/health**

İlk açılışta pano **boştur**; boş ekrandaki “İlk ürünü ekle” veya “Örnek 10 ürünle
keşfet” ile başlanır. Örnek yükleme aynı zamanda 8 kasa kaydı ekler. Veri
`api/data/rafradar.db` dosyasında kalıcıdır.

### Diğer komutlar

```bash
npm run demo       # 10 ürün + 8 kasa kaydı ekle (pano boşsa)
npm run reset      # tüm ürünleri ve kasa kayıtlarını sil
npm run test:api   # API duman testleri (geçici DB)
npm run build      # tip kontrolü + üretim derlemesi
```

Tek tek çalıştırma: `npm run dev:api`, `npm run dev:web`.

## Ürün

### Satış sayfası (`/`)

Değer önerisi → problem → gerçek ürün ekranı → 3 fayda → **raf + kasa** bölümü →
örnek ROI → 3 fiyat paketi → 7 itiraza SSS → CTA. Fiyatlar KDV dahil ve net; ödeme
alınmıyor, bu sayfada açıkça belirtiliyor.

### Panel (`/app`)

- **Ürün ekle/düzenle/sil:** ad, kategori, miktar + birim, birim maliyet, son tarih, not.
- **Risk paneli:** 7 gün içinde bitecek veya tarihi geçmiş ürünler, kalan gün ve TL değeri.
- **Kurtardım / Fire:** tek tıkla sonuç; özet, kurtarma oranı ve son hareketler güncellenir.
- **Rafa geri al:** yanlış işaretlenen ürün tekrar aktif olur.
- **Kasa özeti:** bu ayın geliri, gideri, net kârı ve KDV’si; kasa defterine tek tık.
- **Arama, kategori ve durum sekmeleri.**
- **CSV dışa aktarma** (ürünler).
- **Boş / yükleniyor / hata** durumları; boş panoda ilk adım ve demo.
- **Klavye:** `N` yeni ürün, `/` arama, `Esc` modal kapat.
- **Mobil:** 390px’te tablo kart görünümüne döner, yatay taşma yok.

### Kasa (`/app/kasa`)

- **Gelir / gider kaydı:** tutar, tarih, açıklama, kategori, ödeme yöntemi, belge no,
  KDV oranı, not.
- **Aylık özet:** gelir, gider, net kâr, hesaplanan/indirilecek KDV ve ödenecek KDV.
- **Ay seçici:** önceki/sonraki ay ve “Bu ay”.
- **Kategori, tür ve metin filtresi.**
- **Düzenleme ve onaylı silme.**
- **CSV dışa aktarma** (seçili ay).
- **Kalıcılık:** tüm kayıtlar aynı SQLite dosyasında; yenileme ve kapat-aç testi geçti.
- **KDV mantığı:** tutarlar KDV dahildir; KDV payı `tutar × oran / (100 + oran)` ile
  hesaplanır. Bu modül e-fatura/beyan yerine geçmez.

## Teknoloji seçimleri ve gerekçeleri

| Katman | Seçim | Neden? |
| --- | --- | --- |
| API | **Express 4 + TypeScript** | En tanıdık HTTP katmanı; rotalar ve hata zarfı tek yerde. |
| Doğrulama | **zod** | Alan bazlı Türkçe hata mesajları; 400/404 ayrımı net. |
| Veritabanı | **node:sqlite (SQLite/WAL)** | Tek dosya, sunucu yok. İki modül de aynı veritabanında; Prisma’nın şema/CLI yükü 60 dakikada gereksiz risk. |
| Web | **Vite + React 18 + TypeScript** | Satış sayfası, raf ve kasa aynı projede üç rota. Hızlı HMR, küçük kurulum. |
| Rotalar | **React Router** | `/`, `/app`, `/app/kasa` ayrımı; satış sayfası ayrı proje değil. |
| Veri çekme | **TanStack Query** | Loading/error/cache/invalidation tek yerde; kasa ve panel birbirini tazeler. |
| Stil | **El yazımı CSS** | Krem–orman–domates editoryal yönü; jenerik Tailwind/shadcn görünümünden kaçınmak. |
| Çalıştırma | **npm workspaces + concurrently** | Kökte `npm run dev` → iki proje birlikte. |

**Almadığım kararlar:** Next.js (bu ölçekte Vite yeterli), Prisma (iki tablo için
gereksiz), gerçek ödeme/e-fatura (rubrik istemiyor, zaman riski), auth (tek kullanıcı
varsayımı serbest), grafik kütüphanesi (sayı + bar yeterli), Tailwind (özgün tasarım).

## Klasör yapısı

```
rafradar/
├── api/
│   └── src/
│       ├── index.ts          rotalar, zod, hata zarfı
│       ├── db.ts             şema, ürün + kasa, dashboard, demo, CSV
│       ├── env.ts            .env yükleme, port/DB yolu
│       ├── demo.ts           ürün + kasa örnek verisi
│       ├── reset.ts          temizleme
│       └── smoke.ts          duman testleri
├── web/
│   └── src/
│       ├── landing/          satış sayfası (/)
│       ├── product/          panel (/app), kasa (/app/kasa), modallar
│       ├── components/       logo, toast, ürün üst barı
│       ├── hooks/            ürün ve kasa mutation katmanı
│       ├── api.ts            tipli fetch istemcisi
│       ├── utils.ts          TL/tarih/ay/KDV/Türkçe arama
│       └── styles.css        tasarım sistemi
├── docs/
│   ├── PLAN.md               kapsam + YAPMAYACAKLARIM
│   ├── PITCH.md              90 saniyelik metin
│   └── KABUL.md              22 maddelik kontrol
├── .env.example
└── package.json
```

## API özeti

| Metot | Yol | İş |
| --- | --- | --- |
| GET | `/api/dashboard` | ürün özeti + kasa özeti + aksiyon + son hareketler |
| GET | `/api/accounting?month=YYYY-MM` | aylık kasa özeti + işlemler + kategoriler |
| GET | `/api/items?status=&q=&category=` | filtreli ürün listesi |
| POST | `/api/items` | 201 · yeni ürün |
| PATCH | `/api/items/:id` | 200 · kısmi güncelleme |
| DELETE | `/api/items/:id` | 204 |
| POST | `/api/items/:id/rescue` | kurtarıldı |
| POST | `/api/items/:id/waste` | fire |
| POST | `/api/items/:id/reopen` | rafa geri al |
| POST | `/api/transactions` | 201 · gelir/gider |
| PATCH | `/api/transactions/:id` | 200 · kısmi güncelleme |
| DELETE | `/api/transactions/:id` | 204 |
| GET | `/api/transactions?month=&type=&q=&category=` | kasa listesi |
| GET | `/api/items/export.csv` | ürün CSV |
| GET | `/api/transactions/export.csv?month=` | kasa CSV |
| POST | `/api/demo` | boş panoya ürün + kasa örneği |

Hatalar: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "field": "..." } }`.

## Veri modeli

- `items`: ürün, kategori, miktar/birim, birim maliyet, son tarih, not, durum.
- `transactions`: tür (gelir/gider), kategori, tutar, tarih, açıklama, ödeme yöntemi,
  belge no, KDV oranı, not.
- Ürün durumu: `active | rescued | wasted`. Kasa türü: `income | expense`.
- Tüm tutarlar TL ve KDV dahildir.

## Ortam değişkenleri

```bash
cp .env.example .env       # Windows: copy .env.example .env
```

| Değişken | Varsayılan | Açıklama |
| --- | --- | --- |
| `API_PORT` | `4000` | Express portu |
| `WEB_PORT` | `5174` | Vite portu |
| `DB_PATH` | `api/data/rafradar.db` | SQLite dosyası (köke göre) |

`.env` git’e girmez; `.env.example` girer. Kodda gömülü anahtar yoktur. Gerçek ürün
e-posta servisi eklenecekse anahtar yalnız `.env`’e konur (bu demoda kullanılmıyor).

## Doğrulama

- `npm run test:api` → **12/12** (ürün + kasa + KDV + demo + CSV).
- HTTP sözleşme → **17/17** ürün; **12/12** kasa (aylık özet, KDV, ay/tür filtresi,
  doğrulama, CSV, 404).
- Tarayıcı ürün akışı → **13/13**; demo/fire/mobil/hata → **5/5**.
- Tarayıcı kasa akışı → **11/11** (boş form, gelir/gider, KDV, arama, düzenleme,
  silme, yenileme, dashboard özeti, mobil).
- SQLite kapat-aç → ürün, kasa ve toplamlar yerinde.
- `npm run build` → başarılı.

## Ajanı nasıl sürdüm?

1. **Fikri ve fiyatı ben kilitledim.** Geniş “kafe yönetimi” yerine 3-15 kişilik
   bağımsız kafelerin iki somut acısını seçtim: fire ve günlük kasa.
2. **Önce kapsamı kestim.** `docs/PLAN.md` içindeki YAPMAYACAKLARIM listesiyle auth,
   gerçek ödeme, e-fatura, çoklu şube, POS ve bildirimleri dışarıda bıraktım.
3. **Tek dikey dilim istedim.** Önce ürün ekleme → dashboard → kurtarma; sonra kasa
   kaydı → aylık özet → KDV → CSV. Her adımda çalışan bir ürün kaldı.
4. **Doğrulamayı önce kurdum.** Boş ad, negatif miktar, geçersiz tarih, yanlış kategori,
   sıfır tutar ve bozuk JSON için testler yazdım; UI bunları alan uyarısına çeviriyor.
5. **Ürünü yabancı gibi kullandım.** Puppeteer ile sıfır veri, hatalı form, kaydet,
   yenile, kurtar, fire, kasa ekle/düzenle/sil, ay filtresi ve mobil senaryolarını koşturdum.
6. **Görsel geri bildirimle düzelttim.** Footer sıkışması, SSS başlığı, kasa kartındaki
   dekorun değerleri örtmesi ve mobilde gizlenen “Yeni işlem” butonunu ekran görüntüsüne
   bakarak düzelttim.
7. **Abartı eklemedim.** Olmayan özelliği satmadım: ödeme alınmadığını, faturalandırmanın
   ve kasa modülünün tam muhasebe/e-fatura olmadığını açıkça yazdım.

## Bilinen sınırlar

- Tek kullanıcı; giriş yok (yarışma kapsamı gereği).
- Ödeme/fatura yok; fiyatlandırma satış sayfasında, CTA ürünü açıyor.
- Kasa modülü **tam muhasebe değil**: e-fatura, KDV beyanı, banka/POS entegrasyonu yok.
- Çoklu şube ve barkod yok.
- Demo verisi yalnız boş panoya yüklenir; `npm run reset` ile temizlenir.

## Lisans

MIT — bkz. [LICENSE](LICENSE).
