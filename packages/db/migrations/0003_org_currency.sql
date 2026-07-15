-- Add per-organisation currency configuration
-- currency: ISO 4217 code (machine-readable, e.g. USD, EUR, TRY, GBP)
-- currency_symbol: display character (e.g. $, €, ₺, £)
ALTER TABLE organizations ADD COLUMN currency        TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE organizations ADD COLUMN currency_symbol TEXT NOT NULL DEFAULT '$';
