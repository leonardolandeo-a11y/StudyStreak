package com.example.studystreak.service;

import com.example.studystreak.dto.DailyRecord.DailyRecordRequestDTO;
import com.example.studystreak.dto.DailyRecord.DailyRecordResponseDTO;
import com.example.studystreak.exceptions.ConflictException;
import com.example.studystreak.event.DailyRecordCreatedEvent;
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

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class DailyRecordDatePolicyTest {
    private final DailyRecordRepository records = mock(DailyRecordRepository.class);
    private final GoalRepository goals = mock(GoalRepository.class);
    private final CurrentUserService current = mock(CurrentUserService.class);
    private final ModelMapper mapper = mock(ModelMapper.class);
    private final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);

    private DailyRecordService service() {
        return new DailyRecordService(records, mapper, goals, current,
                mock(TrackingLinkRepository.class), mock(DailyRecordPhotoRepository.class),
                mock(DailyRecordVoiceRepository.class), mock(NotificationRepository.class),
                mock(ValidationRepository.class), mock(StreakService.class), events);
    }

    private Goal ownedGoal() {
        Goal goal = mock(Goal.class);
        User user = mock(User.class);
        when(goals.findById(7L)).thenReturn(Optional.of(goal));
        when(goal.getUser()).thenReturn(user);
        when(user.getId()).thenReturn(11L);
        when(user.getTimeZone()).thenReturn("America/Lima");
        when(current.getCurrentUserId()).thenReturn(11L);
        return goal;
    }

    @Test
    void creationAlwaysUsesAccountDateEvenWhenClientSuppliesPastDate() {
        ownedGoal();
        DailyRecordRequestDTO request = new DailyRecordRequestDTO();
        request.setDate(LocalDate.of(2020, 1, 1));
        request.setNote("Study session");
        DailyRecord mapped = mock(DailyRecord.class);
        DailyRecord saved = mock(DailyRecord.class);
        when(mapper.map(request, DailyRecord.class)).thenReturn(mapped);
        when(records.save(mapped)).thenReturn(saved);
        when(saved.getId()).thenReturn(22L);
        when(mapper.map(saved, DailyRecordResponseDTO.class)).thenReturn(mock(DailyRecordResponseDTO.class));

        service().createDailyRecord(7L, request);

        LocalDate today = LocalDate.now(ZoneId.of("America/Lima"));
        verify(records).existsByGoalIdAndDate(7L, today);
        verify(mapped).setDate(today);
        verify(events).publishEvent(any(DailyRecordCreatedEvent.class));
    }

    @Test
    void updateRejectsChangingTheRecordedDate() {
        Goal goal = ownedGoal();
        DailyRecord record = mock(DailyRecord.class);
        when(records.findById(55L)).thenReturn(Optional.of(record));
        when(record.getGoal()).thenReturn(goal);
        when(goal.getId()).thenReturn(7L);
        when(record.getDate()).thenReturn(LocalDate.of(2026, 10, 28));
        DailyRecordRequestDTO request = new DailyRecordRequestDTO();
        request.setDate(LocalDate.of(2026, 10, 29));

        assertThrows(ConflictException.class, () -> service().updateDailyRecord(7L, 55L, request));
        verify(records, never()).save(any(DailyRecord.class));
    }
}
