-- Optional manual migration for deployments that do not use Hibernate ddl-auto=update.
-- Records completed Pomodoro sessions separately from daily records and streaks.
CREATE TABLE IF NOT EXISTS focus_session (
    id UUID PRIMARY KEY,
    goal_id BIGINT NOT NULL REFERENCES goal(id) ON DELETE CASCADE,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 5 AND 120),
    completed_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_focus_session_goal_id ON focus_session(goal_id);
