# PLAN — RafRadar

## 1. Ürün kararı

| Soru | Cevap |
| --- | --- |
| **Kim?** | 3-15 kişilik, tek şubeli bağımsız kafeler ve pastaneler |
| **Hangi acı?** | Son kullanma tarihi yaklaşan ürünler fark edilmiyor; fire Excel/WhatsApp/hafızada tutuluyor ve ay sonunda TL kaybı bilinmiyor |
| **Nasıl çözüyor?** | Ürün + miktar + maliyet + son tarih tek ekranda; 7 günlük risk ve TL karşılığı otomatik |
| **Neden bugün?** | Gıda maliyetleri artıyor; aynı ürünü ikinci kez satın almak daha pahalı. Görünmeyen fire en sessiz gider |
| **Kaça?** | Başlangıç 149 TL/ay · Pro 299 TL/ay · Pro Yıllık 2.990 TL/yıl |
| **Tek aha akışı** | Ürün ekle → risk panelinde gör → kurtar/fire işaretle → özet güncellensin |
| **Bugün neyi kesiyorum?** | Auth, ödeme, çoklu şube, POS entegrasyonu, bildirim, barkod, grafik kütüphanesi |

### Tek cümle

> RafRadar, bağımsız kafelerin son kullanma tarihi yaklaşan ürünleri görüp kurtarmasını
> ve fireyi TL olarak ölçmesini sağlar.

## 2. Kapsam ve YAPMAYACAKLARIM

**Yapılacak (bu teslim):**

- Kolon yok; tek pano: ürün listesi + risk paneli.
- Ürün CRUD (ad, kategori, miktar, birim, birim maliyet, son tarih, not).
- Kurtarıldı / Fire / Rafa geri al.
- Dashboard: riskteki TL, bu hafta biten, kurtarılan, fire, kurtarma oranı, son hareketler.
- Arama, kategori ve durum filtresi.
- CSV dışa aktarma.
- Boş durum + tek tıkla 10 örnek ürün; hata/yükleniyor durumları.
- Satış sayfası + fiyatlandırma + SSS + gerçek ürün ekran görüntüsü.
- Mobil kullanılabilirlik, klavye (`N`, `/`, `Esc`).

**YAPMAYACAKLARIM:**

- Giriş/kayıt, şifre, e-posta doğrulama, rol/yetki.
- Gerçek ödeme/Stripe; fiyatlandırma tablosu satış sayfasında, ödeme alınmıyor.
- Çoklu şube, ekip yönetimi, kullanıcı daveti.
- POS, muhasebe, tedarikçi veya barkod entegrasyonu.
- Barkod okuyucu, kamera, fiş tarama, görsel yükleme.
- E-posta/SMS/push bildirimi; konsol simülasyonu bile yok.
- Grafik kütüphanesi, tahmin/ML, otomatik indirim önerisi.
- Mobil uygulama, masaüstü paketi, çoklu dil, karanlık tema.
- PDF/Excel dışa aktarma (yalnız CSV), yazdırma şablonu.
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
```

- `status = active` → rafta; `rescued` → kurtarıldı; `wasted` → fire.
- Toplam değer = `quantity × unit_cost`.
- Risk = aktif ve son tarihi ≤ 7 gün (geçmiş dahil) olan ürünlerin toplamı.
- Tarih yalnız gün olarak tutulur; gün sonu mantığıyla karşılaştırılır.
- İlk açılış boş; örnek veri yalnız kullanıcı isterse (`POST /api/demo`) eklenir.

## 4. Uç noktalar

| Metot | Yol | İş |
| --- | --- | --- |
| GET | `/api/health` | `{status:"ok"}` |
| GET | `/api/dashboard` | özet + aksiyon listesi + son hareketler + tüm ürünler |
| GET | `/api/items?status=&q=&category=` | filtrelenmiş liste |
| GET | `/api/items/:id` | tek ürün |
| POST | `/api/items` | yeni ürün |
| PATCH | `/api/items/:id` | kısmi güncelleme |
| DELETE | `/api/items/:id` | sil |
| POST | `/api/items/:id/rescue` | kurtarıldı |
| POST | `/api/items/:id/waste` | fire |
| POST | `/api/items/:id/reopen` | rafa geri al |
| POST | `/api/demo` | boş panoya 10 örnek ürün |
| GET | `/api/items/export.csv` | CSV indir |

Hata zarfı: `{ error: { code, message, field? } }` · 400 doğrulama, 404 kayıt yok.

## 5. Ekranlar

1. **`/` satış sayfası** — hero, problem, ürün/ekran görüntüsü, 3 fayda, ROI, 3 fiyat
   paketi, SSS, final CTA.
2. **`/app` ürün** —
   - boş durum: ilk ürün / örnek veri,
   - özet kartları,
   - “Aksiyon bekleyenler” + kurtar/fire,
   - kurtarma oranı + son hareketler + ipucu,
   - ürün tablosu, sekmeler, arama, kategori, CSV,
   - ürün ekle/düzenle modalı, silme onayı, rafa geri al.
3. **404** — ürün diliyle.

## 6. 60 dakikalık sıra (uygulanan)

| Dakika | İş |
| --- | --- |
| 0-5 | Fikir, hedef kitle, fiyat, tek aha akışı |
| 5-12 | PLAN + YAPMAYACAKLARIM + AGENTS + iskelet |
| 12-24 | SQLite şeması, CRUD, doğrulama, demo verisi |
| 24-38 | Panel: boş durum, özet, aksiyonlar, tablo, modal |
| 38-48 | Satış sayfası: metin, fiyat, SSS, gerçek ekran görüntüsü |
| 48-54 | Sessiz test: hatalı girdi, reload, mobil, fire, demo |
| 54-60 | README, pitch provası, son commit |

## 7. Riskler ve kararlar

- **Risk:** “Bir ürün daha” eklemek kapsamı şişirir. → YAPMAYACAKLARIM listesi.
- **Risk:** 60 dakikada Next.js kurulumu. → Vite + React Router; iki rota aynı projede.
- **Risk:** Grafik kütüphanesi. → Sayı + bar; gerçek değer daha önemli.
- **Risk:** Fiyat sayfasının ürünü abartması. → Yalnız gerçekten yapılan özellikler +
  CSV; ödeme/fatura demo olduğu açıkça yazılı.
- **Risk:** Jüri sıfır veriyle açınca boş ekran. → Boş durum, ilk adım ve tek tık demo.
- **Risk:** Hatalı girdi çökertir. → zod + alan bazlı hata + client validation.
- **Risk:** Sunucu kapanınca veri kaybı. → SQLite/WAL + kapat-aç testi.
