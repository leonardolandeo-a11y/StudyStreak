package com.example.studystreak.service;

import org.springframework.stereotype.Service;

@Service
public class TrackingLinkRepository {
    private final TrackingLinkRepository trackingLinkRepository;

    public TrackingLinkRepository(TrackingLinkRepository trackingLinkRepository) {
        this.trackingLinkRepository = trackingLinkRepository;
    }
}
