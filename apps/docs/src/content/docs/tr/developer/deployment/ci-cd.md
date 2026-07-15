---
title: CI/CD Süreçleri
description: Sürekli Entegrasyon ve Dağıtım iş akışları
---

Kod kalitesini sağlamak ve dağıtımları otomatikleştirmek için CI/CD süreçlerimizde GitHub Actions kullanıyoruz.

## İş Akışları (Workflows)

Tipik iş akışlarımız şunları içerir:

1. **Lint & Test**: Her Pull Request (PR) açıldığında otomatik olarak çalışır.
   - Prettier/ESLint kullanarak kod formatını kontrol eder.
   - Etkilenen paketler için birim testlerini (unit test) çalıştırır.

2. **Önizlemeye Dağıt (Preview)**: 
   - Cloudflare Pages, her Pull Request için otomatik olarak bir önizleme URL'si oluşturur. Bu, ekibin birleştirmeden (merge) önce arayüz değişikliklerini incelemesine olanak tanır.

3. **Canlıya Dağıt (Production)**: 
   - `main` dalına (branch) birleştirme yapılması canlı dağıtımı tetikler.
   - Cloudflare Pages ön yüz uygulamalarını derler ve dağıtır.
   - GitHub Actions, `wrangler deploy` kullanarak güncellenmiş Cloudflare Workers'ı dağıtır.
