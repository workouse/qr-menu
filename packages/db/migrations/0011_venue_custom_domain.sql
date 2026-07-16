-- Custom Domain columns for venues
ALTER TABLE venues ADD COLUMN custom_domain TEXT;
ALTER TABLE venues ADD COLUMN custom_domain_verified INTEGER DEFAULT 0;
ALTER TABLE venues ADD COLUMN domain_verification_token TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_venues_custom_domain ON venues(custom_domain) WHERE custom_domain IS NOT NULL;
