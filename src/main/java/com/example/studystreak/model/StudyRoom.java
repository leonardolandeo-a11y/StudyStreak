package com.example.studystreak.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "study_room", indexes = {@Index(name = "idx_study_room_code", columnList = "invite_code"),
        @Index(name = "idx_room_expiry", columnList = "timerStatus,endsAt")})
public class StudyRoom {
    @Id
    private UUID id;

    @Column(name = "invite_code", nullable = false, unique = true, length = 12)
    private String inviteCode;

    @Column(nullable = false, length = 60)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false, length = 12)
    private String phase = "FOCUS";

    @Column(nullable = false, length = 12)
    private String timerStatus = "PAUSED";

    @Column(nullable = false)
    private int remainingSeconds = 25 * 60;

    private Instant endsAt;

    @Version
    private Long version;

    protected StudyRoom() {}

    public StudyRoom(UUID id, String inviteCode, String name, User owner, Instant createdAt) {
        this.id = id;
        this.inviteCode = inviteCode;
        this.name = name;
        this.owner = owner;
        this.createdAt = createdAt;
    }
}
