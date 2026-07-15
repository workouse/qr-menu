---
title: Mimari Özeti
description: Monorepo mimarisine üst düzey bakış
---

QR Menü projesi, `pnpm` workspace kullanılarak bir monorepo olarak inşa edilmiştir. Bu, ön yüz uygulamalarımız, arka uç servislerimiz ve dokümantasyonumuz arasında kod paylaşmamıza olanak tanır.

## Proje Yapısı

- `apps/`: Dağıtılabilir (deployable) uygulamaları içerir.
  - `dashboard-ui/`: Restoran sahipleri için React tabanlı yönetim paneli.
  - `customer-menu/`: Müşterilerin QR kodu okuttuklarında gördükleri menü uygulaması.
  - `docs/`: Bu Astro Starlight dokümantasyon sitesi.
- `packages/`: Paylaşılan kütüphaneleri ve araçları içerir.
  - `database/`: Paylaşılan veritabanı şeması ve istemci kodu.
  - `ui/`: Paylaşılan kullanıcı arayüzü bileşenleri.

## Teknoloji Yığını (Tech Stack)
- **Ön Yüz (Frontend)**: React, Astro, TailwindCSS
- **Arka Uç (Backend) / Dağıtım**: Cloudflare Workers, Cloudflare Pages
- **Paket Yöneticisi**: pnpm
