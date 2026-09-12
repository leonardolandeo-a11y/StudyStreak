package com.example.studystreak.service;

import com.example.studystreak.repository.TrackingLinkRepository;
import org.springframework.stereotype.Service;

@Service
public class TrackingListService {
    private final TrackingLinkRepository trackingLinkRepository;

    public TrackingListService(TrackingLinkRepository trackingLinkRepository) {
        this.trackingLinkRepository = trackingLinkRepository;
    }
}
