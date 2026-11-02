package com.example.studystreak.service;

import com.example.studystreak.repository.DailyRecordPhotoRepository;
import com.example.studystreak.repository.DailyRecordRepository;
import com.example.studystreak.repository.DailyRecordVoiceRepository;
import com.example.studystreak.repository.FocusSessionRepository;
import com.example.studystreak.repository.NotificationRepository;
import com.example.studystreak.repository.TagRepository;
import com.example.studystreak.repository.ValidationRepository;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoMoreInteractions;

class GoalDeletionServiceTest {

    @Test
    void deletesOnlyGivenGoalDependenciesInForeignKeyOrder() {
        NotificationRepository notifications = mock(NotificationRepository.class);
        DailyRecordPhotoRepository photos = mock(DailyRecordPhotoRepository.class);
        DailyRecordVoiceRepository voices = mock(DailyRecordVoiceRepository.class);
        ValidationRepository validations = mock(ValidationRepository.class);
        DailyRecordRepository records = mock(DailyRecordRepository.class);
        TagRepository tags = mock(TagRepository.class);
        FocusSessionRepository focusSessions = mock(FocusSessionRepository.class);

        GoalDeletionService service = new GoalDeletionService(
                notifications, photos, voices, validations, records, tags, focusSessions);

        service.deleteDependencies(53L);

        InOrder order = inOrder(notifications, photos, voices, validations, records, focusSessions, tags);
        order.verify(notifications).clearDeletedGoalReferences(53L);
        order.verify(photos).deleteForGoal(53L);
        order.verify(voices).deleteForGoal(53L);
        order.verify(validations).deleteForGoal(53L);
        order.verify(records).deleteForGoal(53L);
        order.verify(focusSessions).deleteByGoalId(53L);
        order.verify(tags).deleteLinksForGoal(53L);
        order.verifyNoMoreInteractions();
    }
}
