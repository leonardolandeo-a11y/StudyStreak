-- Manual additive migration: select the intended schema before running.
-- No default or backfill: historical goals remain NULL (Sin dificultad).
BEGIN;
ALTER TABLE goal ADD COLUMN IF NOT EXISTS difficulty varchar(16);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
                   WHERE conrelid = 'goal'::regclass AND conname = 'goal_difficulty_check') THEN
        ALTER TABLE goal ADD CONSTRAINT goal_difficulty_check
            CHECK (difficulty IS NULL OR difficulty IN ('TRIVIAL', 'EASY', 'INTERMEDIATE', 'HARD')) NOT VALID;
    END IF;
END $$;
ALTER TABLE goal VALIDATE CONSTRAINT goal_difficulty_check;
COMMIT;
