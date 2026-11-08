-- Manual additive migration. No startup migration and no historical date backfill.
BEGIN;
CREATE TABLE IF NOT EXISTS social_preferences (
    user_id bigint PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    show_presence boolean NOT NULL DEFAULT false,
    show_last_seen boolean NOT NULL DEFAULT false,
    share_verified_minutes boolean NOT NULL DEFAULT false,
    share_verified_sessions boolean NOT NULL DEFAULT false,
    last_active_at timestamptz
);
CREATE TABLE IF NOT EXISTS presence_session (
    user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id uuid NOT NULL,
    last_seen_at timestamptz NOT NULL,
    PRIMARY KEY (user_id, session_id)
);
CREATE INDEX IF NOT EXISTS presence_session_expiry_idx ON presence_session(last_seen_at);
COMMIT;
