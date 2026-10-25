# PLAN — RafRadar

## 1. Ürün kararı

| Soru | Cevap |
| --- | --- |
| **Kim?** | 3-15 kişilik, tek şubeli bağımsız kafeler ve pastaneler |
| **Hangi acı?** | Son kullanma tarihi yaklaşan ürünler fark edilmiyor; fire Excel/WhatsApp/hafızada. Günlük gelir-gider ise ayrı bir defterde kayboluyor |
| **Nasıl çözüyor?** | Ürün + son tarih tek ekranda; 7 günlük risk ve TL karşılığı otomatik. Gelir-gider, ödeme yöntemi ve KDV aynı panelde; ay sonu net kâr hazır |
| **Neden bugün?** | Gıda maliyetleri artıyor; görünmeyen fire ve dağınık kasa en sessiz iki gider |
| **Kaça?** | Başlangıç 149 TL/ay · Pro 299 TL/ay · Pro Yıllık 2.990 TL/yıl |
| **Tek aha akışı** | Ürün ekle → riski gör → kurtar/fire işaretle → kasaya gelir/gider yaz → net kârı ve KDV'yi gör |
| **Bugün neyi kesiyorum?** | Auth, gerçek ödeme, e-fatura, banka/POS, çoklu şube, bildirim, barkod, grafik kütüphanesi |

### Tek cümle

> RafRadar, bağımsız kafelerin rafındaki fireyi ve kasasındaki parayı tek ekranda
> görünür kılar; günlük kararı verir.

## 2. Kapsam ve YAPMAYACAKLARIM

**Yapılacak (bu teslim):**

- Ürün CRUD (ad, kategori, miktar, birim, birim maliyet, son tarih, not).
- Kurtarıldı / Fire / Rafa geri al.
- Dashboard: riskteki TL, bu hafta biten, kurtarılan, fire, kurtarma oranı.
- **Kasa:** gelir/gider CRUD, tutar, tarih, açıklama, kategori, ödeme yöntemi, belge no,
  KDV oranı, not.
- **Aylık kasa özeti:** gelir, gider, net kâr, hesaplanan/indirilecek/ödenecek KDV,
  tüm zamanların neti.
- Ay seçici, tür/kategori/metin filtresi, kasa CSV.
- Boş durum + tek tıkla 10 ürün + 8 kasa kaydı; hata/yükleniyor durumları.
- Satış sayfası + **raf + kasa** bölümü + fiyatlandırma + SSS + gerçek ürün ekran görüntüsü.
- Mobil kullanılabilirlik, klavye (`N`, `/`, `Esc`).

**YAPMAYACAKLARIM:**

- Giriş/kayıt, şifre, e-posta doğrulama, rol/yetki.
- Gerçek ödeme/Stripe; fiyatlandırma tablosu satış sayfasında, ödeme alınmıyor.
- **Tam muhasebe:** e-fatura, KDV beyannamesi, mizan, banka mutabakatı yok.
- **Banka/POS entegrasyonu**, otomatik işlem içe aktarma.
- Çoklu şube, ekip yönetimi, kullanıcı daveti.
- Barkod okuyucu, kamera, fiş tarama, görsel yükleme.
- E-posta/SMS/push bildirimi; hatırlatma otomasyonu yok.
- Grafik kütüphanesi, tahmin/ML, otomatik indirim önerisi.
- Mobil uygulama, masaüstü paketi, çoklu dil, karanlık tema.
- PDF dışa aktarma; yalnız CSV.
- Ürün reçetesi, maliyet muhasebesi, tedarik siparişi.

## 3. Veri şeması (SQLite)

```sql
CREATE TABLE items (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  quantity    REAL NOT NULL,
  unit        TEXT NOT NULL,
  unit_cost   REAL NOT NULL,
  expiry_date TEXT NOT NULL,           -- YYYY-MM-DD
  note        TEXT,
  status      TEXT NOT NULL DEFAULT 'active', -- active | rescued | wasted
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  resolved_at TEXT
);

CREATE TABLE transactions (
  id             TEXT PRIMARY KEY,
  type           TEXT NOT NULL,        -- income | expense
  category       TEXT NOT NULL,
  amount         REAL NOT NULL,        -- KDV dahil
  date           TEXT NOT NULL,        -- YYYY-MM-DD
  description    TEXT NOT NULL,
  payment_method TEXT NOT NULL,        -- Nakit | Kart | Havale
  document_no    TEXT,
  vat_rate       INTEGER NOT NULL DEFAULT 0,
  note           TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);
```

- Ürün riski: aktif ve son tarihi ≤ 7 gün (geçmiş dahil) olan ürünlerin toplam değeri.
- Kasa neti: aylık gelir − aylık gider.
- KDV payı: `tutar × oran / (100 + oran)`; gelir KDV'si − gider KDV'si = ödenecek.
- Tüm tutarlar KDV dahildir. İlk açılış boş; örnek veri yalnız kullanıcı isterse.

## 4. Uç noktalar

| Metot | Yol | İş |
| --- | --- | --- |
| GET | `/api/health` | `{status:"ok"}` |
| GET | `/api/dashboard` | ürün özeti + kasa özeti + aksiyon + son hareketler |
| GET | `/api/accounting?month=YYYY-MM` | aylık kasa özeti + işlemler + kategoriler |
| GET | `/api/items?status=&q=&category=` | filtrelenmiş ürünler |
| POST | `/api/items` | yeni ürün |
| PATCH | `/api/items/:id` | kısmi güncelleme |
| DELETE | `/api/items/:id` | sil |
| POST | `/api/items/:id/rescue` | kurtarıldı |
| POST | `/api/items/:id/waste` | fire |
| POST | `/api/items/:id/reopen` | rafa geri al |
| GET | `/api/transactions?month=&type=&q=&category=` | kasa listesi |
| POST | `/api/transactions` | yeni gelir/gider |
| PATCH | `/api/transactions/:id` | kısmi güncelleme |
| DELETE | `/api/transactions/:id` | sil |
| GET | `/api/items/export.csv` | ürün CSV |
| GET | `/api/transactions/export.csv?month=` | kasa CSV |
| POST | `/api/demo` | boş panoya ürün + kasa örneği |

Hata zarfı: `{ error: { code, message, field? } }` · 400 doğrulama, 404 kayıt yok.

## 5. Ekranlar

1. **`/` satış sayfası** — hero, problem, ürün/ekran görüntüsü, 3 fayda, raf + kasa
   bölümü, ROI, 3 fiyat paketi, SSS, final CTA.
2. **`/app` ürün** — boş durum, özet kartları, aksiyon listesi, kurtarma oranı, son
   hareketler, **kasa özeti**, ürün tablosu, modallar.
3. **`/app/kasa` kasa** — ay seçici, 4 özet kartı, tür/kategori/metin filtresi,
   gelir-gider tablosu, işlem modalı, CSV, boş/hata/yükleniyor, mobil.
4. **404** — ürün diliyle.

## 6. 60 dakikalık sıra (uygulanan)

| Dakika | İş |
| --- | --- |
| 0-5 | Fikir, hedef kitle, fiyat, tek aha akışı |
| 5-12 | PLAN + YAPMAYACAKLARIM + AGENTS + iskelet |
| 12-22 | SQLite şeması, ürün CRUD, doğrulama, demo |
| 22-32 | Panel: boş durum, özet, aksiyonlar, tablo, modal |
| 32-42 | Kasa: gelir-gider CRUD, aylık özet, KDV, CSV |
| 42-50 | Satış sayfası + fiyat + SSS + gerçek ekran görüntüsü |
| 50-56 | Sessiz test: hatalı form, reload, mobil, fire, kasa, demo |
| 56-60 | README, pitch provası, son commit |

## 7. Riskler ve kararlar

- **Risk:** “Bir özellik daha” kapsamı şişirir. → YAPMAYACAKLARIM listesi.
- **Risk:** Tam muhasebe bataklığı. → Yalnız günlük gelir-gider + KDV özeti; e-fatura yok.
- **Risk:** 60 dakikada Next.js. → Vite + React Router; üç rota aynı projede.
- **Risk:** KDV yanlış hesaplanır. → Tek formül, iki tarafta aynı; testli.
- **Risk:** Jüri sıfır veriyle açınca boş ekran. → Boş durum, ilk adım ve tek tık demo.
- **Risk:** Hatalı girdi çökertir. → zod + alan bazlı hata + client validation.
- **Risk:** Sunucu kapanınca veri kaybı. → SQLite/WAL + kapat-aç testi.
- **Risk:** İki modül birbirini bozar. → Aynı DB, ayrı tablolar; dashboard tek sorguda
  iki özeti birleştirir.
