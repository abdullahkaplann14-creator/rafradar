# KABUL — 22 madde / 100 puan

> Her madde kanıtla işaretlendi. S1 (canlı pitch) sunum anında yapılacak.

## A · Ürün fikri ve problem netliği (20)

- [x] **U1** (6p) Tek cümlede anlaşılan problem: “Rafındaki para çöpe gitmesin; kasadaki
  para kaybolmasın.”
- [x] **U2** (6p) Daha az adım: 10 saniyelik ürün kaydı, tek ekranda TL riski; aynı
  panelde gelir-gider ve net kâr.
- [x] **U3** (4p) Dar hedef kitle: 3-15 kişilik bağımsız kafeler/pastaneler.
- [x] **U4** (4p) “Neden bugün”: artan gıda maliyeti + görünmeyen fire + dağınık kasa.

## B · Çalışan ürün (25)

- [x] **C1** (10p) Uçtan uca akış: ürün ekle → dashboard → kurtar/fire; kasaya gelir/gider
  → aylık özet → KDV → kalıcı sonuç.
- [x] **C2** (6p) SQLite kalıcılığı; sayfa yenileme ve DB kapat-aç testi ürün + kasa için geçti.
- [x] **C3** (4p) Sıfır veri: boş durum + “İlk ürünü ekle” + tek tık demo (10 ürün + 8 kasa).
- [x] **C4** (5p) Boş ad, negatif miktar, geçersiz tarih, yanlış kategori, sıfır tutar →
  alan uyarısı; ürün çökmüyor.

## C · Teknik kalite (20)

- [x] **T1** (6p) `api/` ve `web/` ayrı; kökte `npm run dev` ikisini kaldırıyor.
- [x] **T2** (4p) zod doğrulama, `{error:{code,message,field?}}`; UI alan/toast’a çeviriyor.
- [x] **T3** (4p) README’de gerekçeli teknoloji seçimleri ve alınmayan kararlar.
- [x] **T4** (3p) `.env` + `.env.example`, `.gitignore`; anahtar koda gömülü değil.
- [x] **T5** (3p) Modüler dosyalar; 800 satırlık tek dosya yok, isimler anlamlı.

## D · Pazarlama (20)

- [x] **P1** (6p) Satış akışı: değer önerisi → problem → çözüm → 3 fayda → CTA.
- [x] **P2** (6p) 3 paket, net fiyat, özellikler, “En çok tercih edilen” Pro; kasa ve
  KDV defteri paketlerde.
- [x] **P3** (4p) 7 gerçek itiraza SSS + gerçek ürün ekran görüntüsü.
- [x] **P4** (4p) Fayda dili: “rafındaki para çöpe gitmesin”; satış metninde teknoloji
  jargonu yok.

## E · Pitch (10)

- [ ] **S1** (5p) 90 saniyede problem/çözüm/kitle/fiyat — `docs/PITCH.md` hazır,
  sesli prova sunumda yapılacak. Süre tutulacak.
- [x] **S2** (5p) Ürün yardımsız kullanılabiliyor: boş ekran, tek CTA, anlaşılır formlar,
  silme onayı, kasa ve raf arasında net geçiş.

## F · Süreç kanıtı (5)

- [x] **K1** (2p) `docs/PLAN.md` + YAPMAYACAKLARIM + `AGENTS.md`.
- [x] **K2** (1p) En az 5 anlamlı commit.
- [x] **K3** (2p) README: çalıştırma + “Ajanı nasıl sürdüm” bölümü.

## Koşulan testler

| Test | Sonuç |
| --- | --- |
| `npm run test:api` | 12/12 |
| HTTP ürün sözleşmesi | 17/17 |
| HTTP kasa sözleşmesi (gelir/gider/KDV/ay/CSV) | 12/12 |
| Tarayıcı ürün akışı | 13/13 |
| Tarayıcı demo/fire/mobil/hata | 5/5 |
| Tarayıcı kasa akışı | 11/11 |
| SQLite kapat-aç (ürün + kasa) | geçti |
| `npm run build` | geçti |

## Kasa modülü son kontrol

- [x] Gelir/gider ekleme, düzenleme, onaylı silme.
- [x] Aylık gelir, gider, net kâr, KDV özeti; tüm zamanların neti.
- [x] Ay seçici + “Bu ay”; tür, kategori ve metin filtresi.
- [x] KDV oranı 0/1/10/20; tutarlar KDV dahil.
- [x] Ödeme yöntemi ve belge no.
- [x] CSV (seçili ay).
- [x] Dashboard’da kasa özeti + kasa sayfasına geçiş.
- [x] Mobilde yatay taşma yok; “Yeni işlem” butonu görünür.

## Son kontrol

- [x] Veri `api/data/rafradar.db` dosyasında.
- [x] Satış sayfası ayrı dosya değil, aynı web projesinde `/` rotası.
- [x] Boş panoda demo veri yok; örnek veri yalnız kullanıcı isterse.
- [x] Ödeme alınmıyor; bu sayfada açıkça yazıyor.
- [x] Mobil 390px’te yatay taşma yok.
