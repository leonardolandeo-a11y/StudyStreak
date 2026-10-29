-- StudyStreak database migration
-- Allow in-app notifications when an accepted tracking partner creates a daily record.
-- Safe to re-run: the constraint is recreated with the full supported type list.
BEGIN;

ALTER TABLE public.notification
    DROP CONSTRAINT IF EXISTS notification_type_check;

ALTER TABLE public.notification
    ADD CONSTRAINT notification_type_check
    CHECK (
        type IN (
            'PENDING_CHECK_IN',
            'VALIDATION_RECEIVED',
            'WEEKLY_SUMMARY',
            'GOAL_COMPLETED',
            'TRACKING_REQUESTED',
            'TRACKING_ACCEPTED',
            'TRACKING_REJECTED',
            'TRACKING_BROKEN',
            'DAILY_RECORD_CREATED'
        )
    );

COMMIT;
