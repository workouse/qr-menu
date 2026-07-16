-- Add nutrition and ingredients to items
ALTER TABLE items ADD COLUMN calories INTEGER;
ALTER TABLE items ADD COLUMN protein REAL;
ALTER TABLE items ADD COLUMN carbohydrates REAL;
ALTER TABLE items ADD COLUMN fat REAL;
ALTER TABLE items ADD COLUMN ingredients TEXT;

-- Add ingredients to item translations
ALTER TABLE item_translations ADD COLUMN ingredients TEXT;

-- Add country_code to venues for regional compliance logic
ALTER TABLE venues ADD COLUMN country_code TEXT DEFAULT 'TR';
