-- Multilanguage support
-- org_languages: which languages an org supports and which is the default.
-- Default language is Turkish (tr) — English (en) is the implicit fallback stored
-- in the existing name/description columns on categories and items.
CREATE TABLE org_languages (
  id            TEXT PRIMARY KEY,
  org_id        TEXT NOT NULL,
  language_code TEXT NOT NULL,
  language_name TEXT NOT NULL,
  is_default    INTEGER NOT NULL DEFAULT 0,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE(org_id, language_code)
);

-- Per-language names for categories.
-- English (fallback) lives in categories.name.
CREATE TABLE category_translations (
  id            TEXT PRIMARY KEY,
  category_id   TEXT NOT NULL,
  language_code TEXT NOT NULL,
  name          TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE(category_id, language_code)
);

-- Per-language name + description for items.
-- English (fallback) lives in items.name / items.description.
CREATE TABLE item_translations (
  id            TEXT PRIMARY KEY,
  item_id       TEXT NOT NULL,
  language_code TEXT NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  UNIQUE(item_id, language_code)
);
