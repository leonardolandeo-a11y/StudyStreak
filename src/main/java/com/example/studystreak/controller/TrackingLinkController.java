package com.example.studystreak.controller;

import com.example.studystreak.dto.TrackingLink.TrackingLinkDTO;
import com.example.studystreak.service.TrackingLinkService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<TrackingLinkDTO> createTrackingLink(
            @RequestHeader("X-User-Id") Long requesterId,
            @PathVariable Long receiverId) {

        TrackingLinkDTO trackingLink = trackingLinkService.createTrackingLink(requesterId, receiverId);

        return ResponseEntity.status(HttpStatus.CREATED).body(trackingLink);
    }

    @GetMapping
    public ResponseEntity<List<TrackingLinkDTO>> getTrackingLinks(
            @RequestHeader("X-User-Id") Long userId) {

        List<TrackingLinkDTO> trackingLinks = trackingLinkService.getTrackingLinksByUserId(userId);

        return ResponseEntity.ok(trackingLinks);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<TrackingLinkDTO>> getPendingInvitations(
            @RequestHeader("X-User-Id") Long userId) {

        List<TrackingLinkDTO> pendingInvitations = trackingLinkService.getPendingReceivedInvitations(userId);

        return ResponseEntity.ok(pendingInvitations);
    }

    @GetMapping("/active")
    public ResponseEntity<List<TrackingLinkDTO>> getActiveTrackingLinks(
            @RequestHeader("X-User-Id") Long userId) {

        List<TrackingLinkDTO> activeTrackingLinks = TrackingLinkService.getActiveTrackingList(userId);

        return ResponseEntity.ok(activeTrackingLinks);
    }

    @GetMapping("/with/{otherUserId}")
    public ResponseEntity<TrackingLinkDTO> getLinkBetweenUsers(
            @RequestHeader("X-User-Id") Long currentUserId,
            @PathVariable Long otherUserId) {

        TrackingLinkDTO trackingLink = trackingLinkService.getLinkBetweenUsers(
                        currentUserId,
                        otherUserId
                );

        return ResponseEntity.ok(trackingLink);
    }

    @PutMapping("/{trackingId}")
    public ResponseEntity<TrackingLinkDTO> updateTrackingStatus(
            @PathVariable Long trackingId,
            @RequestHeader("X-User-Id") Long receiverId,
            @RequestBody TrackingLinkDTO trackingLinkDTO) {

        TrackingLinkDTO updatedTrackingLink = trackingLinkService.updateTrackingStatus(
                        trackingId,
                        trackingLinkDTO,
                        receiverId
                );

        return ResponseEntity.ok(updatedTrackingLink);
    }

    @DeleteMapping("/{trackingId}")
    public ResponseEntity<Void> deleteTrackingLink(
            @PathVariable Long trackingId,
            @RequestHeader("X-User-Id") Long userId) {

        trackingLinkService.deleteTrackingLink(trackingId, userId);

        return ResponseEntity.noContent().build();
    }
}