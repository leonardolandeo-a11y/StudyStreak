package com.example.studystreak.service;

import com.example.studystreak.repository.StudyRoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;

/** Conditional SQL update is safe across replicas and catches up after server restarts. */
@Service
public class StudyRoomExpiry {
    private final StudyRoomRepository rooms;
    private final StudyLedgerService ledger;
    public StudyRoomExpiry(StudyRoomRepository rooms, StudyLedgerService ledger) { this.rooms = rooms; this.ledger=ledger; }

    @Scheduled(fixedDelayString = "${study-rooms.expiry-delay-ms:5000}")
    @Transactional
    public void completeExpired() { ledger.expire(); rooms.completeExpired(Instant.now()); }
}
