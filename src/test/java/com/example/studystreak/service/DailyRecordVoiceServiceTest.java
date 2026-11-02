package com.example.studystreak.service;

import com.example.studystreak.exceptions.ForbiddenException;
import com.example.studystreak.model.DailyRecord;
import com.example.studystreak.model.DailyRecordVoice;
import com.example.studystreak.model.Goal;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.DailyRecordRepository;
import com.example.studystreak.repository.DailyRecordVoiceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DailyRecordVoiceServiceTest {
    private final DailyRecordRepository records = mock(DailyRecordRepository.class);
    private final DailyRecordService dailyRecords = mock(DailyRecordService.class);
    private final DailyRecordVoiceRepository voices = mock(DailyRecordVoiceRepository.class);
    private final CurrentUserService currentUser = mock(CurrentUserService.class);
    private final DailyRecordVoiceService service = new DailyRecordVoiceService(records, dailyRecords, voices, currentUser);

    private byte[] validAudio() {
        return new byte[]{0, 0, 0, 16, 'f', 't', 'y', 'p', 'M', '4', 'A', ' ', 1, 2, 3, 4};
    }

    private void ownedRecord(long ownerId, long currentId) {
        DailyRecord record = mock(DailyRecord.class);
        Goal goal = mock(Goal.class);
        User user = mock(User.class);
        when(records.findById(10L)).thenReturn(Optional.of(record));
        when(record.getGoal()).thenReturn(goal);
        when(goal.getId()).thenReturn(3L);
        when(goal.getUser()).thenReturn(user);
        when(user.getId()).thenReturn(ownerId);
        when(currentUser.getCurrentUserId()).thenReturn(currentId);
    }

    @Test
    void preventsOtherUsersFromUploading() {
        ownedRecord(7L, 8L);
        MockMultipartFile file = new MockMultipartFile("audio", "note.m4a", "audio/mp4", validAudio());
        assertThrows(ForbiddenException.class, () -> service.save(3L, 10L, file));
    }

    @Test
    void rejectsInvalidAudio() {
        ownedRecord(7L, 7L);
        MockMultipartFile file = new MockMultipartFile("audio", "note.m4a", "audio/mp4", new byte[]{1, 2, 3, 4});
        assertThrows(IllegalArgumentException.class, () -> service.save(3L, 10L, file));
    }

    @Test
    void rejectsOversizedAudio() {
        ownedRecord(7L, 7L);
        MockMultipartFile file = new MockMultipartFile("audio", "note.m4a", "audio/mp4", new byte[2 * 1024 * 1024 + 1]);
        assertThrows(IllegalArgumentException.class, () -> service.save(3L, 10L, file));
    }

    @Test
    void readsVoiceOnlyAfterCheckingRecordAccess() {
        byte[] audio = validAudio();
        when(voices.findByDailyRecordId(10L)).thenReturn(Optional.of(new DailyRecordVoice(mock(DailyRecord.class), audio)));
        assertArrayEquals(audio, service.read(3L, 10L));
        verify(dailyRecords).getDailyRecordById(3L, 10L);
    }
}
