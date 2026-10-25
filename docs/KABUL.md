# KABUL — 22 madde / 100 puan

> Her madde kanıtla işaretlendi. S1 (canlı pitch) sunum anında yapılacak.

## A · Ürün fikri ve problem netliği (20)

- [x] **U1** (6p) Tek cümlede anlaşılan problem: “Rafındaki para çöpe gitmesin.”
- [x] **U2** (6p) Çözüm daha az adım: 10 saniyelik kayıt + tek ekranda TL riski.
- [x] **U3** (4p) Dar hedef kitle: 3-15 kişilik bağımsız kafeler/pastaneler.
- [x] **U4** (4p) “Neden bugün”: artan gıda maliyeti + görünmeyen fire.

## B · Çalışan ürün (25)

- [x] **C1** (10p) Uçtan uca akış: ürün ekle → dashboard → kurtar/fire → kalıcı sonuç.
- [x] **C2** (6p) SQLite kalıcılığı; sayfa yenileme ve DB kapat-aç testi geçti.
- [x] **C3** (4p) Sıfır veri: boş durum + “İlk ürünü ekle” + tek tık demo.
- [x] **C4** (5p) Boş ad, negatif miktar, geçersiz tarih → alan uyarısı; çökme yok.

## C · Teknik kalite (20)

- [x] **T1** (6p) `api/` ve `web/` ayrı; kökte `npm run dev` ikisini kaldırıyor.
- [x] **T2** (4p) zod doğrulama, `{error:{code,message,field?}}`; UI alan/toast’a çeviriyor.
- [x] **T3** (4p) README’de gerekçeli teknoloji seçimleri ve alınmayan kararlar.
- [x] **T4** (3p) `.env` + `.env.example`, `.gitignore`; anahtar koda gömülü değil.
- [x] **T5** (3p) Modüler dosyalar; 800 satırlık tek dosya yok, isimler anlamlı.

## D · Pazarlama (20)

- [x] **P1** (6p) Satış akışı: değer önerisi → problem → çözüm → 3 fayda → CTA.
- [x] **P2** (6p) 3 paket, net fiyat, özellikler, “En çok tercih edilen” Pro.
- [x] **P3** (4p) 6 gerçek itiraza SSS + gerçek ürün ekran görüntüsü.
- [x] **P4** (4p) Fayda dili: “randevu kaçırmayı bitirir” değil, “rafındaki para çöpe
  gitmesin”; teknoloji jargonu satış metninde yok.

## E · Pitch (10)

- [ ] **S1** (5p) 90 saniyede problem/çözüm/kitle/fiyat — `docs/PITCH.md` hazır,
  sesli prova sunumda yapılacak. Süre tutulacak.
- [x] **S2** (5p) Ürün yardımsız kullanılabiliyor: boş ekran, tek CTA, anlaşılır form,
  silme onayı, geri bildirim toast’ları.

## F · Süreç kanıtı (5)

- [x] **K1** (2p) `docs/PLAN.md` + YAPMAYACAKLARIM + `AGENTS.md`.
- [x] **K2** (1p) En az 5 anlamlı commit.
- [x] **K3** (2p) README: çalıştırma + “Ajanı nasıl sürdüm” bölümü.

## Koşulan testler

| Test | Sonuç |
| --- | --- |
| `npm run test:api` | 9/9 |
| HTTP sözleşme (health, CRUD, doğrulama, demo, CSV, 404) | 17/17 |
| Tarayıcı ürün akışı (boş → ekle → kurtar → düzenle → sil → mobil) | 13/13 |
| Tarayıcı demo/fire/mobil/hata | 5/5 |
| SQLite kapat-aç kalıcılığı | geçti |
| `npm run build` | geçti |

## Son kontrol

- [x] Veri `api/data/rafradar.db` dosyasında.
- [x] Satış sayfası ayrı dosya değil, aynı web projesinde `/` rotası.
- [x] Boş panoda demo veri yok; örnek veri yalnız kullanıcı isterse.
- [x] Ödeme alınmıyor; bu sayfada açıkça yazıyor.
- [x] Mobil 390px’te yatay taşma yok.
