package com.example.studystreak.controller;

import com.example.studystreak.dto.TrackingLink.TrackingLinkDTO;
import com.example.studystreak.service.TrackingLinkService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tracking-links")
public class TrackingLinkController {

    private final TrackingLinkService trackingLinkService;

    public TrackingLinkController(TrackingLinkService trackingLinkService) {
        this.trackingLinkService = trackingLinkService;
    }

    @PostMapping("/{receiverId}")
    public TrackingLinkDTO createTrackingLink(@RequestHeader("X-User-Id") Long requesterId, @PathVariable Long receiverId) {
        return trackingLinkService.createTrackingLink(requesterId, receiverId);
    }

    @GetMapping
    public List<TrackingLinkDTO> getTrackingLinks(@RequestHeader("X-User-Id") Long userId) {
        return trackingLinkService.getTrackingLinksByUserId(userId);
    }

    @GetMapping("/pending")
    public List<TrackingLinkDTO> getPendingInvitations(@RequestHeader("X-User-Id") Long userId) {
        return trackingLinkService.getPendingReceivedInvitations(userId);
    }

    @GetMapping("/active")
    public List<TrackingLinkDTO> getActiveTrackingLinks(@RequestHeader("X-User-Id") Long userId) {
        return trackingLinkService.getActiveTrackingList(userId);
    }

    @GetMapping("/with/{otherUserId}")
    public TrackingLinkDTO getLinkBetweenUsers(@RequestHeader("X-User-Id") Long currentUserId, @PathVariable Long otherUserId) {
        return trackingLinkService.getLinkBetweenUsers(currentUserId, otherUserId);
    }

    @PutMapping("/{trackingId}")
    public TrackingLinkDTO updateTrackingStatus(@PathVariable Long trackingId, @RequestHeader("X-User-Id") Long receiverId, @RequestBody TrackingLinkDTO trackingLinkDTO) {
        return trackingLinkService.updateTrackingStatus(trackingId, trackingLinkDTO, receiverId);
    }

    @DeleteMapping("/{trackingId}")
    public void deleteTrackingLink(@PathVariable Long trackingId, @RequestHeader("X-User-Id") Long userId) {
        trackingLinkService.deleteTrackingLink(trackingId, userId);
    }
}