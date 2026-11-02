package com.example.studystreak.repository;

import com.example.studystreak.model.Goal;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface GoalRepository extends JpaRepository<Goal,Long> {
    Page<Goal> findByUserId(Long userId, Pageable pageable);
    long countByUserId(Long userId);
    long countByUserIdAndCompletedTrue(Long userId);

    @Query("select g.id from Goal g left join g.streak s where g.user.id = :userId " +
            "and (s.id is null or s.lastUpdateDate is null or s.lastUpdateDate <> :today)")
    List<Long> findGoalsWithOutdatedStreaks(@Param("userId") Long userId, @Param("today") LocalDate today);
}
