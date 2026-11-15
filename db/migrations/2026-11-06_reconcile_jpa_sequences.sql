-- Local opt-in reconciliation AFTER Hibernate has prepared the JPA tables.
-- Hibernate 7.4 caches sequence metadata by unqualified name: sequences in a
-- different schema can suppress creation in the actual application schema.
-- These are the 11 @GeneratedValue(SEQUENCE) mappings, with Hibernate's default
-- allocation size of 50. UUID/string IDs and refresh_session need no sequence.
-- Run with the application stopped. Never reset an existing sequence.
BEGIN;
SELECT pg_advisory_xact_lock(782193005);
DO $$
DECLARE
    target_schema text := current_schema();
    table_name text;
    sequence_name text;
    largest_id bigint;
    step bigint;
BEGIN
    IF target_schema IS NULL THEN
        RAISE EXCEPTION 'No application schema selected';
    END IF;
    FOREACH table_name IN ARRAY ARRAY[
        'users', 'goal', 'daily_record', 'daily_record_photo',
        'daily_record_voice', 'notification', 'streak', 'study_room_member',
        'tag', 'tracking_link', 'validation'
    ] LOOP
        sequence_name := table_name || '_seq';
        SELECT increment_by INTO step FROM pg_sequences
        WHERE schemaname = target_schema AND sequencename = sequence_name;
        IF FOUND THEN
            IF step <> 50 THEN
                RAISE EXCEPTION 'Sequence %.% has increment %, expected 50; inspect before migrating',
                    target_schema, sequence_name, step;
            END IF;
        ELSE
            -- An incompatible object with the same name fails CREATE, rather
            -- than silently accepting it. Missing tables also fail here.
            EXECUTE format('SELECT coalesce(max(id), 0) FROM %I.%I', target_schema, table_name)
                INTO largest_id;
            -- Pooled allocation can emit value-49. Start above all stored IDs.
            EXECUTE format('CREATE SEQUENCE %I.%I AS bigint START WITH %s INCREMENT BY 50',
                target_schema, sequence_name,
                CASE WHEN largest_id = 0 THEN 1 ELSE largest_id + 50 END);
        END IF;
    END LOOP;
END
$$;
COMMIT;
