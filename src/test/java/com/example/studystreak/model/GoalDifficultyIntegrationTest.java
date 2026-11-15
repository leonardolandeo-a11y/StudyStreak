package com.example.studystreak.model;

import com.example.studystreak.repository.*;
import com.example.studystreak.service.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import tools.jackson.databind.ObjectMapper;
import javax.sql.DataSource;
import java.net.URI;
import java.net.http.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        // Force the disposable target even if a shell exports a development datasource.
        "spring.datasource.url=jdbc:postgresql://127.0.0.1:55461/studystreak_goal_difficulty_test",
        "spring.datasource.hikari.jdbc-url=jdbc:postgresql://127.0.0.1:55461/studystreak_goal_difficulty_test",
        "spring.datasource.username=goal_test", "spring.datasource.password=test-only",
        "spring.datasource.hikari.schema=ss_audit_goals",
        "spring.jpa.properties.hibernate.default_schema=ss_audit_goals",
        "spring.jpa.hibernate.ddl-auto=create"
})
@EnabledIfEnvironmentVariable(named = "STUDYSTREAK_GOAL_DIFFICULTY_INTEGRATION", matches = "true")
class GoalDifficultyIntegrationTest {
    @LocalServerPort int port;
    @Autowired JdbcTemplate db;
    @Autowired DataSource source;
    @Autowired UserRepository users;
    @Autowired JwtService jwt;
    @Autowired ObjectMapper json;
    User user() {
        var u = new User();
        String name = "difficulty_" + UUID.randomUUID().toString().substring(0, 8);
        u.setUsername(name); u.setEmail(name + "@example.invalid");
        u.setPassword("unused-test-password"); u.setActive(true); u.setRole(Role.USER);
        return users.saveAndFlush(u);
    }
    HttpResponse<String> call(String method, String path, String body, String token) throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + path)).header("Content-Type", "application/json");
        if (token != null) request.header("Authorization", "Bearer " + token);
        return HttpClient.newHttpClient().send(request.method(method, body == null
                ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body)).build(), HttpResponse.BodyHandlers.ofString());
    }
    String goalBody(String difficulty) {
        return "{\"topic\":\"Real persisted goal\",\"frequency\":3,\"duration\":25,\"completed\":false"
                + (difficulty == null ? "" : ",\"difficulty\":" + difficulty) + "}";
    }
    @Test void migrationAndAuthenticatedRoundTripOnDisposablePostgres() throws Exception {
        assertEquals("studystreak_goal_difficulty_test", db.queryForObject("select current_database()", String.class));
        assertEquals("ss_audit_goals", db.queryForObject("select current_schema()", String.class));
        var owner = user(); var stranger = user();
        String token = jwt.generateToken(owner), foreign = jwt.generateToken(stranger);
        String base = "/users/" + owner.getId() + "/goals";
        db.execute("alter table goal drop column difficulty");
        db.update("insert into goal(id,user_id,topic,frequency,duration,completed) values(9000000,?,'Historical goal',2,30,false)", owner.getId());
        long sequence = db.queryForObject("select last_value from goal_seq", Long.class);
        var migration = new ResourceDatabasePopulator(new ClassPathResource("db/migrations/2026-11-12_goal_difficulty.sql"));
        migration.setSeparator("^^^ END OF SCRIPT ^^^");
        migration.execute(source); migration.execute(source);
        assertEquals(sequence, db.queryForObject("select last_value from goal_seq", Long.class));
        assertEquals(1, db.queryForObject("select count(*) from goal", Integer.class));
        assertNull(db.queryForObject("select difficulty from goal where id=9000000", String.class));
        assertEquals("Historical goal", db.queryForObject("select topic from goal where id=9000000", String.class));
        assertTrue(json.readTree(call("GET", base + "/9000000", null, token).body()).path("difficulty").isNull());
        assertEquals(200, call("PUT", base + "/9000000", goalBody(null), token).statusCode());
        assertNull(db.queryForObject("select difficulty from goal where id=9000000", String.class));
        for (var level : GoalDifficulty.values()) {
            var created = call("POST", base, goalBody('"' + level.name() + '"'), token);
            assertEquals(201, created.statusCode(), created.body());
            long id = json.readTree(created.body()).path("id").asLong();
            assertEquals(level.name(), db.queryForObject("select difficulty from goal where id=?", String.class, id));
            assertEquals(level.name(), json.readTree(call("GET", base + "/" + id, null, token).body()).path("difficulty").asString());
            for (String old : Arrays.asList(null, "null")) {
                assertEquals(200, call("PUT", base + "/" + id, goalBody(old), token).statusCode());
                assertEquals(level.name(), db.queryForObject("select difficulty from goal where id=?", String.class, id));
            }
            assertEquals(200, call("PUT", base + "/" + id, goalBody("\"HARD\""), token).statusCode());
            assertEquals("HARD", json.readTree(call("GET", base + "/" + id, null, token).body()).path("difficulty").asString());
            assertEquals(403, call("PUT", base + "/" + id, goalBody("\"EASY\""), foreign).statusCode());
            assertEquals(403, call("PUT", "/users/" + stranger.getId() + "/goals/" + id, goalBody("\"EASY\""), foreign).statusCode());
            assertEquals("HARD", db.queryForObject("select difficulty from goal where id=?", String.class, id));
        }
        var listed = call("GET", base, null, token);
        assertEquals(200, listed.statusCode());
        assertEquals(5, json.readTree(listed.body()).path("totalElements").asInt());
        for (String invalid : List.of("\"IMPOSSIBLE\"", "\"easy\"", "\"\"", "4", "0", "{}", "true"))
            assertEquals(400, call("POST", base, goalBody(invalid), token).statusCode(), invalid);
        assertEquals(401, call("POST", base, goalBody("\"EASY\""), null).statusCode());
        assertEquals(403, call("POST", base, goalBody("\"EASY\""), foreign).statusCode());
        assertEquals(5, db.queryForObject("select count(*) from goal", Integer.class));
        assertThrows(org.springframework.dao.DataIntegrityViolationException.class,
                () -> db.update("update goal set difficulty='INVALID' where id=9000000"));
    }
    @Test
    @EnabledIfEnvironmentVariable(named = "STUDYSTREAK_LEGACY_GOAL_JAR", matches = ".+")
    void reproducesTheActiveLegacyJarWithoutTouchingTheDevelopmentDatabase() throws Exception {
        assertEquals("studystreak_goal_difficulty_test", db.queryForObject("select current_database()", String.class));
        db.execute("create schema ss_audit_old_goals");
        var log = java.nio.file.Files.createTempFile("studystreak-legacy-goals-", ".log");
        var process = new ProcessBuilder("java", "-jar", System.getenv("STUDYSTREAK_LEGACY_GOAL_JAR"),
                "--server.address=127.0.0.1", "--server.port=55462",
                "--spring.datasource.url=jdbc:postgresql://127.0.0.1:55461/studystreak_goal_difficulty_test",
                "--spring.datasource.hikari.jdbc-url=jdbc:postgresql://127.0.0.1:55461/studystreak_goal_difficulty_test",
                "--spring.datasource.username=goal_test", "--spring.datasource.password=test-only",
                "--spring.datasource.hikari.schema=ss_audit_old_goals",
                "--spring.jpa.properties.hibernate.default_schema=ss_audit_old_goals",
                "--spring.jpa.hibernate.ddl-auto=update", "--logging.level.root=WARN")
                .redirectErrorStream(true).redirectOutput(log.toFile()).start();
        try {
            var client = HttpClient.newBuilder().connectTimeout(java.time.Duration.ofMillis(500)).build();
            boolean ready = false;
            for (int i = 0; i < 120 && process.isAlive(); i++) {
                try {
                    var health = client.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:55462/users/1/goals"))
                            .timeout(java.time.Duration.ofSeconds(1)).GET().build(), HttpResponse.BodyHandlers.discarding());
                    if (health.statusCode() == 401) { ready = true; break; }
                } catch (java.io.IOException ignored) { /* Isolated server is still starting. */ }
                Thread.sleep(250);
            }
            assertTrue(ready, "Legacy fixture did not start; inspect " + log);
            // The legacy local setup reconciles this sequence separately from JPA.
            // Reproduce that prerequisite only inside the disposable legacy schema.
            db.execute("create sequence if not exists ss_audit_old_goals.goal_seq increment by 50");
            var owner = user();
            db.update("insert into ss_audit_old_goals.users(id,username,email,password,active,role) values(?,?,?,'unused',true,'USER')",
                    owner.getId(), owner.getUsername(), owner.getEmail());
            String token = jwt.generateToken(owner);
            String base = "http://127.0.0.1:55462/users/" + owner.getId() + "/goals";
            var created = client.send(HttpRequest.newBuilder(URI.create(base)).header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + token).POST(HttpRequest.BodyPublishers.ofString(goalBody("\"EASY\""))).build(), HttpResponse.BodyHandlers.ofString());
            assertEquals(201, created.statusCode(), created.body());
            var response = json.readTree(created.body());
            assertFalse(response.has("difficulty"), "The deployed old DTO ignores the new field");
            var read = client.send(HttpRequest.newBuilder(URI.create(base + "/" + response.path("id").asLong()))
                    .header("Authorization", "Bearer " + token).GET().build(), HttpResponse.BodyHandlers.ofString());
            assertEquals(200, read.statusCode());
            assertFalse(json.readTree(read.body()).has("difficulty"));
            assertEquals(0, db.queryForObject("select count(*) from information_schema.columns where table_schema='ss_audit_old_goals' and table_name='goal' and column_name='difficulty'", Integer.class));
            System.out.println("Legacy JAR reproduction: POST EASY -> 201 without difficulty; GET -> 200 without difficulty; disposable schema has no difficulty column.");
        } finally {
            process.destroy();
            if (!process.waitFor(5, java.util.concurrent.TimeUnit.SECONDS)) process.destroyForcibly().waitFor();
            java.nio.file.Files.copy(log, java.nio.file.Path.of("/tmp/hotfix-legacy-server.log"), java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            java.nio.file.Files.deleteIfExists(log);
        }
    }

}
