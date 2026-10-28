package com.example.studystreak.repository;

import com.example.studystreak.model.Validation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

@Repository
public interface ValidationRepository extends JpaRepository<Validation, Long> {

    Optional<Validation> findByDailyRecordId(Long dailyRecordId);

    boolean existsByDailyRecordId(Long dailyRecordId);

    @Query("select count(v) from Validation v where v.dailyRecord.goal.user.id = :userId")
    long countReviewedByRecordOwnerId(@Param("userId") Long userId);
}
