package com.example.studystreak.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
@Entity
@Table(name = "tracking_link")
public class TrackingLink {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "requester_id",nullable = false)
    private User requester;

    @ManyToOne()
    @JoinColumn(name="receiver_id",nullable = false)
    private User receiver;

    @Enumerated(EnumType.STRING)
    private TrackingStatus status;

    protected TrackingLink(){}

    public TrackingLink(User requester, User receiver, TrackingStatus status) {
        this.requester = requester;
        this.receiver = receiver;
        this.status = status;
    }
}
