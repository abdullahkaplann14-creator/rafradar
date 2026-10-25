# AGENTS.md — RafRadar

## Ürün

**RafRadar**, 3-15 kişilik bağımsız kafe ve pastanelerin **rafını ve kasasını** takip
ettiği bir üründür. Tek aha akışı:

> Ürünü 10 saniyede ekle → bu hafta riskteki ürünleri ve TL karşılığını gör →
> kurtar veya fireye ayır → gelir-gideri kasaya yaz → net kârı ve KDV'yi gör.

## Yığın ve portlar

- **api/** — Express 4 + TypeScript + `node:sqlite` + zod. Port **4000**.
- **web/** — Vite + React 18 + TypeScript + React Router + TanStack Query. Port **5174**.
- Stil: el yazımı CSS (`web/src/styles.css`). Tailwind yok.
- Kök: npm workspaces + `concurrently`.
- Rotalar: satış `/`, panel `/app`, kasa `/app/kasa`.

## Komutlar

```bash
npm install
npm run dev        # api :4000 + web :5174
npm run test:api   # API duman testleri (geçici DB)
npm run demo       # 10 ürün + 9 kasa kaydı ekle (pano boşsa)
npm run reset      # tüm ürünleri ve kasa kayıtlarını sil
npm run build      # web tip kontrolü + üretim derlemesi
```

## Değişmez kurallar

1. Portlar: **4000** / **5174**. API adresi istemcide mutlak yazılmaz; Vite proxy kullanır.
2. Arayüzde sabit ürün/kasa verisi yoktur. Her şey API'den gelir.
3. Veri `api/data/rafradar.db` dosyasında kalıcıdır. Bellek dizisi kullanılmaz.
4. Hatalar `{ error: { code, message, field? } }` zarfıyla döner; UI bunu alan uyarısı
   veya toast'a çevirir.
5. Ürün doğrulaması: ad 2-80, miktar > 0, maliyet ≥ 0, gerçek takvim tarihi.
6. Kasa doğrulaması: tutar > 0, açıklama 2-120, tür ve kategori uyumlu, KDV 0/1/10/20.
   Tutarlar KDV dahildir; KDV payı `tutar × oran / (100 + oran)`. Satılmadı işaretli
   gelir ciroya ve KDV'ye girmez; yalnız satılan gelir hesaba katılır.
7. Boş/hatalı girdi ürünü çökertmez. `400`, `404`, `500` ayrımı korunur.
8. Kapsam: `docs/PLAN.md` içindeki **YAPMAYACAKLARIM** listesi bağlayıcıdır.
9. Her yeşil adımda anlamlı commit: `feat:`, `fix:`, `test:`, `docs:`.
10. Test edilmeyen özellik "bitti" sayılmaz.
11. Satış sayfası metni müşteri dilindedir; teknoloji jargonu kullanılmaz.
