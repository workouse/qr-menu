-- Add theme, branding, and contact details columns to venues
ALTER TABLE venues ADD COLUMN logo_url TEXT;
ALTER TABLE venues ADD COLUMN website TEXT;
ALTER TABLE venues ADD COLUMN facebook TEXT;
ALTER TABLE venues ADD COLUMN instagram TEXT;
ALTER TABLE venues ADD COLUMN twitter TEXT;
ALTER TABLE venues ADD COLUMN phone TEXT;
ALTER TABLE venues ADD COLUMN address TEXT;
ALTER TABLE venues ADD COLUMN email TEXT;
ALTER TABLE venues ADD COLUMN theme_id TEXT NOT NULL DEFAULT 'classic-indigo';
ALTER TABLE venues ADD COLUMN primary_color TEXT NOT NULL DEFAULT '#4f46e5';
ALTER TABLE venues ADD COLUMN accent_color TEXT NOT NULL DEFAULT '#312e81';
ALTER TABLE venues ADD COLUMN background_color TEXT NOT NULL DEFAULT '#f3f4f6';
ALTER TABLE venues ADD COLUMN theme_font TEXT NOT NULL DEFAULT 'sans';
ALTER TABLE venues ADD COLUMN layout_style TEXT NOT NULL DEFAULT 'list';
