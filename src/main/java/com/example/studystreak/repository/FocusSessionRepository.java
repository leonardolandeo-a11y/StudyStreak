package com.example.studystreak.repository;

import com.example.studystreak.model.FocusSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface FocusSessionRepository extends JpaRepository<FocusSession, UUID> {

    @Query("select coalesce(sum(f.durationMinutes), 0) from FocusSession f where f.goal.id = :goalId")
    Long sumMinutesByGoalId(@Param("goalId") Long goalId);

    long countByGoalId(Long goalId);

    @Modifying
    @Query("delete from FocusSession f where f.goal.id = :goalId")
    void deleteByGoalId(@Param("goalId") Long goalId);
}
