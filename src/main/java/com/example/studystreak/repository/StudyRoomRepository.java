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

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from StudyRoom r where r.inviteCode = :code")
    Optional<StudyRoom> findByCodeForUpdate(@Param("code") String code);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update StudyRoom r set r.timerStatus = 'COMPLETE', r.remainingSeconds = 0, " +
           "r.version = r.version + 1 where r.timerStatus = 'RUNNING' and r.endsAt <= :now")
    int completeExpired(@Param("now") java.time.Instant now);

    boolean existsByOwnerId(Long ownerId);
}
