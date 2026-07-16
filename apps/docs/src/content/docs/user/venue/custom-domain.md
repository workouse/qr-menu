---
title: Connect a Custom Domain
description: Learn how to connect a custom domain or subdomain to your digital menu
---

You can connect your own custom domain or subdomain (e.g. `menu.myrestaurant.com` or `myrestaurant.com`) to serve your digital menu directly under your brand.

## Prerequisites

- A custom domain purchased from a domain registrar (e.g., Cloudflare, GoDaddy, Namecheap).
- Access to your domain's DNS settings panel.
- An active QR Menu subscription.

## Connection Steps

Follow these three steps to successfully connect your domain:

### 1. Enter Your Domain in the Dashboard
1. Log in to the QR Menu Dashboard.
2. Navigate to **Venues** and click on your venue.
3. Open **Venue Settings** and click on the **Domain Setup** tab.
4. Enter your custom domain (e.g. `menu.myrestaurant.com`) and click **Save**.

### 2. Configure DNS Records
Login to your domain registrar or DNS host dashboard and create the following DNS records for your domain:

#### A. TXT Record (For Verification)
Add a TXT record so we can verify you own the domain.
* **Type:** `TXT`
* **Host/Name:** `@` (for root domain) or `menu` (for subdomain)
* **Value:** `qr-menu-verification=<your-unique-token>` (Copy the exact token shown in the dashboard Domain Setup tab).
* **TTL:** `Auto` or `3600` (1 hour)

#### B. CNAME Record (For Redirection)
Add a CNAME record to route your domain's web traffic to our servers.
* **Type:** `CNAME`
* **Host/Name:** `@` (for root domain) or `menu` (for subdomain)
* **Target/Points to:** `qr-menu.workouse.com`
* **TTL:** `Auto` or `3600` (1 hour)

### 3. Verify Domain in Dashboard
Once the DNS records are saved:
1. Go back to the **Domain Setup** tab in the dashboard settings.
2. Click **Verify DNS Records**.
3. Once verified, compilation will automatically route your menu to your custom domain!

---

## Troubleshooting

- **DNS Propagation:** DNS changes can take anywhere from a few minutes up to 24 hours to propagate globally. If verification fails, wait a few minutes and try again.
- **Proxy Settings (Cloudflare):** If you use Cloudflare, make sure your CNAME record is set to **DNS Only** (grey cloud) during verification.
