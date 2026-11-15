#!/usr/bin/env bash
# Only the explicitly created, disposable PostgreSQL target is allowed here.
set -euo pipefail
repo_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_dir"
export SPRING_DATASOURCE_URL='jdbc:postgresql://127.0.0.1:55449/studystreak_schema_check'
export SPRING_DATASOURCE_USERNAME=studystreak_profile_test
export SPRING_DATASOURCE_PASSWORD=disposable-profile-test-only
unset SPRING_APPLICATION_JSON SPRING_CONFIG_ADDITIONAL_LOCATION
export SPRING_CONFIG_LOCATION=classpath:/application.properties,classpath:/application-local.properties
export SPRING_PROFILES_ACTIVE=local
export APP_DB_SCHEMA=ss_audit_profile_social
export APP_AUTH_SCHEMA_INIT=always
export STUDYSTREAK_SOCIAL_POSTGRES_INTEGRATION=true
export STUDYSTREAK_POSTGRES_INTEGRATION=true
export STUDYSTREAK_PROFILE_POSTGRES_INTEGRATION=true
export SPRING_JPA_SHOW_SQL=false
export SPRING_JPA_PROPERTIES_HIBERNATE_FORMAT_SQL=false
# Public test-only key, not loaded from any local credential file.
export JWT_SECRET=c3R1ZHlzdHJlYWstZGlzcG9zYWJsZS1wcm9maWxlLXRlc3Qta2V5LTIwMjY=
export JWT_EXPIRATION=3600000
export MAIL_HOST=127.0.0.1 MAIL_PORT=9 MAIL_USERNAME=profile@example.invalid MAIL_PASSWORD=test-only
export SPRING_MAIL_PROPERTIES_MAIL_SMTP_CONNECTIONTIMEOUT=200
export SPRING_MAIL_PROPERTIES_MAIL_SMTP_TIMEOUT=200
export LIVEKIT_ENABLED=false
export PROFILE_IMAGE_DIRECTORY="$repo_dir/.local/profile-backend/test-images"
exec ./mvnw "$@" -Dlogging.level.root=WARN \
  -Dlogging.level.org.springframework.web=WARN -Dlogging.level.org.springframework.jdbc=WARN \
  -Dlogging.level.org.hibernate.SQL=WARN -Dspring.datasource.url="$SPRING_DATASOURCE_URL" \
  -Dspring.datasource.hikari.jdbc-url="$SPRING_DATASOURCE_URL"
