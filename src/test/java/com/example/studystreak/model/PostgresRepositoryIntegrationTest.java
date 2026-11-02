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
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

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
        assertEquals(2, notificationRepository.count());
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
}
