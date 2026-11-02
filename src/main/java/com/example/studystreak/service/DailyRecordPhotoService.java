package com.example.studystreak.service;

import com.example.studystreak.exceptions.ForbiddenException;
import com.example.studystreak.exceptions.ResourceNotFoundException;
import com.example.studystreak.model.DailyRecord;
import com.example.studystreak.model.DailyRecordPhoto;
import com.example.studystreak.repository.DailyRecordPhotoRepository;
import com.example.studystreak.repository.DailyRecordRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class DailyRecordPhotoService {
    public static final long MAX_PHOTO_SIZE = 2L * 1024 * 1024;

    private final DailyRecordRepository dailyRecordRepository;
    private final DailyRecordService dailyRecordService;
    private final DailyRecordPhotoRepository photoRepository;
    private final CurrentUserService currentUserService;

    public DailyRecordPhotoService(DailyRecordRepository dailyRecordRepository,
                                   DailyRecordService dailyRecordService,
                                   DailyRecordPhotoRepository photoRepository,
                                   CurrentUserService currentUserService) {
        this.dailyRecordRepository = dailyRecordRepository;
        this.dailyRecordService = dailyRecordService;
        this.photoRepository = photoRepository;
        this.currentUserService = currentUserService;
    }

    private DailyRecord ownedRecord(Long goalId, Long recordId) {
        DailyRecord record = dailyRecordRepository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Daily record not found"));
        if (!record.getGoal().getId().equals(goalId)) {
            throw new ResourceNotFoundException("Daily record not found in goal");
        }
        if (!record.getGoal().getUser().getId().equals(currentUserService.getCurrentUserId())) {
            throw new ForbiddenException("Only the record owner can change its photo");
        }
        return record;
    }

    @Transactional
    public void save(Long goalId, Long recordId, MultipartFile photo) {
        DailyRecord record = ownedRecord(goalId, recordId);
        if (photo == null || photo.isEmpty() || photo.getSize() > MAX_PHOTO_SIZE ||
                !"image/jpeg".equalsIgnoreCase(photo.getContentType())) {
            throw new IllegalArgumentException("Attach a JPEG image no larger than 2 MB");
        }
        try {
            byte[] bytes = photo.getBytes();
            if (bytes.length < 4 || bytes.length > MAX_PHOTO_SIZE ||
                    (bytes[0] & 0xFF) != 0xFF || (bytes[1] & 0xFF) != 0xD8 ||
                    (bytes[2] & 0xFF) != 0xFF || (bytes[bytes.length - 2] & 0xFF) != 0xFF ||
                    (bytes[bytes.length - 1] & 0xFF) != 0xD9) {
                throw new IllegalArgumentException("Invalid JPEG image");
            }
            DailyRecordPhoto saved = photoRepository.findByDailyRecordId(recordId)
                    .orElseGet(() -> new DailyRecordPhoto(record, bytes));
            saved.setImageData(bytes);
            photoRepository.save(saved);
        } catch (IOException e) {
            throw new IllegalArgumentException("Unable to read the image", e);
        }
    }

    @Transactional
    public byte[] read(Long goalId, Long recordId) {
        dailyRecordService.getDailyRecordById(goalId, recordId);
        return photoRepository.findByDailyRecordId(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("No photo attached to this record"))
                .getImageData();
    }

    @Transactional
    public void remove(Long goalId, Long recordId) {
        ownedRecord(goalId, recordId);
        photoRepository.deleteByDailyRecordId(recordId);
    }
}
