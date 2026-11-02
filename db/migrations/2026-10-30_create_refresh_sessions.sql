-- Stage 16.2. Apply on every PostgreSQL environment before restarting the new backend.
-- No existing accounts, goals, validations or notifications are changed.
BEGIN;
CREATE TABLE IF NOT EXISTS refresh_session (
    id UUID PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_refresh_session_user_id ON refresh_session(user_id);
COMMIT;
