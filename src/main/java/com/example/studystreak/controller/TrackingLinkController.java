package com.example.studystreak.controller;

import com.example.studystreak.dto.TrackingLink.TrackingLinkResponseDTO;
import com.example.studystreak.dto.TrackingLink.TrackingLinkStatusRequestDTO;
import com.example.studystreak.service.TrackingLinkService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tracking-links")
public class TrackingLinkController {

    private final TrackingLinkService trackingLinkService;

    public TrackingLinkController(
            TrackingLinkService trackingLinkService
    ) {
        this.trackingLinkService = trackingLinkService;
    }

    @PostMapping("/{receiverId}")
    public ResponseEntity<TrackingLinkResponseDTO>
    createTrackingLink(
            @RequestHeader("X-User-Id") Long requesterId,
            @PathVariable Long receiverId
    ) {

        TrackingLinkResponseDTO savedTrackingLink =
                trackingLinkService.createTrackingLink(
                        requesterId,
                        receiverId
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedTrackingLink);
    }

    @GetMapping
    public ResponseEntity<List<TrackingLinkResponseDTO>>
    getTrackingLinks(
            @RequestHeader("X-User-Id") Long userId
    ) {

        return ResponseEntity.ok(trackingLinkService.getTrackingLinksByUserId(userId)
        );
    }

    @GetMapping("/pending")
    public ResponseEntity<List<TrackingLinkResponseDTO>>
    getPendingInvitations(
            @RequestHeader("X-User-Id") Long userId
    ) {

        return ResponseEntity.ok(trackingLinkService.getPendingReceivedInvitations(userId)
        );
    }

    @GetMapping("/active")
    public ResponseEntity<List<TrackingLinkResponseDTO>>
    getActiveTrackingLinks(@RequestHeader("X-User-Id") Long userId) {

        return ResponseEntity.ok(trackingLinkService.getActiveTrackingList(userId));
    }

    @GetMapping("/with/{otherUserId}")
    public ResponseEntity<TrackingLinkResponseDTO>
    getLinkBetweenUsers(
            @RequestHeader("X-User-Id") Long currentUserId,
            @PathVariable Long otherUserId
    ) {

        return ResponseEntity.ok(
                trackingLinkService.getLinkBetweenUsers(currentUserId, otherUserId)
        );
    }

    @PatchMapping("/{trackingId}/status")
    public ResponseEntity<TrackingLinkResponseDTO>
    updateTrackingStatus(@PathVariable Long trackingId, @RequestHeader("X-User-Id") Long receiverId,
            @RequestBody TrackingLinkStatusRequestDTO trackingRequest) {

        TrackingLinkResponseDTO updatedTrackingLink =
                trackingLinkService.updateTrackingStatus(trackingId, trackingRequest, receiverId);

        return ResponseEntity.ok(updatedTrackingLink);
    }

    @DeleteMapping("/{trackingId}")
    public ResponseEntity<Void> deleteTrackingLink(@PathVariable Long trackingId,
            @RequestHeader("X-User-Id") Long userId) {

        trackingLinkService.deleteTrackingLink(trackingId, userId);
        return ResponseEntity.noContent().build();
    }
}