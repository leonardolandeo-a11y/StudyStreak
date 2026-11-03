package com.example.studystreak.repository;

import com.example.studystreak.model.StudyRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.Optional;
import java.util.UUID;

public interface StudyRoomRepository extends JpaRepository<StudyRoom, UUID> {
    Optional<StudyRoom> findByInviteCode(String inviteCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from StudyRoom r where r.id = :id")
    Optional<StudyRoom> findByIdForUpdate(@Param("id") UUID id);

    boolean existsByOwnerId(Long ownerId);
}
