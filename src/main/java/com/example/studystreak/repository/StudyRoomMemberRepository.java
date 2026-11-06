package com.example.studystreak.repository;

import com.example.studystreak.model.StudyRoom;
import com.example.studystreak.model.StudyRoomMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StudyRoomMemberRepository extends JpaRepository<StudyRoomMember, Long> {
    Optional<StudyRoomMember> findByRoomIdAndUserId(UUID roomId, Long userId);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = "user")
    List<StudyRoomMember> findByRoomId(UUID roomId);
    @org.springframework.data.jpa.repository.Modifying
    @Query("update StudyRoomMember m set m.reaction=null, m.reactionAt=null where m.reactionAt < :cutoff")
    void clearExpiredReactions(@Param("cutoff") java.time.Instant cutoff);
    @org.springframework.data.jpa.repository.Modifying
    @Query("update StudyRoomMember m set m.handRaised=false where m.handRaised=true and m.lastSeenAt < :cutoff")
    void clearInactiveHands(@Param("cutoff") java.time.Instant cutoff);
    long countByRoomId(UUID roomId);
    boolean existsByUserId(Long userId);
    void deleteByRoomId(UUID roomId);

    @Query("select m.room from StudyRoomMember m where m.user.id = :userId order by m.room.createdAt desc")
    List<StudyRoom> findRoomsForUser(@Param("userId") Long userId);
}
