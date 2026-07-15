-- Backfill NULL active flags to their intended defaults.
-- Defensive: any row with NULL is_active / is_available is treated as active/available
-- everywhere else via COALESCE, but this makes the values explicit so the
-- dashboard toggle UI shows the correct state.
UPDATE categories SET is_active    = 1 WHERE is_active    IS NULL;
UPDATE items      SET is_available = 1 WHERE is_available IS NULL;
