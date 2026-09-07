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

    private String message;

    private Boolean read;
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    private NotificationType type;


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
