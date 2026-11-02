package com.example.studystreak.service;

import com.example.studystreak.repository.DailyRecordPhotoRepository;
import com.example.studystreak.repository.DailyRecordRepository;
import com.example.studystreak.repository.DailyRecordVoiceRepository;
import com.example.studystreak.repository.FocusSessionRepository;
import com.example.studystreak.repository.NotificationRepository;
import com.example.studystreak.repository.TagRepository;
import com.example.studystreak.repository.ValidationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GoalDeletionService {

    private final NotificationRepository notificationRepository;
    private final DailyRecordPhotoRepository photoRepository;
    private final DailyRecordVoiceRepository voiceRepository;
    private final ValidationRepository validationRepository;
    private final DailyRecordRepository dailyRecordRepository;
    private final TagRepository tagRepository;
    private final FocusSessionRepository focusSessionRepository;

    public GoalDeletionService(
            NotificationRepository notificationRepository,
            DailyRecordPhotoRepository photoRepository,
            DailyRecordVoiceRepository voiceRepository,
            ValidationRepository validationRepository,
            DailyRecordRepository dailyRecordRepository,
            TagRepository tagRepository,
            FocusSessionRepository focusSessionRepository
    ) {
        this.notificationRepository = notificationRepository;
        this.photoRepository = photoRepository;
        this.voiceRepository = voiceRepository;
        this.validationRepository = validationRepository;
        this.dailyRecordRepository = dailyRecordRepository;
        this.tagRepository = tagRepository;
        this.focusSessionRepository = focusSessionRepository;
    }

    // The caller must have checked ownership and opened a transaction.
    // Execute database deletes from children to parents to satisfy foreign keys.
    @Transactional(propagation = Propagation.MANDATORY)
    public void deleteDependencies(Long goalId) {
        notificationRepository.clearDeletedGoalReferences(goalId);
        photoRepository.deleteForGoal(goalId);
        voiceRepository.deleteForGoal(goalId);
        validationRepository.deleteForGoal(goalId);
        dailyRecordRepository.deleteForGoal(goalId);
        focusSessionRepository.deleteByGoalId(goalId);
        // Delete only join rows; tags themselves can be shared by other goals.
        tagRepository.deleteLinksForGoal(goalId);
    }
}
