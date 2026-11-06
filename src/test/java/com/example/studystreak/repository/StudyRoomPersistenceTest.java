package com.example.studystreak.repository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class StudyRoomPersistenceTest {
    @Autowired StudyRoomRepository rooms;
    @Autowired JdbcTemplate jdbc;
    @Autowired EntityManager em;

    @Test
    void completionPersistsWithoutClientsAndDoesNotCompletePausedRooms() {
        long owner = -Math.abs(UUID.randomUUID().getMostSignificantBits());
        String name = UUID.randomUUID().toString();
        jdbc.update("insert into users (id, username, email, password, role) values (?, ?, ?, 'test', 'USER')",
                owner, name, name + "@example.test");
        UUID id = UUID.randomUUID();
        jdbc.update("insert into study_room (id, invite_code, name, owner_id, created_at, phase, timer_status, remaining_seconds, ends_at, version) values (?, ?, 'test', ?, current_timestamp, 'FOCUS', 'RUNNING', 1500, current_timestamp - interval '1 minute', 0)",
                id, name.substring(0, 10), owner);
        var locked = rooms.findByCodeForUpdate(name.substring(0, 10)).orElseThrow();
        assertEquals(id, locked.getId());
        assertTrue(rooms.completeExpired(Instant.now()) >= 1);
        var completed = rooms.findById(id).orElseThrow();
        assertEquals("COMPLETE", completed.getTimerStatus());
        assertEquals(0, completed.getRemainingSeconds());
        assertEquals(1L, completed.getVersion());
        rooms.completeExpired(Instant.now());
        assertEquals(1L, rooms.findById(id).orElseThrow().getVersion());
        completed = rooms.findById(id).orElseThrow();
        completed.setTimerStatus("PAUSED");
        completed.setRemainingSeconds(100);
        rooms.saveAndFlush(completed);
        rooms.completeExpired(Instant.now());
        assertEquals("PAUSED", rooms.findById(id).orElseThrow().getTimerStatus());
    }
}
