package com.example.studystreak.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
@Getter
@Setter
@Entity
@Table(name = "notification")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    @Column(nullable = false)
    private String message;

    @Column(nullable = false)
    private Boolean read;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Column(name = "related_goal_id")
    private Long relatedGoalId;

    @Column(name = "related_daily_record_id")
    private Long relatedDailyRecordId;

    @Column(name = "related_tracking_link_id")
    private Long relatedTrackingLinkId;


    @ManyToOne
    @JoinColumn(name = "user_id",nullable = false)
    private User user;

    protected Notification(){}

    public Notification(String message, Boolean read, LocalDateTime createdAt, NotificationType type, User user) {
        this.message = message;
        this.read = read;
        this.createdAt = createdAt;
        this.type = type;
        this.user = user;
    }
}
