package com.example.studystreak.repository;

import com.example.studystreak.model.DailyRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DailyRecordRepository
        extends JpaRepository<DailyRecord, Long> {

    List<DailyRecord> findByGoalId(Long goalId);

    boolean existsByGoalIdAndDate(
            Long goalId,
            LocalDate date
    );

    boolean existsByGoalIdAndDateAndIdNot(
            Long goalId,
            LocalDate date,
            Long dailyRecordId
    );
}