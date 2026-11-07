-- Manual, additive migration. Run only in an explicitly selected schema.
-- Existing users retain NULL values; no identity, history or sequence changes.
BEGIN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name varchar(60);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio varchar(300);
COMMIT;
