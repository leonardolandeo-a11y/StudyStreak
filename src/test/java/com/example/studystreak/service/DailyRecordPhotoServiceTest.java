package com.example.studystreak.service;

import com.example.studystreak.exceptions.ForbiddenException;
import com.example.studystreak.model.DailyRecord;
import com.example.studystreak.model.DailyRecordPhoto;
import com.example.studystreak.model.Goal;
import com.example.studystreak.model.User;
import com.example.studystreak.repository.DailyRecordPhotoRepository;
import com.example.studystreak.repository.DailyRecordRepository;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DailyRecordPhotoServiceTest {
    private final DailyRecordRepository records = mock(DailyRecordRepository.class);
    private final DailyRecordService dailyRecords = mock(DailyRecordService.class);
    private final DailyRecordPhotoRepository photos = mock(DailyRecordPhotoRepository.class);
    private final CurrentUserService currentUser = mock(CurrentUserService.class);
    private final DailyRecordPhotoService service = new DailyRecordPhotoService(records, dailyRecords, photos, currentUser);

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
        MockMultipartFile file = new MockMultipartFile("photo", "notes.jpg", "image/jpeg", new byte[]{-1, -40, -1, -39});
        assertThrows(ForbiddenException.class, () -> service.save(3L, 10L, file));
    }

    @Test
    void rejectsNonJpegImages() {
        ownedRecord(7L, 7L);
        MockMultipartFile file = new MockMultipartFile("photo", "notes.png", "image/png", new byte[]{1, 2, 3});
        assertThrows(IllegalArgumentException.class, () -> service.save(3L, 10L, file));
    }

    @Test
    void rejectsOversizedImages() {
        ownedRecord(7L, 7L);
        MockMultipartFile file = new MockMultipartFile("photo", "notes.jpg", "image/jpeg", new byte[2 * 1024 * 1024 + 1]);
        assertThrows(IllegalArgumentException.class, () -> service.save(3L, 10L, file));
    }

    @Test
    void readsPhotoAfterRecordAccessCheck() {
        byte[] image = new byte[]{-1, -40, -1, -39};
        when(photos.findByDailyRecordId(10L)).thenReturn(Optional.of(new DailyRecordPhoto(mock(DailyRecord.class), image)));
        assertArrayEquals(image, service.read(3L, 10L));
        verify(dailyRecords).getDailyRecordById(3L, 10L);
    }
}
