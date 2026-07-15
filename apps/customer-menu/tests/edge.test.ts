import { env } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import app from '../src/index';

declare module 'cloudflare:test' {
  interface ProvidedEnv {
    MENU_KV: KVNamespace;
    DASHBOARD_URL?: string;
  }
}

describe('Edge Delivery Worker', () => {
  it('should render the landing page at root route', async () => {
    const res = await app.request('/', {}, {
      ...env,
      DASHBOARD_URL: 'http://test-dashboard.local'
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    
    const htmlText = await res.text();
    expect(htmlText).toContain('QR Menu');
    expect(htmlText).toContain('Sıfır Gecikmeli Statik Derleme Altyapısı');
    expect(htmlText).toContain('Daha Hızlısını Bulamayacağınız');
    expect(htmlText).toContain('WORKOUSE');
    expect(htmlText).toContain('Emre Yılmaz');
    expect(htmlText).toContain('fullstack');
    expect(htmlText).toContain('http://test-dashboard.local');
    expect(htmlText).toContain('Free');
    expect(htmlText).toContain('Standard');
    expect(htmlText).toContain('Business');
    expect(htmlText).toContain('Enterprise');
    expect(htmlText).toContain('100 TRY');
    expect(htmlText).toContain('500 TRY');
    expect(htmlText).toContain('Theme Customizer');
    expect(htmlText).toContain('demo-menu-preview');
    expect(htmlText).toContain('/privacy');
    expect(htmlText).toContain('/terms');
  });

  it('should render the privacy policy page at /privacy', async () => {
    const res = await app.request('/privacy', {}, {
      ...env,
      DASHBOARD_URL: 'http://test-dashboard.local'
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    
    const htmlText = await res.text();
    expect(htmlText).toContain('Privacy Policy');
    expect(htmlText).toContain('Gizlilik Politikası');
    expect(htmlText).toContain('WORKOUSE');
  });

  it('should render the terms of service page at /terms', async () => {
    const res = await app.request('/terms', {}, {
      ...env,
      DASHBOARD_URL: 'http://test-dashboard.local'
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    
    const htmlText = await res.text();
    expect(htmlText).toContain('Terms of Service');
    expect(htmlText).toContain('Kullanım Koşulları');
    expect(htmlText).toContain('Free');
    expect(htmlText).toContain('Standard');
    expect(htmlText).toContain('Business');
    expect(htmlText).toContain('Enterprise');
  });

  it('should return 404 HTML if menu not found in KV', async () => {
    const res = await app.request('/invalid-venue', {}, env);
    expect(res.status).toBe(404);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    expect(await res.text()).toContain('Menu Not Found');
  });

  it('should return HTML directly from KV', async () => {
    const testSlug = 'my-test-venue';
    const mockHtml = '<html><body>Test Menu</body></html>';
    
    // Seed KV
    await env.MENU_KV.put(`html:venue::${testSlug}`, mockHtml);
    
    // Trigger route
    const res = await app.request(`/${testSlug}`, {}, env);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    expect(await res.text()).toBe(mockHtml);
  });

  it('should serve robots.txt with sitemap reference', async () => {
    const res = await app.request('/robots.txt', {}, env);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/plain');
    const text = await res.text();
    expect(text).toContain('User-agent: *');
    expect(text).toContain('Allow: /');
    expect(text).toContain('Sitemap:');
    expect(text).toContain('/sitemap.xml');
  });

  it('should dynamically generate sitemap.xml listingKV slugs', async () => {
    // Seed KV with some venues
    await env.MENU_KV.put('html:venue::cafe-a', '<html></html>');
    await env.MENU_KV.put('html:venue::bistro-b', '<html></html>');

    const res = await app.request('/sitemap.xml', {}, env);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/xml');
    
    const xml = await res.text();
    expect(xml).toContain('<urlset');
    expect(xml).toContain('/privacy</loc>');
    expect(xml).toContain('/terms</loc>');
    expect(xml).toContain('/cafe-a</loc>');
    expect(xml).toContain('/bistro-b</loc>');
  });

  it('should pre-render language version server-side via ?lang query param', async () => {
    // 1. Check Turkish rendering
    const resTr = await app.request('/privacy?lang=tr', {}, env);
    expect(resTr.status).toBe(200);
    const htmlTr = await resTr.text();
    expect(htmlTr).toContain('<html lang="tr">');
    expect(htmlTr).toContain('Gizlilik Politikası');
    expect(htmlTr).toContain('1. Giriş');
    
    // Check hreflang tags
    expect(htmlTr).toContain('hreflang="tr"');
    expect(htmlTr).toContain('hreflang="en"');
    expect(htmlTr).toContain('rel="canonical"');

    // 2. Check English rendering
    const resEn = await app.request('/privacy?lang=en', {}, env);
    expect(resEn.status).toBe(200);
    const htmlEn = await resEn.text();
    expect(htmlEn).toContain('<html lang="en">');
    expect(htmlEn).toContain('Privacy Policy');
    expect(htmlEn).toContain('1. Introduction');
  });

  it('should not contain the dynamic Tailwind CDN script but include style overrides', async () => {
    const res = await app.request('/', {}, env);
    expect(res.status).toBe(200);
    const html = await res.text();
    // Dynamic CDN must be removed
    expect(html).not.toContain('cdn.tailwindcss.com');
    // Precompiled CSS must be present
    expect(html).toContain('display:none'); // a common class property generated in landing.css
  });
});
