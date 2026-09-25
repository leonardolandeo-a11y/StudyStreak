package com.example.studystreak.repository;

import com.example.studystreak.model.Goal;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface GoalRepository extends JpaRepository<Goal,Long> {
    Page<Goal> findByUserId(Long userId, Pageable pageable);
}
