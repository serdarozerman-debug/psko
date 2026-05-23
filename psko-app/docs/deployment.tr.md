# PSKO Dağıtım Kılavuzu

> Hedef kitle: PSKO'yu staging veya prodüksiyona alan operasyon / lider mühendis.

## 1. Dağıtım öncesi kontrol listesi

- [ ] `npm test` — tüm birim testleri yeşil
- [ ] `npm run test:coverage` — kapsama eşikleri karşılanıyor (satır > %85, dal > %80)
- [ ] `npm run test:e2e` — Playwright paketi staging'e karşı yeşil
- [ ] `npm run lint` — hata yok
- [ ] `CHANGELOG.tr.md` yeni sürüm girdisiyle güncellendi
- [ ] OpenAPI yeniden oluşturuldu: `npx tsx scripts/generate-openapi.ts`

## 2. Ortam değişkenleri (Vercel proje ayarları)

| Değişken | Amaç |
|---|---|
| `DATABASE_URL` | Supabase Postgres bağlantı dizesi (havuzlanmış) |
| `DIRECT_URL` | Prisma göçü için doğrudan (havuzsuz) URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Genel Supabase REST URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Genel anon anahtarı |
| `SUPABASE_SERVICE_ROLE_KEY` | Sadece sunucu; asla ifşa etmeyin |
| `ANTHROPIC_API_KEY` | Claude API anahtarı |
| `NEXT_PUBLIC_APP_URL` | Kanonik uygulama URL'si (`https://psko.app`) |

## 3. Veritabanı göçü

```bash
cd psko-app
npx prisma migrate deploy --schema prisma/schema.prisma
npm run seed   # idempotent — eksikse personaları yeniden ekler
```

## 4. Dağıtım

```bash
git checkout main
git pull --ff-only
git push origin main
```

Manuel:

```bash
vercel --prod
```

## 5. Dumanlı testler (dağıtım sonrası)

- [ ] `GET https://psko.app/` 200 döndürüyor
- [ ] `GET https://psko.app/api/health` `{ ok: true }` döndürüyor
- [ ] QA fikstür hesabıyla giriş yap
- [ ] Seans başlat, bir mesaj gönder, seansı bitir
- [ ] Giriş yaptıktan sonra `https://psko.app/api/docs` Swagger UI yükleniyor
- [ ] Son 10 dakikadaki Vercel günlüklerinde işlenmemiş hata var mı kontrol et

## 6. Geri alma

Bir dağıtım prodüksiyonu bozarsa:

1. Vercel panosunda → Deployments → önceki yeşil dağıtım → "Promote to Production".
2. Sorun DB göçündeyse:
   ```bash
   npx prisma migrate resolve --rolled-back <göç_adı>
   ```
   ardından önceki uygulama sürümünü yeniden dağıt.
3. Post-mortem girdisini `docs/releases/CHANGELOG.tr.md` altında `[Yayınlanmamış]` başlığıyla ekle.

## 7. İzleme

- Vercel Analytics — istek hacmi ve uç noktası gecikmesi
- Supabase paneli — DB bağlantıları, yavaş sorgular
- Sentry (etkinse) — hata oranı
- `[phase] blocked transition` uyarılarını takip et — sürekli bir artış istemci manipülasyonu veya faz motoru gerilemesini gösterir.
