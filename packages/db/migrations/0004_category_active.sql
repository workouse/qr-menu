-- Add active flag to categories.
-- NOT NULL is intentionally omitted: SQLite ALTER TABLE ADD COLUMN with NOT NULL
-- can physically store NULL in some D1/Wrangler driver versions even when a DEFAULT
-- is declared. The compile endpoint uses COALESCE(is_active, 1) to treat NULL as active.
ALTER TABLE categories ADD COLUMN is_active INTEGER DEFAULT 1;
