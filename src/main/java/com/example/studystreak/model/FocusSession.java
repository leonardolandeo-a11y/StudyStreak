package com.example.studystreak.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/** A completed focus interval, distinct from daily records and peer validations. */
@Getter
@Setter
@Entity
@Table(name = "focus_session", indexes = @jakarta.persistence.Index(name = "idx_focus_goal_completed", columnList = "goal_id,completedAt"))
public class FocusSession {
    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "goal_id", nullable = false)
    private Goal goal;

    @Column(nullable = false)
    private Integer durationMinutes;

    @Column(nullable = false, updatable = false)
    private Instant completedAt;

    protected FocusSession() {}

    public FocusSession(UUID id, Goal goal, int durationMinutes, Instant completedAt) {
        this.id = id;
        this.goal = goal;
        this.durationMinutes = durationMinutes;
        this.completedAt = completedAt;
    }
}
