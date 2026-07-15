---
title: Yerel Kurulum
description: QR Menü projesini yerel bilgisayarınızda nasıl çalıştırırsınız
---

Bu rehber, geliştirme amacıyla QR Menü projesini yerel bilgisayarınızda nasıl kuracağınızı kapsar.

## Ön Koşullar
- Node.js (v26.2.0 önerilir - `nvm` kullanın)
- `pnpm` paket yöneticisi
- Bir Cloudflare hesabı (Wrangler için)

## Kurulum

1. **Depoyu klonlayın**
   ```bash
   git clone <repository-url>
   cd qr-menu
   ```

2. **Doğru Node sürümünü kullanın**
   ```bash
   nvm use
   ```

3. **Bağımlılıkları yükleyin**
   ```bash
   pnpm install
   ```

## Projeyi Çalıştırma

Tüm monorepo veya belirli uygulamalar için geliştirme sunucusunu başlatabilirsiniz.

Yönetim panelini (dashboard) çalıştırmak için:
```bash
pnpm --filter dashboard-ui dev
```

Dokümantasyon sitesini (bu site!) çalıştırmak için:
```bash
pnpm --filter docs dev
```
