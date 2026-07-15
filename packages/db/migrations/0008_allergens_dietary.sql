-- Add dietary and allergens to items
ALTER TABLE items ADD COLUMN is_vegan INTEGER DEFAULT 0;
ALTER TABLE items ADD COLUMN is_gluten_free INTEGER DEFAULT 0;
ALTER TABLE items ADD COLUMN allergens TEXT;
