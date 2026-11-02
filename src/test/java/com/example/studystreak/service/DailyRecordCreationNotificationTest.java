package com.example.studystreak.service;

import com.example.studystreak.dto.DailyRecord.DailyRecordRequestDTO;
import com.example.studystreak.event.DailyRecordCreatedEvent;
import com.example.studystreak.exceptions.ConflictException;
import com.example.studystreak.model.DailyRecord;
import com.example.studystreak.model.Goal;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.*;
import org.junit.jupiter.api.Test;
import org.modelmapper.ModelMapper;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class DailyRecordCreationNotificationTest {

    @Test
    void createsRecordThenPublishesOneEventWithSavedIds() {
        Goal goal = mock(Goal.class);
        User user = mock(User.class);
        DailyRecord saved = mock(DailyRecord.class);
        GoalRepository goals = mock(GoalRepository.class);
        DailyRecordRepository records = mock(DailyRecordRepository.class);
        CurrentUserService current = mock(CurrentUserService.class);
        ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
        ModelMapper mapper = mock(ModelMapper.class);
        DailyRecordRequestDTO request = mock(DailyRecordRequestDTO.class);

        when(goals.findById(7L)).thenReturn(Optional.of(goal));
        when(goal.getUser()).thenReturn(user);
        when(goal.getId()).thenReturn(7L);
        when(goal.getTopic()).thenReturn("Calculus");
        when(user.getId()).thenReturn(11L);
        when(user.getUsername()).thenReturn("owner");
        when(current.getCurrentUserId()).thenReturn(11L);
        when(user.getTimeZone()).thenReturn("America/Lima");
        when(mapper.map(request, DailyRecord.class)).thenReturn(mock(DailyRecord.class));
        when(records.save(any(DailyRecord.class))).thenReturn(saved);
        when(saved.getId()).thenReturn(23L);
        when(saved.getGoal()).thenReturn(goal);
        when(mapper.map(saved, com.example.studystreak.dto.DailyRecord.DailyRecordResponseDTO.class))
                .thenReturn(mock(com.example.studystreak.dto.DailyRecord.DailyRecordResponseDTO.class));

        DailyRecordService service = new DailyRecordService(records, mapper, goals, current,
                mock(TrackingLinkRepository.class), mock(DailyRecordPhotoRepository.class),
                mock(DailyRecordVoiceRepository.class), mock(NotificationRepository.class),
                mock(ValidationRepository.class), mock(StreakService.class), events);
        service.createDailyRecord(7L, request);

        org.mockito.ArgumentCaptor<DailyRecordCreatedEvent> captor =
                org.mockito.ArgumentCaptor.forClass(DailyRecordCreatedEvent.class);
        verify(events).publishEvent(captor.capture());
        DailyRecordCreatedEvent event = captor.getValue();
        assertEquals(7L, event.goalId());
        assertEquals(23L, event.dailyRecordId());
        assertEquals(11L, event.ownerId());
        assertEquals("owner", event.ownerUsername());
    }

    @Test
    void duplicateDateDoesNotPublishNotificationEvent() {
        Goal goal = mock(Goal.class);
        User user = mock(User.class);
        GoalRepository goals = mock(GoalRepository.class);
        DailyRecordRepository records = mock(DailyRecordRepository.class);
        CurrentUserService current = mock(CurrentUserService.class);
        ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
        DailyRecordRequestDTO request = mock(DailyRecordRequestDTO.class);
        LocalDate date = LocalDate.now(ZoneId.of("America/Lima"));
        when(goals.findById(7L)).thenReturn(Optional.of(goal));
        when(goal.getUser()).thenReturn(user);
        when(user.getId()).thenReturn(11L);
        when(current.getCurrentUserId()).thenReturn(11L);
        when(user.getTimeZone()).thenReturn("America/Lima");
        when(records.existsByGoalIdAndDate(7L, date)).thenReturn(true);
        DailyRecordService service = new DailyRecordService(records, mock(ModelMapper.class), goals, current,
                mock(TrackingLinkRepository.class), mock(DailyRecordPhotoRepository.class),
                mock(DailyRecordVoiceRepository.class), mock(NotificationRepository.class),
                mock(ValidationRepository.class), mock(StreakService.class), events);
        assertThrows(ConflictException.class, () -> service.createDailyRecord(7L, request));
        verifyNoInteractions(events);
    }
}
