package com.example.studystreak.repository;

import com.example.studystreak.model.DailyRecordVoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DailyRecordVoiceRepository extends JpaRepository<DailyRecordVoice, Long> {
    Optional<DailyRecordVoice> findByDailyRecordId(Long dailyRecordId);
    boolean existsByDailyRecordId(Long dailyRecordId);
    void deleteByDailyRecordId(Long dailyRecordId);
}
