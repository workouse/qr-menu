-- Seed demo organization, venue, menu, categories, and items with nutritional info
INSERT OR IGNORE INTO organizations (id, name, currency, currency_symbol) 
VALUES ('org_demo_123', 'Gourmet Group', 'TRY', '₺');

INSERT OR IGNORE INTO org_languages (id, org_id, language_code, language_name, is_default, sort_order)
VALUES ('lang_demo_tr', 'org_demo_123', 'tr', 'Türkçe', 1, 0);

INSERT OR IGNORE INTO org_languages (id, org_id, language_code, language_name, is_default, sort_order)
VALUES ('lang_demo_en', 'org_demo_123', 'en', 'English', 0, 1);

INSERT OR IGNORE INTO users (id, org_id, email, role)
VALUES ('demo_owner', 'org_demo_123', 'demo@lezzetsarayi.com', 'org_owner');

INSERT OR IGNORE INTO venues (id, org_id, name, slug, country_code)
VALUES ('venue_demo_123', 'org_demo_123', 'Gourmet Bistro', 'gourmet-bistro', 'TR');

INSERT OR IGNORE INTO menus (id, venue_id, name, is_active)
VALUES ('menu_demo_123', 'venue_demo_123', 'Ana Menü', 1);

INSERT OR IGNORE INTO categories (id, menu_id, name, sort_order, is_active)
VALUES ('cat_demo_starters', 'menu_demo_123', 'Starters', 0, 1);

INSERT OR IGNORE INTO categories (id, menu_id, name, sort_order, is_active)
VALUES ('cat_demo_mains', 'menu_demo_123', 'Mains', 1, 1);

-- Seed Categories Translations
INSERT OR IGNORE INTO category_translations (id, category_id, language_code, name)
VALUES ('ctr_demo_starters_tr', 'cat_demo_starters', 'tr', 'Başlangıçlar');

INSERT OR IGNORE INTO category_translations (id, category_id, language_code, name)
VALUES ('ctr_demo_mains_tr', 'cat_demo_mains', 'tr', 'Ana Yemekler');

-- Seed Items with English fallback names, descriptions, and ingredients
INSERT OR IGNORE INTO items (id, category_id, name, description, price, is_available, is_vegan, is_gluten_free, allergens, calories, protein, carbohydrates, fat, ingredients)
VALUES (
  'item_demo_lentil', 
  'cat_demo_starters', 
  'Lentil Soup', 
  'Traditional red lentil soup served with lemon slice', 
  12000, 
  1, 0, 0, 
  '["wheat"]', 
  180, 8.5, 22.0, 5.5, 
  'Red lentils, onion, carrot, olive oil, flour, salt, black pepper, mint'
);

INSERT OR IGNORE INTO items (id, category_id, name, description, price, is_available, is_vegan, is_gluten_free, allergens, calories, protein, carbohydrates, fat, ingredients)
VALUES (
  'item_demo_salmon', 
  'cat_demo_mains', 
  'Grilled Salmon', 
  'Fresh grilled Atlantic salmon file served with steamed greens', 
  45000, 
  1, 0, 0, 
  '["fish"]', 
  480, 34.0, 0.0, 38.0, 
  'Salmon fillet, olive oil, lemon, fresh thyme, sea salt'
);

-- Seed Items Translations (Turkish values)
INSERT OR IGNORE INTO item_translations (id, item_id, language_code, name, description, ingredients)
VALUES (
  'itr_demo_lentil_tr', 
  'item_demo_lentil', 
  'tr', 
  'Mercimek Çorbası', 
  'Limon dilimi ile servis edilen geleneksel kırmızı mercimek çorbası',
  'Kırmızı mercimek, soğan, havuç, zeytinyağı, un, tuz, karabiber, nane'
);

INSERT OR IGNORE INTO item_translations (id, item_id, language_code, name, description, ingredients)
VALUES (
  'itr_demo_salmon_tr', 
  'item_demo_salmon', 
  'tr', 
  'Izgara Somon', 
  'Buharda pişirilmiş yeşilliklerle servis edilen taze ızgara Atlantik somonu filetoları',
  'Somon fileto, zeytinyağı, limon, taze kekik, deniz tuzu'
);
