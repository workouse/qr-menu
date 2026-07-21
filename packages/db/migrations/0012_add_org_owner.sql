-- Add owner_id to organizations to track ownership for multiple organizations limits
ALTER TABLE organizations ADD COLUMN owner_id TEXT;

-- Backfill owner_id using the users table mapping for org_owners
UPDATE organizations 
SET owner_id = (
    SELECT id 
    FROM users 
    WHERE users.org_id = organizations.id 
      AND users.role = 'org_owner'
)
WHERE owner_id IS NULL;
