package com.example.studystreak.repository;

import com.example.studystreak.model.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {

    @Query(
            value = "SELECT DISTINCT t FROM Tag t JOIN t.goals g WHERE g.id = :goalId",
            countQuery = " SELECT COUNT(DISTINCT t.id) FROM Tag t JOIN t.goals g WHERE g.id = :goalId"
    )
    Page<Tag> findAllByGoalId(@Param("goalId") Long goalId, Pageable pageable);

    @Query("SELECT DISTINCT t FROM Tag t JOIN t.goals g WHERE t.id = :tagId AND g.id = :goalId")
    Optional<Tag> findByIdAndGoalId(
            @Param("tagId") Long tagId,
            @Param("goalId") Long goalId
    );

    @Query("SELECT DISTINCT t FROM Tag t JOIN t.goals g WHERE LOWER(t.name) = LOWER(:name) AND g.user.id = :userId")
    Optional<Tag> findByNameAndUserId(
            @Param("name") String name,
            @Param("userId") Long userId
    );
}