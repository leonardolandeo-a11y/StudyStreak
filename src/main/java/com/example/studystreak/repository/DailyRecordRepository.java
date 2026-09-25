package com.example.studystreak.repository;

import com.example.studystreak.model.DailyRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface DailyRecordRepository
        extends JpaRepository<DailyRecord, Long> {

    List<DailyRecord> findByGoalId(Long goalId);
    //sobrecarga que devuelve los dailyrecords paginados
    Page<DailyRecord> findByGoalId(Long goalId, Pageable pageable);

    boolean existsByGoalIdAndDate(Long goalId, LocalDate date);

    boolean existsByGoalIdAndDateAndIdNot(Long goalId, LocalDate date, Long dailyRecordId);
}