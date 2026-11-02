package com.example.studystreak.service;

import com.example.studystreak.exceptions.ForbiddenException;
import com.example.studystreak.exceptions.ResourceNotFoundException;
import com.example.studystreak.model.DailyRecord;
import com.example.studystreak.model.DailyRecordVoice;
import com.example.studystreak.repository.DailyRecordRepository;
import com.example.studystreak.repository.DailyRecordVoiceRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Set;

@Service
public class DailyRecordVoiceService {
    public static final long MAX_VOICE_SIZE = 2L * 1024 * 1024;
    private static final Set<String> AUDIO_TYPES = Set.of("audio/mp4", "audio/m4a", "audio/x-m4a");

    private final DailyRecordRepository recordRepository;
    private final DailyRecordService dailyRecordService;
    private final DailyRecordVoiceRepository voiceRepository;
    private final CurrentUserService currentUserService;

    public DailyRecordVoiceService(DailyRecordRepository recordRepository,
                                   DailyRecordService dailyRecordService,
                                   DailyRecordVoiceRepository voiceRepository,
                                   CurrentUserService currentUserService) {
        this.recordRepository = recordRepository;
        this.dailyRecordService = dailyRecordService;
        this.voiceRepository = voiceRepository;
        this.currentUserService = currentUserService;
    }

    private DailyRecord ownedRecord(Long goalId, Long recordId) {
        DailyRecord record = recordRepository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Daily record not found"));
        if (!record.getGoal().getId().equals(goalId)) {
            throw new ResourceNotFoundException("Daily record not found in goal");
        }
        if (!record.getGoal().getUser().getId().equals(currentUserService.getCurrentUserId())) {
            throw new ForbiddenException("Only the record owner can change its voice note");
        }
        return record;
    }

    @Transactional
    public void save(Long goalId, Long recordId, MultipartFile audio) {
        DailyRecord record = ownedRecord(goalId, recordId);
        if (audio == null || audio.isEmpty() || audio.getSize() > MAX_VOICE_SIZE ||
                !AUDIO_TYPES.contains(audio.getContentType())) {
            throw new IllegalArgumentException("Attach an M4A voice note no larger than 2 MB");
        }
        try {
            byte[] bytes = audio.getBytes();
            if (bytes.length < 12 || bytes.length > MAX_VOICE_SIZE ||
                    bytes[4] != 'f' || bytes[5] != 't' || bytes[6] != 'y' || bytes[7] != 'p') {
                throw new IllegalArgumentException("Invalid M4A voice note");
            }
            DailyRecordVoice saved = voiceRepository.findByDailyRecordId(recordId)
                    .orElseGet(() -> new DailyRecordVoice(record, bytes));
            saved.setAudioData(bytes);
            voiceRepository.save(saved);
        } catch (IOException ex) {
            throw new IllegalArgumentException("Unable to read the voice note", ex);
        }
    }

    @Transactional
    public byte[] read(Long goalId, Long recordId) {
        dailyRecordService.getDailyRecordById(goalId, recordId);
        return voiceRepository.findByDailyRecordId(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("No voice note attached to this record"))
                .getAudioData();
    }

    @Transactional
    public void remove(Long goalId, Long recordId) {
        ownedRecord(goalId, recordId);
        voiceRepository.deleteByDailyRecordId(recordId);
    }
}
