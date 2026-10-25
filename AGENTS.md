# AGENTS.md — RafRadar

## Ürün

**RafRadar**, 3-15 kişilik bağımsız kafe ve pastanelerin son kullanma tarihini ve fireyi
takip ettiği bir üründür. Tek aha akışı:

> Ürünü 10 saniyede ekle → bu hafta riskteki ürünleri ve TL karşılığını gör →
> kurtar veya fireye ayır → özet anında güncellensin.

## Yığın ve portlar

- **api/** — Express 4 + TypeScript + `node:sqlite` + zod. Port **4000**.
- **web/** — Vite + React 18 + TypeScript + React Router + TanStack Query. Port **5174**.
- Stil: el yazımı CSS (`web/src/styles.css`). Tailwind yok.
- Kök: npm workspaces + `concurrently`.
- Satış sayfası `/`, ürün paneli `/app` — aynı web projesinde iki rota.

## Komutlar

```bash
npm install
npm run dev        # api :4000 + web :5174
npm run test:api   # API duman testleri (geçici DB)
npm run demo       # 10 örnek ürün ekle (pano boşsa)
npm run reset      # tüm ürünleri sil
npm run build      # web tip kontrolü + üretim derlemesi
```

## Değişmez kurallar

1. Portlar: **4000** / **5174**. API adresi istemcide mutlak yazılmaz; Vite proxy kullanır.
2. Arayüzde sabit ürün/pano verisi yoktur. Her şey API'den gelir.
3. Veri `api/data/rafradar.db` dosyasında kalıcıdır. Bellek dizisi kullanılmaz.
4. Hatalar `{ error: { code, message, field? } }` zarfıyla döner; UI bunu alan uyarısı
   veya toast'a çevirir.
5. Doğrulama zod ile: ad 2-80, miktar > 0, maliyet ≥ 0, gerçek takvim tarihi.
6. Boş/hatalı girdi ürünü çökertmez. `400`, `404`, `500` ayrımı korunur.
7. Kapsam: `docs/PLAN.md` içindeki **YAPMAYACAKLARIM** listesi bağlayıcıdır.
8. Her yeşil adımda anlamlı commit: `feat:`, `fix:`, `test:`, `docs:`.
9. Test edilmeyen özellik "bitti" sayılmaz.
10. Satış sayfası metni müşteri dilindedir; teknoloji jargonu kullanılmaz.
