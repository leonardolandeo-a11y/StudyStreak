package com.example.studystreak.repository;

import com.example.studystreak.model.Validation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ValidationRepository extends JpaRepository<Validation, Long> {

    Optional<Validation> findByDailyRecordId(Long dailyRecordId);

    boolean existsByDailyRecordId(Long dailyRecordId);
}
