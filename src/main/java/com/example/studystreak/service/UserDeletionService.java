package com.example.studystreak.service;

import com.example.studystreak.exceptions.ConflictException;
import com.example.studystreak.exceptions.ResourceNotFoundException;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.GoalRepository;
import com.example.studystreak.repository.NotificationRepository;
import com.example.studystreak.repository.TrackingLinkRepository;
import com.example.studystreak.repository.UserRepository;
import com.example.studystreak.repository.StudyRoomRepository;
import com.example.studystreak.repository.StudyRoomMemberRepository;
import com.example.studystreak.repository.ValidationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserDeletionService {
    private final UserRepository userRepository;
    private final GoalRepository goalRepository;
    private final ValidationRepository validationRepository;
    private final TrackingLinkRepository trackingLinkRepository;
    private final NotificationRepository notificationRepository;
    private final StudyRoomRepository studyRoomRepository;
    private final StudyRoomMemberRepository studyRoomMemberRepository;

    public UserDeletionService(UserRepository userRepository, GoalRepository goalRepository,
            ValidationRepository validationRepository, TrackingLinkRepository trackingLinkRepository,
            NotificationRepository notificationRepository, StudyRoomRepository studyRoomRepository,
            StudyRoomMemberRepository studyRoomMemberRepository) {
        this.userRepository = userRepository;
        this.goalRepository = goalRepository;
        this.validationRepository = validationRepository;
        this.trackingLinkRepository = trackingLinkRepository;
        this.notificationRepository = notificationRepository;
        this.studyRoomRepository = studyRoomRepository;
        this.studyRoomMemberRepository = studyRoomMemberRepository;
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Deleting connected accounts requires an explicit data-retention policy.
        // Never silently remove another user's validations or tracking history.
        if (goalRepository.existsByUserId(userId) || validationRepository.existsByValidatorId(userId)
                || trackingLinkRepository.existsByRequesterIdOrReceiverId(userId, userId)
                || studyRoomRepository.existsByOwnerId(userId) || studyRoomMemberRepository.existsByUserId(userId)) {
            throw new ConflictException("User still has goals, validations, tracking links or study rooms. Remove related resources before deletion.");
        }

        notificationRepository.deleteForUser(userId);
        // Refresh sessions are removed by the refresh_session ON DELETE CASCADE FK.
        userRepository.delete(user);
    }
}
