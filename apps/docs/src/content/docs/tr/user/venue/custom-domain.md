---
title: Özel Alan Adı Bağlama
description: Dijital menünüze nasıl özel bir alan adı veya alt alan adı bağlayacağınızı öğrenin
---

Kendi özel alan adınızı veya alt alan adınızı (örn. `menu.restoraniniz.com` veya `restoraniniz.com`) dijital menünüzü doğrudan kendi markanız altında sunmak için bağlayabilirsiniz.

## Ön Koşullar

- Bir alan adı tescil firmasından (örn. Cloudflare, GoDaddy, Namecheap) satın alınmış bir alan adı.
- Alan adınızın DNS ayarları paneline erişim.
- Aktif bir QR Menu aboneliği.

## Bağlantı Adımları

Alan adınızı başarıyla bağlamak için aşağıdaki üç adımı izleyin:

### 1. Alan Adınızı Yönetim Paneline Girin
1. QR Menu Yönetim Paneline giriş yapın.
2. **Mekanlar** bölümüne gidin ve mekanınıza tıklayın.
3. **Mekan Ayarları**'nı açın ve **Alan Adı Kurulumu** sekmesine tıklayın.
4. Özel alan adınızı (örn. `menu.restoraniniz.com`) girin ve **Kaydet**'e tıklayın.

### 2. DNS Kayıtlarını Yapılandırın
Alan adı tescil firmanızın veya DNS sağlayıcınızın kontrol paneline giriş yapın ve alan adınız için aşağıdaki DNS kayıtlarını oluşturun:

#### A. TXT Kaydı (Doğrulama İçin)
Alan adının size ait olduğunu doğrulayabilmemiz için bir TXT kaydı ekleyin.
* **Tür:** `TXT`
* **Ana Bilgisayar/Ad (Host):** `@` (kök alan adı için) veya `menu` (alt alan adı için)
* **Değer (Value):** `qr-menu-verification=<size-ozel-kod>` (Yönetim panelindeki Alan Adı Kurulumu sekmesinde gösterilen kodu aynen kopyalayın).
* **TTL:** `Otomatik` veya `3600` (1 saat)

#### B. CNAME Kaydı (Yönlendirme İçin)
Alan adınızın web trafiğini sunucularımıza yönlendirmek için bir CNAME kaydı ekleyin.
* **Tür:** `CNAME`
* **Ana Bilgisayar/Ad (Host):** `@` (kök alan adı için) veya `menu` (alt alan adı için)
* **Hedef/Yönlendirilen Yer (Target):** `qr-menu.workouse.com`
* **TTL:** `Otomatik` veya `3600` (1 saat)

### 3. Yönetim Panelinde Alan Adını Doğrulayın
DNS kayıtları kaydedildikten sonra:
1. Yönetim panelindeki **Alan Adı Kurulumu** sekmesine geri dönün.
2. **DNS Kayıtlarını Doğrula** butonuna tıklayın.
3. Doğrulandıktan sonra, menünüzün derleme işlemi otomatik olarak özel alan adınıza yönlendirilecektir!

---

## Sorun Giderme

- **DNS Yayılması (Propagation):** DNS değişikliklerinin küresel olarak yayılması birkaç dakikadan 24 saate kadar sürebilir. Doğrulama başarısız olursa, birkaç dakika bekleyip tekrar deneyin.
- **Proxy Ayarları (Cloudflare):** Cloudflare kullanıyorsanız, doğrulama sırasında CNAME kaydınızın **DNS Only** (gri bulut) olarak ayarlandığından emin olun.
