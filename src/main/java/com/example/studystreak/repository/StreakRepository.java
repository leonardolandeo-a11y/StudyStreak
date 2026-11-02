package com.example.studystreak.repository;

import com.example.studystreak.model.Streak;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

@Repository
public interface StreakRepository extends JpaRepository<Streak, Long> {

    Optional<Streak> findByGoalId(Long goalId);

    @Query("select coalesce(max(s.currentStreak), 0) from Streak s where s.goal.user.id = :userId")
    int findHighestCurrentStreak(@Param("userId") Long userId);

    @Query("select coalesce(max(s.bestStreak), 0) from Streak s where s.goal.user.id = :userId")
    int findHighestBestStreak(@Param("userId") Long userId);
}
