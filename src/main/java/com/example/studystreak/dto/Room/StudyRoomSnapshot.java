package com.example.studystreak.dto.Room;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Return serverNow with endsAt so clients can correct for device clock skew. */
public record StudyRoomSnapshot(
        UUID id, String name, String inviteCode, Long ownerId,
        boolean host, String phase, String timerStatus,
        int remainingSeconds, Instant endsAt, Instant serverNow,
        Long version, List<Member> members
) {
    public record Member(Long userId, String username, boolean online, boolean studying, boolean host) {}
}
