package com.example.studystreak.repository;

import com.example.studystreak.model.DailyRecordPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DailyRecordPhotoRepository extends JpaRepository<DailyRecordPhoto, Long> {
    Optional<DailyRecordPhoto> findByDailyRecordId(Long dailyRecordId);
    boolean existsByDailyRecordId(Long dailyRecordId);
    void deleteByDailyRecordId(Long dailyRecordId);
}
