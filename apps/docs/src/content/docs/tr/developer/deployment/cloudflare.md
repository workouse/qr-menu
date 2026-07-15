---
title: Cloudflare Dağıtımı
description: Uygulamaları Cloudflare'e nasıl dağıtırsınız
---

Uygulamalarımızı barındırmak için Cloudflare ekosistemini kullanıyoruz, böylece hızlı ve küresel olarak dağıtılmış olduklarından emin oluyoruz.

## Cloudflare Pages

`dashboard-ui` ve `docs` gibi ön yüz uygulamaları **Cloudflare Pages** kullanılarak dağıtılır.

1. GitHub deponuzu Cloudflare Pages'e bağlayın.
2. Uygun framework ön ayarını seçin (örn. React veya Astro).
3. Derleme (build) komutunu ayarlayın:
   - Dokümantasyon için: `pnpm --filter docs build`
   - Çıktı dizini: `apps/docs/dist`

## Cloudflare Workers

Arka uç API'leri veya belirli sunucusuz (serverless) fonksiyonlar **Cloudflare Workers** kullanılarak dağıtılır.

Workers'ı dağıtmak için `wrangler` kullanıyoruz. Manuel olarak dağıtmak için:
```bash
npx wrangler deploy
```
Kimlik doğrulaması yaptığınızdan (`npx wrangler login`) ve belirli uygulama/paket dizininde doğru `wrangler.json` veya `wrangler.toml` dosyasının yapılandırıldığından emin olun.
