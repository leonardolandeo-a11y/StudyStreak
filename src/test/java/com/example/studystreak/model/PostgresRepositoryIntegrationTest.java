package com.example.studystreak.model;

import com.example.studystreak.exceptions.ConflictException;
import com.example.studystreak.repository.DailyRecordRepository;
import com.example.studystreak.repository.GoalRepository;
import com.example.studystreak.repository.NotificationRepository;
import com.example.studystreak.repository.TrackingLinkRepository;
import com.example.studystreak.repository.UserRepository;
import com.example.studystreak.service.TrackingLinkService;
import com.example.studystreak.service.UserDeletionService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
@EnabledIfEnvironmentVariable(named = "STUDYSTREAK_POSTGRES_INTEGRATION", matches = "true")
class PostgresRepositoryIntegrationTest {
    @Autowired private UserRepository userRepository;
    @Autowired private GoalRepository goalRepository;
    @Autowired private DailyRecordRepository dailyRecordRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private TrackingLinkRepository trackingLinkRepository;
    @Autowired private TrackingLinkService trackingLinkService;
    @Autowired private UserDeletionService userDeletionService;
    @Autowired private EntityManager entityManager;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private PlatformTransactionManager transactionManager;

    @BeforeEach
    void requireIsolatedSchema() {
        String schema = jdbcTemplate.queryForObject("select current_schema()", String.class);
        assertNotNull(schema);
        assertTrue(schema.startsWith("ss_audit_"), "Integration tests require an isolated audit schema");
    }

    private User createUser() {
        String suffix = UUID.randomUUID().toString().substring(0, 12);
        User user = new User();
        user.setUsername("audit_" + suffix);
        user.setEmail("audit_" + suffix + "@example.invalid");
        user.setPassword("unused-in-integration-test");
        user.setActive(true);
        user.setRole(Role.USER);
        user.setTimeZone("America/Lima");
        user.setRegistrationDate(LocalDate.now());
        return userRepository.saveAndFlush(user);
    }

    private Goal createGoal(User owner) {
        Goal goal = new Goal();
        goal.setUser(owner);
        goal.setTopic("Integration test goal");
        goal.setFrequency(3);
        goal.setDuration(30);
        goal.setCompleted(false);
        return goalRepository.saveAndFlush(goal);
    }

    private Notification createNotification(User owner, NotificationType type) {
        return new Notification("Integration notification", false, LocalDateTime.now(), type, owner);
    }

    @Test
    void clearsTrackingReferenceWithoutDeletingNotification() {
        User requester = createUser();
        User receiver = createUser();
        TrackingLink link = trackingLinkRepository.saveAndFlush(new TrackingLink(requester, receiver, TrackingStatus.PENDING));
        Notification notification = createNotification(receiver, NotificationType.TRACKING_REQUESTED);
        notification.setRelatedTrackingLinkId(link.getId());
        Long notificationId = notificationRepository.saveAndFlush(notification).getId();

        assertEquals(1, notificationRepository.clearDeletedTrackingLinkReferences(link.getId()));
        entityManager.flush();
        entityManager.clear();

        Notification persisted = notificationRepository.findById(notificationId).orElseThrow();
        assertNull(persisted.getRelatedTrackingLinkId());
        assertEquals("Integration notification", persisted.getMessage());
    }

    @Test
    void clearsGoalAndRecordReferencesWithoutDeletingNotifications() {
        User owner = createUser();
        Goal goal = createGoal(owner);
        DailyRecord record = dailyRecordRepository.saveAndFlush(new DailyRecord(
                LocalDate.now(), "Integration record", "", goal));
        Notification goalNotice = createNotification(owner, NotificationType.GOAL_COMPLETED);
        goalNotice.setRelatedGoalId(goal.getId());
        Long goalNoticeId = notificationRepository.saveAndFlush(goalNotice).getId();
        Notification recordNotice = createNotification(owner, NotificationType.DAILY_RECORD_CREATED);
        recordNotice.setRelatedDailyRecordId(record.getId());
        Long recordNoticeId = notificationRepository.saveAndFlush(recordNotice).getId();

        assertEquals(2, notificationRepository.clearDeletedGoalReferences(goal.getId()));
        entityManager.flush();
        entityManager.clear();

        assertNull(notificationRepository.findById(goalNoticeId).orElseThrow().getRelatedGoalId());
        assertNull(notificationRepository.findById(recordNoticeId).orElseThrow().getRelatedDailyRecordId());
        assertEquals(2, jdbcTemplate.queryForObject("select count(*) from notification where user_id = ?", Integer.class, owner.getId()));
    }

    @Test
    void preventsDeletingUserWithExistingGoals() {
        User owner = createUser();
        createGoal(owner);

        assertThrows(ConflictException.class, () -> userDeletionService.deleteUser(owner.getId()));
        assertTrue(userRepository.existsById(owner.getId()));
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void deletesEmptyUserAndTheirNotifications() {
        User owner = createUser();
        Notification notice = createNotification(owner, NotificationType.WEEKLY_SUMMARY);
        Long noticeId = notificationRepository.saveAndFlush(notice).getId();

        // Exercise the deletion service in its own committed transaction.
        // Bulk notification deletion must not leave test-managed entities stale.
        userDeletionService.deleteUser(owner.getId());

        assertFalse(userRepository.existsById(owner.getId()));
        assertFalse(notificationRepository.existsById(noticeId));
    }

    @Test
    void rejectsReversedDuplicateTrackingLinkAgainstPostgres() {
        User first = createUser();
        User second = createUser();
        trackingLinkService.createTrackingLink(first.getId(), second.getId());
        entityManager.flush();

        assertThrows(ConflictException.class,
                () -> trackingLinkService.createTrackingLink(second.getId(), first.getId()));
        assertTrue(trackingLinkRepository.findLinkBetweenUsers(first.getId(), second.getId()).isPresent());
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void serializesConcurrentTrackingRequestsInSameDirection() throws Exception {
        assertConcurrentTrackingRequests(false);
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void serializesConcurrentTrackingRequestsInOppositeDirections() throws Exception {
        assertConcurrentTrackingRequests(true);
    }

    private void assertConcurrentTrackingRequests(boolean reverse) throws Exception {
        User first = createUser();
        User second = createUser();
        Long firstId = first.getId();
        Long secondId = second.getId();
        CountDownLatch firstInserted = new CountDownLatch(1);
        CountDownLatch releaseFirst = new CountDownLatch(1);
        CountDownLatch secondStarted = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);

        try {
            Future<?> firstRequest = executor.submit(() -> transactionTemplate.executeWithoutResult(status -> {
                // The first link is saved but remains invisible until this transaction commits.
                trackingLinkService.createTrackingLink(firstId, secondId);
                firstInserted.countDown();
                try {
                    if (!releaseFirst.await(10, TimeUnit.SECONDS)) {
                        throw new IllegalStateException("Timed out holding the first tracking transaction");
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException("First tracking transaction interrupted", e);
                }
            }));

            assertTrue(firstInserted.await(10, TimeUnit.SECONDS), "First transaction did not create its link");
            Future<Boolean> secondRequest = executor.submit(() -> {
                secondStarted.countDown();
                try {
                    trackingLinkService.createTrackingLink(reverse ? secondId : firstId,
                            reverse ? firstId : secondId);
                    return false;
                } catch (ConflictException e) {
                    return true;
                }
            });

            assertTrue(secondStarted.await(5, TimeUnit.SECONDS), "Second transaction did not start");
            assertThrows(TimeoutException.class, () -> secondRequest.get(300, TimeUnit.MILLISECONDS),
                    "Second transaction must not finish while the first holds the user row locks");

            releaseFirst.countDown();
            firstRequest.get(15, TimeUnit.SECONDS);
            assertTrue(secondRequest.get(15, TimeUnit.SECONDS), "Duplicate request must return a conflict");
            Long linkCount = jdbcTemplate.queryForObject(
                    "select count(*) from tracking_link where " +
                    "(requester_id = ? and receiver_id = ?) or (requester_id = ? and receiver_id = ?)",
                    Long.class, firstId, secondId, secondId, firstId);
            assertEquals(1L, linkCount, "Exactly one tracking link must be committed");
        } finally {
            releaseFirst.countDown();
            executor.shutdownNow();
            assertTrue(executor.awaitTermination(15, TimeUnit.SECONDS), "Tracking test threads did not terminate");
        }
    }
}
