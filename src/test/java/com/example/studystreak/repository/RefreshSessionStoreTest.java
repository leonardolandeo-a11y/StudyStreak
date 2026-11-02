package com.example.studystreak.repository;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import java.time.Instant;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class RefreshSessionStoreTest {
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final RefreshSessionStore store = new RefreshSessionStore(jdbc);

    @Test
    void onlyOneConditionalRotationMaySucceed() {
        UUID sessionId = UUID.randomUUID();
        Instant expires = Instant.now().plusSeconds(600);
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1, 0);
        assertTrue(store.rotate(sessionId, 11L, "old", "new", expires));
        assertFalse(store.rotate(sessionId, 11L, "old", "new", expires));
        verify(jdbc, times(2)).update(contains("token_hash = ?"), any(Object[].class));
    }

    @Test
    void revocationRequiresTheMatchingTokenHash() {
        store.revoke(UUID.randomUUID(), 11L, "hashed-jti");
        verify(jdbc).update(contains("AND token_hash = ?"), any(Object[].class));
    }
}
