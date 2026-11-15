BEGIN;
SELECT pg_advisory_xact_lock(782193004);

-- PostgreSQL timestamptz(6) observations are exact to one microsecond.
-- Existing whole milliseconds remain authoritative. Fractions already lost by
-- older code cannot be reconstructed; zero is the only safe initial remainder.
-- No observed/confirmed time, state or historical completion is rewritten.
ALTER TABLE study_ledger
    ADD COLUMN IF NOT EXISTS observed_remainder_us smallint NOT NULL DEFAULT 0
    CONSTRAINT ck_study_observation_remainder CHECK (
        observed_remainder_us BETWEEN 0 AND 999
        AND (observed_ms < planned_seconds * 1000::bigint OR observed_remainder_us = 0)
    );

COMMIT;
