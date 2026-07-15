export type TranslationKey = keyof typeof translations;

export const translations = {
  // Navigation & Headers
  features: {
    en: "Features",
    tr: "Özellikler"
  },
  live_demo: {
    en: "Live Demo",
    tr: "Canlı Demo"
  },
  pricing: {
    en: "Pricing",
    tr: "Fiyatlandırma"
  },
  documentation: {
    en: "Documentation",
    tr: "Dokümantasyon"
  },
  who_are_we: {
    en: "Who Are We",
    tr: "Biz Kimiz"
  },
  home: {
    en: "Home",
    tr: "Ana Sayfa"
  },
  login: {
    en: "Log In",
    tr: "Giriş Yap"
  },
  get_started: {
    en: "Get Started",
    tr: "Kayıt Ol"
  },
  privacy_policy: {
    en: "Privacy Policy",
    tr: "Gizlilik Politikası"
  },
  terms_of_service: {
    en: "Terms of Service",
    tr: "Kullanım Koşulları"
  },
  copyright: {
    en: "&copy; 2026 QR Menu. All rights reserved.",
    tr: "&copy; 2026 QR Menu. Tüm hakları saklıdır."
  },
  workouse_desc: {
    en: "WORKOUSE &copy; 2026. Boutique, solo engineering and architecture house. Handcrafted by Emre Yılmaz.",
    tr: "WORKOUSE &copy; 2026. Butik, tek kişilik mühendislik ve mimarlık evi. Emre Yılmaz tarafından el yapımı."
  },

  // Hero Section
  hero_badge: {
    en: "Zero-Database Static Compiler Pipeline",
    tr: "Sıfır Gecikmeli Statik Derleme Altyapısı"
  },
  hero_title: {
    en: "Lightning-Fast QR Menus <br/> <span class=\"bg-gradient-to-r from-brand-600 via-purple-400 to-blue-400 bg-clip-text text-transparent\">Compiled to the Edge</span>",
    tr: "Daha Hızlısını Bulamayacağınız <br/> <span class=\"bg-gradient-to-r from-brand-500 via-purple-400 to-blue-400 bg-clip-text text-transparent\">QR Menüler</span>"
  },
  hero_subtitle: {
    en: "Say goodbye to slow-loading pages. QR Menu compiles your digital menu into an optimized static bundle, delivering it in under 100ms globally with zero database lag.",
    tr: "Yavaş yüklenen sayfalara elveda deyin. QR Menu, dijital menünüzü optimize edilmiş statik bir pakette derler ve sıfır veritabanı gecikmesiyle dünya çapında 100 ms'nin altında sunar."
  },
  start_free_trial: {
    en: "Start Free Trial",
    tr: "Ücretsiz Denemeye Başla"
  },
  explore_features: {
    en: "Explore Features",
    tr: "Özellikleri Keşfet"
  },

  // Demo / Mockup
  overview: {
    en: "Overview",
    tr: "Genel Bakış"
  },
  venues: {
    en: "Venues",
    tr: "Mekanlar"
  },
  menus: {
    en: "Menus",
    tr: "Menüler"
  },
  settings: {
    en: "Settings",
    tr: "Ayarlar"
  },
  compile_menu: {
    en: "Compile Menu",
    tr: "Menüyü Derle"
  },
  total_venues: {
    en: "Total Venues",
    tr: "Toplam Mekan"
  },
  active_menus: {
    en: "Active Menus",
    tr: "Aktif Menü"
  },
  compiled_views: {
    en: "Compiled Views",
    tr: "Derlenmiş Gösterim"
  },
  status_sync: {
    en: "Status: Synchronized with Cloudflare KV",
    tr: "Durum: Cloudflare KV ile Senkronize"
  },
  active: {
    en: "Active",
    tr: "Aktif"
  },

  // Features Section
  features_title: {
    en: "Built for Extreme Speed",
    tr: "Olağanüstü Hız İçin İnşa Edildi"
  },
  features_subtitle: {
    en: "Our compile-on-save architecture moves the heavy lifting away from user devices.",
    tr: "Kaydettiğinizde derleme yapan mimarimiz, ağır yükleri kullanıcı cihazlarından uzaklaştırır."
  },
  feat1_title: {
    en: "Instant Live Updates",
    tr: "Anında Güncelleme"
  },
  feat1_desc: {
    en: "Change prices, toggle out-of-stock items, or update categories. Your changes compile instantly to the edge without database downtime.",
    tr: "Fiyatları değiştirin, tükenen ürünleri kapatın veya kategorileri güncelleyin. Değişiklikleriniz veritabanı kesintisi olmadan anında uç noktada derlenir."
  },
  feat2_title: {
    en: "Multi-Venue Control",
    tr: "Çoklu Mekan Kontrolü"
  },
  feat2_desc: {
    en: "Manage multiple restaurant branches and menus from a single organization dashboard. Grant staff localized access while keeping owner controls secure.",
    tr: "Tek bir organizasyon panelinden birden fazla restoran şubesini ve menüyü yönetin. Sahip kontrollerini güvende tutarken personelinize yerel erişim izni verin."
  },
  feat3_title: {
    en: "Multi-Lingual Native",
    tr: "Doğal Çok Dilli"
  },
  feat3_desc: {
    en: "Serve local regulars and international tourists seamlessly. Switch languages instantly with a beautiful toggle, pulling compiled translations on the fly.",
    tr: "Yerel müşterilerinize ve uluslararası turistlere sorunsuz hizmet verin. Derlenmiş çevirileri anında çekerek diller arasında güzel bir geçiş düğmesiyle anında geçiş yapın."
  },

  // Interactive Demo Section
  demo_title: {
    en: "Interactive Menu Builder Demo",
    tr: "İnteraktif Menü Tasarım Demosu"
  },
  demo_subtitle: {
    en: "See how easy it is to customize the design, colors, and layout of your digital menu in real-time.",
    tr: "Dijital menünüzün tasarımını, renklerini ve düzenini gerçek zamanlı olarak özelleştirmenin ne kadar kolay olduğunu görün."
  },
  theme_customizer: {
    en: "Theme Customizer",
    tr: "Tema Özelleştirici"
  },
  brand_color: {
    en: "Brand Color",
    tr: "Marka Rengi"
  },
  font_style: {
    en: "Font Style",
    tr: "Yazı Tipi"
  },
  layout_style: {
    en: "Layout Style",
    tr: "Sayfa Düzeni"
  },
  cards_grid: {
    en: "Cards Grid",
    tr: "Kart Görünümü"
  },
  classic_list: {
    en: "Classic List",
    tr: "Liste Görünümü"
  },
  gourmet_tag: {
    en: "Gourmet Burgers & Fries",
    tr: "Gurme Burger & Patates"
  },
  burgers: {
    en: "Burgers",
    tr: "Burgerler"
  },
  sides: {
    en: "Sides",
    tr: "Yan Ürünler"
  },
  truffle_fries: {
    en: "Truffle Fries",
    tr: "Trüflü Patates"
  },
  parmesan_oil_short: {
    en: "Parmesan and truffle oil",
    tr: "Parmesan ve trüf yağı"
  },
  parmesan_oil_long: {
    en: "Parmesan and black truffle oil",
    tr: "Taze parmesan ve siyah trüf yağı"
  },
  burger_desc_short: {
    en: "Cheddar, pickle, special sauce",
    tr: "Çedar, turşu, özel sos"
  },
  burger_desc_long: {
    en: "Cheddar, pickle, special burger sauce",
    tr: "Cheddar, turşu, özel burger sosu"
  },
  powered_by: {
    en: "Powered by QR Menu",
    tr: "QR Menu Destekli"
  },

  // About Section
  about_badge: {
    en: "WHO ARE WE?",
    tr: "BİZ KİMİZ?"
  },
  about_title: {
    en: "Engineered by WORKOUSE.<br><span class='text-gray-400'>Elite fullstack software house.</span>",
    tr: "WORKOUSE Tarafından Geliştirildi.<br><span class='text-gray-400'>Seçkin fullstack yazılım evi.</span>"
  },
  about_desc: {
    en: "QR Menu is engineered and backed by <strong>WORKOUSE</strong>, a boutique, solo software development house building resilient, high-scale web applications for forward-thinking companies. Founded by Emre Yılmaz, a Senior Software Architect with 15+ years of experience, we bring elite fullstack engineering, Nix reproducibility, and edge-delivery automation to modern restaurants.",
    tr: "QR Menu, yenilikçi şirketler için dayanıklı ve yüksek ölçekli web uygulamaları geliştiren butik, tek kişilik bir yazılım evi olan <strong>WORKOUSE</strong> tarafından tasarlanmış ve desteklenmektedir. 15 yılı aşkın deneyime sahip Kıdemli Yazılım Mimarı Emre Yılmaz tarafından kurulan WORKOUSE, modern restoranlara seçkin fullstack mühendislik, Nix tekrarlanabilirliği ve uç nokta dağıtım otomasyonu sunar."
  },
  upwork_agency: {
    en: "Upwork Agency",
    tr: "Upwork Acentesi"
  },

  // Pricing Section
  pricing_title: {
    en: "Simple, Transparent Pricing",
    tr: "Basit ve Şeffaf Fiyatlandırma"
  },
  pricing_subtitle: {
    en: "Scale your restaurant menu experience as your business grows.",
    tr: "İşletmeniz büyüdükçe restoran menüsü deneyiminizi de ölçeklendirin."
  },
  free: {
    en: "Free",
    tr: "Ücretsiz"
  },
  free_tagline: {
    en: "Great for testing",
    tr: "Test etmek için harika"
  },
  org_limit_1: {
    en: "1 Org Included",
    tr: "1 Organizasyon Dahil"
  },
  venue_limit_1: {
    en: "1 Venue Included",
    tr: "1 Mekan Dahil"
  },
  menu_limit_1: {
    en: "1 Menu Included",
    tr: "1 Menü Dahil"
  },
  no_staff: {
    en: "No Staff Members",
    tr: "Personel Erişimi Yok"
  },
  cat_limit_2: {
    en: "2 Categories Included",
    tr: "En Fazla 2 Kategori"
  },
  item_limit_10: {
    en: "10 Items per category",
    tr: "Kategori Başına 10 Ürün"
  },
  standard: {
    en: "Standard",
    tr: "Standart"
  },
  standard_tagline: {
    en: "Perfect for single locations",
    tr: "Tek şubeli mekanlar için ideal"
  },
  price_suffix: {
    en: "/month",
    tr: "/ay"
  },
  venue_limit_5: {
    en: "5 Venues Included",
    tr: "5 Mekan Dahil"
  },
  menu_limit_2: {
    en: "2 Menus per venue",
    tr: "Mekan Başına 2 Menü"
  },
  staff_limit_10: {
    en: "10 Staff Members",
    tr: "10 Personel Erişimi"
  },
  cat_limit_30: {
    en: "30 Categories Included",
    tr: "En Fazla 30 Kategori"
  },
  item_limit_20: {
    en: "20 Items per category",
    tr: "Kategori Başına 20 Ürün"
  },
  custom_features: {
    en: "Custom Themes & Domains",
    tr: "Özel Temalar & Alan Adları"
  },
  best_value: {
    en: "Best Value",
    tr: "En Popüler"
  },
  business: {
    en: "Business",
    tr: "İşletme"
  },
  business_tagline: {
    en: "For growing restaurant groups",
    tr: "Büyüyen restoran grupları için"
  },
  org_limit_3: {
    en: "3 Orgs Included",
    tr: "3 Organizasyon Dahil"
  },
  venue_limit_5_per_org: {
    en: "5 Venues per org",
    tr: "Org Başına 5 Mekan"
  },
  menu_limit_5: {
    en: "5 Menus per venue",
    tr: "Mekan Başına 5 Menü"
  },
  staff_limit_10_per_org: {
    en: "10 Staff per org",
    tr: "Org Başına 10 Personel"
  },
  item_limit_50: {
    en: "50 Items per category",
    tr: "Kategori Başına 50 Ürün"
  },
  phone_support: {
    en: "Phone Support",
    tr: "Telefon Desteği"
  },
  enterprise: {
    en: "Enterprise",
    tr: "Kurumsal"
  },
  enterprise_tagline: {
    en: "For franchises & hotels",
    tr: "Franchise & oteller için"
  },
  custom_pricing: {
    en: "Custom pricing",
    tr: "Özel fiyatlandırma"
  },
  org_limit_unlimited: {
    en: "Unlimited Organizations",
    tr: "Sınırsız Organizasyon"
  },
  venue_limit_unlimited: {
    en: "Unlimited Venues",
    tr: "Sınırsız Mekan"
  },
  menu_limit_unlimited: {
    en: "Unlimited Menus",
    tr: "Sınırsız Menü"
  },
  staff_limit_unlimited: {
    en: "Unlimited Staff",
    tr: "Sınırsız Personel"
  },
  cat_limit_unlimited: {
    en: "Unlimited Categories",
    tr: "Sınırsız Kategori"
  },
  item_limit_unlimited: {
    en: "Unlimited Items",
    tr: "Sınırsız Ürün"
  },
  account_manager: {
    en: "Dedicated Account Manager",
    tr: "Özel Müşteri Temsilcisi"
  },
  custom_sla: {
    en: "Custom SLA",
    tr: "Özel SLA"
  },
  contact_sales: {
    en: "Contact Sales",
    tr: "Satışla İletişime Geç"
  },

  // Privacy Policy Specifics
  privacy_intro_title: {
    en: "1. Introduction",
    tr: "1. Giriş"
  },
  privacy_intro_desc: {
    en: "Your privacy is extremely important to us. It is QR Menu's policy to respect your privacy regarding any information we may collect from you across our website and services. We only ask for personal information when we truly need it to provide a service to you.",
    tr: "Gizliliğiniz bizim için son derece önemlidir. QR Menu olarak, web sitemiz ve hizmetlerimiz genelinde sizden toplayabileceğimiz bilgilere ilişkin gizliliğinize saygı duymak politikamızdır. Kişisel bilgileri yalnızca size bir hizmet sunmak için gerçekten ihtiyacımız olduğunda isteriz."
  },
  privacy_collect_title: {
    en: "2. Information We Collect",
    tr: "2. Topladığımız Bilgiler"
  },
  privacy_collect_desc: {
    en: "We collect information by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used. This may include your name, email, billing details, organization details, and menu uploads.",
    tr: "Bilgileri bilginiz ve rızanız dahilinde, adil ve yasal yollarla toplarız. Ayrıca neden topladığımızı ve nasıl kullanılacağını da size bildiririz. Bu bilgiler adınızı, e-posta adresinizi, fatura bilgilerinizi, organizasyon detaylarınızı ve yüklediğiniz menü görsellerini içerebilir."
  },
  privacy_retention_title: {
    en: "3. Data Retention and Security",
    tr: "3. Veri Saklama ve Güvenliği"
  },
  privacy_retention_desc: {
    en: "We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use, or modification.",
    tr: "Toplanan bilgileri yalnızca size talep ettiğiniz hizmeti sağlamak için gerekli olduğu sürece saklarız. Sakladığımız verileri, kayıp ve hırsızlığın yanı sıra yetkisiz erişim, ifşa, kopyalama, kullanım veya değiştirmeyi önlemek için ticari olarak kabul edilebilir yollarla koruruz."
  },
  privacy_cookies_title: {
    en: "4. Cookies and Analytical Tracking",
    tr: "4. Çerezler ve Analitik Takip"
  },
  privacy_cookies_desc: {
    en: "We use cookies to identify your sessions and manage authentication through Auth0. You are free to refuse our request for these cookies, with the understanding that we may be unable to provide you with some of your desired services.",
    tr: "Oturumlarınızı tanımlamak ve Auth0 üzerinden kimlik doğrulamasını yönetmek için çerezleri kullanırız. Bu çerezlere yönelik talebimizi reddetmekte özgürsünüz, ancak bu durumda talep ettiğiniz bazı hizmetleri size sunamayabileceğimizi göz önünde bulundurmalısınız."
  },
  privacy_thirdparty_title: {
    en: "5. Third-Party Services",
    tr: "5. Üçüncü Taraf Hizmetleri"
  },
  privacy_thirdparty_desc: {
    en: "Our service utilizes Auth0 for user identity management and Lemon Squeezy for subscription processing. These services have their own privacy policies governing data usage.",
    tr: "Hizmetimiz, kullanıcı kimliği yönetimi için Auth0'ı ve abonelik işlemleri için Lemon Squeezy'yi kullanır. Bu hizmetlerin, veri kullanımını düzenleyen kendi gizlilik politikaları vardır."
  },

  // Terms of Service Specifics
  terms_accept_title: {
    en: "1. Acceptance of Terms",
    tr: "1. Şartların Kabulü"
  },
  terms_accept_desc: {
    en: "By accessing or using QR Menu, you agree to be bound by these Terms of Service. If you do not agree to these terms, you must not access or use the application.",
    tr: "QR Menu'ye erişerek veya kullanarak, bu Kullanım Koşullarına bağlı kalmayı kabul etmiş olursunuz. Bu şartları kabul etmiyorsanız, uygulamaya erişmemeli ve kullanmamalısınız."
  },
  terms_license_title: {
    en: "2. Use License and Subscription Plans",
    tr: "2. Kullanım Lisansı ve Abonelik Paketleri"
  },
  terms_license_desc: {
    en: "We grant you a limited, non-exclusive, non-transferable license to use QR Menu according to the quotas specified in your selected subscription plan:",
    tr: "Seçtiğiniz abonelik paketinde belirtilen kotalara göre QR Menu'yü kullanmanız için size sınırlı, münhasır olmayan, devredilemez bir lisans vermekteyiz:"
  },
  terms_license_free: {
    en: "<strong>Free</strong>: 1 Organization, 1 Venue, 1 Menu, no staff access, 2 Categories, and 10 Items per category.",
    tr: "<strong>Ücretsiz</strong>: 1 Organizasyon, 1 Mekan, 1 Menü, personel erişimi yok, 2 Kategori ve kategori başına 10 Ürün."
  },
  terms_license_standard: {
    en: "<strong>Standard</strong>: 1 Organization, 5 Venues, 2 Menus per venue, 10 Staff members, 30 Categories, 20 Items per category, custom themes, custom domain.",
    tr: "<strong>Standart</strong>: 1 Organizasyon, 5 Mekan, mekan başına 2 Menü, 10 Personel, 30 Kategori, kategori başına 20 Ürün, özel temalar ve özel alan adı."
  },
  terms_license_business: {
    en: "<strong>Business</strong>: 3 Organizations, 5 Venues per organization, 5 Menus per venue, 10 Staff per organization, 30 Categories, 50 Items per category, custom theme/domain, and call support.",
    tr: "<strong>İşletme</strong>: 3 Organizasyon, organizasyon başına 5 Mekan, mekan başına 5 Menü, organizasyon başına 10 Personel, 30 Kategori, kategori başına 50 Ürün, özel tema/alan adı ve telefon desteği."
  },
  terms_license_enterprise: {
    en: "<strong>Enterprise</strong>: Custom specifications and pricing designed for franchises and hotels.",
    tr: "<strong>Kurumsal</strong>: Franchise şubeleri ve oteller için tasarlanmış özel kota ve fiyatlandırmalar."
  },
  terms_account_title: {
    en: "3. Account Responsibilities",
    tr: "3. Hesap Sorumlulukları"
  },
  terms_account_desc: {
    en: "You are responsible for maintaining the security of your account and credentials. QR Menu cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.",
    tr: "Hesabınızın ve kimlik bilgilerinizin güvenliğini korumaktan siz sorumlusunuz. QR Menu, bu güvenlik yükümlülüğüne uymamanızdan kaynaklanan hiçbir kayıp veya zarardan sorumlu tutulamaz."
  },
  terms_liability_title: {
    en: "4. Limitations of Liability",
    tr: "4. Sorumluluk Sınırları"
  },
  terms_liability_desc: {
    en: "In no event shall QR Menu or its developers (WORKOUSE) be liable for any damages arising out of the use or inability to use the services, even if notified orally or in writing of the possibility of such damage.",
    tr: "QR Menu veya geliştiricileri (WORKOUSE), hizmetlerin kullanımından veya kullanılamamasından kaynaklanan hiçbir zarardan, bu tür zararların olasılığı sözlü veya yazılı olarak bildirilmiş olsa dahi, hiçbir koşulda sorumlu tutulamaz."
  }
} as const;
