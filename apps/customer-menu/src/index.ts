import { Hono } from 'hono';
import { LANDING_CSS } from './landing.css';
import { translations, TranslationKey } from './translations';

type Bindings = {
  MENU_KV: KVNamespace;
  UPLOADS_BUCKET: R2Bucket;
  DASHBOARD_URL?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Helper to determine request language
function getLanguage(c: any): 'en' | 'tr' {
  const queryLang = c.req.query('lang');
  if (queryLang === 'tr' || queryLang === 'en') {
    return queryLang;
  }
  const acceptLang = c.req.header('accept-language');
  if (acceptLang && acceptLang.toLowerCase().startsWith('tr')) {
    return 'tr';
  }
  return 'en';
}

// Translations wrapper
const t = (key: TranslationKey, lang: 'en' | 'tr') => translations[key][lang];

// Helper to build canonical URL
function getCanonicalUrl(c: any): string {
  const host = c.req.header('host') || 'qr-menu.example.com';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  const path = c.req.path;
  return `${protocol}://${host}${path}`;
}

// Shared HTML header generator for SEO
const buildSEOHeaders = (
  title: string,
  description: string,
  canonicalUrl: string,
  lang: 'en' | 'tr',
  dashboardUrl: string
) => {
  const alternateEn = canonicalUrl.includes('?') ? `${canonicalUrl.split('?')[0]}?lang=en` : `${canonicalUrl}?lang=en`;
  const alternateTr = canonicalUrl.includes('?') ? `${canonicalUrl.split('?')[0]}?lang=tr` : `${canonicalUrl}?lang=tr`;
  const mainCanonical = canonicalUrl.split('?')[0];

  return `
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${mainCanonical}">
  <meta name="robots" content="index, follow">
  
  <!-- Alternate Language Page Links -->
  <link rel="alternate" hreflang="en" href="${alternateEn}">
  <link rel="alternate" hreflang="tr" href="${alternateTr}">
  <link rel="alternate" hreflang="x-default" href="${mainCanonical}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${mainCanonical}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${dashboardUrl}/logo.png">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${mainCanonical}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${dashboardUrl}/logo.png">

  <!-- Favicon -->
  <link rel="icon" type="image/png" href="${dashboardUrl}/favicon.png">
  `;
};

// Shared styles and meta tags helper for branding pages
const buildHeaderHtml = (dashboardUrl: string, lang: 'en' | 'tr', currentPath: string = '/') => {
  const trText = (key: TranslationKey) => t(key, lang);
  return `
  <!-- Glowing Background Orbs -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px]"></div>
    <div class="absolute top-[30%] right-[-10%] w-[40%] h-[45%] rounded-full bg-purple-600/10 blur-[120px]"></div>
    <div class="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]"></div>
  </div>

  <!-- Header -->
  <header class="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
    <a href="/" class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-purple-500 flex items-center justify-center shadow-lg shadow-brand-600/20">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 15h.008v.008H15V15zm0 3h.008v.008H15V18zm3-3h.008v.008H18V15zm0 3h.008v.008H18V18zm-3 3h.008v.008H15V21zm3 3h.008v.008H18V24z" />
        </svg>
      </div>
      <span class="heading-font text-2xl font-black tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">QR Menu</span>
    </a>
    
    <nav class="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-300">
      ${currentPath === '/' ? `
        <a href="#features" class="hover:text-white transition-colors">${trText('features')}</a>
        <a href="#demo" class="hover:text-white transition-colors">${trText('live_demo')}</a>
        <a href="#pricing" class="hover:text-white transition-colors">${trText('pricing')}</a>
        <a href="https://docs.qr-menu.workouse.com" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors">${trText('documentation')}</a>
        <a href="#about" class="hover:text-white transition-colors">${trText('who_are_we')}</a>
      ` : `
        <a href="/" class="hover:text-white transition-colors">${trText('home')}</a>
      `}
    </nav>

    <div class="flex items-center gap-4">
      <!-- Language Switcher Buttons -->
      <div class="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
        <a href="?lang=en" class="lang-btn px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-300 ${lang === 'en' ? 'bg-brand-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/10'}">EN</a>
        <a href="?lang=tr" class="lang-btn px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-300 ${lang === 'tr' ? 'bg-brand-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/10'}">TR</a>
      </div>

      <a href="${dashboardUrl}?lang=${lang}" class="text-sm font-semibold text-gray-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5">${trText('login')}</a>
      <a href="${dashboardUrl}?lang=${lang}" class="hidden sm:inline-flex text-sm font-bold bg-gradient-to-r from-brand-600 to-purple-500 hover:from-brand-500 hover:to-purple-400 text-white px-5 py-2.5 rounded-xl transition-all duration-300 shadow-md shadow-brand-600/10 hover:shadow-brand-600/20 hover:scale-[1.02]">${trText('get_started')}</a>
    </div>
  </header>
  `;
};

const buildFooterHtml = (lang: 'en' | 'tr') => {
  const trText = (key: TranslationKey) => t(key, lang);
  return `
  <!-- Footer -->
  <footer class="border-t border-white/5 bg-[#070a11] py-12 relative z-10">
    <div class="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-purple-500 flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5z" />
          </svg>
        </div>
        <span class="heading-font text-lg font-black text-white">QR Menu</span>
      </div>
      <div class="flex items-center gap-6 text-sm text-gray-500 font-semibold mb-4 md:mb-0">
        <a href="/privacy" class="hover:text-gray-300 transition-colors">${trText('privacy_policy')}</a>
        <a href="/terms" class="hover:text-gray-300 transition-colors">${trText('terms_of_service')}</a>
      </div>
      <div class="text-right">
        <p class="text-gray-500 text-xs font-semibold">${trText('copyright')}</p>
        <p class="text-gray-600 text-[10px] font-mono mt-1">${trText('workouse_desc')}</p>
      </div>
    </div>
  </footer>
  `;
};



// Robots.txt
app.get('/robots.txt', (c) => {
  const host = c.req.header('host') || 'qr-menu.example.com';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;
  const txt = `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
  c.header('Content-Type', 'text/plain');
  return c.body(txt);
});

// Dynamic XML Sitemap
app.get('/sitemap.xml', async (c) => {
  const host = c.req.header('host') || 'qr-menu.example.com';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  // Retrieve active venue slugs from KV
  const list = await c.env.MENU_KV.list({ prefix: 'html:venue::' });
  const slugs = list.keys.map(k => k.name.replace('html:venue::', ''));

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Static Pages
  xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${baseUrl}/privacy</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.3</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${baseUrl}/terms</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.3</priority>\n  </url>\n`;

  // Dynamic Venues
  for (const slug of slugs) {
    xml += `  <url>\n    <loc>${baseUrl}/${slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  }

  xml += `</urlset>`;

  c.header('Content-Type', 'application/xml');
  return c.body(xml);
});

// Landing Page
app.get('/', async (c) => {
  const dashboardUrl = c.env.DASHBOARD_URL || 'http://localhost:5173';
  const lang = getLanguage(c);
  const canonicalUrl = getCanonicalUrl(c);

  const seoTitle = lang === 'tr' 
    ? 'QR Menu - Restoranlar İçin Sıfır Veritabanı Gecikmeli Dijital QR Menüler' 
    : 'QR Menu - Premium Zero-Database QR Menus for Restaurants';
  
  const seoDesc = lang === 'tr'
    ? 'Yüksek performanslı, mobil odaklı QR menüler oluşturun. Sıfır veritabanı gecikmesi, anında uç nokta güncellemeleri ve şık dinamik tasarımlar.'
    : 'Generate high-performance, mobile-first QR menus. Zero database lag, instant edge updates, and beautiful dynamic designs.';
  const trText = (key: TranslationKey) => t(key, lang);

  const faqSectionHtml = `
    <!-- FAQ Section -->
    <section id="faq" class="max-w-4xl mx-auto px-6 py-24 relative z-10 border-t border-white/5 text-left">
      <div class="text-center max-w-3xl mx-auto mb-16">
        <h2 class="heading-font text-3xl sm:text-5xl font-black text-white mt-4">${trText('faq_global_title')}</h2>
        <p class="mt-4 text-gray-400">${trText('faq_global_subtitle')}</p>
      </div>

      <div class="space-y-4">
        <!-- FAQ 1 (Global) -->
        <div class="faq-item group bg-white/5 border border-white/5 rounded-2xl overflow-hidden transition-all duration-300">
          <button class="w-full flex justify-between items-center p-6 text-left focus:outline-none" onclick="toggleFaq(this)">
            <span class="heading-font font-bold text-white text-base sm:text-lg group-hover:text-brand-400 transition-colors">${trText('faq_g1_q')}</span>
            <svg class="w-5 h-5 text-gray-400 transform transition-transform duration-300 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          <div class="faq-answer max-h-0 overflow-hidden transition-all duration-300 ease-in-out">
            <div class="p-6 pt-0 text-sm text-gray-400 border-t border-white/5 leading-relaxed bg-white/[0.01]">
              ${trText('faq_g1_a')}
            </div>
          </div>
        </div>

        <!-- FAQ 2 (Global) -->
        <div class="faq-item group bg-white/5 border border-white/5 rounded-2xl overflow-hidden transition-all duration-300">
          <button class="w-full flex justify-between items-center p-6 text-left focus:outline-none" onclick="toggleFaq(this)">
            <span class="heading-font font-bold text-white text-base sm:text-lg group-hover:text-brand-400 transition-colors">${trText('faq_g2_q')}</span>
            <svg class="w-5 h-5 text-gray-400 transform transition-transform duration-300 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          <div class="faq-answer max-h-0 overflow-hidden transition-all duration-300 ease-in-out">
            <div class="p-6 pt-0 text-sm text-gray-400 border-t border-white/5 leading-relaxed bg-white/[0.01]">
              ${trText('faq_g2_a')}
            </div>
          </div>
        </div>

        <!-- FAQ 3 (Global) -->
        <div class="faq-item group bg-white/5 border border-white/5 rounded-2xl overflow-hidden transition-all duration-300">
          <button class="w-full flex justify-between items-center p-6 text-left focus:outline-none" onclick="toggleFaq(this)">
            <span class="heading-font font-bold text-white text-base sm:text-lg group-hover:text-brand-400 transition-colors">${trText('faq_g3_q')}</span>
            <svg class="w-5 h-5 text-gray-400 transform transition-transform duration-300 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          <div class="faq-answer max-h-0 overflow-hidden transition-all duration-300 ease-in-out">
            <div class="p-6 pt-0 text-sm text-gray-400 border-t border-white/5 leading-relaxed bg-white/[0.01]">
              ${trText('faq_g3_a')}
            </div>
          </div>
        </div>

        ${lang === 'tr' ? `
        <!-- FAQ 4 (TR Compliance) -->
        <div class="faq-item group bg-white/5 border border-white/5 rounded-2xl overflow-hidden transition-all duration-300">
          <button class="w-full flex justify-between items-center p-6 text-left focus:outline-none" onclick="toggleFaq(this)">
            <span class="heading-font font-bold text-white text-base sm:text-lg group-hover:text-brand-400 transition-colors">${trText('faq1_q')}</span>
            <svg class="w-5 h-5 text-gray-400 transform transition-transform duration-300 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          <div class="faq-answer max-h-0 overflow-hidden transition-all duration-300 ease-in-out">
            <div class="p-6 pt-0 text-sm text-gray-400 border-t border-white/5 leading-relaxed bg-white/[0.01]">
              ${trText('faq1_a')}
            </div>
          </div>
        </div>

        <!-- FAQ 5 (TR Compliance) -->
        <div class="faq-item group bg-white/5 border border-white/5 rounded-2xl overflow-hidden transition-all duration-300">
          <button class="w-full flex justify-between items-center p-6 text-left focus:outline-none" onclick="toggleFaq(this)">
            <span class="heading-font font-bold text-white text-base sm:text-lg group-hover:text-brand-400 transition-colors">${trText('faq2_q')}</span>
            <svg class="w-5 h-5 text-gray-400 transform transition-transform duration-300 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          <div class="faq-answer max-h-0 overflow-hidden transition-all duration-300 ease-in-out">
            <div class="p-6 pt-0 text-sm text-gray-400 border-t border-white/5 leading-relaxed bg-white/[0.01]">
              ${trText('faq2_a')}
            </div>
          </div>
        </div>

        <!-- FAQ 6 (TR Compliance) -->
        <div class="faq-item group bg-white/5 border border-white/5 rounded-2xl overflow-hidden transition-all duration-300">
          <button class="w-full flex justify-between items-center p-6 text-left focus:outline-none" onclick="toggleFaq(this)">
            <span class="heading-font font-bold text-white text-base sm:text-lg group-hover:text-brand-400 transition-colors">${trText('faq3_q')}</span>
            <svg class="w-5 h-5 text-gray-400 transform transition-transform duration-300 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          <div class="faq-answer max-h-0 overflow-hidden transition-all duration-300 ease-in-out">
            <div class="p-6 pt-0 text-sm text-gray-400 border-t border-white/5 leading-relaxed bg-white/[0.01]">
              ${trText('faq3_a')}
            </div>
          </div>
        </div>
        ` : ''}
      </div>
    </section>
  `;

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  ${buildSEOHeaders(seoTitle, seoDesc, canonicalUrl, lang, dashboardUrl)}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
    }
    .heading-font {
      font-family: 'Outfit', sans-serif;
    }
    ${LANDING_CSS}
  </style>
</head>
<body class="bg-[#0b0f19] text-gray-100 min-h-screen overflow-x-hidden relative flex flex-col justify-between">
  ${buildHeaderHtml(dashboardUrl, lang, '/')}

  <!-- Hero Section -->
  <main class="flex-grow">
    <section class="max-w-7xl mx-auto px-6 pt-16 pb-24 text-center relative z-10">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/25 text-brand-100 text-xs font-semibold mb-8 backdrop-blur-md">
        ${trText('hero_badge')}
      </div>
      
      <h1 class="heading-font text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none text-white max-w-5xl mx-auto">
        ${trText('hero_title')}
      </h1>
      
      <p class="mt-8 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed">
        ${trText('hero_subtitle')}
      </p>

      <div class="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
        <a href="${dashboardUrl}?lang=${lang}" class="w-full sm:w-auto text-center font-bold bg-gradient-to-r from-brand-600 to-purple-500 hover:from-brand-500 hover:to-purple-400 text-white px-8 py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-brand-600/20 hover:shadow-brand-600/30 hover:scale-[1.03]">
          ${trText('start_free_trial')}
        </a>
        <a href="#features" class="w-full sm:w-auto text-center font-semibold bg-white/5 border border-white/10 hover:bg-white/10 text-white px-8 py-4 rounded-2xl transition-all duration-300 backdrop-blur-md">
          ${trText('explore_features')}
        </a>
      </div>

      <!-- Mockup Window -->
      <div class="mt-20 max-w-5xl mx-auto rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-2xl relative">
        <div class="absolute inset-0 bg-gradient-to-tr from-brand-600/10 to-purple-500/10 pointer-events-none rounded-2xl"></div>
        <div class="flex gap-1.5 pb-3 border-b border-white/5">
          <span class="w-3 h-3 rounded-full bg-red-500/60"></span>
          <span class="w-3 h-3 rounded-full bg-yellow-500/60"></span>
          <span class="w-3 h-3 rounded-full bg-green-500/60"></span>
        </div>
        <div class="mt-4 aspect-[16/9] bg-[#0c0f1d] rounded-xl overflow-hidden flex flex-col md:flex-row">
          <!-- Mock Sidebar -->
          <div class="w-full md:w-56 border-r border-white/5 bg-[#0e1222] p-4 flex flex-col gap-2 text-left hidden md:flex">
            <div class="h-6 w-24 bg-white/10 rounded mb-4"></div>
            <div class="h-8 bg-brand-600/20 text-brand-100 rounded px-3 flex items-center text-xs font-semibold text-left">${trText('overview')}</div>
            <div class="h-8 text-gray-400 rounded px-3 flex items-center text-xs font-semibold text-left">${trText('venues')}</div>
            <div class="h-8 text-gray-400 rounded px-3 flex items-center text-xs font-semibold text-left">${trText('menus')}</div>
            <div class="h-8 text-gray-400 rounded px-3 flex items-center text-xs font-semibold text-left">${trText('settings')}</div>
          </div>
          <!-- Mock Main Content -->
          <div class="flex-grow p-6 text-left flex flex-col justify-between">
            <div>
              <div class="flex justify-between items-center mb-6">
                <div class="h-8 w-40 bg-white/10 rounded"></div>
                <div class="h-9 w-28 bg-brand-600 hover:bg-brand-500 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-md cursor-pointer">${trText('compile_menu')}</div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="p-4 rounded-xl bg-white/5 border border-white/5">
                  <div class="text-xs text-gray-400">${trText('total_venues')}</div>
                  <div class="text-xl font-bold mt-2 text-white">4</div>
                </div>
                <div class="p-4 rounded-xl bg-white/5 border border-white/5">
                  <div class="text-xs text-gray-400">${trText('active_menus')}</div>
                  <div class="text-xl font-bold mt-2 text-white">8</div>
                </div>
                <div class="p-4 rounded-xl bg-white/5 border border-white/5">
                  <div class="text-xs text-gray-400">${trText('compiled_views')}</div>
                  <div class="text-xl font-bold mt-2 text-white">12.4K</div>
                </div>
              </div>
            </div>
            <div class="mt-6 border-t border-white/5 pt-4 flex items-center justify-between text-xs text-gray-400">
              <span>${trText('status_sync')}</span>
              <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-green-500"></span> <span>${trText('active')}</span></span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="max-w-7xl mx-auto px-6 py-24 relative z-10 border-t border-white/5">
      <div class="text-center max-w-3xl mx-auto mb-16">
        <h2 class="heading-font text-3xl sm:text-5xl font-black text-white">${trText('features_title')}</h2>
        <p class="mt-4 text-gray-400">${trText('features_subtitle')}</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <!-- Feature 1 -->
        <div class="p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-brand-500/20 hover:bg-white/10 transition-all duration-300 text-left">
          <div class="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/25 flex items-center justify-center text-brand-500 mb-6">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </div>
          <h3 class="heading-font text-xl font-bold text-white mb-3">${trText('feat1_title')}</h3>
          <p class="text-gray-400 text-sm leading-relaxed">
            ${trText('feat1_desc')}
          </p>
        </div>

        <!-- Feature 2 -->
        <div class="p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-brand-500/20 hover:bg-white/10 transition-all duration-300 text-left">
          <div class="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 mb-6">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
            </svg>
          </div>
          <h3 class="heading-font text-xl font-bold text-white mb-3">${trText('feat2_title')}</h3>
          <p class="text-gray-400 text-sm leading-relaxed">
            ${trText('feat2_desc')}
          </p>
        </div>

        <!-- Feature 3 -->
        <div class="p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-brand-500/20 hover:bg-white/10 transition-all duration-300 text-left">
          <div class="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 mb-6">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 21a6 6 0 0 0 5.93-9H4.07a6 6 0 0 0 5.93 9zm0-18a6 6 0 0 0-5.93 9h11.86a6 6 0 0 0-5.93-9z" />
            </svg>
          </div>
          <h3 class="heading-font text-xl font-bold text-white mb-3">${trText('feat3_title')}</h3>
          <p class="text-gray-400 text-sm leading-relaxed">
            ${trText('feat3_desc')}
          </p>
        </div>

        <!-- Feature 4 -->
        <div class="p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-brand-500/20 hover:bg-white/10 transition-all duration-300 text-left">
          <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-6">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 class="heading-font text-xl font-bold text-white mb-3">${trText('feat4_title')}</h3>
          <p class="text-gray-400 text-sm leading-relaxed">
            ${trText('feat4_desc')}
          </p>
        </div>
      </div>
    </section>

    <!-- Interactive Demo Section -->
    <section id="demo" class="max-w-7xl mx-auto px-6 py-24 relative z-10 border-t border-white/5">
      <div class="text-center max-w-3xl mx-auto mb-16">
        <h2 class="heading-font text-3xl sm:text-5xl font-black text-white">${trText('demo_title')}</h2>
        <p class="mt-4 text-gray-400">${trText('demo_subtitle')}</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-6xl mx-auto">
        <!-- Controls panel -->
        <div class="lg:col-span-5 bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md text-left space-y-6">
          <h3 class="heading-font text-xl font-bold text-white">${trText('theme_customizer')}</h3>
          
          <!-- Color Picker -->
          <div class="space-y-3">
            <label class="text-xs font-semibold text-gray-400 uppercase tracking-wider">${trText('brand_color')}</label>
            <div class="flex gap-3">
              <button onclick="updateDemoColor('indigo', '#4f46e5', '#312e81')" data-color="indigo" class="demo-color-btn w-8 h-8 rounded-full bg-[#4f46e5] ring-2 ring-white transition-all"></button>
              <button onclick="updateDemoColor('rose', '#f43f5e', '#881337')" data-color="rose" class="demo-color-btn w-8 h-8 rounded-full bg-[#f43f5e] transition-all"></button>
              <button onclick="updateDemoColor('emerald', '#10b981', '#064e3b')" data-color="emerald" class="demo-color-btn w-8 h-8 rounded-full bg-[#10b981] transition-all"></button>
              <button onclick="updateDemoColor('amber', '#f59e0b', '#78350f')" data-color="amber" class="demo-color-btn w-8 h-8 rounded-full bg-[#f59e0b] transition-all"></button>
              <button onclick="updateDemoColor('violet', '#8b5cf6', '#4c1d95')" data-color="violet" class="demo-color-btn w-8 h-8 rounded-full bg-[#8b5cf6] transition-all"></button>
            </div>
          </div>

          <!-- Font Picker -->
          <div class="space-y-3">
            <label class="text-xs font-semibold text-gray-400 uppercase tracking-wider">${trText('font_style')}</label>
            <div class="grid grid-cols-3 gap-2">
              <button onclick="updateDemoFont('sans', 'Inter')" data-font="sans" class="demo-font-btn px-3 py-2 rounded-xl text-xs font-bold bg-brand-600 text-white transition-all">Sans (Inter)</button>
              <button onclick="updateDemoFont('serif', 'Playfair Display')" data-font="serif" class="demo-font-btn px-3 py-2 rounded-xl text-xs font-bold bg-white/5 text-gray-400 hover:text-white transition-all">Serif</button>
              <button onclick="updateDemoFont('rounded', 'Outfit')" data-font="rounded" class="demo-font-btn px-3 py-2 rounded-xl text-xs font-bold bg-white/5 text-gray-400 hover:text-white transition-all">Rounded</button>
            </div>
          </div>

          <!-- Layout Picker -->
          <div class="space-y-3">
            <label class="text-xs font-semibold text-gray-400 uppercase tracking-wider">${trText('layout_style')}</label>
            <div class="grid grid-cols-2 gap-2">
              <button onclick="updateDemoLayout('cards')" data-layout="cards" class="demo-layout-btn px-3 py-2 rounded-xl text-xs font-bold bg-brand-600 text-white transition-all">${trText('cards_grid')}</button>
              <button onclick="updateDemoLayout('list')" data-layout="list" class="demo-layout-btn px-3 py-2 rounded-xl text-xs font-bold bg-white/5 text-gray-400 hover:text-white transition-all">${trText('classic_list')}</button>
            </div>
          </div>
        </div>

        <!-- Phone frame preview -->
        <div class="lg:col-span-7 flex justify-center w-full">
          <div id="demo-menu-preview" style="--demo-primary: #4f46e5; --demo-accent: #312e81; font-family: Inter, sans-serif;" class="w-full max-w-[320px] rounded-[2.5rem] border-[8px] border-gray-800 bg-gray-50 text-gray-900 shadow-2xl overflow-hidden aspect-[9/18] flex flex-col justify-between relative p-3 transition-all duration-300">
            <!-- Simulated Notch -->
            <div class="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-4 bg-gray-800 rounded-b-xl z-20"></div>
            
            <div class="flex-grow overflow-y-auto no-scrollbar space-y-4 pt-4">
              <!-- Mini Header -->
              <div class="px-4 py-6 text-white text-center rounded-xl relative overflow-hidden transition-all duration-300" style="background-color: var(--demo-primary);">
                <h4 class="text-base font-black tracking-tight">Burger Hub</h4>
                <p class="text-[9px] opacity-80">${trText('gourmet_tag')}</p>
                <div class="flex justify-center gap-1.5 mt-3">
                  <button class="px-2 py-0.5 rounded-full text-[8px] font-bold transition-colors duration-300" style="background-color: white; color: var(--demo-primary);">${trText('burgers')}</button>
                  <button class="px-2 py-0.5 rounded-full text-[8px] font-bold text-white/80 hover:bg-white/10 transition-colors duration-300">${trText('sides')}</button>
                </div>
              </div>

              <!-- Category Title -->
              <h5 class="text-xs font-black text-gray-800 border-b pb-1 mb-2 px-1">${trText('burgers')}</h5>

              <!-- Cards Layout -->
              <div id="demo-layout-cards" class="grid grid-cols-2 gap-2 text-left">
                <!-- Item 1 -->
                <div class="bg-white rounded-lg border border-gray-100 p-2 shadow-sm flex flex-col justify-between">
                  <div>
                    <div class="w-full h-16 bg-gray-100 rounded-md mb-2 overflow-hidden flex items-center justify-center text-[10px] text-gray-400 font-bold">🍔 Burger</div>
                    <h6 class="text-[10px] font-bold text-gray-800 leading-tight">Classic Cheeseburger</h6>
                    <p class="text-[8px] text-gray-400 line-clamp-2 mt-0.5">${trText('burger_desc_long')}</p>
                  </div>
                  <div class="flex justify-between items-center mt-2 border-t pt-1 border-gray-50">
                    <span class="text-[10px] font-black" style="color: var(--demo-accent);">120 TL</span>
                    <span class="text-[8px] bg-red-50 text-red-700 font-bold px-1 rounded-sm border border-red-100/50 scale-90 shrink-0">🔥 520 kcal</span>
                  </div>
                </div>
                <!-- Item 2 -->
                <div class="bg-white rounded-lg border border-gray-100 p-2 shadow-sm flex flex-col justify-between">
                  <div>
                    <div class="w-full h-16 bg-gray-100 rounded-md mb-2 overflow-hidden flex items-center justify-center text-[10px] text-gray-400 font-bold">🍟 Patates</div>
                    <h6 class="text-[10px] font-bold text-gray-800 leading-tight">${trText('truffle_fries')}</h6>
                    <p class="text-[8px] text-gray-400 line-clamp-2 mt-0.5">${trText('parmesan_oil_long')}</p>
                  </div>
                  <div class="flex justify-between items-center mt-2 border-t pt-1 border-gray-50">
                    <span class="text-[10px] font-black" style="color: var(--demo-accent);">60 TL</span>
                    <span class="text-[8px] bg-red-50 text-red-700 font-bold px-1 rounded-sm border border-red-100/50 scale-90 shrink-0">🔥 320 kcal</span>
                  </div>
                </div>
              </div>

              <!-- List Layout -->
              <div id="demo-layout-list" class="space-y-1.5 text-left hidden">
                <!-- Item 1 -->
                <div class="bg-white rounded-lg border border-gray-100 p-2 shadow-sm flex justify-between items-center gap-2">
                  <div class="flex items-center gap-2 min-w-0">
                    <div class="w-10 h-10 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center text-xs">🍔</div>
                    <div class="min-w-0">
                      <h6 class="text-[10px] font-bold text-gray-800 leading-tight">Classic Cheeseburger <span class="text-[7px] text-red-600 font-semibold px-0.5 ml-1 bg-red-50 rounded">🔥 520 kcal</span></h6>
                      <p class="text-[8px] text-gray-400 line-clamp-1 mt-0.5">${trText('burger_desc_short')}</p>
                    </div>
                  </div>
                  <span class="text-[10px] font-black shrink-0" style="color: var(--demo-accent);">120 TL</span>
                </div>
                <!-- Item 2 -->
                <div class="bg-white rounded-lg border border-gray-100 p-2 shadow-sm flex justify-between items-center gap-2">
                  <div class="flex items-center gap-2 min-w-0">
                    <div class="w-10 h-10 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center text-xs">🍟</div>
                    <div class="min-w-0">
                      <h6 class="text-[10px] font-bold text-gray-800 leading-tight">${trText('truffle_fries')} <span class="text-[7px] text-red-600 font-semibold px-0.5 ml-1 bg-red-50 rounded">🔥 320 kcal</span></h6>
                      <p class="text-[8px] text-gray-400 line-clamp-1 mt-0.5">${trText('parmesan_oil_short')}</p>
                    </div>
                  </div>
                  <span class="text-[10px] font-black shrink-0" style="color: var(--demo-accent);">60 TL</span>
                </div>
              </div>
            </div>

            <!-- Mini Footer -->
            <div class="border-t pt-2 text-center">
              <span class="text-[8px] text-gray-400 font-semibold">${trText('powered_by')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Who Are We Section -->
    <section id="about" class="max-w-7xl mx-auto px-6 py-24 relative z-10 border-t border-white/5">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <div class="lg:col-span-7 space-y-6 text-left">
          <div class="flex items-center gap-3">
            <span class="text-xs font-mono font-bold tracking-widest text-brand-500 uppercase">${trText('about_badge')}</span>
            <span class="h-[1px] w-12 bg-white/10"></span>
          </div>
          
          <h2 class="heading-font text-3xl sm:text-4xl font-black text-white leading-tight">
            ${trText('about_title')}
          </h2>
          
          <p class="text-gray-400 text-base sm:text-lg leading-relaxed">
            ${trText('about_desc')}
          </p>

          <div class="flex flex-wrap gap-4 pt-4">
            <a href="https://www.upwork.com/agencies/workouse" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold tracking-wide uppercase transition duration-300">
              <span>${trText('upwork_agency')}</span>
            </a>
            <a href="https://github.com/workouse" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold tracking-wide uppercase transition duration-300">
              <span>GitHub</span>
            </a>
          </div>
        </div>

        <!-- Right code mockup -->
        <div class="lg:col-span-5 w-full">
          <div class="w-full rounded-2xl border border-white/5 bg-white/5 overflow-hidden shadow-2xl relative text-left">
            <div class="bg-white/10 px-4 py-3 flex items-center justify-between border-b border-white/5">
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-full bg-white/20"></span>
                <span class="w-3 h-3 rounded-full bg-white/20"></span>
                <span class="w-3 h-3 rounded-full bg-white/20"></span>
              </div>
              <span class="text-[10px] font-mono text-gray-500 tracking-wider">workouse.ts</span>
              <div class="w-10"></div>
            </div>
            <div class="p-6 font-mono text-xs leading-relaxed text-gray-400 overflow-x-auto whitespace-pre">
<span class="text-brand-500">const</span> developer <span class="text-white">=</span> &#123;
  name: <span class="text-emerald-400">"Emre Yılmaz"</span>,
  title: <span class="text-emerald-400">"Senior Architect"</span>,
  company: <span class="text-emerald-400">"WORKOUSE"</span>,
  experience: <span class="text-emerald-400">"15+ Years"</span>,
  stack: [
    <span class="text-emerald-400">"Symfony / Node.js"</span>,
    <span class="text-emerald-400">"Cloudflare / AWS"</span>,
    <span class="text-emerald-400">"Haskell / Nix"</span>
  ]
&#125;;
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="max-w-7xl mx-auto px-6 py-24 relative z-10 border-t border-white/5">
      <div class="text-center max-w-3xl mx-auto mb-16">
        <h2 class="heading-font text-3xl sm:text-5xl font-black text-white">${trText('pricing_title')}</h2>
        <p class="mt-4 text-gray-400">${trText('pricing_subtitle')}</p>
      </div>

      <!-- Billing Cycle Toggle -->
      <div class="flex justify-center items-center gap-3 mb-12">
        <span class="text-sm font-semibold text-gray-400">Monthly</span>
        <button id="billing-period-toggle" class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-white/10 transition-colors duration-200 ease-in-out focus:outline-none" onclick="toggleBillingPeriod()">
          <span id="billing-toggle-knob" class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-0"></span>
        </button>
        <span class="text-sm font-semibold text-gray-400">Annually <span class="ml-1 text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/25">Save 15%+</span></span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
        <!-- Free Tier -->
        <div class="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between hover:border-white/10 transition-all duration-300 text-left">
          <div>
            <h3 class="heading-font text-lg font-bold text-gray-300">${trText('free')}</h3>
            <p class="text-xs text-gray-400 mt-1">${trText('free_tagline')}</p>
            <div class="mt-6 flex items-baseline gap-1">
              <span class="text-3xl font-black text-white">${trText('free')}</span>
            </div>
            <ul class="mt-8 space-y-3.5 text-xs text-gray-300">
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('org_limit_1')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('venue_limit_1')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('menu_limit_1')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('no_staff')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('cat_limit_2')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('item_limit_10')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('lang_limit_1_extra')}</span>
              </li>
            </ul>
          </div>
          <a href="${dashboardUrl}?lang=${lang}&plan=Free" class="mt-8 w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-center transition-colors text-xs">
            ${trText('get_started')}
          </a>
        </div>

        <!-- Standard Tier -->
        <div class="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between hover:border-white/10 transition-all duration-300 text-left">
          <div>
            <h3 class="heading-font text-lg font-bold text-gray-300">${trText('standard')}</h3>
            <p class="text-xs text-gray-400 mt-1">${trText('standard_tagline')}</p>
            <div class="mt-6 flex items-baseline gap-1">
              <span id="price-standard-val" class="text-3xl font-black text-white">$7</span>
              <span id="price-standard-suffix" class="text-xs text-gray-400 font-semibold">${trText('price_suffix')}</span>
            </div>
            <ul class="mt-8 space-y-3.5 text-xs text-gray-300">
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('org_limit_2')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('venue_limit_5')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('menu_limit_2')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('staff_limit_10')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('cat_limit_30')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('item_limit_20')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('lang_limit_3_extra')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('custom_domain_standard')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('custom_features')}</span>
              </li>
            </ul>
          </div>
          <a id="btn-standard-link" href="${dashboardUrl}?lang=${lang}&plan=Standard" class="mt-8 w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-center transition-colors text-xs">
            ${trText('start_free_trial')}
          </a>
        </div>

        <!-- Business Tier -->
        <div class="p-6 rounded-2xl bg-gradient-to-b from-brand-950 to-brand-900 border-2 border-brand-500 flex flex-col justify-between relative shadow-xl shadow-brand-600/10 hover:shadow-brand-600/20 transition-all duration-300 text-left">
          <div class="absolute top-0 right-6 -translate-y-1/2 px-3 py-1 rounded-full bg-brand-500 text-white text-[10px] font-black uppercase tracking-wider">
            ${trText('best_value')}
          </div>
          <div>
            <h3 class="heading-font text-lg font-bold text-white">${trText('business')}</h3>
            <p class="text-xs text-brand-100 mt-1">${trText('business_tagline')}</p>
            <div class="mt-6 flex items-baseline gap-1">
              <span id="price-business-val" class="text-3xl font-black text-white">$15</span>
              <span id="price-business-suffix" class="text-xs text-brand-100 font-semibold">${trText('price_suffix')}</span>
            </div>
            <ul class="mt-8 space-y-3.5 text-xs text-brand-100 font-medium">
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-purple-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('org_limit_5')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-purple-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('venue_limit_5_per_org')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-purple-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('menu_limit_5')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-purple-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('staff_limit_10_per_org')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-purple-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('cat_limit_30')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-purple-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('item_limit_50')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-purple-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('lang_limit_10_extra')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-purple-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('custom_domain_business')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-purple-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('custom_features')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-purple-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('phone_support')}</span>
              </li>
            </ul>
          </div>
          <a id="btn-business-link" href="${dashboardUrl}?lang=${lang}&plan=Business" class="mt-8 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-purple-500 hover:from-brand-500 hover:to-purple-400 text-white font-bold text-center transition-all duration-300 text-xs shadow-md">
            ${trText('start_free_trial')}
          </a>
        </div>

        <!-- Enterprise Tier -->
        <div class="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between hover:border-white/10 transition-all duration-300 text-left">
          <div>
            <h3 class="heading-font text-lg font-bold text-gray-300">${trText('enterprise')}</h3>
            <p class="text-xs text-gray-400 mt-1">${trText('enterprise_tagline')}</p>
            <div class="mt-6 flex items-baseline gap-1">
              <span class="text-3xl font-black text-white">${trText('custom_pricing')}</span>
            </div>
            <ul class="mt-8 space-y-3.5 text-xs text-gray-300">
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('org_limit_unlimited')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('venue_limit_unlimited')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('menu_limit_unlimited')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('staff_limit_unlimited')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('cat_limit_unlimited')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('item_limit_unlimited')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('account_manager')}</span>
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-brand-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                <span>${trText('custom_sla')}</span>
              </li>
            </ul>
          </div>
          <a href="${dashboardUrl}" class="mt-8 w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-center transition-colors text-xs">
            ${trText('contact_sales')}
          </a>
        </div>
      </div>
    </section>

    ${faqSectionHtml}
  </main>

  ${buildFooterHtml(lang)}
  
  <!-- Customizer and translation scripts -->

  <script>
    function toggleFaq(btn) {
      var item = btn.parentElement;
      var answer = item.querySelector('.faq-answer');
      var svg = btn.querySelector('svg');
      
      var isOpen = item.classList.toggle('faq-open');
      if (isOpen) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
        svg.style.transform = 'rotate(180deg)';
      } else {
        answer.style.maxHeight = '0px';
        svg.style.transform = 'rotate(0deg)';
      }
    }

    var billingPeriod = 'monthly';
    var suffixMonthly = "${trText('price_suffix')}";
    var suffixAnnually = "${trText('price_suffix_annual')}";

    function toggleBillingPeriod() {
      var knob = document.getElementById('billing-toggle-knob');
      var toggle = document.getElementById('billing-period-toggle');
      var standardVal = document.getElementById('price-standard-val');
      var standardSuffix = document.getElementById('price-standard-suffix');
      var businessVal = document.getElementById('price-business-val');
      var businessSuffix = document.getElementById('price-business-suffix');

      if (billingPeriod === 'monthly') {
        billingPeriod = 'annually';
        if (knob) {
          knob.classList.remove('translate-x-0');
          knob.classList.add('translate-x-5');
        }
        if (toggle) {
          toggle.classList.remove('bg-white/10');
          toggle.classList.add('bg-brand-600');
        }
        if (standardVal) standardVal.textContent = '$70';
        if (standardSuffix) standardSuffix.textContent = suffixAnnually;
        if (businessVal) businessVal.textContent = '$150';
        if (businessSuffix) businessSuffix.textContent = suffixAnnually;
      } else {
        billingPeriod = 'monthly';
        if (knob) {
          knob.classList.remove('translate-x-5');
          knob.classList.add('translate-x-0');
        }
        if (toggle) {
          toggle.classList.remove('bg-brand-600');
          toggle.classList.add('bg-white/10');
        }
        if (standardVal) standardVal.textContent = '$7';
        if (standardSuffix) standardSuffix.textContent = suffixMonthly;
        if (businessVal) businessVal.textContent = '$15';
        if (businessSuffix) businessSuffix.textContent = suffixMonthly;
      }
    }

    function updateDemoColor(color, hex, accentHex) {
      var container = document.getElementById('demo-menu-preview');
      if (container) {
        container.style.setProperty('--demo-primary', hex);
        container.style.setProperty('--demo-accent', accentHex);
      }
      
      document.querySelectorAll('.demo-color-btn').forEach(function(btn) {
        var active = btn.getAttribute('data-color') === color;
        btn.classList.toggle('ring-2', active);
        btn.classList.toggle('ring-white', active);
      });
    }

    function updateDemoFont(font, fontName) {
      var container = document.getElementById('demo-menu-preview');
      if (container) {
        container.style.fontFamily = fontName + ", ui-sans-serif, system-ui, -apple-system, sans-serif";
      }
      
      document.querySelectorAll('.demo-font-btn').forEach(function(btn) {
        var active = btn.getAttribute('data-font') === font;
        btn.classList.toggle('bg-brand-600', active);
        btn.classList.toggle('text-white', active);
        btn.classList.toggle('bg-white/5', !active);
        btn.classList.toggle('text-gray-400', !active);
      });
    }

    function updateDemoLayout(layout) {
      var cardsList = document.getElementById('demo-layout-cards');
      var listList = document.getElementById('demo-layout-list');
      if (cardsList && listList) {
        if (layout === 'cards') {
          cardsList.style.display = 'grid';
          listList.style.display = 'none';
        } else {
          cardsList.style.display = 'none';
          listList.style.display = 'block';
        }
      }

      document.querySelectorAll('.demo-layout-btn').forEach(function(btn) {
        var active = btn.getAttribute('data-layout') === layout;
        btn.classList.toggle('bg-brand-600', active);
        btn.classList.toggle('text-white', active);
        btn.classList.toggle('bg-white/5', !active);
        btn.classList.toggle('text-gray-400', !active);
      });
    }
  </script>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-S5L6XWQGWC"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-S5L6XWQGWC');
</script>
</body>
</html>`;

  return c.html(html);
});

// Privacy Policy Page
app.get('/privacy', async (c) => {
  const dashboardUrl = c.env.DASHBOARD_URL || 'http://localhost:5173';
  const lang = getLanguage(c);
  const canonicalUrl = getCanonicalUrl(c);

  const seoTitle = lang === 'tr' ? 'Gizlilik Politikası - QR Menu' : 'Privacy Policy - QR Menu';
  const seoDesc = lang === 'tr' 
    ? 'QR Menu Gizlilik Politikası. Hangi verileri topladığımız, nasıl kullandığımız ve koruduğumuz hakkında bilgi edinin.'
    : 'Privacy Policy for QR Menu. Understand what information we collect, how it is used, and how we protect it.';

  const trText = (key: TranslationKey) => t(key, lang);

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  ${buildSEOHeaders(seoTitle, seoDesc, canonicalUrl, lang, dashboardUrl)}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
    }
    .heading-font {
      font-family: 'Outfit', sans-serif;
    }
    ${LANDING_CSS}
  </style>
</head>
<body class="bg-[#0b0f19] text-gray-100 min-h-screen overflow-x-hidden relative flex flex-col justify-between">
  ${buildHeaderHtml(dashboardUrl, lang, '/privacy')}

  <main class="flex-grow max-w-4xl mx-auto px-6 py-16 relative z-10 text-left">
    <h1 class="heading-font text-3xl sm:text-5xl font-black text-white mb-8 border-b border-white/10 pb-4">${trText('privacy_policy')}</h1>
    
    <div class="prose prose-invert max-w-none space-y-6 text-gray-300 text-sm sm:text-base leading-relaxed">
      <section class="space-y-3">
        <h2 class="heading-font text-lg sm:text-xl font-bold text-white">${trText('privacy_intro_title')}</h2>
        <p>
          ${trText('privacy_intro_desc')}
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="heading-font text-lg sm:text-xl font-bold text-white">${trText('privacy_collect_title')}</h2>
        <p>
          ${trText('privacy_collect_desc')}
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="heading-font text-lg sm:text-xl font-bold text-white">${trText('privacy_retention_title')}</h2>
        <p>
          ${trText('privacy_retention_desc')}
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="heading-font text-lg sm:text-xl font-bold text-white">${trText('privacy_cookies_title')}</h2>
        <p>
          ${trText('privacy_cookies_desc')}
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="heading-font text-lg sm:text-xl font-bold text-white">${trText('privacy_thirdparty_title')}</h2>
        <p>
          ${trText('privacy_thirdparty_desc')}
        </p>
      </section>
    </div>
  </main>

  ${buildFooterHtml(lang)}

<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-S5L6XWQGWC"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-S5L6XWQGWC');
</script>
</body>
</html>`;

  return c.html(html);
});

// Terms of Service Page
app.get('/terms', async (c) => {
  const dashboardUrl = c.env.DASHBOARD_URL || 'http://localhost:5173';
  const lang = getLanguage(c);
  const canonicalUrl = getCanonicalUrl(c);

  const seoTitle = lang === 'tr' ? 'Kullanım Koşulları - QR Menu' : 'Terms of Service - QR Menu';
  const seoDesc = lang === 'tr'
    ? 'QR Menu Kullanım Koşulları. Abonelik planları, veri lisansları ve yasal haklar hakkında bilgi edinin.'
    : 'Terms of Service for QR Menu. Understand subscription limits, licenses, and legal guidelines.';

  const trText = (key: TranslationKey) => t(key, lang);

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  ${buildSEOHeaders(seoTitle, seoDesc, canonicalUrl, lang, dashboardUrl)}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
    }
    .heading-font {
      font-family: 'Outfit', sans-serif;
    }
    ${LANDING_CSS}
  </style>
</head>
<body class="bg-[#0b0f19] text-gray-100 min-h-screen overflow-x-hidden relative flex flex-col justify-between">
  ${buildHeaderHtml(dashboardUrl, lang, '/terms')}

  <main class="flex-grow max-w-4xl mx-auto px-6 py-16 relative z-10 text-left">
    <h1 class="heading-font text-3xl sm:text-5xl font-black text-white mb-8 border-b border-white/10 pb-4">${trText('terms_of_service')}</h1>
    
    <div class="prose prose-invert max-w-none space-y-6 text-gray-300 text-sm sm:text-base leading-relaxed">
      <section class="space-y-3">
        <h2 class="heading-font text-lg sm:text-xl font-bold text-white">${trText('terms_accept_title')}</h2>
        <p>
          ${trText('terms_accept_desc')}
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="heading-font text-lg sm:text-xl font-bold text-white">${trText('terms_license_title')}</h2>
        <p>
          ${trText('terms_license_desc')}
        </p>
        <ul class="list-disc pl-6 space-y-2 text-gray-400">
          <li>${trText('terms_license_free')}</li>
          <li>${trText('terms_license_standard')}</li>
          <li>${trText('terms_license_business')}</li>
          <li>${trText('terms_license_enterprise')}</li>
        </ul>
      </section>

      <section class="space-y-3">
        <h2 class="heading-font text-lg sm:text-xl font-bold text-white">${trText('terms_account_title')}</h2>
        <p>
          ${trText('terms_account_desc')}
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="heading-font text-lg sm:text-xl font-bold text-white">${trText('terms_liability_title')}</h2>
        <p>
          ${trText('terms_liability_desc')}
        </p>
      </section>
    </div>
  </main>

  ${buildFooterHtml(lang)}

<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-S5L6XWQGWC"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-S5L6XWQGWC');
</script>
</body>
</html>`;

  return c.html(html);
});

// Image Upload Router
app.use('*', async (c, next) => {
  const host = c.req.header('host') || '';
  const mainDomain = 'qr-menu.workouse.com';

  // If host is not our main domain, try to resolve it as a custom domain
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1') && !host.includes('.workers.dev') && host !== mainDomain) {
    const lang = c.req.query('lang');
    let html = null;
    if (lang) {
      html = await c.env.MENU_KV.get(`html:domain::${host.toLowerCase()}::${lang}`);
    }
    if (!html) {
      html = await c.env.MENU_KV.get(`html:domain::${host.toLowerCase()}`);
    }

    if (html) {
      return c.html(html);
    }
  }
  await next();
});

app.get('/uploads/:id', async (c) => {
  const id = c.req.param('id');
  const object = await c.env.UPLOADS_BUCKET.get(id);

  if (!object) {
    return c.json({ error: 'Not Found' }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=604800, immutable');

  return new Response(object.body, { headers });
});

// Venue Slug Router
app.get('/:venue_slug', async (c) => {
  const slug = c.req.param('venue_slug');
  const lang = c.req.query('lang');

  let html = null;
  if (lang) {
    html = await c.env.MENU_KV.get(`html:venue::${slug}::${lang}`);
  }

  // Fallback to default if no lang or lang version not found
  if (!html) {
    html = await c.env.MENU_KV.get(`html:venue::${slug}`);
  }

  if (!html) {
    const errorHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Menu Not Found</title>
        <style>
          body {
            background-color: #f3f4f6;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
            margin: 0;
          }
          .card {
            background-color: #ffffff;
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            max-width: 28rem;
            text-align: center;
          }
          h1 {
            font-size: 2.25rem;
            font-weight: 800;
            color: #1f2937;
            margin-top: 0;
            margin-bottom: 1rem;
          }
          p {
            color: #4b5563;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>404</h1>
          <p>We couldn't find an active menu for this venue.</p>
        </div>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-S5L6XWQGWC"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-S5L6XWQGWC');
</script>
      </body>
      </html>
    `;
    return c.html(errorHtml, 404);
  }

  return c.html(html);
});

export default app;
