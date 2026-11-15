#!/usr/bin/env bash
# A new cluster under /tmp, never the developer's PostgreSQL or Docker volume.
set -euo pipefail
repo_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
pg_bin="${STUDYSTREAK_TEST_PG_BIN:-/usr/lib/postgresql/16/bin}"
test_dir="$(mktemp -d /tmp/studystreak-goal-difficulty.XXXXXX)"
cleanup() {
  "$pg_bin/pg_ctl" -D "$test_dir/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf -- "$test_dir"
}
trap cleanup EXIT
"$pg_bin/initdb" -D "$test_dir/data" -U goal_test --auth=trust > "$test_dir/init.log"
"$pg_bin/pg_ctl" -D "$test_dir/data" -l "$test_dir/server.log" -o "-h 127.0.0.1 -p 55461 -k $test_dir" -w start >/dev/null
"$pg_bin/createdb" -h 127.0.0.1 -p 55461 -U goal_test studystreak_goal_difficulty_test
"$pg_bin/psql" -h 127.0.0.1 -p 55461 -U goal_test -d studystreak_goal_difficulty_test -v ON_ERROR_STOP=1 -c 'CREATE SCHEMA ss_audit_goals' >/dev/null
cd "$repo_dir"
unset SPRING_APPLICATION_JSON SPRING_CONFIG_ADDITIONAL_LOCATION
export SPRING_CONFIG_LOCATION=classpath:/application.properties
export STUDYSTREAK_GOAL_DIFFICULTY_INTEGRATION=true
export SPRING_DATASOURCE_URL='jdbc:postgresql://127.0.0.1:55461/studystreak_goal_difficulty_test'
export SPRING_DATASOURCE_USERNAME=goal_test SPRING_DATASOURCE_PASSWORD=test-only
export SPRING_JPA_HIBERNATE_DDL_AUTO=create SPRING_JPA_SHOW_SQL=false
export SPRING_DATASOURCE_HIKARI_SCHEMA=ss_audit_goals SPRING_JPA_PROPERTIES_HIBERNATE_DEFAULT_SCHEMA=ss_audit_goals
export JWT_SECRET=c3R1ZHlzdHJlYWstZGlzcG9zYWJsZS1wcm9maWxlLXRlc3Qta2V5LTIwMjY=
export JWT_EXPIRATION=3600000 MAIL_USERNAME=fixture@example.invalid MAIL_PASSWORD=test-only
export LIVEKIT_ENABLED=false PROFILE_IMAGE_DIRECTORY="$test_dir/images"
./mvnw -o -Dtest=GoalDifficultyIntegrationTest,GoalServiceTest,GoalDeletionServiceTest test \
 -Dspring.datasource.url="$SPRING_DATASOURCE_URL" -Dspring.datasource.hikari.jdbc-url="$SPRING_DATASOURCE_URL" \
 -Dlogging.level.root=WARN -Dlogging.level.org.springframework.web=WARN \
 -Dlogging.level.org.springframework.jdbc=WARN -Dlogging.level.org.hibernate.SQL=WARN "$@"
