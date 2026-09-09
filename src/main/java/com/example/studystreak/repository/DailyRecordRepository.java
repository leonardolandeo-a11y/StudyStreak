package com.example.studystreak.repository;

import com.example.studystreak.model.DailyRecord;
import com.example.studystreak.model.Goal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DailyRecordRepository extends JpaRepository<DailyRecord,Long> {
    public List<DailyRecord> findByGoalId(Long id);

    Long goal(Goal goal);
}
