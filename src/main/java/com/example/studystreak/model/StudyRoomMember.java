package com.example.studystreak.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "study_room_member",
        indexes = @Index(name = "idx_room_member_user", columnList = "user_id"),
        uniqueConstraints = @UniqueConstraint(name = "uk_room_member_user", columnNames = {"room_id", "user_id"}))
public class StudyRoomMember {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private StudyRoom room;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private boolean studying;

    @Column(nullable = false)
    private Instant lastSeenAt;

    protected StudyRoomMember() {}

    public StudyRoomMember(StudyRoom room, User user, Instant now) {
        this.room = room;
        this.user = user;
        this.lastSeenAt = now;
        this.studying = false;
    }
}
