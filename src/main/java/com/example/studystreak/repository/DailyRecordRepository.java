package com.example.studystreak.repository;

import com.example.studystreak.model.DailyRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DailyRecordRepository extends JpaRepository<DailyRecord, Long> {

    List<DailyRecord> findByGoalId(Long id);
}
