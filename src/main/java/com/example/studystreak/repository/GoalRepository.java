package com.example.studystreak.repository;

import com.example.studystreak.model.Goal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GoalRepository extends JpaRepository<Goal,Long> {
    public List<Goal> findByUserId(Long UserId);
}
