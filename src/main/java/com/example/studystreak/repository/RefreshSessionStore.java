package com.example.studystreak.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;

/** Database-backed one-time refresh token sessions. Only token hashes are stored. */
@Repository
public class RefreshSessionStore {
    private final JdbcTemplate jdbc;

    public RefreshSessionStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void create(UUID sessionId, Long userId, String tokenHash, Instant expiresAt) {
        jdbc.update("""
                INSERT INTO refresh_session (id, user_id, token_hash, expires_at, created_at)
                VALUES (?, ?, ?, ?, ?)
                """, sessionId, userId, tokenHash, Timestamp.from(expiresAt), Timestamp.from(Instant.now()));
    }

    /** Compare-and-swap guarantees that only one concurrent request can rotate the token. */
    public boolean rotate(UUID sessionId, Long userId, String oldHash, String newHash, Instant expiresAt) {
        int changed = jdbc.update("""
                UPDATE refresh_session
                   SET token_hash = ?, expires_at = ?
                 WHERE id = ? AND user_id = ? AND token_hash = ?
                   AND revoked_at IS NULL AND expires_at > ?
                """, newHash, Timestamp.from(expiresAt), sessionId, userId, oldHash,
                Timestamp.from(Instant.now()));
        return changed == 1;
    }

    public void revoke(UUID sessionId, Long userId, String currentHash) {
        jdbc.update("""
                UPDATE refresh_session
                   SET revoked_at = ?
                 WHERE id = ? AND user_id = ? AND token_hash = ? AND revoked_at IS NULL
                """, Timestamp.from(Instant.now()), sessionId, userId, currentHash);
    }
}
