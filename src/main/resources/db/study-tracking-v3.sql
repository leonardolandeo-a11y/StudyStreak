BEGIN;
SELECT pg_advisory_xact_lock(782193004);
CREATE TABLE IF NOT EXISTS study_run (
 id uuid PRIMARY KEY, room_id uuid REFERENCES study_room(id) ON DELETE SET NULL,
 state varchar(12) NOT NULL CHECK(state IN ('RUNNING','PAUSED','COMPLETE','CANCELLED')),
 started_at timestamptz NOT NULL, ends_at timestamptz, completed_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_study_run_active ON study_run(room_id) WHERE state IN ('RUNNING','PAUSED');
CREATE INDEX IF NOT EXISTS idx_study_run_end ON study_run(state,ends_at);
CREATE TABLE IF NOT EXISTS study_ledger (
 id uuid PRIMARY KEY, user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 goal_id bigint REFERENCES goal(id) ON DELETE SET NULL, goal_name text NOT NULL,
 run_id uuid REFERENCES study_run(id), source varchar(12) NOT NULL CHECK(source IN ('INDIVIDUAL','GROUP','LEGACY')),
 state varchar(12) NOT NULL CHECK(state IN ('RUNNING','PAUSED','COMPLETE','CANCELLED')),
 planned_seconds integer NOT NULL CHECK(planned_seconds BETWEEN 60 AND 7200),
 observed_ms bigint NOT NULL DEFAULT 0 CHECK(observed_ms >= 0 AND observed_ms <= planned_seconds * 1000::bigint),
 confirmed_seconds integer NOT NULL DEFAULT 0 CHECK(confirmed_seconds >= 0 AND confirmed_seconds <= planned_seconds),
 started_at timestamptz NOT NULL, last_seen_at timestamptz NOT NULL, ends_at timestamptz,
 completed_at timestamptz, verified boolean NOT NULL DEFAULT true,
 CHECK(state <> 'COMPLETE' OR (completed_at IS NOT NULL AND confirmed_seconds >= 60)),
 UNIQUE(run_id,user_id)
);
ALTER TABLE study_ledger ADD COLUMN IF NOT EXISTS original_goal_id bigint;
UPDATE study_ledger SET original_goal_id=goal_id WHERE original_goal_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_study_user_started ON study_ledger(user_id,started_at DESC,id DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_study_user_active ON study_ledger(user_id) WHERE state IN ('RUNNING','PAUSED');
CREATE INDEX IF NOT EXISTS idx_study_user_date ON study_ledger(user_id,completed_at);
CREATE INDEX IF NOT EXISTS idx_study_goal_date ON study_ledger(goal_id,completed_at);
CREATE TABLE IF NOT EXISTS study_room_selection (
 room_id uuid NOT NULL REFERENCES study_room(id) ON DELETE CASCADE,
 user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 goal_id bigint REFERENCES goal(id) ON DELETE SET NULL,
 PRIMARY KEY(room_id,user_id)
);
CREATE INDEX IF NOT EXISTS idx_study_selection_goal ON study_room_selection(goal_id);
INSERT INTO study_ledger(id,user_id,goal_id,original_goal_id,goal_name,source,state,planned_seconds,observed_ms,confirmed_seconds,started_at,last_seen_at,completed_at,verified)
SELECT f.id,g.user_id,g.id,g.id,coalesce(g.topic,'Untitled Goal'),'LEGACY','COMPLETE',f.duration_minutes*60,0,f.duration_minutes*60,
 f.completed_at,f.completed_at,f.completed_at,false FROM focus_session f JOIN goal g ON g.id=f.goal_id
ON CONFLICT(id) DO NOTHING;

COMMIT;
