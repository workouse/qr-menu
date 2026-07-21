-- Migration to add advanced theming configurations to venues
ALTER TABLE venues ADD COLUMN layout_template TEXT NOT NULL DEFAULT 'classic-list';
ALTER TABLE venues ADD COLUMN theme_config TEXT;
