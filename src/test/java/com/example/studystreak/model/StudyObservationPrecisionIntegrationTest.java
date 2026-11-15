package com.example.studystreak.model;

import com.example.studystreak.config.StudyLedgerSchema;
import com.example.studystreak.dto.Room.*;
import com.example.studystreak.repository.*;
import com.example.studystreak.service.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.AopTestUtils;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.sql.*;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
@EnabledIfEnvironmentVariable(named = "STUDYSTREAK_POSTGRES_INTEGRATION", matches = "true")
class StudyObservationPrecisionIntegrationTest {
    private static final String MIGRATION = "db/migrations/2026-11-06_preserve_observation_precision.sql";
    @Autowired JdbcTemplate db;
    @Autowired DataSource source;
    @Autowired UserRepository users;
    @Autowired GoalRepository goals;
    @Autowired StudyLedgerService ledger;
    @Autowired StudyAnalyticsService analytics;
    @Autowired StudyRoomService rooms;
    @Autowired StudyRoomExpiry expiry;
    @Autowired CurrentUserService current;
    private User user;
    private Goal goal;

    @BeforeEach void setup() {
        assertEquals("studystreak_schema_check", db.queryForObject("select current_database()", String.class));
        assertTrue(db.queryForObject("select current_schema()", String.class).startsWith("ss_audit_"));
        user = new User();
        String name = "fraction_" + UUID.randomUUID();
        user.setUsername(name); user.setEmail(name + "@example.invalid");
        user.setPassword("unused"); user.setRole(Role.USER); user.setTimeZone("America/Lima");
        user = users.saveAndFlush(user);
        goal = new Goal(); goal.setUser(user); goal.setTopic("Precision fixture");
        goal.setDuration(5); goal.setFrequency(3); goal = goals.saveAndFlush(goal);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(name, null, List.of()));
    }
    @AfterEach void clearSecurity() { SecurityContextHolder.clearContext(); }
    private Instant now() { return db.queryForObject("select clock_timestamp()", Timestamp.class).toInstant(); }
    private Map<String,Object> row(UUID id) { return db.queryForMap("select * from study_ledger where id=?", id); }
    private long number(Map<String,Object> row, String key) { return ((Number) row.get(key)).longValue(); }
    private Instant instant(Map<String,Object> row, String key) { return ((Timestamp) row.get(key)).toInstant(); }
    private long micros(Map<String,Object> row) { return number(row,"observed_ms") * 1000 + number(row,"observed_remainder_us"); }
    private void observe(UUID id, Instant time) {
        // Reload after every pulse: the remainder must survive the actual JDBC/PostgreSQL round trip.
        StudyLedgerService target = AopTestUtils.getTargetObject(ledger);
        ReflectionTestUtils.invokeMethod(target, "observe", row(id), time);
    }
    private UUID start(Instant start) {
        UUID id = UUID.randomUUID();
        var response = ledger.start(id, goal.getId(), 5);
        assertFalse(response.containsKey("observed_remainder_us"));
        db.update("update study_ledger set started_at=?,last_seen_at=?,ends_at=? where id=?",
                Timestamp.from(start), Timestamp.from(start), Timestamp.from(start.plusSeconds(300)), id);
        return id;
    }
    @SuppressWarnings("unchecked")
    private void consistent(long minutes, long sessions) {
        assertEquals(minutes, number(ledger.summary(goal.getId()), "totalMinutes"));
        assertEquals(sessions, number(ledger.summary(goal.getId()), "completedSessions"));
        for (int days : List.of(7,30)) {
            var stats = analytics.stats(days);
            var period = (Map<String,Object>) stats.get("verifiedPeriod");
            assertEquals(minutes, number(period,"minutes")); assertEquals(sessions, number(period,"sessions"));
            var daily = (List<Map<String,Object>>) period.get("daily");
            assertEquals(days, daily.size());
            assertEquals(minutes, daily.stream().mapToLong(item -> number(item,"minutes")).sum());
            assertEquals(sessions, daily.stream().mapToLong(item -> number(item,"sessions")).sum());
        }
    }

    @Test void exactPulsesPersistRemaindersCompleteOnceAndKeepRestPayloadsUnchanged() {
        Instant base = now().minusSeconds(600);
        assertEquals(0, base.getNano() % 1000, "Actual database clock has microsecond precision");
        UUID id = start(base);
        for (int i=1; i<=30; i++) observe(id, i==30 ? base.plusSeconds(300)
                : base.plusSeconds(i*10L).plusNanos(i*500_000L));
        assertEquals(300_000_000L, micros(row(id)));
        consistent(0,0); // RUNNING is correctly excluded.
        var active = (Map<?,?>) ledger.active().get("session");
        assertFalse(active.containsKey("observed_remainder_us"));
        assertFalse(ledger.start(id, goal.getId(), 5).containsKey("observed_remainder_us"));
        var completion = ledger.complete(goal.getId(), id, 5);
        assertEquals("COMPLETE", completion.get("state")); assertEquals(300L, number(completion,"confirmed_seconds"));
        assertFalse(completion.containsKey("observed_remainder_us"));
        var persisted = row(id);
        assertEquals(completion, ledger.complete(goal.getId(), id, 5));
        assertEquals(persisted, row(id), "Retry must not alter timestamps, time or fraction");
        consistent(5,1);
    }

    @ParameterizedTest @CsvSource({"299999999,240,COMPLETE", "59999999,0,CANCELLED", "60000000,60,COMPLETE"})
    void realTimeBelowThresholdIsNeverRoundedUp(long observedUs, long confirmed, String state) {
        Instant base = now().minusSeconds(600);
        UUID id = start(base);
        // A deterministic isolated observation trace, not a replacement for the real-time browser audit.
        for (long elapsed=10_000_000; elapsed<observedUs; elapsed+=10_000_000)
            observe(id, base.plusNanos(elapsed*1000));
        observe(id, base.plusNanos(observedUs*1000));
        assertEquals(observedUs, micros(row(id)));
        var completed = ledger.complete(goal.getId(),id,5);
        assertEquals(state, completed.get("state")); assertEquals(confirmed, number(completed,"confirmed_seconds"));
        consistent(confirmed/60, confirmed==0 ? 0 : 1);
    }

    @Test void resumeUsesExactRemainingMicrosecondsAndCancelledSessionsEarnNothing() {
        Instant base = now().minusSeconds(600);
        UUID id = start(base);
        observe(id, base.plusNanos(12_900_000));
        ledger.pulse(id,"PAUSE");
        assertEquals(12_900L, micros(row(id))); // disconnected gap and pause add nothing
        assertEquals(900L, number(row(id),"observed_remainder_us"));
        // Fresh service instance demonstrates that no remainder is held only in JVM memory.
        var fresh = new StudyLedgerService(db,current);
        var response = fresh.pulse(id,"RESUME");
        assertFalse(response.containsKey("observed_remainder_us"));
        var resumed = row(id);
        assertEquals(299_987_100L, Duration.between(instant(resumed,"last_seen_at"),instant(resumed,"ends_at")).toNanos()/1000);
        assertEquals(12_900L, micros(resumed));
        fresh.pulse(id,"CANCEL");
        var cancelled = row(id);
        assertEquals("CANCELLED", cancelled.get("state"));
        assertEquals(0L, number(cancelled,"confirmed_seconds"));
        fresh.complete(goal.getId(),id,5);
        assertEquals(cancelled,row(id));
        consistent(0,0);
    }

    @Test void groupedParticipationUsesTheSamePreciseAccumulatorAndExpiryIsIdempotent() {
        var room = rooms.create(new StudyRoomRequest("Precision round"));
        ledger.select(room.id(),goal.getId());
        rooms.timer(room.id(), new StudyRoomTimerRequest(StudyRoomTimerRequest.Action.START));
        rooms.heartbeat(room.id(),new StudyRoomHeartbeat(true));
        var original = db.queryForMap("select * from study_ledger where user_id=?",user.getId());
        UUID id = (UUID) original.get("id");
        Instant base = now().minusSeconds(600), deadline = base.plusSeconds(300);
        db.update("update study_ledger set started_at=?,last_seen_at=?,ends_at=? where id=?",
                Timestamp.from(base),Timestamp.from(base),Timestamp.from(deadline),id);
        db.update("update study_run set ends_at=? where id=?",Timestamp.from(deadline),original.get("run_id"));
        for (int i=1;i<=30;i++) observe(id, i==30 ? deadline : base.plusSeconds(i*10L).plusNanos(i*500_000L));
        assertEquals(300_000_000L,micros(row(id)));
        expiry.completeExpired();
        var completed=row(id); expiry.completeExpired(); assertEquals(completed,row(id));
        assertEquals("GROUP",completed.get("source")); assertEquals("COMPLETE",completed.get("state"));
        assertEquals(300L,number(completed,"confirmed_seconds"));
        consistent(5,1);
        assertEquals(5L,number(analytics.stats(7),"groupMinutes"));
    }

    @Test void timestampsAndConstraintsRetainSubmillisecondPrecision() {
        UUID id = start(now().minusSeconds(600));
        db.update("update study_ledger set observed_ms=299999,observed_remainder_us=999 where id=?",id);
        assertEquals(299_999_999L,micros(row(id)));
        // PostgreSQL transactions need savepoints around expected constraint failures.
        for (String sql : List.of(
                "update study_ledger set observed_remainder_us=-1 where id=?",
                "update study_ledger set observed_remainder_us=1000 where id=?",
                "update study_ledger set observed_ms=300000,observed_remainder_us=1 where id=?")) {
            db.execute((org.springframework.jdbc.core.ConnectionCallback<Void>) connection -> {
                Savepoint savepoint=connection.setSavepoint();
                try { assertThrows(SQLException.class,()->{try(var stmt=connection.prepareStatement(sql)){stmt.setObject(1,id);stmt.executeUpdate();}}); }
                finally { connection.rollback(savepoint); connection.releaseSavepoint(savepoint); }
                return null;
            });
        }
    }

    @Test void migrationIsAdditiveRepeatableAndFreshStartupRunsItAfterLedgerCreation() throws Exception {
        try (var connection=source.getConnection(); var statement=connection.createStatement()) {
            String original=connection.getSchema(), fixture="ss_precision_"+UUID.randomUUID().toString().replace("-","");
            statement.execute("create schema "+fixture);
            try {
                connection.setSchema(fixture);
                statement.execute("create table users(id bigint primary key)");
                statement.execute("create table goal(id bigint primary key,user_id bigint,topic text)");
                statement.execute("create table study_room(id uuid primary key)");
                statement.execute("create table focus_session(id uuid primary key,goal_id bigint,duration_minutes integer,completed_at timestamptz)");
                new ResourceDatabasePopulator(new ClassPathResource("db/study-tracking-v3.sql")).populate(connection);
                statement.execute("insert into users values(1)");
                statement.execute("insert into study_ledger(id,user_id,goal_name,source,state,planned_seconds,observed_ms,confirmed_seconds,started_at,last_seen_at,completed_at) values ('00000000-0000-0000-0000-000000000001',1,'History','LEGACY','COMPLETE',300,299985,240,now(),now(),now())");
                var fixtureDb = new JdbcTemplate(new SingleConnectionDataSource(connection,true));
                String before=fixtureDb.queryForObject("select (to_jsonb(l)-'observed_remainder_us')::text from study_ledger l",String.class);
                assertThrows(Exception.class,()->new StudyLedgerSchema().initializeStudyLedger(new SingleConnectionDataSource(connection,true),false));
                var migration=new ResourceDatabasePopulator(new ClassPathResource(MIGRATION));
                migration.populate(connection); migration.populate(connection);
                assertEquals(0,fixtureDb.queryForObject("select observed_remainder_us from study_ledger",Integer.class));
                assertEquals(before,fixtureDb.queryForObject("select (to_jsonb(l)-'observed_remainder_us')::text from study_ledger l",String.class));
                assertNotNull(new StudyLedgerSchema().initializeStudyLedger(new SingleConnectionDataSource(connection,true),false));
                // Replay the complete bootstrap; both scripts preserve completed history.
                assertNotNull(new StudyLedgerSchema().initializeStudyLedger(new SingleConnectionDataSource(connection,true),true));
                assertEquals(before,fixtureDb.queryForObject("select (to_jsonb(l)-'observed_remainder_us')::text from study_ledger l",String.class));
            } finally {
                statement.execute("rollback"); connection.setSchema(original);
                statement.execute("drop schema "+fixture+" cascade");
            }
        }
    }

    @Test void newSchemaBootstrapCreatesBothLedgerAndPrecisionColumn() throws Exception {
        try (var connection=source.getConnection(); var statement=connection.createStatement()) {
            String original=connection.getSchema(), fixture="ss_precision_fresh_"+UUID.randomUUID().toString().replace("-","");
            statement.execute("create schema "+fixture);
            try {
                connection.setSchema(fixture);
                statement.execute("create table users(id bigint primary key)");
                statement.execute("create table goal(id bigint primary key,user_id bigint,topic text)");
                statement.execute("create table study_room(id uuid primary key)");
                statement.execute("create table focus_session(id uuid primary key,goal_id bigint,duration_minutes integer,completed_at timestamptz)");
                var fixtureSource=new SingleConnectionDataSource(connection,true);
                assertNotNull(new StudyLedgerSchema().initializeStudyLedger(fixtureSource,true));
                assertNotNull(new StudyLedgerSchema().initializeStudyLedger(fixtureSource,false));
                assertEquals(0L,new JdbcTemplate(fixtureSource).queryForObject("select count(observed_remainder_us) from study_ledger",Long.class));
            } finally {
                statement.execute("rollback"); connection.setSchema(original);
                statement.execute("drop schema "+fixture+" cascade");
            }
        }
    }
}
