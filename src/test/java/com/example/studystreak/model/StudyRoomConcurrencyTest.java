package com.example.studystreak.model;

import com.example.studystreak.repository.*;
import com.example.studystreak.service.*;
import com.example.studystreak.dto.Room.*;
import com.example.studystreak.dto.Focus.FocusSessionRequestDTO;
import com.example.studystreak.exceptions.ConflictException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class StudyRoomConcurrencyTest {
    @Autowired UserRepository users;
    @Autowired GoalRepository goals;
    @Autowired FocusSessionRepository sessions;
    @Autowired StudyRoomService service;
    @Autowired FocusSessionService focus;
    @Autowired StudyLedgerService ledger;
    @Autowired JdbcTemplate jdbc;

    private User user() {
        User user = new User();
        String name = "room_test_" + UUID.randomUUID();
        user.setUsername(name);
        user.setEmail(name + "@example.invalid");
        user.setPassword("test");
        user.setRole(Role.USER);
        return users.saveAndFlush(user);
    }

    private void authenticate(User user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user.getUsername(), null, List.of()));
    }

    @Test
    void concurrentJoinsNeverExceedTwelveAndRotatedCodeCannotRejoin() throws Exception {
        List<User> participants = new ArrayList<>();
        UUID roomId = null;
        try (var pool = Executors.newFixedThreadPool(13)) {
            for (int i = 0; i < 14; i++) participants.add(user());
            authenticate(participants.getFirst());
            var room = service.create(new StudyRoomRequest("Concurrent room"));
            roomId = room.id();
            CountDownLatch start = new CountDownLatch(1);
            List<Future<Boolean>> results = new ArrayList<>();
            for (User member : participants.subList(1, participants.size())) {
                results.add(pool.submit(() -> {
                    authenticate(member);
                    try {
                        assertTrue(start.await(10, TimeUnit.SECONDS));
                        service.join(new StudyRoomJoinRequest(room.inviteCode()));
                        return true;
                    } catch (ConflictException full) { return false; }
                    finally { SecurityContextHolder.clearContext(); }
                }));
            }
            start.countDown();
            int joined = 0;
            for (var result : results) if (result.get(20, TimeUnit.SECONDS)) joined++;
            assertEquals(11, joined);
            assertEquals(12, service.get(room.id()).members().size());
            var changed = service.regenerateCode(room.id());
            assertNotEquals(room.inviteCode(), changed.inviteCode());
            assertThrows(com.example.studystreak.exceptions.ResourceNotFoundException.class,
                    () -> service.join(new StudyRoomJoinRequest(room.inviteCode())));
        } finally {
            SecurityContextHolder.clearContext();
            if (roomId != null) {
                jdbc.update("delete from study_room_member where room_id = ?", roomId);
                jdbc.update("delete from study_room where id = ?", roomId);
            }
            for (User member : participants) users.deleteById(member.getId());
        }
    }

    @Test
    void concurrentCompletionRetriesKeepOneOriginalRecord() throws Exception {
        User owner = user();
        Goal goal = new Goal();
        goal.setUser(owner); goal.setTopic("Concurrent focus");
        goal.setFrequency(3); goal.setDuration(30); goal.setCompleted(false);
        goal = goals.saveAndFlush(goal);
        final Long goalId = goal.getId();
        UUID id = UUID.randomUUID();
        authenticate(owner);
        ledger.start(id, goalId, 25);
        jdbc.update("update study_ledger set observed_ms=1499000,last_seen_at=clock_timestamp()-interval '2 seconds',ends_at=clock_timestamp()-interval '1 second' where id=?",id);
        try (var pool = Executors.newFixedThreadPool(2)) {
            CountDownLatch start = new CountDownLatch(1);
            Callable<com.example.studystreak.dto.Focus.FocusSessionResponseDTO> record = () -> {
                authenticate(owner);
                try {
                    assertTrue(start.await(10, TimeUnit.SECONDS));
                    return focus.recordCompletion(goalId, new FocusSessionRequestDTO(id, 25));
                } finally { SecurityContextHolder.clearContext(); }
            };
            var a = pool.submit(record); var b = pool.submit(record);
            start.countDown();
            assertEquals(a.get(20, TimeUnit.SECONDS), b.get(20, TimeUnit.SECONDS));
            assertEquals(1L, ledger.summary(goalId).get("completedSessions"));
            assertEquals(25L, ledger.summary(goalId).get("totalMinutes"));
        } finally {
            jdbc.update("delete from study_ledger where id=?", id);
            SecurityContextHolder.clearContext();
            goals.deleteById(goalId);
            users.deleteById(owner.getId());
        }
    }
}
