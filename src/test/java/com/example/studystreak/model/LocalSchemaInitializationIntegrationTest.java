package com.example.studystreak.model;

import jakarta.persistence.EntityManager;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Table;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.jdbc.datasource.init.ScriptUtils;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@EnabledIfEnvironmentVariable(named = "STUDYSTREAK_POSTGRES_INTEGRATION", matches = "true")
class LocalSchemaInitializationIntegrationTest {
    @Autowired DataSource source;
    @Autowired EntityManager entities;

    private ResourceDatabasePopulator migration() {
        var script = new ResourceDatabasePopulator(new ClassPathResource(
                "db/migrations/2026-11-06_reconcile_jpa_sequences.sql"));
        script.setSeparator(ScriptUtils.EOF_STATEMENT_SEPARATOR);
        return script;
    }

    private long scalar(Connection connection, String sql) throws SQLException {
        try (var statement = connection.createStatement(); var row = statement.executeQuery(sql)) {
            assertTrue(row.next());
            return row.getLong(1);
        }
    }

    @Test
    void repairsOnlyMissingSequencesInSelectedSchemaAboveStoredIdsAndIsRepeatable() throws Exception {
        try (var connection = source.getConnection(); var statement = connection.createStatement()) {
            String original = connection.getSchema();
            assertTrue(original.startsWith("ss_audit_"), "Requires an isolated audit database/schema");
            String fixture = "ss_sequence_" + UUID.randomUUID().toString().replace("-", "");
            statement.execute("CREATE SCHEMA " + fixture);
            try {
                connection.setSchema(fixture);
                // Derive the fixture from the real mappings, so added/renamed
                // SEQUENCE entities must also be handled by the SQL migration.
                var tables = entities.getMetamodel().getEntities().stream()
                        .map(entity -> entity.getJavaType())
                        .filter(type -> Arrays.stream(type.getDeclaredFields()).anyMatch(field -> {
                            var generated = field.getAnnotation(GeneratedValue.class);
                            return generated != null && generated.strategy() == GenerationType.SEQUENCE;
                        }))
                        .map(type -> type.getAnnotation(Table.class).name()).toList();
                for (String table : tables) {
                    statement.execute("CREATE TABLE " + table + " (id bigint PRIMARY KEY)");
                }
                statement.execute("INSERT INTO users(id) VALUES (9000)");
                migration().populate(connection);
                for (String table : tables) {
                    assertEquals(50, scalar(connection, "SELECT increment_by FROM pg_sequences WHERE schemaname='"
                            + fixture + "' AND sequencename='" + table + "_seq'"));
                }
                // Hibernate's pooled optimizer may allocate the previous 49 IDs.
                assertEquals(9050, scalar(connection, "SELECT nextval('users_seq')"));
                assertEquals(1, scalar(connection, "SELECT nextval('goal_seq')"));
                migration().populate(connection);
                assertEquals(9050, scalar(connection, "SELECT last_value FROM users_seq"));
                assertEquals(1, scalar(connection, "SELECT last_value FROM goal_seq"));
                assertEquals(9000, scalar(connection, "SELECT id FROM users"));

                statement.execute("ALTER SEQUENCE users_seq INCREMENT BY 1");
                assertThrows(Exception.class, () -> migration().populate(connection));
                statement.execute("ROLLBACK");
                assertEquals(1, scalar(connection, "SELECT increment_by FROM pg_sequences WHERE schemaname='"
                        + fixture + "' AND sequencename='users_seq'"));
            } finally {
                statement.execute("ROLLBACK");
                connection.setSchema(original);
                // Only the random fixture created by this test is removed.
                statement.execute("DROP SCHEMA " + fixture + " CASCADE");
            }
        }
    }
}
