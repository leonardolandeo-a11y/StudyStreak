package com.example.studystreak.repository;

import com.example.studystreak.model.FocusSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;
import java.time.Instant;
import java.util.List;

public interface FocusSessionRepository extends JpaRepository<FocusSession, UUID> {

    @Query("select coalesce(sum(f.durationMinutes), 0) from FocusSession f where f.goal.id = :goalId")
    Long sumMinutesByGoalId(@Param("goalId") Long goalId);

    long countByGoalId(Long goalId);

    @Query("select f from FocusSession f where f.goal.user.id = :userId and f.completedAt >= :since order by f.completedAt desc")
    List<FocusSession> findRecentForUser(@Param("userId") Long userId, @Param("since") Instant since);

    @Query("select coalesce(sum(f.durationMinutes), 0) from FocusSession f where f.goal.user.id = :userId")
    Long sumMinutesForUser(@Param("userId") Long userId);

    @Query("select count(f) from FocusSession f where f.goal.user.id = :userId")
    long countForUser(@Param("userId") Long userId);

    @Query("select f.goal.id, f.goal.topic, sum(f.durationMinutes), count(f) " +
            "from FocusSession f where f.goal.user.id = :userId " +
            "group by f.goal.id, f.goal.topic order by sum(f.durationMinutes) desc")
    List<Object[]> totalsByGoalForUser(@Param("userId") Long userId);

    @Modifying
    @Query("delete from FocusSession f where f.goal.id = :goalId")
    void deleteByGoalId(@Param("goalId") Long goalId);
}
