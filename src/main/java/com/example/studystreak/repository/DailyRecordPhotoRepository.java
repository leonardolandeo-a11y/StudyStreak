package com.example.studystreak.repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.studystreak.model.DailyRecordPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DailyRecordPhotoRepository extends JpaRepository<DailyRecordPhoto, Long> {
    Optional<DailyRecordPhoto> findByDailyRecordId(Long dailyRecordId);
    boolean existsByDailyRecordId(Long dailyRecordId);
    void deleteByDailyRecordId(Long dailyRecordId);

    @Modifying
    @Query("delete from DailyRecordPhoto p where p.dailyRecord.id in (select d.id from DailyRecord d where d.goal.id = :goalId)")
    int deleteForGoal(@Param("goalId") Long goalId);
}
