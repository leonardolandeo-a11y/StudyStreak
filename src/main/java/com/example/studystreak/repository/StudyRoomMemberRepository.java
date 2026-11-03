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
    List<StudyRoomMember> findByRoomId(UUID roomId);
    long countByRoomId(UUID roomId);
    boolean existsByUserId(Long userId);
    void deleteByRoomId(UUID roomId);

    @Query("select m.room from StudyRoomMember m where m.user.id = :userId order by m.room.createdAt desc")
    List<StudyRoom> findRoomsForUser(@Param("userId") Long userId);
}
