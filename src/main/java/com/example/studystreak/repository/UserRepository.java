package com.example.studystreak.repository;

import com.example.studystreak.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User,Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.active = true AND u.id <> :currentUserId " +
           "AND (LOWER(u.username) LIKE CONCAT(LOWER(:query), '%') OR LOWER(u.email) = LOWER(:query))")
    Page<User> searchActiveUsers(
            @Param("query") String query,
            @Param("currentUserId") Long currentUserId,
            Pageable pageable
    );
}