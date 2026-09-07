package com.example.studystreak.repository;

import com.example.studystreak.model.Streak;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StreakRepository extends JpaRepository<Streak,Long> {
}
