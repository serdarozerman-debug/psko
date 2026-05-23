# Sürüm Notları

PSKO için tüm önemli değişiklikler burada belgelenir.
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) biçimi ve
[Semantic Versioning](https://semver.org/spec/v2.0.0.html) kuralları izlenir.

## [0.2.0] — 2026-05-18 — Phase 2 Sertleştirme

### Eklendi
- **Sunucu yetkili faz geçişleri.** Yeni `validatePhaseTransition(approach, fromPhase, toPhase)` yardımcısı geri sıçramaları, çoklu-faz atlamalarını ve bilinmeyen yaklaşım geçişlerini reddeder.
- **`POST /api/session/phase`** yönetici/kurtarma amaçlı geçiş uç noktası; `app_metadata.role === 'admin'` ile korunur. Yasa dışı sıçramalarda `409` döndürür.
- **`HybridFrameworkViewer`** — seans sonrası inceleme ekranında 2–3 terapötik çerçevenin yan yana, salt-okunur karşılaştırması. Duyarlı (3/2/1 sütun); arayüz Türkçedir.
- **Playwright E2E test paketi** dört senaryoyla iskele halinde: öğrenci mutlu yolu, faz ilerlemesi, intake doğrulama, seans devam ettirme. axe-core erişilebilirlik denetimi yardımcısı dahildir.
- **OpenAPI 3.1 sözleşmesi** `public/openapi.json` dosyasına üretilir (`scripts/generate-openapi.ts`). Swagger UI `/api/docs` adresinde, kimlik doğrulamalı olarak yayınlanır.
- **Kapsama eşikleri** `vitest.config.mjs` içinde: satır > %85, dal > %80. `npm run test:coverage` ile zorlanır.
- `detect-phase.ts` için sınır durum birim testleri (son faz, bilinmeyen yaklaşım, negatif tur).
- `docs/deployment.md` dağıtım kılavuzu (Türkçe sürümü mevcut).

### Değişti
- **`GET /api/session/phase`** artık fazın kalıcılaştırılmasını bekler; yazma hatasında `500` döndürür (önceden "fire-and-forget" idi). Yasa dışı geçişler `200` durumuyla `{ blocked: true, attempted, reason }` döndürür ve veritabanını değiştirmez.

### Güvenlik
- Faz değişiklikleri artık sunucu tarafında doğrulanır; manipüle edilmiş bir istemci fazları atlayamaz veya tekrar oynayamaz.

### Notlar
- Şema göçü yoktur.
- Mevcut tüm API yanıtları geri uyumludur (yeni alanlar yalnızca eklemedir).
- Türkçe (`tr`) birincil arayüz dilidir; yeni metinlerin tamamı Türkçe yazılmıştır.

## [0.1.0] — 2026-05-16 — Klinik Zekâ Motoru

İlk Phase 2 sürümü: faz motoru, çerçeve kayıt defteri, intake formülasyonu,
seans yaşam döngüsü uç noktaları.
