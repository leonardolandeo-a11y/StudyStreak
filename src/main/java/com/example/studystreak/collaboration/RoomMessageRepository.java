package com.example.studystreak.collaboration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.*;
import java.time.Instant;
import java.util.UUID;
public interface RoomMessageRepository extends JpaRepository<RoomMessage,UUID> {
    Page<RoomMessage> findByRoomIdAndCreatedAtAfterOrderByCreatedAtDescIdDesc(UUID room,Instant cutoff,Pageable page);
    void deleteByCreatedAtBefore(Instant cutoff);
}
